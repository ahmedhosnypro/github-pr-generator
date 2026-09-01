import type { ExtensionConfig } from "../../types";

export const GITHUB_JSON_ACCEPT = "application/vnd.github.v3+json";
export const GITHUB_RAW_ACCEPT = "application/vnd.github.raw+json";
export const GITHUB_DIFF_ACCEPT = "application/vnd.github.v3.diff";
export const GITHUB_USER_AGENT = "github-pr-generator-extension";
const RATE_LIMIT_REMAINING_HEADER = "X-RateLimit-Remaining";

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

export function isValidRepoName(name: string): boolean {
  return /^[a-zA-Z0-9_.-]+$/.test(name);
}
