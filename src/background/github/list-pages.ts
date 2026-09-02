import type {
  FetchPRCommitsResult,
  FetchPRFilesResult,
  GitHubCommitApiItem,
  GitHubErrorResult,
  GitHubFileApiItem,
} from "../../github-types";
import type { CommitInfo, ExtensionConfig, FileChange, FileChangeType } from "../../types";
import { errorMessage, logMsg } from "../log";
import { makeGitHubHeaders, rateLimitRemaining } from "./common";

interface PageListResult<T> {
  items: T[];
}

async function fetchPage(
  headers: Record<string, string>,
  baseUrl: string,
  label: string,
  page: number,
  perPage: number,
): Promise<unknown[] | GitHubErrorResult> {
  const url = baseUrl + "?page=" + String(page) + "&per_page=" + String(perPage);
  logMsg("Fetching " + label + " page " + String(page) + " from: " + url);

  const response = await fetch(url, { method: "GET", headers });
  logMsg(
    label +
      " page " +
      String(page) +
      " response status: " +
      String(response.status) +
      ", rate limit remaining: " +
      rateLimitRemaining(response),
  );
  if (!response.ok) {
    const errText = await response.text();
    logMsg(
      "GitHub API error fetching " +
        label +
        " page " +
        String(page) +
        ": " +
        String(response.status) +
        " - " +
        errText.substring(0, 200),
    );
    return { error: "GITHUB_API_ERROR", status: response.status };
  }

  const body: unknown = await response.json();
  // GitHub's list endpoints must return arrays; a non-array 2xx (e.g. a proxy
  // or a migrated endpoint returning an object) should NOT silently flow to
  // callers as if it were a page of items.
  if (!Array.isArray(body)) {
    logMsg("GitHub API returned non-array body for " + label + " page " + String(page));
    return { error: "GITHUB_API_ERROR", status: response.status };
  }
  return body as unknown[];
}

// Paginates a GitHub REST list endpoint (100 per page, stops on a short page),
// with identical logging and error handling for the commits/files listings.
async function fetchAllPages<TMapped>(
  config: ExtensionConfig,
  baseUrl: string,
  label: string,
  mapItem: (item: unknown) => TMapped,
): Promise<PageListResult<TMapped> | GitHubErrorResult> {
  const headers = makeGitHubHeaders(config);

  try {
    let allItems: TMapped[] = [];
    let page = 1;
    const perPage = 100; // Max per page for GitHub API
    let hasMore = true;

    while (hasMore) {
      // oxlint-disable-next-line no-await-in-loop -- each GitHub page depends on the previous response; pagination must stay sequential
      const pageResult = await fetchPage(headers, baseUrl, label, page, perPage);
      if (!Array.isArray(pageResult)) return pageResult;

      const noun = label.replace(/^PR /, "").toLowerCase();
      logMsg("Page " + String(page) + " returned " + String(pageResult.length) + " " + noun);

      if (pageResult.length === 0) {
        break;
      }

      allItems = allItems.concat(pageResult.map(mapItem));

      // Check if there are more pages (GitHub returns fewer than perPage when last page)
      if (pageResult.length < perPage) {
        hasMore = false;
      } else {
        page++;
      }
    }

    logMsg("Total " + label + " fetched across all pages: " + String(allItems.length));
    return { items: allItems };
  } catch (fetchErr) {
    logMsg("GitHub API fetch error (" + label + "): " + errorMessage(fetchErr));
    return { error: "GITHUB_NETWORK_ERROR", message: errorMessage(fetchErr) };
  }
}

function mapCommitItem(raw: unknown): CommitInfo {
  const c = raw as GitHubCommitApiItem;
  return { message: c.commit?.message ? c.commit.message : "" };
}

export async function fetchPRCommits(
  config: ExtensionConfig,
  owner: string,
  repo: string,
  prNumber: string,
): Promise<FetchPRCommitsResult> {
  const baseUrl = "https://api.github.com/repos/" + owner + "/" + repo + "/pulls/" + prNumber + "/commits";
  logMsg("Fetching PR commits from: " + baseUrl);
  const result = await fetchAllPages<CommitInfo>(config, baseUrl, "PR commits", mapCommitItem);
  if ("items" in result) return { commits: result.items };
  return result;
}

function mapFileItem(raw: unknown): FileChange {
  const f = raw as GitHubFileApiItem;
  let type: FileChangeType = "modified";
  if (f.status === "added") type = "added";
  else if (f.status === "removed") type = "removed";
  else if (f.status === "renamed") type = "renamed";
  return {
    path: f.filename || "",
    type,
    additions: f.additions || 0,
    deletions: f.deletions || 0,
    diffAnchor: "",
  };
}

export async function fetchPRFiles(
  config: ExtensionConfig,
  owner: string,
  repo: string,
  prNumber: string,
): Promise<FetchPRFilesResult> {
  const baseUrl = "https://api.github.com/repos/" + owner + "/" + repo + "/pulls/" + prNumber + "/files";
  logMsg("Fetching PR files from: " + baseUrl);
  const result = await fetchAllPages<FileChange>(config, baseUrl, "PR files", mapFileItem);
  if ("items" in result) return { files: result.items };
  return result;
}
