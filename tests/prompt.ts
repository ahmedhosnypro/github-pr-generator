import { buildCombinedPrompt } from "./prompt-mirror";
import type { FileChange, GhPrDetails, GhPrFile, TestPrRef } from "./shared";
import { extractLinkedIssues, fetchPRCommits, fetchPRDetails, fetchPRFiles } from "./shared";
import type { TestContext } from "./testkit";
import { logPromptAnalysis } from "./testkit";

// The prompt-builder mirror lives in tests/prompt-mirror.ts (wording must match
// src/; tests/prompt-logic.ts fails on drift). Re-exported here for compatibility.
export { buildCombinedPrompt };

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

export interface BuiltTestPrompt {
  commits: string[];
  changesSummary: string;
  prompt: string;
  coveredInSummary: number;
}

// Fetches commits/files/diff for the test PR, builds the combined prompt from
// them, and logs the shared prompt-analysis block (header and body note vary
// per script). Used by the full-coverage and pr-creation test scripts.
export async function buildPromptFromContext(
  ctx: TestContext,
  existingBody: string,
  analysisHeader: string,
  existingBodyNote: string,
): Promise<BuiltTestPrompt> {
  const { testPr, prDetails, githubToken } = ctx;
  const commits = fetchPRCommits(testPr);
  const files = fetchPRFiles(testPr);
  const diffText = await fetchPRDiff(testPr, githubToken);

  const data = buildSummaryData(prDetails, commits, files, existingBody);
  const changesSummary = buildChangesSummary(data, diffText);
  const prompt = buildCombinedPrompt(changesSummary, existingBody);

  const coveredInSummary = logPromptAnalysis(
    analysisHeader,
    prompt,
    changesSummary,
    commits,
    files,
    diffText,
    existingBody,
    existingBodyNote,
  );
  return { commits, changesSummary, prompt, coveredInSummary };
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
