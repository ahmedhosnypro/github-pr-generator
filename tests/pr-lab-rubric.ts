// Deterministic 10-point render-quality rubric for generated PR descriptions.
// Each check maps to one failure class observed in the corpus study
// (analysis/pull-requests/PRESENTATION.md) or the sirajLMS/siraj#119 incident.
import { countDiffAnchors } from "../src/background/parse";
import { countCoveredCommits } from "./testkit";

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
  return {
    name: "summary prose-only, ≤4 sentences",
    ok: summary !== "" && !/^[-*]\s/m.test(summary) && sentenceCount(summary) <= 4,
    detail: String(sentenceCount(summary)) + " sentences",
  };
}

function checkChanges(changes: string): RubricCheck {
  return {
    name: "changes grouped with bold-label bullets",
    ok: changes !== "" && bulletLines(changes).filter((l) => l.includes("**")).length >= 3,
    detail: String(bulletLines(changes).length) + " bullets",
  };
}

function checkAnchors(description: string): RubricCheck {
  return {
    name: "diff-hunk anchors present",
    ok: countDiffAnchors(description) >= 3,
    detail: String(countDiffAnchors(description)) + " anchors",
  };
}

function checkTesting(testing: string): RubricCheck {
  return {
    name: "testing has numbered steps + fence",
    ok: (testing.match(/^\d+\.\s/gm) ?? []).length >= 2 && /```/.test(testing),
    detail: "steps=" + String((testing.match(/^\d+\.\s/gm) ?? []).length),
  };
}

function checkFences(fences: number): RubricCheck {
  return { name: "fences balanced", ok: fences % 2 === 0 && fences > 0, detail: String(fences) + " fences" };
}

function checkLineLengths(description: string): RubricCheck {
  return {
    name: "no prose-wall lines (>400 chars)",
    ok: description.split("\n").every((l) => l.length <= 400),
    detail: "max=" + String(Math.max(...description.split("\n").map((l) => l.length))),
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
  return {
    name: "commit coverage ≥90%",
    ok: commitMessages.length === 0 || countCoveredCommits(commitMessages, description) / commitMessages.length >= 0.9,
    detail: String(countCoveredCommits(commitMessages, description)) + "/" + String(commitMessages.length),
  };
}

// 10 checks, one point each. `expectAnchors` = the prompt carried an Anchors section.
export function scoreDescription(
  description: string,
  title: string,
  commitMessages: string[],
): { score: number; checks: RubricCheck[] } {
  const checks: RubricCheck[] = [
    checkOpener(firstLine(description), title),
    checkSummary(sectionSlice(description, "Summary")),
    checkChanges(sectionSlice(description, "Changes")),
    checkAnchors(description),
    checkTesting(sectionSlice(description, "Testing")),
    checkFences((description.match(/```/g) ?? []).length),
    checkLineLengths(description),
    checkBulletWords(description),
    checkEnding(description),
    checkCoverage(description, commitMessages),
  ];
  return { score: checks.filter((c) => c.ok).length, checks };
}
