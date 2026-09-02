/**
 * Discovers a repo's PR template and recent merged-PR conventions at runtime.
 * Results are cached in chrome.storage.session (survives service-worker
 * restarts, cleared on browser close) to stay within GitHub rate limits.
 */
import type { GitHubContentsEntry, GitHubPRListItem } from "../../github-types";
import type { ExtensionConfig } from "../../types";
import { errorMessage, logMsg } from "../log";
import type { PrSample, RepoStyle } from "../repo-style";
import { EMPTY_REPO_STYLE, inferRepoStyle } from "../repo-style";
import { GITHUB_RAW_ACCEPT, GITHUB_USER_AGENT, isValidRepoName, makeGitHubHeaders } from "./common";

const TEMPLATE_DIRS = [".github", "docs", ""];
const TEMPLATE_FILE = /^pull_request_template\.\w+$/i;
const TEMPLATE_DIR = /^pull_request_template$/i;
const MAX_TEMPLATE_CHARS = 12_000;
const RECENT_PRS_PER_PAGE = 30;
const MAX_SAMPLES = 12;
const MAX_SAMPLE_BODY_CHARS = 1500;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const CACHE_PREFIX = "repoStyle:";

// Bot logins in the GitHub API always carry the "[bot]" suffix (e.g.
// "dependabot[bot]"); a plain suffix match would also exclude humans like
// "robot".
const BOT_LOGIN = /\[bot\]$/i;

async function readCache(key: string): Promise<RepoStyle | null> {
  try {
    const record = await chrome.storage.session.get(key);
    const entry = record[key] as { at: number; style: RepoStyle } | undefined;
    if (entry && Date.now() - entry.at < CACHE_TTL_MS) return entry.style;
  } catch {
    // cache miss / storage unavailable — proceed uncached
  }
  return null;
}

async function writeCache(key: string, style: RepoStyle): Promise<void> {
  try {
    await chrome.storage.session.set({ [key]: { at: Date.now(), style } });
  } catch {
    // storage unavailable — non-fatal
  }
}

async function fetchTemplateFile(
  config: ExtensionConfig,
  owner: string,
  repo: string,
  path: string,
): Promise<string | null> {
  const headers: Record<string, string> = { Accept: GITHUB_RAW_ACCEPT, "User-Agent": GITHUB_USER_AGENT };
  if (config.githubToken) headers.Authorization = "Bearer " + config.githubToken;
  const url = "https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + path;
  const response = await fetch(url, { method: "GET", headers });
  logMsg("PR template fetch " + path + " -> " + String(response.status));
  if (!response.ok) return null;
  const text = await response.text();
  return text.length > 0 && text.length <= MAX_TEMPLATE_CHARS ? text : null;
}

async function listDir(
  config: ExtensionConfig,
  owner: string,
  repo: string,
  dir: string,
): Promise<GitHubContentsEntry[] | null> {
  const url = "https://api.github.com/repos/" + owner + "/" + repo + "/contents" + (dir === "" ? "" : "/" + dir);
  const response = await fetch(url, { method: "GET", headers: makeGitHubHeaders(config) });
  if (!response.ok) return null;
  const entries = (await response.json()) as GitHubContentsEntry[] | { message?: string };
  return Array.isArray(entries) ? entries : null;
}

// Probes .github/, docs/, and the repo root for PULL_REQUEST_TEMPLATE files;
// also descends into a PULL_REQUEST_TEMPLATE/ directory for multi-template repos.
async function discoverPrTemplate(config: ExtensionConfig, owner: string, repo: string): Promise<string | null> {
  for (const dir of TEMPLATE_DIRS) {
    // oxlint-disable-next-line no-await-in-loop -- probe template dirs in priority order, stop at first hit
    const found = await findTemplateInDir(config, owner, repo, dir);
    if (found) return found;
  }
  return null;
}

async function findTemplateInDir(
  config: ExtensionConfig,
  owner: string,
  repo: string,
  dir: string,
): Promise<string | null> {
  const entries = await listDir(config, owner, repo, dir);
  if (!entries) return null;
  for (const entry of entries) {
    const name = entry.name ?? "";
    const path = entry.path ?? "";
    if (path === "") continue;
    if (entry.type === "file" && TEMPLATE_FILE.test(name)) {
      return fetchTemplateFile(config, owner, repo, path);
    }
    if (entry.type === "dir" && TEMPLATE_DIR.test(name)) {
      // oxlint-disable-next-line no-await-in-loop -- descend only on a template-dir match; fetch is sequential by design
      const found = await firstTemplateInDir(config, owner, repo, path);
      if (found) return found;
    }
  }
  return null;
}

async function firstTemplateInDir(
  config: ExtensionConfig,
  owner: string,
  repo: string,
  dirPath: string,
): Promise<string | null> {
  const subEntries = await listDir(config, owner, repo, dirPath);
  const first = subEntries?.find((e) => e.type === "file" && (e.path ?? "") !== "");
  return first?.path ? fetchTemplateFile(config, owner, repo, first.path) : null;
}

/** Most recently merged human PRs (title + truncated body), bots excluded. */
async function fetchRecentMergedPrs(config: ExtensionConfig, owner: string, repo: string): Promise<PrSample[]> {
  const url =
    "https://api.github.com/repos/" +
    owner +
    "/" +
    repo +
    "/pulls?state=closed&sort=updated&direction=desc&per_page=" +
    String(RECENT_PRS_PER_PAGE);
  const response = await fetch(url, { method: "GET", headers: makeGitHubHeaders(config) });
  if (!response.ok) {
    logMsg("Recent merged PRs fetch failed: " + String(response.status));
    return [];
  }
  const items = (await response.json()) as GitHubPRListItem[];
  if (!Array.isArray(items)) return [];
  const samples: PrSample[] = [];
  for (const item of items) {
    if (!item.merged_at) continue;
    if (BOT_LOGIN.test(item.user?.login ?? "")) continue;
    samples.push({ title: item.title ?? "", body: (item.body ?? "").slice(0, MAX_SAMPLE_BODY_CHARS) });
    if (samples.length >= MAX_SAMPLES) break;
  }
  logMsg("Recent merged PR samples kept: " + String(samples.length) + " of " + String(items.length));
  return samples;
}

/**
 * Full repo-style discovery: PR template + inferred title/length conventions.
 * Never throws; returns EMPTY_REPO_STYLE on failure.
 */
export async function discoverRepoStyle(config: ExtensionConfig, owner: string, repo: string): Promise<RepoStyle> {
  if (!isValidRepoName(owner) || !isValidRepoName(repo)) return EMPTY_REPO_STYLE;
  const cacheKey = CACHE_PREFIX + owner.toLowerCase() + "/" + repo.toLowerCase();
  const cached = await readCache(cacheKey);
  if (cached) {
    logMsg("Repo style cache hit for " + owner + "/" + repo);
    return cached;
  }
  try {
    const [template, samples] = await Promise.all([
      discoverPrTemplate(config, owner, repo),
      fetchRecentMergedPrs(config, owner, repo),
    ]);
    const style = inferRepoStyle(template, samples);
    await writeCache(cacheKey, style);
    return style;
  } catch (error) {
    logMsg("Repo style discovery failed: " + errorMessage(error));
    return EMPTY_REPO_STYLE;
  }
}
