import type { FileChange, GhPrDetails, GhPrFile, TestPrRef } from "./shared";
import { extractLinkedIssues, fetchPRDetails } from "./shared";

export interface ChangesSummaryData {
  commits: { message: string }[];
  fileChanges: FileChange[];
  stats: { files: number; additions: number; deletions: number };
  branchContext: { baseBranch: string; headBranch: string };
  linkedIssues: string[];
  existingBody: string;
}

export async function fetchPRDiff(testPr: TestPrRef, githubToken: string): Promise<string | null> {
  const { owner, repo } = testPr;
  const prDetails = fetchPRDetails(testPr);
  const { baseRefName, headRefName } = prDetails;

  const url = `https://api.github.com/repos/${owner}/${repo}/compare/${encodeURIComponent(baseRefName)}...${encodeURIComponent(headRefName)}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3.diff",
    "User-Agent": "github-pr-generator-extension",
  };
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  try {
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) {
      console.warn(`Diff fetch failed: ${String(response.status)}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.warn(`Diff fetch error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export function buildSummaryData(
  prDetails: GhPrDetails,
  commits: string[],
  files: GhPrFile[],
  existingBody: string,
): ChangesSummaryData {
  return {
    commits: commits.map((c) => ({ message: c })),
    fileChanges: files,
    stats: { files: prDetails.files.length, additions: prDetails.additions, deletions: prDetails.deletions },
    branchContext: { baseBranch: prDetails.baseRefName, headBranch: prDetails.headRefName },
    linkedIssues: extractLinkedIssues(commits),
    existingBody,
  };
}

// Copied from background.js - buildChangesSummary
export function buildChangesSummary(data: ChangesSummaryData, diffText: string | null): string {
  let summary = "";
  summary += "## Commits\n";
  data.commits.forEach((c, i) => {
    summary += `${String(i + 1)}. ${c.message}\n\n`;
  });
  summary += "## File Changes\n";
  data.fileChanges.forEach((f) => {
    summary += `- ${f.path} (${String(f.type)}): +${String(f.additions)}/-${String(f.deletions)}`;
    if (f.diffAnchor) summary += ` [[${f.diffAnchor}]]`;
    summary += "\n";
  });
  summary += "\n## Stats\n";
  summary += `- Files: ${String(data.stats.files)}\n`;
  summary += `- Additions: ${String(data.stats.additions)}\n`;
  summary += `- Deletions: ${String(data.stats.deletions)}\n`;
  summary += "\n## Branch Context\n";
  summary += `- Base: ${data.branchContext.baseBranch}\n`;
  summary += `- Head: ${data.branchContext.headBranch}\n`;
  if (data.linkedIssues.length > 0) {
    summary += "\n## Linked Issues\n";
    data.linkedIssues.forEach((issue) => {
      summary += `- ${issue}\n`;
    });
  }
  if (diffText !== null) {
    summary += "\n## Diff (truncated)\n";
    summary += diffText;
  }
  return summary;
}

function defaultSectionsPrompt(): string {
  let prompt = "Use these sections (omit sections that would be empty):\n\n";
  prompt += "## Summary\n";
  prompt += "A 2-4 sentence overview of what this PR does and why the change is needed.\n\n";
  prompt += "## Changes\n";
  prompt +=
    "Grouped by category or area. Include specific details drawn from the diff — mention function names, variable names, and what was added/removed/modified and why. Do NOT just list files; explain the changes. **For each file mentioned, add at least one diff hunk reference using the format from the Anchors section.**\n\n";
  prompt += "## Walkthrough\n";
  prompt +=
    "File-by-file list of key changes. **Each entry has:** (1) the file path wrapped in backticks, (2) a 1-2 sentence description of what changed, and (3) a diff hunk reference link. Example: `frontend/app/globals.css` — Updated CSS variables for theme consistency. [[1]](diffhunk://#diff-4a5d3f2_L10-R25)\n\n";
  prompt += "## Commit Coverage\n";
  prompt +=
    "**IMPORTANT: You MUST cover every commit listed in the '## Commits' section above.** For each commit, mention what it does and reference the relevant files/diffs. Do not skip any commits — even small fixes or infrastructure changes. Group related commits together if they address the same feature, but ensure every commit message is represented in the description.\n\n";
  prompt += "## Testing\n";
  prompt += "How a reviewer can test or verify these changes. Include specific steps if inferable from the diff.\n\n";
  prompt += "## Breaking Changes\n";
  prompt +=
    "Any API changes, removed functions, renamed exports, or behavioral changes consumers need to know about. **Include diff hunk references for changed APIs.** Omit this section if there are none.\n\n";
  prompt += "## Linked Issues\n";
  prompt += "List any issue references from the commit messages. Omit if none.\n\n";
  return prompt;
}

// Copied from background.js - buildCombinedPrompt (used for PR creation page)
export function buildCombinedPrompt(changesSummary: string, existingBody: string): string {
  let prompt = "Generate a GitHub pull request title and description for the following changes.\n\n";
  prompt += `${changesSummary}\n`;

  if (existingBody.trim().length > 0) {
    prompt += "## Existing Content in Description Field\n";
    prompt +=
      "The user already has the following content in the description field. Respect its structure — keep its headers, fill in its sections, and do not remove any existing content:\n\n";
    prompt += `${existingBody}\n\n`;
  }

  prompt += "OUTPUT FORMAT:\n";
  prompt +=
    '1. First line: PR title only (conventional commit format, e.g. "feat: add JWT auth", "fix: resolve token expiry", "refactor: extract validation logic"). Under 72 characters. No quotes, no markdown, no prefix like "Title:".\n';
  prompt += "2. Empty line.\n";
  prompt += "3. PR description body as structured markdown.\n\n";

  if (existingBody.trim().length === 0) {
    prompt += defaultSectionsPrompt();
  }
  prompt += "RULES:\n";
  prompt += "- Be specific — reference actual code entities from the diff, not generic descriptions\n";
  prompt +=
    "- In the Changes and Walkthrough sections, **add diff hunk reference links for every file you mention**: Format: `[[N]](diffhunk://ANCHOR_Lstart-Rend)` (e.g., `[[1]](diffhunk://#diff-4a5d3f2_L5-R25)`) using the reference numbers from the Anchors section. **Use only right-side line ranges** (L5-R25 means lines 5-25 in the new file). Add 1+ references per file.\n";
  prompt += '- Do NOT start with filler like "This PR introduces..." or "In this pull request..."\n';
  prompt += "- Do NOT wrap the output in backtick fences\n";
  prompt += "- Do NOT add meta-commentary about the description itself\n";
  prompt += "- **Examples**:";
  prompt += "  ✅ ✔️ `src/auth.ts` — Added JWT token validation. [[1]](diffhunk://#diff-46b776ea_L5-R25)\n";
  prompt +=
    "  ✅ ✔️ Updated loading backgrounds in `loading.tsx` to use theme variables. [[2]](diffhunk://#diff-b688a522_L10-R30), [[3]](diffhunk://#diff-b688a522_L40-R80)\n";
  prompt += "  ❌ ❌ **Don't:** Many files updated to fix dark mode theming. (No diff links)\n";
  prompt +=
    "- If the user has existing content in the description field (a PR template), fill in its sections instead of using the section structure above\n";

  return prompt;
}
