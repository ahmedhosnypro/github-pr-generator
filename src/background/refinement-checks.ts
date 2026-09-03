// Deterministic quality checks for generated PR descriptions, consumed by the
// refinement loop (refinement.ts) and by tests. Kept out of refinement.ts to
// stay under the sonarjs/max-lines budget. Each check returns null on pass.

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

function checkOpener(description: string): CheckResult | null {
  const summaryMatch = description.match(summarySliceRe);
  if (!summaryMatch?.[1]) {
    return { score: 0, failures: [{ check: "opener", detail: "no Summary section" }] };
  }
  const first = summaryMatch[1].trim().split("\n")[0] || "";
  if (!(first.length > 0 && first.length <= 300 && first.trim() !== "")) {
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

// Small diffs (≤3 files, ≤50 changed lines) skip scaffolding entirely per the
// size-tier prompt note — Changes/Testing sections are optional on that path.
function isSmallDiff(stats: PRStats | null): boolean {
  if (!stats) return false;
  return stats.files > 0 && stats.files <= 3 && stats.additions + stats.deletions <= 50;
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

function checkAnchors(description: string): CheckResult | null {
  const anchorCount = (description.match(/diffhunk:\/\//g) ?? []).length;
  // Bare [[N]] markers without the diffhunk:// URL link silently break the
  // anchors' whole purpose — detect them separately.
  const bareMarkers = (description.match(/\[\[\d+\]\]\s*(?!\()/g) ?? []).length;
  const failures: Array<{ check: string; detail: string }> = [];
  if (anchorCount < 3) {
    failures.push({ check: "anchors", detail: `${anchorCount} anchors` });
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
  const steps = (testingMatch[1].match(/^\d+\.\s/gm) ?? []).length;
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
  const hasExpectedNextLine =
    /```bash\n[^`]+```\s*\n\s*Expected:/m.test(testingMatch2[1]) ||
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
  const bullets2 = description.split("\n").filter((l) => /^[-*]\s/.test(l));
  const maxWords = bullets2.reduce((m, l) => Math.max(m, l.trim().split(/\s+/).filter(Boolean).length), 0);
  if (maxWords > 60) {
    return { score: 0, failures: [{ check: "bulletWords", detail: `max=${maxWords}` }] };
  }
  return null;
}

// Accepted closing artifacts: verdict line, issue link, honest "Not verified",
// a verdict table row, or scope accounting. Shared with the normalizer in
// description-normalize.ts so normalization and checking can never drift.
export const ARTIFACT_ENDING_RE = /Closes #|Fixes #|Not verified|verdict|\|[-—\s|]+\||scope/i;

function checkEnding(description: string): CheckResult | null {
  const tail = description
    .split("\n")
    .filter((l) => l.trim())
    .slice(-3)
    .join(" ");
  if (!ARTIFACT_ENDING_RE.test(tail)) {
    return {
      score: 0,
      failures: [
        {
          check: "ending",
          detail: `ends: ${description
            .split("\n")
            .filter((l) => l.trim())
            .slice(-3)
            .join(" ")
            .slice(0, 80)}`,
        },
      ],
    };
  }
  return null;
}

function checkExpectedLineLength(description: string): CheckResult | null {
  const expectedLines = description.split("\n").filter((l) => /^\s*Expected:/i.test(l));
  const maxExpectedLen = expectedLines.reduce((m, l) => Math.max(m, l.length), 0);
  if (maxExpectedLen > 400 && expectedLines.length > 0) {
    return { score: 0, failures: [{ check: "expectedLineLength", detail: `max=${maxExpectedLen}` }] };
  }
  return null;
}

// Corpus "size proportionality" trait: small diffs should get compact output.
// Only evaluated when stats exist and the diff is small (≤3 files, ≤50 changed
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

import { countCoveredCommits, coverageThreshold } from "./commit-coverage";

function checkCommitCoverage(description: string, commitMessages: string[]): CheckResult | null {
  if (commitMessages.length === 0) return null;
  const covered = countCoveredCommits(commitMessages, description);
  const threshold = coverageThreshold(commitMessages.length);
  if (covered / commitMessages.length < threshold) {
    return {
      score: 0,
      failures: [
        {
          check: "commitCoverage",
          detail: `${covered}/${commitMessages.length} (needs ${Math.round(threshold * 100)}%)`,
        },
      ],
    };
  }
  return null;
}

export async function scoreDescription(
  description: string,
  commitMessages: string[] = [],
  hasAnchors = true,
  stats: PRStats | null = null,
): Promise<{
  score: number;
  maxScore: number;
  failures: Array<{ check: string; detail: string }>;
}> {
  const checks: Check[] = [
    checkOpener,
    checkSummarySentences,
    (desc: string) => checkBoldLabelBullets(desc, stats),
    // Only demand anchors when the PR actually has usable anchor targets; the
    // generation prompt forbids emitting diffhunk links when none were scraped.
    ...(hasAnchors ? [checkAnchors] : []),
    ...(stats ? [(desc: string) => checkProportionalSize(desc, stats)] : []),
    (desc: string) => checkTestingSteps(desc, stats),
    (desc: string) => checkFences(desc, stats),
    checkLineLength,
    checkBulletWords,
    checkEnding,
    (desc: string) => checkTestingFormat(desc, stats),
    checkExpectedLineLength,
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
