export function buildMergeTitlePrompt(
  changesSummary: string,
  existingTitle: string,
  existingMergeTitle: string,
): string {
  let prompt = "Generate ONLY a GitHub merge commit title for the following pull request changes.\n\n";
  prompt +=
    "A merge commit title summarizes what the entire PR accomplishes in a single line. It typically follows conventional commit format.\n\n";
  prompt += changesSummary + "\n";

  if (existingTitle && existingTitle.trim().length > 0) {
    prompt += '## PR Title\nThe pull request title is: "' + existingTitle + '"\n';
    prompt +=
      "Use this as a reference. The merge commit title can be similar but should be a clean, concise summary suitable for the git history.\n\n";
  }

  if (existingMergeTitle && existingMergeTitle.trim().length > 0) {
    prompt +=
      '## Existing Merge Commit Title\nThe current merge commit title is: "' +
      existingMergeTitle +
      '"\nGenerate an improved version.\n\n';
  }

  prompt += "OUTPUT FORMAT:\n";
  prompt +=
    'Output ONLY the merge commit title on a single line. No quotes, no markdown, no prefix like "Title:", no description.\n';
  prompt +=
    'Use conventional commit format (e.g. "feat: add JWT auth", "fix: resolve token expiry", "refactor: extract validation logic"). Under 72 characters.\n\n';
  prompt += "RULES:\n";
  prompt += "- Be specific — reference actual code entities from the diff, not generic descriptions\n";
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
): string {
  let prompt = "Generate ONLY a GitHub merge commit extended description for the following pull request changes.\n\n";
  prompt +=
    "A merge commit extended description provides additional context about the change beyond the title. It should be concise but informative for someone reading the git log.\n\n";
  prompt += changesSummary + "\n";

  if (existingTitle && existingTitle.trim().length > 0) {
    prompt += '## PR Title\nThe pull request title is: "' + existingTitle + '"\n\n';
  }

  if (existingMergeTitle && existingMergeTitle.trim().length > 0) {
    prompt += '## Merge Commit Title\nThe merge commit title is: "' + existingMergeTitle + '"\n\n';
  }

  if (existingDescription && existingDescription.trim().length > 0) {
    prompt += "## PR Description\nThe pull request description is:\n\n" + existingDescription + "\n\n";
  }

  if (existingMergeDesc && existingMergeDesc.trim().length > 0) {
    prompt +=
      "## Existing Merge Commit Description\nThe current merge commit description is:\n\n" +
      existingMergeDesc +
      "\nGenerate an improved version.\n\n";
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
