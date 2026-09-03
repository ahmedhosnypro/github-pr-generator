// Deterministic 10-point render-quality rubric for generated PR descriptions.
// Each check maps to one failure class observed in the corpus study
// (analysis/pull-requests/PRESENTATION.md) or the sirajLMS/siraj#119 incident.
import { countCoveredCommits, coverageThreshold } from "../src/background/commit-coverage";
import { countDiffAnchors } from "../src/background/parse";

export interface RubricCheck {
  name: string;
  ok: boolean;
  detail: string;
}

function sectionSlice(text: string, header: string): string {
  const start = text.search(new RegExp("^## " + header, "im"));
  if (start === -1) return "";
  const rest = text.slice(start);
  const next = rest.indexOf("\n## ", 2);
  return next === -1 ? rest : rest.slice(0, next);
}

// The Summary check judges the direct prose block only: compact outputs may
// keep an H3 subsection (e.g. "### Key Changes") under the Summary header, and
// those bullets/sentences must not count against the prose-only limit.
function summarySlice(text: string): string {
  const start = text.search(/^## Summary/im);
  if (start === -1) return "";
  const rest = text.slice(start);
  const next = rest.slice(2).search(/\n#{2,6} /);
  return next === -1 ? rest : rest.slice(0, next + 2);
}

// The verification section is canonically "## Testing"; models sometimes write
// "## Verification", "### Verification Steps", or "How to test" — accept the
// synonyms. The slice stops only at the next H2 so steps nested under H3
// subgroups inside the section stay in scope.
function testingSlice(text: string): string {
  const start = text.search(/^#{2,3} (?:Testing|Verification|How to test)\b/im);
  if (start === -1) return "";
  const rest = text.slice(start);
  const next = rest.indexOf("\n## ", 2);
  return next === -1 ? rest : rest.slice(0, next);
}

function sentenceCount(text: string): number {
  return (text.match(/[.!?](?=\s|$)/g) ?? []).length;
}

function bulletLines(text: string): string[] {
  return text.split("\n").filter((l) => /^[-*]\s/.test(l));
}

function maxWords(lines: string[]): number {
  return lines.reduce((m, l) => Math.max(m, l.trim().split(/\s+/).filter(Boolean).length), 0);
}

function firstLine(text: string): string {
  return text.split("\n").find((l) => l.trim().length > 0) ?? "";
}

function endingCheck(text: string): { ok: boolean; detail: string } {
  const tail = text
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .slice(-3)
    .join(" ");
  if (/please review|let me know|thank you/i.test(tail)) return { ok: false, detail: "soft sign-off ending" };
  if (/Closes #|Fixes #|Not verified|verdict|\|[-—\s|]+\||scope/i.test(tail)) {
    return { ok: true, detail: "artifact ending" };
  }
  return { ok: false, detail: "ends without verdict/link/table: " + tail.slice(0, 80) };
}

function checkOpener(open: string, title: string): RubricCheck {
  return {
    name: "opener is a thesis, not the title",
    ok: open.length > 0 && open.length <= 300 && open.trim() !== title.trim(),
    detail: open.slice(0, 80),
  };
}

function checkSummary(summary: string): RubricCheck {
  const hasBullets = /^[-*]\s/m.test(summary);
  return {
    name: "summary prose-only, ≤4 sentences",
    ok: summary !== "" && !hasBullets && sentenceCount(summary) <= 4,
    detail: String(sentenceCount(summary)) + " sentences" + (hasBullets ? " + bullets inside Summary" : ""),
  };
}

function checkChanges(changes: string, opts: RubricOptions): RubricCheck {
  const boldBullets = bulletLines(changes).filter((l) => l.includes("**")).length;
  // Small diffs may fold changes into Summary entirely (per the compact directive).
  if (opts.fileCount !== undefined && opts.fileCount <= 3 && changes === "") {
    return { name: "changes folded into summary (small diff)", ok: true, detail: "no Changes section" };
  }
  const required = opts.fileCount !== undefined ? Math.min(3, Math.max(1, opts.fileCount)) : 3;
  return {
    name: "changes grouped with bold-label bullets",
    ok: changes !== "" && boldBullets >= required,
    detail:
      String(bulletLines(changes).length) +
      " bullets (needs " +
      String(boldBullets) +
      "/" +
      String(required) +
      " bold)",
  };
}

function checkAnchors(description: string, opts: RubricOptions): RubricCheck {
  const count = countDiffAnchors(description);
  if (opts.expectAnchors === false) {
    // The prompt forbids diffhunk links when no Anchors section existed.
    return { name: "no diff-hunk anchors invented", ok: count === 0, detail: String(count) + " anchors" };
  }
  // Bare [[N]] refs without the (diffhunk://...) part mean the model dropped the links.
  const bareRefs = (description.match(/\[\[\d+\]\]\s*(?!\()/g) ?? []).length;
  // Anchor expectations scale with diff size: a 2-file PR legitimately has 2.
  const required = Math.min(3, Math.max(1, opts.fileCount ?? 3));
  const bare = bareRefs > 0 ? ", " + String(bareRefs) + " bare [[N]] refs" : "";
  return {
    name: "diff-hunk anchors present",
    ok: count >= required && bareRefs === 0,
    detail: String(count) + " anchors (needs " + String(required) + ")" + bare,
  };
}

function checkTesting(testing: string, opts: RubricOptions): RubricCheck {
  // The prompt frees small diffs from mandatory Testing; missing is then a pass.
  if (opts.fileCount !== undefined && opts.fileCount <= 3 && testing === "") {
    return { name: "testing skipped for small diff", ok: true, detail: "no Testing section (small diff)" };
  }
  const steps = (testing.match(/^\d+\.\s/gm) ?? []).length;
  return {
    name: "testing has numbered steps + fence",
    ok: steps >= 1 && /```/.test(testing),
    detail: "steps=" + String(steps),
  };
}

function checkFences(fences: number, opts: RubricOptions): RubricCheck {
  // Small diffs don't need any fences; >0 must still be balanced.
  const isSmall = opts.fileCount !== undefined && opts.fileCount <= 3;
  return {
    name: "fences balanced",
    ok: fences % 2 === 0 && (fences > 0 || isSmall),
    detail: String(fences) + " fences",
  };
}

function checkLineLengths(description: string): RubricCheck {
  let inFence = false;
  let maxProse = 0;
  let maxBullet = 0;
  for (const line of description.split("\n")) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^[-*]\s/.test(line) || line.startsWith("|")) {
      maxBullet = Math.max(maxBullet, line.length);
    } else {
      maxProse = Math.max(maxProse, line.length);
    }
  }
  // Prose walls live in paragraphs (≤400); bullets carry identifiers (≤600);
  // fenced commands/logs are exempt.
  return {
    name: "no prose-wall lines (prose ≤400, bullets ≤600)",
    ok: maxProse <= 400 && maxBullet <= 600,
    detail: "prose=" + String(maxProse) + ", bullets=" + String(maxBullet),
  };
}

function checkBulletWords(description: string): RubricCheck {
  return {
    name: "bullets ≤60 words",
    ok: maxWords(bulletLines(description)) <= 60,
    detail: "max=" + String(maxWords(bulletLines(description))),
  };
}

function checkEnding(description: string): RubricCheck {
  return { name: "ends on an artifact", ok: endingCheck(description).ok, detail: endingCheck(description).detail };
}

function checkCoverage(description: string, commitMessages: string[]): RubricCheck {
  const threshold = coverageThreshold(commitMessages.length);
  return {
    name: "commit coverage ≥" + String(Math.round(threshold * 100)) + "%",
    ok:
      commitMessages.length === 0 ||
      countCoveredCommits(commitMessages, description) / commitMessages.length >= threshold,
    detail: String(countCoveredCommits(commitMessages, description)) + "/" + String(commitMessages.length),
  };
}

// 10 checks, one point each.
// - expectAnchors: false when the prompt carried no Anchors section (the model
//   is then forbidden from emitting any diffhunk links).
// - fileCount: sizes the anchor/bullets minimums so small diffs aren't held to
//   thresholds they can't reach.
export interface RubricOptions {
  expectAnchors?: boolean;
  fileCount?: number;
}

export function scoreDescription(
  description: string,
  title: string,
  commitMessages: string[],
  opts: RubricOptions = {},
): { score: number; checks: RubricCheck[] } {
  const checks: RubricCheck[] = [
    checkOpener(firstLine(description), title),
    checkSummary(summarySlice(description)),
    checkChanges(sectionSlice(description, "Changes"), opts),
    checkAnchors(description, opts),
    checkTesting(testingSlice(description), opts),
    checkFences((description.match(/```/g) ?? []).length, opts),
    checkLineLengths(description),
    checkBulletWords(description),
    checkEnding(description),
    checkCoverage(description, commitMessages),
  ];
  return { score: checks.filter((c) => c.ok).length, checks };
}
