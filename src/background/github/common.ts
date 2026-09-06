import type { GitHubErrorResult } from "../../github-types";
import type { ExtensionConfig } from "../../types";
import { logMsg } from "../log";

export const GITHUB_JSON_ACCEPT = "application/vnd.github.v3+json";
export const GITHUB_RAW_ACCEPT = "application/vnd.github.raw+json";
export const GITHUB_DIFF_ACCEPT = "application/vnd.github.v3.diff";
export const GITHUB_USER_AGENT = "github-pr-generator-extension";
const GITHUB_REQUEST_TIMEOUT_MS = 15_000;
const RATE_LIMIT_REMAINING_HEADER = "X-RateLimit-Remaining";
const RATE_LIMIT_RESET_HEADER = "X-RateLimit-Reset";

export function makeGitHubHeaders(config: Pick<ExtensionConfig, "githubToken">): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: GITHUB_JSON_ACCEPT,
    "User-Agent": GITHUB_USER_AGENT,
  };
  if (config.githubToken) {
    headers.Authorization = "Bearer " + config.githubToken;
  }
  return headers;
}

export function rateLimitRemaining(response: Response): string {
  return response.headers.get(RATE_LIMIT_REMAINING_HEADER) || "unknown";
}

// A stalled GitHub socket hangs a bare fetch forever, and the LLM stall
// watchdog in llm.ts only covers the LLM call that starts AFTER the GitHub
// fetches finish. Every GitHub request goes through this wrapper; a timeout
// is rethrown as a plain Error so the existing catch blocks map it to the
// GITHUB_NETWORK_ERROR result shape.
export async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const timeout = AbortSignal.timeout(GITHUB_REQUEST_TIMEOUT_MS);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  try {
    return await fetch(url, { ...init, signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("GitHub API request timed out after " + String(GITHUB_REQUEST_TIMEOUT_MS / 1000) + "s: " + url, {
        cause: error,
      });
    }
    throw error;
  }
}

// True rate limiting, one definition shared by all GitHub fetches: 429, or
// 403 only when the primary quota is exhausted (X-RateLimit-Remaining: 0).
// Any other 403 is SSO enforcement or insufficient token permissions.
export function isRateLimited(response: Response): boolean {
  return response.status === 429 || (response.status === 403 && rateLimitRemaining(response) === "0");
}

export function rateLimitedResult(response: Response): GitHubErrorResult {
  const remaining = rateLimitRemaining(response);
  const reset = response.headers.get(RATE_LIMIT_RESET_HEADER) || "unknown";
  logMsg("GitHub API rate limited - remaining: " + remaining + ", reset: " + reset);
  return { error: "GITHUB_RATE_LIMITED", rateLimitRemaining: remaining };
}

// Maps 403/429 responses in one place so diff/pr/list fetches agree: real
// rate limiting (429, or 403 with the primary quota exhausted) goes to
// GITHUB_RATE_LIMITED; every other 403 (SSO enforcement, insufficient token
// permissions, secondary limits) is a plain GITHUB_API_ERROR with detail.
// Returns null for other statuses.
export function rateLimitOrApiError(response: Response): GitHubErrorResult | null {
  if (isRateLimited(response)) return rateLimitedResult(response);
  if (response.status === 403) {
    logMsg(
      "GitHub API 403 with rate limit remaining " +
        rateLimitRemaining(response) +
        " - not rate limiting (SSO or token permissions)",
    );
    return {
      error: "GITHUB_API_ERROR",
      status: 403,
      message:
        "GitHub API 403 without exhausted rate limit - usually SSO enforcement or insufficient token permissions.",
    };
  }
  return null;
}

export function isValidRepoName(name: string): boolean {
  // "." and ".." pass the charset check but become path-traversal segments
  // once interpolated into an API URL.
  return /^[a-zA-Z0-9_.-]+$/.test(name) && name !== "." && name !== "..";
}

// PR numbers come from URL scraping and user-facing messages; they must stay
// plain digits so interpolating them into an API path cannot break out of
// /pulls/<n>.
export function isValidPrNumber(prNumber: string): boolean {
  return /^[1-9]\d*$/.test(prNumber);
}
