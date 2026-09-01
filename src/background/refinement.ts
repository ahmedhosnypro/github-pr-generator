import type { ExtensionConfig } from "../types";
import { callAPI } from "./llm";
import { logMsg } from "./log";

const REFINEMENT_PROMPT = `You are an expert at crafting GitHub PR descriptions that are highly readable and follow the conventions of top open-source projects.

TASK: Improve the given PR description to maximize readability and render quality. You MUST fix ALL issues found in the analysis.

QUALITY REQUIREMENTS (10-point rubric - fix every failure):
1. **Opener is a thesis** - First line after "## Summary" must be a clear thesis, NOT a restatement of the title. Wrap at sentence boundaries.
2. **Summary prose ≤4 sentences** - No bullets in Summary; max 4 sentences total. Each sentence on its own line OR wrap at sentence boundaries if >400 chars.
3. **Changes grouped with bold-label bullets** - Each bullet: \`- **Bold label** — one concrete statement ≤25 words\`
4. **Diff-hunk anchors present** - Every file mentioned must have \`[[N]](diffhunk://...)\` link
5. **Testing has numbered steps + fenced commands** - Steps like "1. Run \`cmd\`\nExpected: ...\n\n2. ..."
6. **Fences balanced** - Every \`\`\` has closing \`\`\`
7. **No prose-wall lines (>400 chars)** - CRITICAL: Wrap ALL lines >400 chars at sentence boundaries. This includes Summary paragraphs, Expected lines, and any other content.
8. **Bullets ≤60 words** - Break long bullets; one idea per bullet
9. **Ends on artifact** - Final line MUST be a verdict table row (|...|), "Closes #N", "Fixes #N", "Not verified — reason", or scope accounting line (e.g., "Scope: X files, Y additions"). NEVER end with "please review", "let me know", test output, or bare "Expected:" lines.
10. **Testing steps: command on one line, Expected: on next** - Never combine command + outcome on same line
11. **Expected lines ≤500 chars** - Wrap long expected outcomes at sentence boundaries

CRITICAL FORMATTING RULES:
- Commands in fenced \`\`\`bash blocks, never inline
- Tables with bold verdict captions for 2+ row comparisons
- Bold labels on bullets: \`- **Label** — one statement\`
- H2 for sections, H3 for subsections — never bare-text pseudo-headers
- Paragraphs ≤3 sentences, one idea each
- Checked boxes only for verified claims; unchecked carry "N/A — reason"
- UI evidence: \`**What this shows:**\` / \`**State:**\` captions
- Body ends on artifact: verdict line / \`Closes #N\` / scope accounting
- No "please review" or empty checklists at end
- The FINAL LINE of the description must be an artifact (verdict table, Closes #, Fixes #, Not verified, or scope summary)
- **CRITICAL**: "Expected:" lines in Testing section MUST be ≤400 chars. Wrap them at sentence boundaries. Each Expected: line should be on its own line after the command fence, not inline with the command.
- **CRITICAL**: Summary paragraph lines must be ≤400 chars. Write Summary as 2-4 separate sentences, each on its own line if needed.
- NEVER output a single paragraph with multiple sentences on one line. Wrap sentences at boundaries.

INPUT FORMAT:
---
TITLE: <pr title>
DESCRIPTION: <markdown body>
ANCHORS: <true/false>
SCORE: <current score>/10
FAILURES: <list of failures with details>
---

OUTPUT FORMAT:
Return ONLY the improved PR description (markdown), nothing else. No commentary, no preamble.`;

function checkOpener(
  description: string,
): { score: number; failures: Array<{ check: string; detail: string }> } | null {
  const summaryMatch = description.match(/^## Summary\n([\s\S]*?)(?=\n## |\n$)/);
  if (!summaryMatch?.[1]) {
    return { score: 0, failures: [{ check: "opener", detail: "no Summary section" }] };
  }
  const first = summaryMatch[1].trim().split("\n")[0] || "";
  if (!(first.length > 0 && first.length <= 300 && first.trim() !== "")) {
    return { score: 0, failures: [{ check: "opener", detail: first.slice(0, 80) }] };
  }
  return null;
}

function checkSummarySentences(
  description: string,
): { score: number; failures: Array<{ check: string; detail: string }> } | null {
  const summaryMatch2 = description.match(/^## Summary\n([\s\S]*?)(?=\n## |\n$)/);
  if (!summaryMatch2?.[1]) {
    return { score: 0, failures: [{ check: "summarySentences", detail: "no Summary section" }] };
  }
  const sentences = summaryMatch2[1].split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > 4 || sentences.length === 0 || /^[-*]\s/m.test(summaryMatch2[1])) {
    return { score: 0, failures: [{ check: "summarySentences", detail: `${sentences.length} sentences` }] };
  }
  return null;
}

function checkBoldLabelBullets(
  description: string,
): { score: number; failures: Array<{ check: string; detail: string }> } | null {
  const changesMatch = description.match(/^## Changes\n([\s\S]*?)(?=\n## |\n$)/);
  if (!changesMatch?.[1]) {
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

function checkAnchors(
  description: string,
): { score: number; failures: Array<{ check: string; detail: string }> } | null {
  const anchorCount = (description.match(/diffhunk:\/\//g) ?? []).length;
  if (anchorCount < 3) {
    return { score: 0, failures: [{ check: "anchors", detail: `${anchorCount} anchors` }] };
  }
  return null;
}

function checkTestingSteps(
  description: string,
): { score: number; failures: Array<{ check: string; detail: string }> } | null {
  const testingMatch = description.match(/^## Testing\n([\s\S]*?)(?=\n## |\n$)/);
  if (!testingMatch?.[1]) {
    return { score: 0, failures: [{ check: "testingSteps", detail: "no Testing section" }] };
  }
  const steps = (testingMatch[1].match(/^\d+\.\s/gm) ?? []).length;
  const hasFence = /```/.test(testingMatch[1]);
  if (steps < 2 || !hasFence) {
    return { score: 0, failures: [{ check: "testingSteps", detail: `steps=${steps}, fence=${hasFence}` }] };
  }
  return null;
}

function checkFences(
  description: string,
): { score: number; failures: Array<{ check: string; detail: string }> } | null {
  const fenceCount = (description.match(/```/g) ?? []).length;
  if (fenceCount === 0 || fenceCount % 2 !== 0) {
    return { score: 0, failures: [{ check: "fences", detail: `${fenceCount} fences` }] };
  }
  return null;
}

function checkLineLength(
  description: string,
): { score: number; failures: Array<{ check: string; detail: string }> } | null {
  const maxLen = Math.max(...description.split("\n").map((l) => l.length));
  if (maxLen > 400) {
    return { score: 0, failures: [{ check: "lineLength", detail: `max=${maxLen}` }] };
  }
  return null;
}

function checkBulletWords(
  description: string,
): { score: number; failures: Array<{ check: string; detail: string }> } | null {
  const bullets2 = description.split("\n").filter((l) => /^[-*]\s/.test(l));
  const maxWords = bullets2.reduce((m, l) => Math.max(m, l.trim().split(/\s+/).filter(Boolean).length), 0);
  if (maxWords > 60) {
    return { score: 0, failures: [{ check: "bulletWords", detail: `max=${maxWords}` }] };
  }
  return null;
}

function checkEnding(
  description: string,
): { score: number; failures: Array<{ check: string; detail: string }> } | null {
  const tail = description
    .split("\n")
    .filter((l) => l.trim())
    .slice(-3)
    .join(" ");
  if (!/Closes #|Fixes #|Not verified|verdict|\|[-—\s|]+\||scope/i.test(tail)) {
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

function checkTestingFormat(
  description: string,
): { score: number; failures: Array<{ check: string; detail: string }> } | null {
  const testingMatch2 = description.match(/^## Testing\n([\s\S]*?)(?=\n## |\n$)/);
  if (!testingMatch2?.[1]) {
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

function checkExpectedLineLength(
  description: string,
): { score: number; failures: Array<{ check: string; detail: string }> } | null {
  const expectedLines = description.split("\n").filter((l) => /^\s*Expected:/i.test(l));
  const maxExpectedLen = expectedLines.reduce((m, l) => Math.max(m, l.length), 0);
  if (maxExpectedLen > 500 && expectedLines.length > 0) {
    return { score: 0, failures: [{ check: "expectedLineLength", detail: `max=${maxExpectedLen}` }] };
  }
  return null;
}

function countCoveredCommits(messages: string[], desc: string): number {
  let covered = 0;
  for (const msg of messages) {
    const words = msg
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    if (words.some((w) => desc.toLowerCase().includes(w))) {
      covered++;
    }
  }
  return covered;
}

function checkCommitCoverage(
  description: string,
  commitMessages: string[],
): { score: number; failures: Array<{ check: string; detail: string }> } | null {
  if (commitMessages.length === 0) return null;
  const covered = countCoveredCommits(commitMessages, description);
  if (covered / commitMessages.length < 0.9) {
    return { score: 0, failures: [{ check: "commitCoverage", detail: `${covered}/${commitMessages.length}` }] };
  }
  return null;
}

async function scoreDescription(
  description: string,
  commitMessages: string[] = [],
): Promise<{
  score: number;
  failures: Array<{ check: string; detail: string }>;
}> {
  const checks = [
    checkOpener,
    checkSummarySentences,
    checkBoldLabelBullets,
    checkAnchors,
    checkTestingSteps,
    checkFences,
    checkLineLength,
    checkBulletWords,
    checkEnding,
    checkTestingFormat,
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

  return { score, failures };
}

export async function refineDescription(
  config: ExtensionConfig,
  title: string,
  description: string,
  commitMessages: string[],
  _hasAnchors: boolean,
  maxIterations = 3,
  targetScore = 10,
): Promise<{ description: string; finalScore: number; iterations: number }> {
  let currentDescription = description;
  let currentScore = 0;
  let iterations = 0;
  let failures: Array<{ check: string; detail: string }> = [];

  // Initial score
  const initial = await scoreDescription(currentDescription, commitMessages);
  currentScore = initial.score;
  failures = initial.failures;
  logMsg(`Initial quality score: ${currentScore}/10`);

  for (let iter = 1; iter <= maxIterations && currentScore < targetScore; iter++) {
    iterations = iter;
    logMsg(`Refinement iteration ${iter}/${maxIterations} (current: ${currentScore}/10)`);

    const failuresText = failures.map((f) => `- ${f.check}: ${f.detail}`).join("\n");
    const prompt = `---
TITLE: ${title}
DESCRIPTION: ${currentDescription}
ANCHORS: ${_hasAnchors}
SCORE: ${currentScore}/10
FAILURES:
${failuresText}
---

${REFINEMENT_PROMPT}
OUTPUT FORMAT:
Return ONLY the improved PR description (markdown), nothing else. No commentary, no preamble.`;

    try {
      const refined = await callAPI(config, prompt, 0.2);
      if (!refined || refined.trim().length < 200) {
        logMsg(`Iteration ${iter}: refinement too short, stopping`);
        break;
      }

      const scored = await scoreDescription(refined, commitMessages);
      logMsg(`Iteration ${iter}: score ${scored.score}/10 (was ${currentScore}/10)`);

      if (scored.score >= currentScore) {
        currentDescription = refined;
        currentScore = scored.score;
        failures = scored.failures;
        if (currentScore >= targetScore) break;
      } else {
        logMsg(`Iteration ${iter}: score regressed, keeping previous`);
      }
    } catch (e) {
      logMsg(`Iteration ${iter} failed: ${e}`);
      break;
    }
  }

  logMsg(`Refinement complete: ${currentScore}/10 after ${iterations} iterations`);
  return { description: currentDescription, finalScore: currentScore, iterations };
}
