import type {
  FetchPRDetailsResult,
  GitHubPRApiResponse,
  GitHubPRDetails,
  PRUpdateFields,
  UpdatePRResult,
} from "../../github-types";
import type { ExtensionConfig } from "../../types";
import { errorMessage, logMsg } from "../log";
import {
  GITHUB_JSON_ACCEPT,
  GITHUB_USER_AGENT,
  isValidRepoName,
  makeGitHubHeaders,
  rateLimitRemaining,
} from "./common";

function prUrl(owner: string, repo: string, prNumber: string): string {
  return "https://api.github.com/repos/" + owner + "/" + repo + "/pulls/" + prNumber;
}

function mapPRDetails(prData: GitHubPRApiResponse): GitHubPRDetails {
  logMsg(
    "Fetched PR details - title: " +
      String(prData.title) +
      ", base: " +
      String(prData.base && prData.base.ref) +
      ", head: " +
      String(prData.head && prData.head.ref) +
      ", additions: " +
      String(prData.additions || 0) +
      ", deletions: " +
      String(prData.deletions || 0) +
      ", changed_files: " +
      String(prData.changed_files || 0),
  );
  return {
    title: prData.title || "",
    body: prData.body || "",
    baseBranch: prData.base && prData.base.ref ? prData.base.ref : "",
    headBranch: prData.head && prData.head.ref ? prData.head.ref : "",
    additions: prData.additions || 0,
    deletions: prData.deletions || 0,
    changedFiles: prData.changed_files || 0,
  };
}

export async function fetchPRDetails(
  config: ExtensionConfig,
  owner: string,
  repo: string,
  prNumber: string,
): Promise<FetchPRDetailsResult> {
  if (!isValidRepoName(owner) || !isValidRepoName(repo)) {
    logMsg("Invalid owner or repo name - owner: " + owner + ", repo: " + repo);
    return { error: "GITHUB_INVALID_CONTEXT" };
  }

  const url = prUrl(owner, repo, prNumber);
  logMsg("Fetching PR details from: " + url);

  try {
    const response = await fetch(url, { method: "GET", headers: makeGitHubHeaders(config) });
    logMsg(
      "PR details response status: " +
        String(response.status) +
        ", rate limit remaining: " +
        rateLimitRemaining(response),
    );
    if (!response.ok) {
      const errText = await response.text();
      logMsg("GitHub API error fetching PR details: " + String(response.status) + " - " + errText.substring(0, 200));
      return { error: "GITHUB_API_ERROR", status: response.status };
    }
    const prData = (await response.json()) as GitHubPRApiResponse;
    return mapPRDetails(prData);
  } catch (fetchErr) {
    logMsg("GitHub API fetch error (PR details): " + errorMessage(fetchErr));
    return { error: "GITHUB_NETWORK_ERROR", message: errorMessage(fetchErr) };
  }
}

async function updateFailure(response: Response): Promise<UpdatePRResult> {
  const errText = await response.text();
  logMsg("GitHub API error updating PR: " + String(response.status) + " - " + errText.substring(0, 200));
  if (response.status === 403) {
    return { error: "GITHUB_403", message: "GitHub PAT may lack repo scope or insufficient permissions." };
  }
  if (response.status === 422) {
    return { error: "GITHUB_422", message: "Validation failed: " + errText.substring(0, 200) };
  }
  return { error: "GITHUB_API_ERROR", status: response.status, message: errText.substring(0, 200) };
}

export async function updatePRField(
  config: ExtensionConfig,
  owner: string,
  repo: string,
  prNumber: string,
  fields: PRUpdateFields,
): Promise<UpdatePRResult> {
  if (!config.githubToken) {
    logMsg("No GitHub token configured for PR update");
    return { error: "GITHUB_NO_TOKEN" };
  }

  if (!isValidRepoName(owner) || !isValidRepoName(repo)) {
    logMsg("Invalid owner or repo name - owner: " + owner + ", repo: " + repo);
    return { error: "GITHUB_INVALID_CONTEXT" };
  }

  const url = prUrl(owner, repo, prNumber);
  logMsg("Updating PR via PATCH: " + url + " fields: " + Object.keys(fields).join(", "));

  const headers: Record<string, string> = {
    Accept: GITHUB_JSON_ACCEPT,
    "User-Agent": GITHUB_USER_AGENT,
    Authorization: "Bearer " + config.githubToken,
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(fields) });
    logMsg(
      "PR update response status: " +
        String(response.status) +
        ", rate limit remaining: " +
        rateLimitRemaining(response),
    );
    if (!response.ok) return await updateFailure(response);
    const result = (await response.json()) as GitHubPRApiResponse;
    logMsg("PR updated successfully - title: " + String(result.title));
    return { success: true, title: result.title || "", body: result.body || "" };
  } catch (fetchErr) {
    logMsg("GitHub API fetch error (PR update): " + errorMessage(fetchErr));
    return { error: "GITHUB_NETWORK_ERROR", message: errorMessage(fetchErr) };
  }
}
