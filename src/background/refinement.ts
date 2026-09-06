import type { ExtensionConfig, PRStats } from "../types";
import { ensureArtifactEnding, wrapLongProseLines } from "./description-normalize";
import { callAPI } from "./llm";
import { logMsg } from "./log";
import { type ScoreMode, scoreDescription } from "./refinement-checks";

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

const AUTHORED_PRESERVING_PROMPT = `You are finalizing a GitHub PR description whose body already contains the PR author's hand-written text.

ABSOLUTE RULE: The body already carries the PR author's hand-written text, and every sentence of it MUST survive verbatim. Do NOT restructure, rewrite, reorder, or reformat any existing content — not the Summary, not paragraphs, not bullets, not headings, not tables. Your only license is to complete genuinely missing parts (a '## Testing' section with numbered steps and fenced commands; issue links such as 'Closes #N') and to fix the failures listed below with the smallest possible edit.

REDUCED RUBRIC (6 checks — fix every listed failure, change nothing else):
1. **Testing has numbered steps + fenced commands** - Steps like "1. Run \`cmd\`\nExpected: ...\n\n2. ..."
2. **Fences balanced** - Every \`\`\` has a closing \`\`\`
3. **No prose-wall lines** - Prose paragraphs outside fences must stay ≤400 chars; wrap at sentence boundaries. This is the ONLY permitted touch to existing prose, and only for lines over 400 chars.
4. **Ends on an artifact** - Final line MUST be a verdict line, "Closes #N", "Not verified — reason", or scope accounting (e.g. "Scope: X files, Y additions"). NEVER end with "please review" or similar pleas.
5. **Command on one line, Expected: on the next** - Never combine a command and its outcome on the same line inside Testing.
6. **Expected lines ≤400 chars** - Wrap long expected outcomes at sentence boundaries.

INPUT FORMAT:
---
TITLE: <pr title>
DESCRIPTION: <current body; authored prose inside>
ANCHORS: <true/false>
STATS: <files and +/- lines>
SCORE: <current>/<max>
FAILURES: <failing checks with details>
---

OUTPUT FORMAT:
Return ONLY the finished PR description as markdown — no commentary, no preamble.`;

function pickScoreMode(preserveAuthoredBody: boolean): ScoreMode {
  return preserveAuthoredBody ? "preserve-authored" : "full";
}

function abortReason(signal: AbortSignal | undefined): string {
  const reason: unknown = signal?.reason;
  return reason instanceof Error ? reason.message : "cancelled";
}

function isAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted ?? false;
}

function buildIterationPrompt(
  title: string,
  description: string,
  hasAnchors: boolean,
  stats: PRStats | null,
  score: number,
  maxScore: number,
  failures: Array<{ check: string; detail: string }>,
  preserveAuthoredBody: boolean,
): string {
  const statsText = stats
    ? `${String(stats.files)} files, +${String(stats.additions)}/-${String(stats.deletions)}`
    : "unknown";
  const failuresText = failures.map((f) => `- ${f.check}: ${f.detail}`).join("\n");
  const rubric = preserveAuthoredBody ? AUTHORED_PRESERVING_PROMPT : REFINEMENT_PROMPT(hasAnchors);
  return `---
TITLE: ${title}
DESCRIPTION: ${description}
ANCHORS: ${hasAnchors}
STATS: ${statsText}
SCORE: ${score}/${maxScore}
FAILURES:
${failuresText}
---

${rubric}
OUTPUT FORMAT:
Return ONLY the improved PR description (markdown), nothing else. No commentary, no preamble.`;
}

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
  preserveAuthoredBody = false,
  signal?: AbortSignal,
): Promise<{ description: string; finalScore: number; iterations: number }> {
  const scoreMode = pickScoreMode(preserveAuthoredBody);
  let currentDescription = ensureArtifactEnding(wrapLongProseLines(description), stats);
  let iterations = 0;

  // Initial score (after the free deterministic fixes, so a long prose line
  // or a missing closing artifact never costs an LLM iteration)
  const initial = await scoreDescription(currentDescription, commitMessages, hasAnchors, stats, scoreMode);
  const { maxScore } = initial;
  let { score: currentScore, failures } = initial;
  targetScore = Math.min(targetScore, maxScore);
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
    if (isAborted(signal)) {
      logMsg("Refinement aborted (caller cancelled): " + abortReason(signal));
      break;
    }
    iterations = iter;
    logMsg(`Refinement iteration ${iter}/${maxIterations} (current: ${currentScore}/${maxScore})`);

    const prompt = buildIterationPrompt(
      title,
      currentDescription,
      hasAnchors,
      stats,
      currentScore,
      maxScore,
      failures,
      preserveAuthoredBody,
    );

    try {
      const refined = await callAPI(config, prompt, 0.2, undefined, true, true, signal);
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
      const scored = await scoreDescription(wrapped, commitMessages, hasAnchors, stats, scoreMode);
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
