// Deterministic quality checks for generated PR descriptions, consumed by the
// refinement loop (refinement.ts) and by tests. Each check returns null on pass.

import type { PRStats } from "../types";

interface CheckResult {
  score: number;
  failures: Array<{ check: string; detail: string }>;
}

type Check = (description: string) => CheckResult | null;

// The Summary's own prose block: ends at the next heading of any depth, so
// compact outputs that keep a "### Key Changes" subsection under the Summary
// header are judged by their prose sentences only — the bullets belong to the
// subsection, not to the opener.
const summarySliceRe = /^## Summary\n([\s\S]*?)(?=\n#{2,6} |$(?![\s\S]))/m;

// Wrap target shared with the normalizer (description-normalize.ts hard-wraps
// prose lines beyond it). Checks must accept everything up to this target —
// a check stricter than the wrap target creates a dead zone (301..390 chars)
// where a line fails the check yet is never wrapped. Kept under the 400-char
// render-check limit in checkLineLength.
export const PROSE_LINE_TARGET = 390;

function checkOpener(description: string): CheckResult | null {
  const summaryMatch = description.match(summarySliceRe);
  if (!summaryMatch?.[1]) {
    return { score: 0, failures: [{ check: "opener", detail: "no Summary section" }] };
  }
  const first = summaryMatch[1].trim().split("\n")[0] || "";
  if (!(first.length > 0 && first.length <= PROSE_LINE_TARGET && first.trim() !== "")) {
    return { score: 0, failures: [{ check: "opener", detail: first.slice(0, 80) }] };
  }
  return null;
}

function checkSummarySentences(description: string): CheckResult | null {
  const summaryMatch2 = description.match(summarySliceRe);
  if (!summaryMatch2?.[1]) {
    return { score: 0, failures: [{ check: "summarySentences", detail: "no Summary section" }] };
  }
  const sentences = summaryMatch2[1].split(/(?<=[.!?])\s+/).filter(Boolean);
  const hasBullets = /^[-*]\s/m.test(summaryMatch2[1]);
  if (sentences.length > 4 || sentences.length === 0 || hasBullets) {
    return {
      score: 0,
      failures: [
        {
          check: "summarySentences",
          detail:
            `${sentences.length} sentences` +
            (hasBullets ? " + bullet lines inside the Summary section (move them under their own heading)" : ""),
        },
      ],
    };
  }
  return null;
}

// Small diffs (≤3 files or ≤50 changed lines) skip scaffolding entirely per the
// size-tier prompt note — Changes/Testing sections are optional on that path.
// The "or" matches buildSizeTierNote in prompts/common.ts: either signal on its
// own puts the PR on the compact path. A 0-file/0-line stat block is never small.
function isSmallDiff(stats: PRStats | null): boolean {
  if (!stats || stats.files <= 0) return false;
  return stats.files <= 3 || stats.additions + stats.deletions <= 50;
}

function checkBoldLabelBullets(description: string, stats: PRStats | null): CheckResult | null {
  const changesMatch = description.match(/^## Changes\n([\s\S]*?)(?=\n## |$(?![\s\S]))/m);
  if (!changesMatch?.[1]) {
    if (isSmallDiff(stats)) return null;
    return { score: 0, failures: [{ check: "boldLabelBullets", detail: "no Changes section" }] };
  }
  const bullets = changesMatch[1].split("\n").filter((l) => /^[-*]\s/.test(l));
  const boldCount = bullets.filter((l) => l.includes("**")).length;
  if (bullets.length < 3 || boldCount < 3) {
    return {
      score: 0,
      failures: [{ check: "boldLabelBullets", detail: `${bullets.length} bullets, ${boldCount} bold` }],
    };
  }
  return null;
}

// Fence-aware content view: lines inside ``` code fences (and the fence
// delimiter lines themselves) are replaced with empty strings so line
// positions survive, while fenced content never counts toward prose, step,
// or anchor metrics — a pasted log must not pretend to be authored content.
function stripFencedLines(text: string): string {
  let inFence = false;
  return text
    .split("\n")
    .map((line) => {
      if (line.trim().startsWith("```")) {
        inFence = !inFence;
        return "";
      }
      return inFence ? "" : line;
    })
    .join("\n");
}

// The anchor floor scales with the ACTUAL anchor supply, not just the file
// count: a PR whose diff yielded 1 usable anchor is asked for 1 link, even if
// it touched more files. anchorCount is the number of anchor-capable files the
// prompt offered; null falls back to min(3, files) for callers without it.
function checkAnchors(
  description: string,
  stats: PRStats | null,
  anchorCount: number | null = null,
): CheckResult | null {
  const content = stripFencedLines(description);
  const linkCount = (content.match(/diffhunk:\/\//g) ?? []).length;
  // Bare [[N]] markers without the diffhunk:// URL link silently break the
  // anchors' whole purpose — detect them separately.
  const bareMarkers = (content.match(/\[\[\d+\]\]\s*(?!\()/g) ?? []).length;
  const failures: Array<{ check: string; detail: string }> = [];
  const supply = anchorCount ?? stats?.files ?? 3;
  const required = Math.min(3, Math.max(1, supply));
  if (linkCount < required) {
    failures.push({ check: "anchors", detail: `${linkCount} anchors (needs ${required})` });
  }
  if (bareMarkers > 0) {
    failures.push({ check: "anchors", detail: `${bareMarkers} bare [[N]] refs without links` });
  }
  return failures.length > 0 ? { score: 0, failures } : null;
}

// The verification section is canonically "## Testing"; models sometimes write
// "## Verification" (or an "### Verification Steps" subsection) or "How to
// test" — accept the synonyms. Slicing still stops at the next H2 only, so
// numbered steps nested under H3 subgroups inside the section stay in scope.
const TESTING_SECTION_RE = /^#{2,3} (?:Testing|Verification|How to test)\s*\n([\s\S]*?)(?=\n## |$(?![\s\S]))/m;

function checkTestingSteps(description: string, stats: PRStats | null): CheckResult | null {
  const testingMatch = description.match(TESTING_SECTION_RE);
  if (!testingMatch?.[1]) {
    if (isSmallDiff(stats)) return null;
    return { score: 0, failures: [{ check: "testingSteps", detail: "no Testing section" }] };
  }
  // Numbered steps must be authored steps, not lines quoted inside a fenced
  // example — but the fence requirement itself still looks at the raw content.
  const steps = (stripFencedLines(testingMatch[1]).match(/^\d+\.\s/gm) ?? []).length;
  const hasFence = /```/.test(testingMatch[1]);
  if (steps < 2 || !hasFence) {
    return { score: 0, failures: [{ check: "testingSteps", detail: `steps=${steps}, fence=${hasFence}` }] };
  }
  return null;
}

function checkTestingFormat(description: string, stats: PRStats | null): CheckResult | null {
  const testingMatch2 = description.match(TESTING_SECTION_RE);
  if (!testingMatch2?.[1]) {
    if (isSmallDiff(stats)) return null;
    return { score: 0, failures: [{ check: "testingFormat", detail: "no Testing section" }] };
  }
  // Any fence language (or a bare fence) is fine — the prompts promise generic
  // fences, so ```sh / ```console / plain ``` all count as the command block.
  const hasExpectedNextLine =
    /```[^\n]*\n[^`]+```\s*\n\s*Expected:/m.test(testingMatch2[1]) ||
    /^\d+\.\s[^`]+```\s*\n\s*Expected:/m.test(testingMatch2[1]);
  if (!hasExpectedNextLine) {
    return { score: 0, failures: [{ check: "testingFormat", detail: "command+Expected on same line" }] };
  }
  return null;
}

function checkFences(description: string, stats: PRStats | null): CheckResult | null {
  const fenceCount = (description.match(/```/g) ?? []).length;
  if (fenceCount % 2 !== 0) {
    return { score: 0, failures: [{ check: "fences", detail: `${fenceCount} fences (unbalanced)` }] };
  }
  if (fenceCount === 0 && !isSmallDiff(stats)) {
    return { score: 0, failures: [{ check: "fences", detail: "no fenced blocks" }] };
  }
  return null;
}

// Prose lines (paragraphs) ≤400 chars; bullets get 600 (long identifiers live
// there); fenced commands/logs are exempt entirely — a long URL or command must
// not count as a "prose wall".
function proseMetrics(description: string): { maxProse: number; maxBullet: number } {
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
  return { maxProse, maxBullet };
}

function checkLineLength(description: string): CheckResult | null {
  const { maxProse, maxBullet } = proseMetrics(description);
  if (maxProse > 400 || maxBullet > 600) {
    return { score: 0, failures: [{ check: "lineLength", detail: `prose=${maxProse}, bullets=${maxBullet}` }] };
  }
  return null;
}

function checkBulletWords(description: string): CheckResult | null {
  const bullets2 = stripFencedLines(description)
    .split("\n")
    .filter((l) => /^[-*]\s/.test(l));
  const maxWords = bullets2.reduce((m, l) => Math.max(m, l.trim().split(/\s+/).filter(Boolean).length), 0);
  if (maxWords > 60) {
    return { score: 0, failures: [{ check: "bulletWords", detail: `max=${maxWords}` }] };
  }
  return null;
}

// Accepted closing artifacts: verdict line, issue link, honest "Not verified",
// a verdict table row, or a scope-accounting line in the exact shape
// ensureArtifactEnding appends (`Scope: N files, +A/-D`, case-insensitive).
// Bare prose mentions of the word "scope" do NOT count. Shared with the
// normalizer in description-normalize.ts so normalization and checking can
// never drift.
const ARTIFACT_ENDING_PARTS = [
  "(?:Closes|Fixes) #",
  "Not verified",
  "verdict",
  String.raw`\|[-—\s|]+\|`,
  String.raw`scope:\s*\d+\s*files?,\s*\+\d+\s*/\s*-\d+`,
];

export const ARTIFACT_ENDING_RE = new RegExp(ARTIFACT_ENDING_PARTS.join("|"), "i");

function checkEnding(description: string): CheckResult | null {
  const tail = description
    .split("\n")
    .filter((l) => l.trim())
    .slice(-3)
    .join(" ");
  if (!ARTIFACT_ENDING_RE.test(tail)) {
    return { score: 0, failures: [{ check: "ending", detail: `ends: ${tail.slice(0, 80)}` }] };
  }
  return null;
}

function checkExpectedLineLength(description: string): CheckResult | null {
  const expectedLines = stripFencedLines(description)
    .split("\n")
    .filter((l) => /^\s*Expected:/i.test(l));
  const maxExpectedLen = expectedLines.reduce((m, l) => Math.max(m, l.length), 0);
  if (maxExpectedLen > 400 && expectedLines.length > 0) {
    return { score: 0, failures: [{ check: "expectedLineLength", detail: `max=${maxExpectedLen}` }] };
  }
  return null;
}

// Corpus "size proportionality" trait: small diffs should get compact output.
// Only evaluated when stats exist and the diff is small (≤3 files or ≤50 changed
// lines); larger diffs get no upper bound from this check.
function checkProportionalSize(description: string, stats: PRStats): CheckResult | null {
  if (!isSmallDiff(stats)) return null;
  const words = description.split(/\s+/).filter(Boolean).length;
  if (words > 200) {
    return {
      score: 0,
      failures: [
        {
          check: "proportionalSize",
          detail: `${String(words)} words for a small diff (${String(stats.files)} files, +${String(stats.additions)}/-${String(stats.deletions)}) — keep it compact (≤200 words): root-cause-first Summary, verifiable Testing, no scaffold`,
        },
      ],
    };
  }
  return null;
}

import { countCoveredCommits, coverageThreshold, listedCommits } from "./commit-coverage";

// Coverage is judged only against the commits the prompt actually listed
// (MAX_LISTED_COMMITS, commit-coverage.ts): past that cap a 60% requirement on
// the full array is mathematically unreachable and costs pointless refinement
// iterations. Unlisted commits are covered thematically per the prompt note.
function checkCommitCoverage(description: string, commitMessages: string[]): CheckResult | null {
  const listed = listedCommits(commitMessages);
  if (listed.length === 0) return null;
  const covered = countCoveredCommits(listed, description);
  const threshold = coverageThreshold(listed.length);
  if (covered / listed.length < threshold) {
    const unlisted = commitMessages.length - listed.length;
    const unlistedNote = unlisted > 0 ? ` (+${String(unlisted)} unlisted, thematic)` : "";
    return {
      score: 0,
      failures: [
        {
          check: "commitCoverage",
          detail: `${covered}/${listed.length} listed${unlistedNote} (needs ${Math.round(threshold * 100)}%)`,
        },
      ],
    };
  }
  return null;
}

export type ScoreMode = "full" | "preserve-authored";

export async function scoreDescription(
  description: string,
  commitMessages: string[] = [],
  hasAnchors = true,
  stats: PRStats | null = null,
  mode: ScoreMode = "full",
  anchorCount: number | null = null,
): Promise<{
  score: number;
  maxScore: number;
  failures: Array<{ check: string; detail: string }>;
}> {
  // "preserve-authored" runs only the checks that never force restructuring of
  // the author's prose, so maxScore is always 6 in that mode.
  const polish: Check[] = [
    (desc: string) => checkTestingSteps(desc, stats),
    (desc: string) => checkFences(desc, stats),
    checkLineLength,
    checkEnding,
    (desc: string) => checkTestingFormat(desc, stats),
    checkExpectedLineLength,
  ];
  const checks: Check[] =
    mode === "preserve-authored"
      ? polish
      : [
          checkOpener,
          checkSummarySentences,
          (desc: string) => checkBoldLabelBullets(desc, stats),
          // Only demand anchors when the PR actually has usable target anchors.
          ...(hasAnchors ? [(desc: string) => checkAnchors(desc, stats, anchorCount)] : []),
          ...(stats ? [(desc: string) => checkProportionalSize(desc, stats)] : []),
          ...polish.slice(0, 3),
          checkBulletWords,
          ...polish.slice(3),
          (desc: string) => checkCommitCoverage(desc, commitMessages),
        ];

  let score = 0;
  const failures: Array<{ check: string; detail: string }> = [];

  for (const check of checks) {
    const result = check(description);
    if (result) {
      failures.push(...result.failures);
    } else {
      score += 1;
    }
  }

  return { score, maxScore: checks.length, failures };
}
