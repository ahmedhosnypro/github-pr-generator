import { SECTIONS_PROMPT } from "./common";

export function buildTitleOnlyPrompt(changesSummary: string, existingTitle: string): string {
  let prompt =
    "Generate ONLY a GitHub pull request title for the following changes. Do NOT generate a description.\n\n";
  prompt += changesSummary + "\n";

  if (existingTitle && existingTitle.trim().length > 0) {
    prompt += '## Existing Title\nThe current title is: "' + existingTitle + '"\nGenerate an improved version.\n\n';
  }

  prompt += "OUTPUT FORMAT:\n";
  prompt +=
    'Output ONLY the PR title on a single line. No quotes, no markdown, no prefix like "Title:", no description.\n';
  prompt +=
    'Use conventional commit format (e.g. "feat: add JWT auth", "fix: resolve token expiry", "refactor: extract validation logic"). Under 72 characters.\n\n';
  prompt += "RULES:\n";
  prompt += "- Be specific — reference actual code entities from the diff, not generic descriptions\n";
  prompt += "- Do NOT wrap the output in backtick fences\n";
  prompt += "- Do NOT include any description or body text, ONLY the title\n";

  return prompt;
}

export function buildDescriptionOnlyPrompt(
  changesSummary: string,
  existingTitle: string,
  existingDescription: string,
): string {
  let prompt =
    "Generate ONLY a GitHub pull request description for the following changes. The title is already set and should NOT be changed.\n\n";
  prompt += changesSummary + "\n";

  if (existingTitle && existingTitle.trim().length > 0) {
    prompt += '## Current Title\nThe PR title is: "' + existingTitle + '"\n\n';
  }

  if (existingDescription && existingDescription.trim().length > 0) {
    prompt += "## Existing Content in Description Field\n";
    prompt +=
      "The user already has the following content in the description field. Respect its structure — keep its headers, fill in its sections, and do not remove any existing content:\n\n";
    prompt += existingDescription + "\n\n";
  }

  prompt += "OUTPUT FORMAT:\n";
  prompt += "Output ONLY the PR description body as structured markdown. Do NOT include a title line.\n\n";

  if (!existingDescription || existingDescription.trim().length === 0) {
    prompt += SECTIONS_PROMPT;
  }
  prompt += "RULES:\n";
  prompt += "- Be specific — reference actual code entities from the diff, not generic descriptions\n";
  prompt +=
    "- In the Changes and Walkthrough sections, **add diff hunk reference links for every file you mention**: Format: `[[N]](diffhunk://ANCHOR_Lstart-Rend)` (e.g., `[[1]](diffhunk://#diff-4a5d3f2_L5-R25)`) using the reference numbers from the Anchors section. **Use only right-side line ranges** (L5-R25 means lines 5-25 in the new file). Add 1+ references per file.\n";
  prompt += '- Do NOT start with filler like "This PR introduces..." or "In this pull request..."\n';
  prompt += "- Do NOT wrap the output in backtick fences\n";
  prompt += "- Do NOT add meta-commentary about the description itself\n";
  prompt += "- Do NOT output a title line — output ONLY the description body\n";
  prompt +=
    "- If the user has existing content in the description field (a PR template), fill in its sections instead of using the section structure above\n";

  return prompt;
}
