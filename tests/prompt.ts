import { buildChangesSummary } from "../src/background/summary";
import type { FileChangeType, GenerateData, FileChange as SrcFileChange } from "../src/types";
import { buildCombinedPrompt } from "./prompt-mirror";
import type { FileChange, GhPrDetails, TestPrRef } from "./shared";
import { extractLinkedIssues, fetchPRCommits, fetchPRDetails, fetchPRFiles } from "./shared";
import type { TestContext } from "./testkit";
import { logPromptAnalysis } from "./testkit";

// The prompt-builder mirror lives in tests/prompt-mirror.ts (wording must match
// src/; tests/prompt-logic.ts fails on drift). Re-exported here for compatibility.
export { buildCombinedPrompt };

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
  files: FileChange[],
  existingBody: string,
  owner: string,
  repo: string,
): GenerateData {
  return {
    commits: commits.map((c) => ({ message: c })),
    // gh CLI files lack the extension-only fields — fill them with the defaults
    // the content script uses when no DOM anchor was scraped.
    fileChanges: files.map(
      (f): SrcFileChange => ({
        path: f.path,
        type: (f.type ?? "modified") as FileChangeType,
        additions: f.additions,
        deletions: f.deletions,
        diffAnchor: f.diffAnchor ?? "",
      }),
    ),
    stats: { files: prDetails.files.length, additions: prDetails.additions, deletions: prDetails.deletions },
    branchContext: { owner, repo, baseBranch: prDetails.baseRefName, headBranch: prDetails.headRefName },
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

  const data = buildSummaryData(prDetails, commits, files, existingBody, testPr.owner, testPr.repo);
  // Deliberately uses the real src builder (not a fork) so prompt tests see the
  // exact summary format the extension produces; hunkRanges are unknown to the
  // gh-CLI layer, so anchors come only from diffAnchor fields (absent here).
  const changesSummary = buildChangesSummary(data, diffText, null);
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
