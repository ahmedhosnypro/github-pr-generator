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

export function buildTitleOnlyPrompt(
  changesSummary: string,
  existingTitle: string,
  style?: RepoStyle,
  freshVariant?: string,
): string {
  let prompt =
    "Generate ONLY a GitHub pull request title for the following changes. Do NOT generate a description.\n\n";
  prompt += changesSummary + "\n";

  if (freshVariant) {
    prompt +=
      "## Fresh Title\nCreate a brand-new title from scratch, based solely on the changes above. Do not reuse or rephrase any previously used wording for this pull request. For this attempt, emphasize " +
      freshVariant +
      ".\n\n";
  } else if (existingTitle && existingTitle.trim().length > 0) {
    prompt += '## Existing Title\nThe current title is: "' + existingTitle + '"\nGenerate an improved version.\n\n';
  }

  if (style) {
    prompt += buildHouseStyleNote(style);
  }

  prompt += "OUTPUT FORMAT:\n";
  prompt +=
    'Output ONLY the PR title on a single line. No quotes, no markdown, no prefix like "Title:", no description.\n';
  prompt += TITLE_STYLE_GUIDANCE + ". Under 72 characters.\n\n";
  prompt += "RULES:\n";
  prompt += "- Be specific — reference actual code entities from the diff, not generic descriptions\n";
  prompt += INTENT_TITLES_RULE;
  prompt += "- Do NOT wrap the output in backtick fences\n";
  prompt += "- Do NOT include any description or body text, ONLY the title\n";

  return prompt;
}

export function buildDescriptionOnlyPrompt(
  changesSummary: string,
  existingTitle: string,
  existingDescription: string,
  style?: RepoStyle,
): string {
  let prompt =
    "Generate ONLY a GitHub pull request description for the following changes. The title is already set and should NOT be changed.\n\n";
  prompt += changesSummary + "\n";

  if (existingTitle && existingTitle.trim().length > 0) {
    prompt += '## Current Title\nThe PR title is: "' + existingTitle + '"\n\n';
  }

  const hasDescription = existingDescription.trim().length > 0;
  if (hasDescription) {
    prompt += buildExistingContentSection(existingDescription);
  } else if (style?.template) {
    prompt += buildTemplateFillBlock(style.template);
  }

  if (style) {
    prompt += buildHouseStyleNote(style);
  }

  prompt += buildScreenshotsHint(changesSummary);
  prompt += buildSizeTierNote(changesSummary);

  prompt += "OUTPUT FORMAT:\n";
  prompt += "Output ONLY the PR description body as structured markdown. Do NOT include a title line.\n\n";

  if (!hasDescription && !style?.template) {
    prompt += SECTIONS_PROMPT;
  }
  prompt += "RULES:\n";
  prompt += descriptionRules();

  return prompt;
}

function descriptionRules(): string {
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
    ...FORMATTING_RULES,
    // Anchor examples matter for description-only too — same lens on output quality.
    "- **Examples**:",
    "  ✅ ✔️ `src/auth.ts` — Added JWT token validation. [[1]](diffhunk://#diff-46b776ea_L5-R25)\n",
    "  ✅ ✔️ Updated loading backgrounds in `loading.tsx` to use theme variables. [[2]](diffhunk://#diff-b688a522_L10-R30), [[3]](diffhunk://#diff-b688a522_L40-R80)\n",
    "  ❌ ❌ **Don't:** Many files updated to fix dark mode theming. (No diff links)\n",
    "- Do NOT output a title line — output ONLY the description body\n",
    "- If the user has existing content in the description field (a PR template), fill in its sections instead of using the section structure above\n",
  ].join("");
}
