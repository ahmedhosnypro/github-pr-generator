import type { GitHubHunksByFile, GitHubPRDetails } from "../../github-types";
import { extractLinkedIssues } from "../../linked-issues";
import type { BranchContext, CommitInfo, ExtensionConfig, FileChange, OpenedPRData, PRStats } from "../../types";
import { getConfig, validateConfig } from "../config";
import { fetchGitHubDiff } from "../github/diff";
import { fetchPRCommits, fetchPRFiles } from "../github/list-pages";
import { fetchPRDetails } from "../github/pr";
import { logMsg } from "../log";

export interface GatheredPRData {
  owner: string;
  repo: string;
  prNumber: string;
  prDetails: GitHubPRDetails;
  commits: CommitInfo[];
  fileChanges: FileChange[];
  branchContext: BranchContext;
  diffText: string | null;
  hunkRanges: GitHubHunksByFile | null;
}

export interface FieldUpdatePreparation {
  config: ExtensionConfig;
  gathered: GatheredPRData;
  linkedIssues: string[];
  stats: PRStats;
}

export async function getValidatedConfig(): Promise<ExtensionConfig> {
  const config = await getConfig();
  const configError = validateConfig(config);
  if (configError) {
    logMsg("Config validation failed: " + configError);
    throw new Error(configError);
  }
  return config;
}

// Shared fetch sequence used by the opened-PR and merge handlers:
// PR details, then commits, then files, then the base...head compare diff.
export async function gatherPRData(
  origin: string,
  config: ExtensionConfig,
  data: OpenedPRData,
): Promise<GatheredPRData> {
  const owner = data.owner || "";
  const repo = data.repo || "";
  const prNumber = data.prNumber || "";

  const prDetails = await fetchPRDetails(config, owner, repo, prNumber);
  if ("error" in prDetails) {
    throw new Error("Failed to fetch PR details: " + prDetails.error);
  }

  const prCommits = await fetchPRCommits(config, owner, repo, prNumber);
  const commits = "commits" in prCommits ? prCommits.commits : [];
  if ("error" in prCommits) {
    // Never silently fall to zero — the prompt would generate without commits.
    logMsg(origin + " - commits fetch failed (" + prCommits.error + "); generating without commit data");
  }
  logMsg(origin + " - fetched " + String(commits.length) + " commits total");

  const prFiles = await fetchPRFiles(config, owner, repo, prNumber);
  const fileChanges = "files" in prFiles ? prFiles.files : [];
  if ("error" in prFiles) {
    logMsg(origin + " - files fetch failed (" + prFiles.error + "); generating without file list");
  }
  logMsg(origin + " - fetched " + String(fileChanges.length) + " files total");

  const branchContext: BranchContext = {
    owner,
    repo,
    baseBranch: prDetails.baseBranch,
    headBranch: prDetails.headBranch,
  };

  const diffResult = await fetchGitHubDiff(config, branchContext, prNumber);
  let diffText: string | null = null;
  let hunkRanges: GitHubHunksByFile | null = null;
  if (diffResult && "diff" in diffResult) {
    diffText = diffResult.diff;
    hunkRanges = diffResult.hunks;
  }

  return { owner, repo, prNumber, prDetails, commits, fileChanges, branchContext, diffText, hunkRanges };
}

export { extractLinkedIssues };

export function buildStats(prDetails: GitHubPRDetails, fileChanges: FileChange[]): PRStats {
  return {
    files: prDetails.changedFiles || fileChanges.length || 0,
    additions: prDetails.additions || 0,
    deletions: prDetails.deletions || 0,
  };
}

export interface FieldApplyPreparation {
  config: ExtensionConfig;
  owner: string;
  repo: string;
  prNumber: string;
  text: string;
}

/**
 * Apply-phase prologue for the opened-PR review flow. The payload comes from a
 * content-script text field the user just edited, so nothing is trusted:
 * coordinates and text are shape-checked here, and updatePRField validates the
 * owner/repo/prNumber formats again before the PATCH.
 */
export async function prepareFieldApply(
  label: string,
  data: { owner?: string; repo?: string; prNumber?: string },
  fieldName: string,
  text: string | undefined,
  tokenRequiredMessage: string,
): Promise<FieldApplyPreparation> {
  logMsg(label + " - apply request for " + fieldName + " update");
  const owner = typeof data.owner === "string" ? data.owner.trim() : "";
  const repo = typeof data.repo === "string" ? data.repo.trim() : "";
  const prNumber = typeof data.prNumber === "string" ? data.prNumber.trim() : "";
  if (!owner || !repo || !prNumber) {
    throw new Error("Missing PR owner/repo/number for the " + fieldName + " update.");
  }
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Cannot apply an empty " + fieldName + " to the PR.");
  }

  const config = await getValidatedConfig();
  if (!config.githubToken) {
    throw new Error(tokenRequiredMessage);
  }
  return { config, owner, repo, prNumber, text };
}

// Shared prologue of the title/description update handlers: log the request,
// require a configured GitHub token (the field update will need it), then
// gather PR data and derive linked issues plus stats.
export async function gatherForFieldUpdate(
  label: string,
  data: OpenedPRData,
  tokenRequiredMessage: string,
): Promise<FieldUpdatePreparation> {
  logMsg(
    label + " - owner: " + (data.owner || "") + ", repo: " + (data.repo || "") + ", prNumber: " + (data.prNumber || ""),
  );

  const config = await getValidatedConfig();

  if (!config.githubToken) {
    throw new Error(tokenRequiredMessage);
  }

  const gathered = await gatherPRData(label, config, data);
  const linkedIssues = extractLinkedIssues(gathered.commits);
  const stats = buildStats(gathered.prDetails, gathered.fileChanges);
  return { config, gathered, linkedIssues, stats };
}
