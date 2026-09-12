import type { CommitInfo, FileChange } from "./types";

/** Error codes returned by the GitHub API helpers; consumed by string-literal
 * comparisons in background handlers (e.g. generate.ts) and the popup. */
type GitHubErrorCode =
  | "GITHUB_404"
  | "GITHUB_403"
  | "GITHUB_422"
  | "GITHUB_RATE_LIMITED"
  | "GITHUB_API_ERROR"
  | "GITHUB_NETWORK_ERROR"
  | "GITHUB_INVALID_CONTEXT"
  | "GITHUB_NO_TOKEN";

/** Error shape returned (not thrown) by the GitHub API helpers. */
export interface GitHubErrorResult {
  error: GitHubErrorCode;
  status?: number;
  message?: string;
  rateLimitRemaining?: string;
}

export interface GitHubHunkRange {
  rightStart: number;
  rightCount: number;
}

/** Hunk line ranges grouped by file path, parsed from a unified diff. */
export type GitHubHunksByFile = Record<string, GitHubHunkRange[]>;

interface GitHubDiffSuccess {
  diff: string;
  hunks: GitHubHunksByFile;
}

export type GitHubDiffResult = GitHubDiffSuccess | GitHubErrorResult | null;

export interface GitHubPRDetails {
  title: string;
  body: string;
  baseBranch: string;
  headBranch: string;
  additions: number;
  deletions: number;
  changedFiles: number;
}

export type FetchPRDetailsResult = GitHubPRDetails | GitHubErrorResult;

interface GitHubCommitList {
  commits: CommitInfo[];
}

export type FetchPRCommitsResult = GitHubCommitList | GitHubErrorResult;

interface GitHubFileList {
  files: FileChange[];
}

export type FetchPRFilesResult = GitHubFileList | GitHubErrorResult;

export interface PRUpdateFields {
  title?: string;
  body?: string;
}

interface GitHubPRUpdateSuccess {
  success: true;
  title: string;
  body: string;
}

export type UpdatePRResult = GitHubPRUpdateSuccess | GitHubErrorResult;

/** Raw shapes of the GitHub REST API responses used by the extension. */
export interface GitHubPRApiResponse {
  title?: string;
  body?: string | null;
  base?: { ref?: string } | null;
  head?: { ref?: string; label?: string; repo?: { full_name?: string } | null } | null;
  additions?: number;
  deletions?: number;
  changed_files?: number;
}

export interface GitHubCommitApiItem {
  commit?: { message?: string };
}

export interface GitHubFileApiItem {
  filename?: string;
  status?: string;
  additions?: number;
  deletions?: number;
}

/** Entry from the GitHub contents API (directory listing). */
export interface GitHubContentsEntry {
  name?: string;
  path?: string;
  type?: string;
  download_url?: string | null;
}

/** Subset of the GitHub list-PRs response used for repo style discovery. */
export interface GitHubPRListItem {
  title?: string;
  body?: string | null;
  merged_at?: string | null;
  user?: { login?: string } | null;
}

/** OpenAI-compatible chat completion response/chunk shapes. */
interface ChatCompletionContent {
  content?: string;
  /** Thinking-model reasoning (Gemini 3, DeepSeek-R1, …); never part of the answer. */
  reasoning_content?: string;
}

interface ChatCompletionChoice {
  delta?: ChatCompletionContent;
  message?: ChatCompletionContent;
}

export interface ChatCompletionResponse {
  choices?: ChatCompletionChoice[];
}
