import type {
  FetchPRCommitsResult,
  FetchPRFilesResult,
  GitHubCommitApiItem,
  GitHubErrorResult,
  GitHubFileApiItem,
} from "../../github-types";
import type { CommitInfo, ExtensionConfig, FileChange, FileChangeType } from "../../types";
import { errorMessage, logMsg } from "../log";
import { makeGitHubHeaders } from "./common";
import { fetchGitHubJson, prUrl, validatePrContext } from "./request";

interface PageListResult<T> {
  items: T[];
}

// GitHub caps the PR files listing at 3000 entries, so 10 pages × 100 covers
// everything GitHub will actually return. The bound also keeps a pathological
// server (always-full pages) from looping forever.
const MAX_PAGES = 10;

async function fetchPage(
  headers: Record<string, string>,
  baseUrl: string,
  label: string,
  page: number,
  perPage: number,
): Promise<unknown[] | GitHubErrorResult> {
  const url = baseUrl + "?page=" + String(page) + "&per_page=" + String(perPage);
  logMsg("Fetching " + label + " page " + String(page) + " from: " + url);

  const result = await fetchGitHubJson(label + " page " + String(page), url, { method: "GET", headers });
  if ("error" in result) return result;

  const response = result;
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
//
// Failure contract: a first-page failure fails loudly as GITHUB_* error and the
// caller (handlers/shared.ts) logs it and generates without this section. A
// failure partway through degrades instead — the pages already fetched are
// returned so the prompt loses only the missing tail, and the log records
// exactly what was kept and what failed.
async function fetchAllPages<TMapped>(
  config: ExtensionConfig,
  baseUrl: string,
  label: string,
  mapItem: (item: unknown) => TMapped,
): Promise<PageListResult<TMapped> | GitHubErrorResult> {
  const headers = makeGitHubHeaders(config);

  let allItems: TMapped[] = [];
  let page = 1;
  try {
    const perPage = 100; // Max per page for GitHub API
    let hasMore = true;

    while (hasMore && page <= MAX_PAGES) {
      // oxlint-disable-next-line no-await-in-loop -- each GitHub page depends on the previous response; pagination must stay sequential
      const pageResult = await fetchPage(headers, baseUrl, label, page, perPage);
      if (!Array.isArray(pageResult)) {
        if (allItems.length > 0) {
          logMsg(
            label +
              " page " +
              String(page) +
              " failed (" +
              pageResult.error +
              (pageResult.status ? ", status " + String(pageResult.status) : "") +
              ") after " +
              String(allItems.length) +
              " items from " +
              String(page - 1) +
              " page(s); keeping the partial list",
          );
          return { items: allItems };
        }
        return pageResult;
      }

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

    if (hasMore && page > MAX_PAGES) {
      // Not silent: a truncated file/commit list changes the generated PR text,
      // so the log gets counts, the cap, and why capping is safe.
      logMsg(
        "TRUNCATED " +
          label +
          ": fetched " +
          String(allItems.length) +
          " items across " +
          String(MAX_PAGES) +
          " pages and hit the " +
          String(MAX_PAGES) +
          "-page cap (" +
          String(MAX_PAGES * 100) +
          " items); remaining pages skipped. " +
          "GitHub itself caps these listings per PR (3000 files), so anything past the cap is reported partially.",
      );
    }

    logMsg("Total " + label + " fetched across all pages: " + String(allItems.length));
    return { items: allItems };
  } catch (fetchErr) {
    return handleFetchFailure(label, fetchErr, allItems, page);
  }
}

// A fetch/network throw mid-pagination keeps the pages already fetched
// (same degrade rule as HTTP errors); with nothing fetched yet it fails
// loudly as GITHUB_NETWORK_ERROR, as before.
function handleFetchFailure<TMapped>(
  label: string,
  fetchErr: unknown,
  allItems: TMapped[],
  page: number,
): PageListResult<TMapped> | GitHubErrorResult {
  if (allItems.length > 0) {
    logMsg(
      label +
        " fetch failed mid-pagination on page " +
        String(page) +
        " (" +
        errorMessage(fetchErr) +
        "); keeping " +
        String(allItems.length) +
        " items from " +
        String(page - 1) +
        " page(s)",
    );
    return { items: allItems };
  }
  logMsg("GitHub API fetch error (" + label + "): " + errorMessage(fetchErr));
  return { error: "GITHUB_NETWORK_ERROR", message: errorMessage(fetchErr) };
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
  const invalid = validatePrContext(owner, repo, prNumber, "Invalid PR number: ");
  if (invalid) return invalid;

  const baseUrl = prUrl(owner, repo, prNumber) + "/commits";
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
  const invalid = validatePrContext(owner, repo, prNumber, "Invalid PR number: ");
  if (invalid) return invalid;

  const baseUrl = prUrl(owner, repo, prNumber) + "/files";
  logMsg("Fetching PR files from: " + baseUrl);
  const result = await fetchAllPages<FileChange>(config, baseUrl, "PR files", mapFileItem);
  if ("items" in result) return { files: result.items };
  return result;
}
