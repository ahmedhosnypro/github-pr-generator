import type { GitHubErrorResult } from "../../github-types";
import { logMsg } from "../log";
import { fetchWithTimeout, isValidPrNumber, isValidRepoName, rateLimitOrApiError, rateLimitRemaining } from "./common";

export function prUrl(owner: string, repo: string, prNumber: string): string {
  return "https://api.github.com/repos/" + owner + "/" + repo + "/pulls/" + prNumber;
}

// Guard shared by every PR-scoped fetch/update: owner, repo, and PR number
// must be valid before anything is interpolated into an API URL. prNumberLogPrefix
// lets callers keep their existing "Invalid PR number" wording. Returns null
// when the context is valid.
export function validatePrContext(
  owner: string,
  repo: string,
  prNumber: string,
  prNumberLogPrefix: string,
): GitHubErrorResult | null {
  if (!isValidRepoName(owner) || !isValidRepoName(repo)) {
    logMsg("Invalid owner or repo name - owner: " + owner + ", repo: " + repo);
    return { error: "GITHUB_INVALID_CONTEXT" };
  }
  if (!isValidPrNumber(prNumber)) {
    logMsg(prNumberLogPrefix + prNumber);
    return { error: "GITHUB_INVALID_CONTEXT" };
  }
  return null;
}

export function logResponseStatus(scope: string, response: Response): void {
  logMsg(
    scope + " response status: " + String(response.status) + ", rate limit remaining: " + rateLimitRemaining(response),
  );
}

// One GET with the shared status log and error contract: the scope string is
// prefixed onto the response-status log and the "GitHub API error fetching
// <scope>" log. Rate limiting and 403 disambiguation go through
// rateLimitOrApiError; any other non-OK status is GITHUB_API_ERROR with the
// status code. Network throws propagate to the caller's catch, which maps
// them to GITHUB_NETWORK_ERROR.
export async function fetchGitHubJson(
  scope: string,
  url: string,
  init: RequestInit,
): Promise<Response | GitHubErrorResult> {
  const response = await fetchWithTimeout(url, init);
  logResponseStatus(scope, response);
  if (!response.ok) {
    const blocked = rateLimitOrApiError(response);
    if (blocked) return blocked;
    const errText = await response.text();
    logMsg("GitHub API error fetching " + scope + ": " + String(response.status) + " - " + errText.substring(0, 200));
    return { error: "GITHUB_API_ERROR", status: response.status };
  }
  return response;
}
