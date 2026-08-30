import type { GitHubDiffResult, GitHubErrorResult } from "../../github-types";
import type { BranchContext, ExtensionConfig } from "../../types";
import { errorMessage, logMsg } from "../log";
import { GITHUB_DIFF_ACCEPT, GITHUB_USER_AGENT, isValidRepoName, rateLimitRemaining } from "./common";
import { parseHunkLineRanges, truncateDiff } from "./diff-parse";

async function diffFailure(response: Response): Promise<GitHubErrorResult | null> {
  if (response.status === 404) {
    logMsg("GitHub API 404 - repo/compare not found (may need PAT for private repo)");
    return { error: "GITHUB_404" };
  }

  if (response.status === 403 || response.status === 429) {
    const remaining = rateLimitRemaining(response);
    const reset = response.headers.get("X-RateLimit-Reset") || "unknown";
    logMsg("GitHub API rate limited - remaining: " + remaining + ", reset: " + reset);
    return { error: "GITHUB_RATE_LIMITED", rateLimitRemaining: remaining };
  }

  if (!response.ok) {
    const errText = await response.text();
    logMsg("GitHub API error fetching diff: " + String(response.status) + " - " + errText.substring(0, 200));
    return { error: "GITHUB_API_ERROR", status: response.status };
  }

  return null;
}

function buildDiffHeaders(config: ExtensionConfig): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: GITHUB_DIFF_ACCEPT,
    "User-Agent": GITHUB_USER_AGENT,
  };
  if (config.githubToken) {
    headers.Authorization = "Bearer " + config.githubToken;
  }
  return headers;
}

async function processDiffResponse(config: ExtensionConfig, response: Response): Promise<GitHubDiffResult> {
  const failure = await diffFailure(response);
  if (failure) return failure;

  const diffText = await response.text();
  logMsg("Fetched diff, raw length: " + String(diffText.length) + " bytes");

  const trimmed = truncateDiff(diffText, config.diffMaxLines, config.diffMaxBytes);
  const hunkRanges = parseHunkLineRanges(trimmed);
  logMsg(
    "Trimmed diff length: " +
      String(trimmed.length) +
      " bytes, " +
      String(Object.keys(hunkRanges).length) +
      " files with hunks",
  );
  return { diff: trimmed, hunks: hunkRanges };
}

async function requestCompareDiff(
  config: ExtensionConfig,
  owner: string,
  repo: string,
  base: string,
  head: string,
): Promise<GitHubDiffResult> {
  const url =
    "https://api.github.com/repos/" +
    owner +
    "/" +
    repo +
    "/compare/" +
    encodeURIComponent(base) +
    "..." +
    encodeURIComponent(head);
  logMsg("Fetching diff from: " + url);

  const headers = buildDiffHeaders(config);

  try {
    const response = await fetch(url, { method: "GET", headers });
    logMsg(
      "GitHub API diff response status: " +
        String(response.status) +
        ", rate limit remaining: " +
        rateLimitRemaining(response),
    );
    return await processDiffResponse(config, response);
  } catch (fetchErr) {
    logMsg("GitHub API fetch error (diff): " + errorMessage(fetchErr));
    return { error: "GITHUB_NETWORK_ERROR", message: errorMessage(fetchErr) };
  }
}

export async function fetchGitHubDiff(
  config: ExtensionConfig,
  branchContext: Partial<BranchContext> | null,
): Promise<GitHubDiffResult> {
  if (!config.diffEnabled) {
    logMsg("Diff fetching disabled by config");
    return null;
  }
  if (
    !branchContext ||
    !branchContext.owner ||
    !branchContext.repo ||
    !branchContext.baseBranch ||
    !branchContext.headBranch
  ) {
    logMsg("Cannot fetch diff: missing branch context - " + JSON.stringify(branchContext));
    return null;
  }

  if (!isValidRepoName(branchContext.owner) || !isValidRepoName(branchContext.repo)) {
    logMsg("Invalid owner or repo name - owner: " + branchContext.owner + ", repo: " + branchContext.repo);
    return { error: "GITHUB_INVALID_CONTEXT" };
  }

  return requestCompareDiff(
    config,
    branchContext.owner,
    branchContext.repo,
    branchContext.baseBranch,
    branchContext.headBranch,
  );
}
