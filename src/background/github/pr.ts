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
  fetchWithTimeout,
  GITHUB_JSON_ACCEPT,
  GITHUB_USER_AGENT,
  isRateLimited,
  makeGitHubHeaders,
  rateLimitedResult,
} from "./common";
import { fetchGitHubJson, logResponseStatus, prUrl, validatePrContext } from "./request";

// head.label arrives as "owner:branch". The owner segment is the base repo's
// owner for same-repo PRs, so fold the label back to the plain ref; a PR from
// a fork keeps its "owner:branch" label because that branch lives elsewhere.
function headBranchLabel(prData: GitHubPRApiResponse, owner: string, repo: string): string {
  const head = prData.head;
  if (!head) return "";
  const headRepo = head.repo?.full_name?.toLowerCase() ?? "";
  if (headRepo === `${owner.toLowerCase()}/${repo.toLowerCase()}`) {
    return head.ref ?? head.label ?? "";
  }
  return head.label && head.label !== "" ? head.label : (head.ref ?? "");
}

function mapPRDetails(prData: GitHubPRApiResponse, owner: string, repo: string): GitHubPRDetails {
  logMsg(
    "Fetched PR details - title: " +
      String(prData.title) +
      ", base: " +
      String(prData.base?.ref) +
      ", head: " +
      String(prData.head?.ref) +
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
    baseBranch: prData.base?.ref ? prData.base.ref : "",
    headBranch: headBranchLabel(prData, owner, repo),
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
  const invalid = validatePrContext(owner, repo, prNumber, "Invalid PR number - prNumber: ");
  if (invalid) return invalid;

  const url = prUrl(owner, repo, prNumber);
  logMsg("Fetching PR details from: " + url);

  try {
    const response = await fetchGitHubJson("PR details", url, { method: "GET", headers: makeGitHubHeaders(config) });
    if ("error" in response) return response;
    const prData = (await response.json()) as GitHubPRApiResponse;
    return mapPRDetails(prData, owner, repo);
  } catch (fetchErr) {
    logMsg("GitHub API fetch error (PR details): " + errorMessage(fetchErr));
    return { error: "GITHUB_NETWORK_ERROR", message: errorMessage(fetchErr) };
  }
}

async function updateFailure(response: Response): Promise<UpdatePRResult> {
  const errText = await response.text();
  logMsg("GitHub API error updating PR: " + String(response.status) + " - " + errText.substring(0, 200));
  // Real rate limiting first; a non-exhausted 403 keeps the update-specific
  // GITHUB_403 code below (its message already names the PAT-scope cause).
  if (isRateLimited(response)) return rateLimitedResult(response);
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

  const invalid = validatePrContext(owner, repo, prNumber, "Invalid PR number - prNumber: ");
  if (invalid) return invalid;

  const url = prUrl(owner, repo, prNumber);
  logMsg("Updating PR via PATCH: " + url + " fields: " + Object.keys(fields).join(", "));

  const headers: Record<string, string> = {
    Accept: GITHUB_JSON_ACCEPT,
    "User-Agent": GITHUB_USER_AGENT,
    Authorization: "Bearer " + config.githubToken,
    "Content-Type": "application/json",
  };

  try {
    const response = await fetchWithTimeout(url, { method: "PATCH", headers, body: JSON.stringify(fields) });
    logResponseStatus("PR update", response);
    if (!response.ok) return await updateFailure(response);
    const result = (await response.json()) as GitHubPRApiResponse;
    logMsg("PR updated successfully - title: " + String(result.title));
    return { success: true, title: result.title || "", body: result.body || "" };
  } catch (fetchErr) {
    logMsg("GitHub API fetch error (PR update): " + errorMessage(fetchErr));
    return { error: "GITHUB_NETWORK_ERROR", message: errorMessage(fetchErr) };
  }
}
