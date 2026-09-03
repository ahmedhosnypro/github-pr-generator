import type { ExtensionConfig, PRStats } from "../types";
import { ensureArtifactEnding, wrapLongProseLines } from "./description-normalize";
import { callAPI } from "./llm";
import { logMsg } from "./log";
import { scoreDescription } from "./refinement-checks";

const REFINEMENT_PROMPT = (
  hasAnchors: boolean,
) => `You are an expert at crafting GitHub PR descriptions that are highly readable and follow the conventions of top open-source projects.

TASK: Improve the given PR description to maximize readability and render quality. You MUST fix ALL issues found in the analysis.

QUALITY REQUIREMENTS (12-point rubric - fix every failure):
1. **Opener is a thesis** - First line after "## Summary" must be a clear thesis, NOT a restatement of the title. Wrap at sentence boundaries.
2. **Summary prose ≤4 sentences** - No bullets in Summary; max 4 sentences total. Each sentence on its own line.
3. **Changes grouped with bold-label bullets** - Each bullet: \`- **Bold label** — one concrete statement ≤25 words\`. Keep bullets in groups ≤200 words maximum.
${hasAnchors ? "4. **Diff-hunk anchors present** - Every file mentioned must have `[[N]](diffhunk://...)` link" : "4. **No anchors available** - This PR has no scraped diff anchors; do NOT add `[[N]](diffhunk://...)` links"}
5. **Testing has numbered steps + fenced commands** - Steps like "1. Run \`cmd\`\nExpected: ...\n\n2. ..."
6. **Fences balanced** - Every \`\`\` has closing \`\`\`
7. **No prose-wall lines** - Prose paragraphs ≤400 chars (wrap at sentence boundaries); bullet lines may run to 600 for long identifiers; fenced commands/logs are exempt. This includes Summary paragraphs, Expected lines, and any other prose.
8. **Bullets ≤60 words** - Break long bullets; one idea per bullet. Each bullet should be <25 words.
9. **Ends on artifact** - Final line MUST be a verdict table row (|...|), "Closes #N", "Fixes #N", "Not verified — reason", or scope accounting line (e.g., "Scope: X files, Y additions"). NEVER end with "please review", "let me know", test output, or bare "Expected:" lines.
10. **Testing steps: command on one line, Expected: on next** - Never combine command + outcome on same line
11. **Expected lines ≤400 chars** - Wrap long expected outcomes at sentence boundaries
12. **Proportional size** - For small diffs (≤3 files, ≤50 changed lines) keep the whole description ≤200 words — compact "small but complete", no long scaffold.

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
- **CRITICAL**: "Expected:" lines in Testing section MUST be ≤400 chars. Wrap them at sentence boundaries. Each Expected: line should be on its own line after the command fence, not inline with the command.
- **CRITICAL**: Summary section: 2-4 sentences, ≤400 chars total; each sentence on its own line; no paragraph line over 400 chars.
- Keep bullet count low (~25-30) but dense and searchable
- Testing steps ≤10 with high-value coverage of suites
- CRITICAL: These exact pattern rules must be followed strictly — every "Expected:" on its own line after the command fence; no inline commands with colon colons or pre in Summary; commits must be accounted for via bullet mentions without orphaned commits

INPUT FORMAT:
---
TITLE: <pr title>
DESCRIPTION: <markdown body>
ANCHORS: <true/false>
STATS: <files, additions/deletions>
SCORE: <current score>/<max score>
FAILURES: <list of failures with details>
---

OUTPUT FORMAT:
Return ONLY the improved PR description (markdown), nothing else. No commentary, no preamble.`;

export async function refineDescription(
  config: ExtensionConfig,
  title: string,
  description: string,
  commitMessages: string[],
  hasAnchors: boolean,
  maxIterations = 3,
  targetScore = 10,
  stats: PRStats | null = null,
  earlyAccept?: (description: string) => boolean,
): Promise<{ description: string; finalScore: number; iterations: number }> {
  let currentDescription = ensureArtifactEnding(wrapLongProseLines(description), stats);
  let currentScore = 0;
  let maxScore = 0;
  let iterations = 0;
  let failures: Array<{ check: string; detail: string }> = [];

  // Initial score (after the free deterministic fixes, so a long prose line
  // or a missing closing artifact never costs an LLM iteration)
  const initial = await scoreDescription(currentDescription, commitMessages, hasAnchors, stats);
  currentScore = initial.score;
  maxScore = initial.maxScore;
  failures = initial.failures;
  logMsg(`Initial quality score: ${currentScore}/${maxScore}`);

  // Callers with an external acceptance gate (the PR lab's rubric) can stop
  // before spending LLM iterations on internal points the gate ignores.
  if (earlyAccept?.(currentDescription)) {
    logMsg("Early accept: external acceptance check passed on first pass");
    return { description: currentDescription, finalScore: currentScore, iterations: 0 };
  }

  // A degenerate near-empty refinement (observed: 11-char replies from a
  // congested gateway) used to abort the whole loop; give it one retry before
  // giving up on refinement entirely.
  let shortRetryUsed = false;

  for (let iter = 1; iter <= maxIterations && currentScore < targetScore; iter++) {
    iterations = iter;
    logMsg(`Refinement iteration ${iter}/${maxIterations} (current: ${currentScore}/${maxScore})`);

    const failuresText = failures.map((f) => `- ${f.check}: ${f.detail}`).join("\n");
    const prompt = `---
TITLE: ${title}
DESCRIPTION: ${currentDescription}
ANCHORS: ${hasAnchors}
STATS: ${stats ? `${String(stats.files)} files, +${String(stats.additions)}/-${String(stats.deletions)}` : "unknown"}
SCORE: ${currentScore}/${maxScore}
FAILURES:
${failuresText}
---

${REFINEMENT_PROMPT(hasAnchors)}
OUTPUT FORMAT:
Return ONLY the improved PR description (markdown), nothing else. No commentary, no preamble.`;

    try {
      const refined = await callAPI(config, prompt, 0.2);
      if (!refined || refined.trim().length < 200) {
        if (!shortRetryUsed) {
          shortRetryUsed = true;
          logMsg(
            `Iteration ${iter}: refinement too short (${String(refined.trim().length)} chars) — retrying iteration once`,
          );
          iter -= 1;
          continue;
        }
        logMsg(`Iteration ${iter}: refinement too short, stopping`);
        break;
      }

      const wrapped = ensureArtifactEnding(wrapLongProseLines(refined), stats);
      const scored = await scoreDescription(wrapped, commitMessages, hasAnchors, stats);
      logMsg(`Iteration ${iter}: score ${scored.score}/${maxScore} (was ${currentScore}/${maxScore})`);

      if (scored.score >= currentScore) {
        currentDescription = wrapped;
        currentScore = scored.score;
        failures = scored.failures;
        if (earlyAccept?.(currentDescription)) {
          logMsg(`Early accept: external acceptance check passed at iteration ${String(iter)}`);
          break;
        }
        if (currentScore >= targetScore) break;
      } else {
        logMsg(`Iteration ${iter}: score regressed, keeping previous`);
      }
    } catch (e) {
      logMsg(`Iteration ${iter} failed: ${e instanceof Error ? e.message : String(e)}`);
      break;
    }
  }

  logMsg(`Refinement complete: ${currentScore}/${maxScore} after ${iterations} iterations`);
  return { description: currentDescription, finalScore: currentScore, iterations };
}
