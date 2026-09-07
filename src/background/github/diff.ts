import type { GitHubDiffResult, GitHubErrorResult } from "../../github-types";
import type { BranchContext, ExtensionConfig } from "../../types";
import { errorMessage, logMsg } from "../log";
import {
  fetchWithTimeout,
  GITHUB_DIFF_ACCEPT,
  GITHUB_USER_AGENT,
  isValidPrNumber,
  isValidRepoName,
  rateLimitOrApiError,
  rateLimitRemaining,
} from "./common";
import { parseHunkLineRanges, truncateDiff } from "./diff-parse";

async function diffFailure(response: Response, hasToken: boolean): Promise<GitHubErrorResult | null> {
  if (response.status === 404) {
    // With a token configured, a 404 means the base/head ref or repo itself is
    // gone — pointing the user at a PAT would send them chasing the wrong fix.
    if (hasToken) {
      logMsg(
        "GitHub API 404 - compare/pull not found (base/head branch deleted or repo moved); token is configured, so this is not an auth issue",
      );
    } else {
      logMsg("GitHub API 404 - repo/compare not found (may need PAT for private repo)");
    }
    return { error: "GITHUB_404" };
  }

  const blocked = rateLimitOrApiError(response);
  if (blocked) return blocked;

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
  const failure = await diffFailure(response, Boolean(config.githubToken));
  if (failure) return failure;

  const diffText = await response.text();
  logMsg("Fetched diff, raw length: " + String(diffText.length) + " bytes");

  // Hunk line ranges are metadata — parse them from the FULL diff so anchors
  // stay available for files beyond the truncation window. Only the diff text
  // that goes into the prompt is truncated.
  const hunkRanges = parseHunkLineRanges(diffText);
  const trimmed = truncateDiff(diffText, config.diffMaxLines, config.diffMaxBytes);
  logMsg(
    "Trimmed diff length: " +
      String(trimmed.length) +
      " bytes, anchors for " +
      String(Object.keys(hunkRanges).length) +
      " files",
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
    const response = await fetchWithTimeout(url, { method: "GET", headers });
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

async function requestPrDiff(
  config: ExtensionConfig,
  owner: string,
  repo: string,
  prNumber: string,
): Promise<GitHubDiffResult> {
  if (!isValidPrNumber(prNumber)) {
    logMsg("Invalid PR number for fallback diff fetch: " + prNumber);
    return { error: "GITHUB_INVALID_CONTEXT" };
  }
  const url = "https://api.github.com/repos/" + owner + "/" + repo + "/pulls/" + prNumber;
  logMsg("Fetching fallback diff from: " + url);
  try {
    const response = await fetchWithTimeout(url, { method: "GET", headers: buildDiffHeaders(config) });
    return await processDiffResponse(config, response);
  } catch (fetchErr) {
    logMsg("GitHub API fetch error (pull diff): " + errorMessage(fetchErr));
    return { error: "GITHUB_NETWORK_ERROR", message: errorMessage(fetchErr) };
  }
}

export async function fetchGitHubDiff(
  config: ExtensionConfig,
  branchContext: Partial<BranchContext> | null,
  prNumber?: string,
): Promise<GitHubDiffResult> {
  if (!config.diffEnabled) {
    logMsg("Diff fetching disabled by config");
    return null;
  }
  if (!branchContext?.owner || !branchContext.repo || !branchContext.baseBranch || !branchContext.headBranch) {
    logMsg("Cannot fetch diff: missing branch context - " + JSON.stringify(branchContext));
    return null;
  }

  if (!isValidRepoName(branchContext.owner) || !isValidRepoName(branchContext.repo)) {
    logMsg("Invalid owner or repo name - owner: " + branchContext.owner + ", repo: " + branchContext.repo);
    return { error: "GITHUB_INVALID_CONTEXT" };
  }

  const compareResult = await requestCompareDiff(
    config,
    branchContext.owner,
    branchContext.repo,
    branchContext.baseBranch,
    branchContext.headBranch,
  );

  // A 404 on compare usually means the head branch was deleted after merge.
  // The /pulls/{n} diff endpoint survives that — use it when we know the PR.
  if (compareResult !== null && "error" in compareResult && compareResult.error === "GITHUB_404" && prNumber) {
    logMsg("Compare diff 404 (branch likely deleted post-merge) — falling back to PR diff endpoint");
    return await requestPrDiff(config, branchContext.owner, branchContext.repo, prNumber);
  }
  return compareResult;
}
