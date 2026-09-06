import { buildHouseStyleNote, type RepoStyle } from "../repo-style";
import {
  ANCHOR_RULE,
  BREAKING_CHANGES_RULE,
  buildExistingContentSection,
  buildScreenshotsHint,
  buildSizeTierNote,
  buildTemplateFillBlock,
  FORMATTING_RULES,
  INTENT_TITLES_RULE,
  NO_BOT_SIGNATURES_RULE,
  NO_EMPTY_OR_PLACEHOLDERS_RULE,
  SCOPE_BOUNDARIES_RULE,
  SECTIONS_PROMPT,
  TITLE_STYLE_GUIDANCE,
} from "./common";

// Hard ceiling on the assembled prompt: at ~4 chars/token this keeps the
// request near 30k tokens, leaving completion headroom in the model's
// context window. The per-field caps (commits, changed files, anchors, diff,
// template) bound each field but not their sum, which is what this ceiling
// enforces.
export const MAX_PROMPT_CHARS = 120_000;

function assemble(changesSummary: string, existingBody: string, style?: RepoStyle): string {
  let prompt = "Generate a GitHub pull request title and description for the following changes.\n\n";
  prompt += changesSummary + "\n";

  const hasBody = existingBody.trim().length > 0;
  if (hasBody) {
    prompt += buildExistingContentSection(existingBody);
  } else if (style?.template) {
    prompt += buildTemplateFillBlock(style.template);
  }

  if (style) {
    prompt += buildHouseStyleNote(style);
  }

  prompt += buildScreenshotsHint(changesSummary);
  prompt += buildSizeTierNote(changesSummary);

  prompt += "OUTPUT FORMAT:\n";
  prompt += "1. First line: PR title only. " + TITLE_STYLE_GUIDANCE + ". Under 72 characters.\n";
  prompt += '   No quotes, no markdown, no prefix like "Title:".\n';
  prompt += "2. Empty line.\n";
  prompt += "3. PR description body as structured markdown.\n\n";

  if (!hasBody && !style?.template) {
    prompt += SECTIONS_PROMPT;
  }

  prompt += "RULES:\n";
  prompt += combinedRules();
  return prompt;
}

export function buildCombinedPrompt(changesSummary: string, existingBody: string, style?: RepoStyle): string {
  let prompt = assemble(changesSummary, existingBody, style);
  if (prompt.length <= MAX_PROMPT_CHARS) {
    return prompt;
  }
  const trimmedSummary = truncateToBudget(changesSummary, changesSummary.length - (prompt.length - MAX_PROMPT_CHARS));
  prompt = assemble(trimmedSummary, existingBody, style);
  if (prompt.length <= MAX_PROMPT_CHARS) {
    return prompt;
  }
  const trimmedBody = truncateToBudget(existingBody, existingBody.length - (prompt.length - MAX_PROMPT_CHARS));
  return assemble(trimmedSummary, trimmedBody, style);
}

// Truncation applies only to changesSummary and existingBody — the
// OUTPUT FORMAT/RULES tail is never touched. Cut at a newline boundary so
// the model gets whole lines, then mark the removal so it does not assume
// the input was complete.
function truncateToBudget(text: string, keep: number): string {
  const cut = text.lastIndexOf("\n", Math.max(keep - 1, 0));
  const prefix = cut > 0 ? text.slice(0, cut) : text.slice(0, Math.max(keep, 0));
  return prefix + "\n... (truncated: prompt budget reached — remaining input omitted)\n";
}

function combinedRules(): string {
  return [
    "- Be specific — reference actual code entities from the diff, not generic descriptions\n",
    ANCHOR_RULE,
    '- Do NOT start with filler like "This PR introduces..." or "In this pull request..."\n',
    "- Do NOT wrap the output in backtick fences\n",
    "- Do NOT add meta-commentary about the description itself\n",
    BREAKING_CHANGES_RULE,
    NO_BOT_SIGNATURES_RULE,
    SCOPE_BOUNDARIES_RULE,
    NO_EMPTY_OR_PLACEHOLDERS_RULE,
    INTENT_TITLES_RULE,
    ...FORMATTING_RULES,
    "- **Examples**:",
    "  ✅ ✔️ `src/auth.ts` — Added JWT token validation. [[1]](diffhunk://#diff-46b776ea_L5-R25)\n",
    "  ✅ ✔️ Updated loading backgrounds in `loading.tsx` to use theme variables. [[2]](diffhunk://#diff-b688a522_L10-R30), [[3]](diffhunk://#diff-b688a522_L40-R80)\n",
    "  ❌ ❌ **Don't:** Many files updated to fix dark mode theming. (No diff links)\n",
    "- If the user has existing content in the description field (a PR template), fill in its sections instead of using the section structure above\n",
  ].join("");
}
