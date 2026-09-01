import { buildHouseStyleNote, type RepoStyle } from "../repo-style";
import {
  ANCHOR_RULE,
  BREAKING_CHANGES_RULE,
  buildExistingContentSection,
  buildTemplateFillBlock,
  FORMATTING_RULES,
  INTENT_TITLES_RULE,
  NO_BOT_SIGNATURES_RULE,
  NO_EMPTY_OR_PLACEHOLDERS_RULE,
  SCOPE_BOUNDARIES_RULE,
  SECTIONS_PROMPT,
  TITLE_STYLE_GUIDANCE,
} from "./common";

export function buildCombinedPrompt(changesSummary: string, existingBody: string, style?: RepoStyle): string {
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
