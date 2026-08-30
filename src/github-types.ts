import type { CommitInfo, FileChange } from "./types";

/** Error shape returned (not thrown) by the GitHub API helpers. */
export interface GitHubErrorResult {
  error: string;
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
  head?: { ref?: string } | null;
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

/** OpenAI-compatible chat completion response/chunk shapes. */
interface ChatCompletionContent {
  content?: string;
}

interface ChatCompletionChoice {
  delta?: ChatCompletionContent;
  message?: ChatCompletionContent;
}

export interface ChatCompletionResponse {
  choices?: ChatCompletionChoice[];
}
