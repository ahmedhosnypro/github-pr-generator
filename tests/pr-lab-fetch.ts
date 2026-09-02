/**
 * GitHub REST fetchers for the pr-lab harness — direct REST (token from
 * config.local.json), paginated commits/files, compare diff. Read-only.
 */
import type { GitHubFileApiItem } from "../src/github-types";
import type { ExtensionConfig, FileChange, FileChangeType } from "../src/types";

const UA = "github-pr-generator-prlab";

interface PrApiDetails {
  title?: string;
  body?: string | null;
  base?: { ref?: string };
  head?: { ref?: string };
  additions?: number;
  deletions?: number;
}

function headers(token: string, accept: string): Record<string, string> {
  return { Authorization: "Bearer " + token, Accept: accept, "User-Agent": UA };
}

async function fetchJsonPage(url: string, token: string): Promise<unknown[]> {
  const response = await fetch(url, { headers: headers(token, "application/vnd.github+json") });
  if (!response.ok) throw new Error("GitHub " + String(response.status) + " for " + url);
  return (await response.json()) as unknown[];
}

async function fetchAllPages(url: string, token: string): Promise<unknown[]> {
  const all: unknown[] = [];
  let page = 1;
  for (;;) {
    // oxlint-disable-next-line no-await-in-loop -- pagination is sequential by design
    const items = await fetchJsonPage(
      url + (url.includes("?") ? "&" : "?") + "per_page=100&page=" + String(page),
      token,
    );
    all.push(...items);
    if (items.length < 100) return all;
    page++;
  }
}

export async function fetchPrCommitMessages(base: string, token: string): Promise<string[]> {
  const items = await fetchAllPages(base + "/commits", token);
  return items
    .map((i) => (i as { commit?: { message?: string } }).commit?.message ?? "")
    .map((m) => m.split("\n")[0] ?? "");
}

function mapFile(raw: unknown): FileChange {
  const f = raw as GitHubFileApiItem;
  let type: FileChangeType = "modified";
  if (f.status === "added") type = "added";
  else if (f.status === "removed") type = "removed";
  else if (f.status === "renamed") type = "renamed";
  return { path: f.filename ?? "", type, additions: f.additions ?? 0, deletions: f.deletions ?? 0, diffAnchor: "" };
}

export async function fetchPrFiles(base: string, token: string): Promise<FileChange[]> {
  return (await fetchAllPages(base + "/files", token)).map(mapFile).filter((f) => f.path !== "");
}

export interface PrInfo {
  title: string;
  body: string;
  baseBranch: string;
  headBranch: string;
  additions: number;
  deletions: number;
}

export async function fetchPrInfo(base: string, token: string): Promise<PrInfo> {
  const response = await fetch(base, { headers: headers(token, "application/vnd.github+json") });
  if (!response.ok) throw new Error("GitHub " + String(response.status) + " for PR details");
  const pr = (await response.json()) as PrApiDetails;
  return {
    title: pr.title ?? "",
    body: pr.body ?? "",
    baseBranch: pr.base?.ref ?? "",
    headBranch: pr.head?.ref ?? "",
    additions: pr.additions ?? 0,
    deletions: pr.deletions ?? 0,
  };
}

export async function fetchPrDiffText(
  config: ExtensionConfig,
  owner: string,
  repo: string,
  base: string,
  head: string,
  prNumber?: number,
): Promise<string | null> {
  const url =
    "https://api.github.com/repos/" +
    owner +
    "/" +
    repo +
    "/compare/" +
    encodeURIComponent(base) +
    "..." +
    encodeURIComponent(head);
  const response = await fetch(url, {
    headers: headers(config.githubToken, "application/vnd.github.v3.diff"),
  });
  if (response.ok) return response.text();

  // Compare 404s when the head branch was deleted after merge — the PR diff
  // endpoint survives that (it indexes by PR number, not branch).
  if (prNumber !== undefined) {
    const fallback = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/pulls/" + String(prNumber), {
      headers: headers(config.githubToken, "application/vnd.github.v3.diff"),
    });
    if (fallback.ok) return fallback.text();
    if (fallback.status === 406) {
      console.warn(`Diff endpoint reports the PR is too large (>300 files, HTTP 406) — no diff available for prompt`);
      return null;
    }
    console.warn(`PR diff fallback failed: ${String(fallback.status)}`);
  }
  return null;
}

export function prApiBase(owner: string, repo: string, prNumber: number): string {
  return "https://api.github.com/repos/" + owner + "/" + repo + "/pulls/" + String(prNumber);
}
