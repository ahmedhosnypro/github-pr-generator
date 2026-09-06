import { buildHouseStyleNote, type RepoStyle } from "../repo-style";
import {
  enforcePromptBudget,
  INTENT_TITLES_RULE,
  quoteEmbeddedTitle,
  TITLE_STYLE_GUIDANCE,
  wrapUntrustedData,
} from "./common";

export function buildMergeTitlePrompt(
  changesSummary: string,
  existingTitle: string,
  existingMergeTitle: string,
  style?: RepoStyle,
): string {
  return enforcePromptBudget(
    (summary) => assembleMergeTitlePrompt(summary, existingTitle, existingMergeTitle, style),
    changesSummary,
  );
}

function assembleMergeTitlePrompt(
  changesSummary: string,
  existingTitle: string,
  existingMergeTitle: string,
  style?: RepoStyle,
): string {
  let prompt = "Generate ONLY a GitHub merge commit title for the following pull request changes.\n\n";
  prompt += "A merge commit title summarizes what the entire PR accomplishes in a single line.\n\n";
  // changesSummary is already fenced as <untrusted_pr_data> by buildChangesSummary.
  prompt += changesSummary + "\n";

  if (existingTitle && existingTitle.trim().length > 0) {
    prompt +=
      "## PR Title (untrusted data)\n" +
      wrapUntrustedData('The pull request title is: "' + quoteEmbeddedTitle(existingTitle) + '"');
    prompt +=
      "Use this as a reference. The merge commit title can be similar but should be a clean, concise summary suitable for the git history.\n\n";
  }

  if (existingMergeTitle && existingMergeTitle.trim().length > 0) {
    prompt +=
      "## Existing Merge Commit Title (untrusted data)\n" +
      wrapUntrustedData('The current merge commit title is: "' + quoteEmbeddedTitle(existingMergeTitle) + '"') +
      "Generate an improved version.\n\n";
  }

  if (style) {
    prompt += buildHouseStyleNote(style);
  }

  prompt += "OUTPUT FORMAT:\n";
  prompt +=
    'Output ONLY the merge commit title on a single line. No quotes, no markdown, no prefix like "Title:", no description.\n';
  prompt += TITLE_STYLE_GUIDANCE + ". Under 72 characters.\n\n";
  prompt += "RULES:\n";
  prompt += "- Be specific — reference actual code entities from the diff, not generic descriptions\n";
  prompt += INTENT_TITLES_RULE;
  prompt += "- The merge commit title should summarize the overall change concisely\n";
  prompt += "- Do NOT wrap the output in backtick fences\n";
  prompt += "- Do NOT include any description or body text, ONLY the title\n";
  prompt += "- Do NOT include PR number or branch name in the title\n";

  return prompt;
}

export function buildMergeDescriptionPrompt(
  changesSummary: string,
  existingTitle: string,
  existingDescription: string,
  existingMergeTitle: string,
  existingMergeDesc: string,
  style?: RepoStyle,
): string {
  return enforcePromptBudget(
    (summary, prBody) =>
      assembleMergeDescriptionPrompt(summary, existingTitle, prBody, existingMergeTitle, existingMergeDesc, style),
    changesSummary,
    existingDescription,
  );
}

function assembleMergeDescriptionPrompt(
  changesSummary: string,
  existingTitle: string,
  existingDescription: string,
  existingMergeTitle: string,
  existingMergeDesc: string,
  style?: RepoStyle,
): string {
  let prompt = "Generate ONLY a GitHub merge commit extended description for the following pull request changes.\n\n";
  prompt +=
    "A merge commit extended description provides additional context about the change beyond the title. It should be concise but informative for someone reading the git log.\n\n";
  // changesSummary is already fenced as <untrusted_pr_data> by buildChangesSummary.
  prompt += changesSummary + "\n";

  if (existingTitle && existingTitle.trim().length > 0) {
    prompt +=
      "## PR Title (untrusted data)\n" +
      wrapUntrustedData('The pull request title is: "' + quoteEmbeddedTitle(existingTitle) + '"') +
      "\n";
  }

  if (existingMergeTitle && existingMergeTitle.trim().length > 0) {
    prompt +=
      "## Merge Commit Title (untrusted data)\n" +
      wrapUntrustedData('The merge commit title is: "' + quoteEmbeddedTitle(existingMergeTitle) + '"') +
      "\n";
  }

  if (existingDescription && existingDescription.trim().length > 0) {
    prompt +=
      "## PR Description (untrusted data)\nThe pull request description is:\n\n" +
      wrapUntrustedData(existingDescription) +
      "\n";
  }

  if (existingMergeDesc && existingMergeDesc.trim().length > 0) {
    prompt +=
      "## Existing Merge Commit Description (untrusted data)\nThe current merge commit description is:\n\n" +
      wrapUntrustedData(existingMergeDesc) +
      "Generate an improved version.\n\n";
  }

  if (style) {
    prompt += buildHouseStyleNote(style);
  }

  prompt += buildMergeDescriptionRules();
  return prompt;
}

function buildMergeDescriptionRules(): string {
  let prompt = "OUTPUT FORMAT:\n";
  prompt +=
    "Output ONLY the merge commit extended description as plain text or simple markdown. Do NOT include a title line.\n\n";
  prompt += "Guidelines:\n";
  prompt += "- Summarize the key changes and their motivation\n";
  prompt += "- Mention important implementation details a future reader would need\n";
  prompt += "- Reference specific function names, components, or modules changed\n";
  prompt += "- Keep it concise (typically 3-10 lines)\n";
  prompt += "- Do NOT include diff hunk references — this is for the git log, not the PR page\n\n";
  prompt += "RULES:\n";
  prompt += '- Do NOT start with filler like "This PR introduces..." or "In this pull request..."\n';
  prompt += "- Do NOT wrap the output in backtick fences\n";
  prompt += "- Do NOT add meta-commentary about the description itself\n";
  prompt += "- Do NOT output a title line — output ONLY the description body\n";
  return prompt;
}
