import { githubTokenInput, testGitHubBtn, testGitHubResult } from "./elements";
import { errorMessage } from "./messaging";
import { COLOR_ERROR, COLOR_MUTED, COLOR_OK } from "./ui";

interface GitHubTestResult {
  ok: boolean;
  status: number;
  body: unknown;
}

function stringProp(body: unknown, key: string): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function readGitHubResponse(resp: Response): Promise<GitHubTestResult> {
  console.log("[popup testGitHub] response:", resp.status);
  return resp.text().then((text): GitHubTestResult => {
    try {
      return { ok: resp.ok, status: resp.status, body: JSON.parse(text) as unknown };
    } catch {
      return { ok: resp.ok, status: resp.status, body: text };
    }
  });
}

function showGitHubResult(result: GitHubTestResult): void {
  testGitHubBtn.disabled = false;
  testGitHubBtn.textContent = "Test GitHub";
  if (result.ok) {
    testGitHubResult.textContent = "Success! User: " + (stringProp(result.body, "login") || "unknown");
    testGitHubResult.style.color = COLOR_OK;
  } else {
    const detail = stringProp(result.body, "message") || JSON.stringify(result.body);
    testGitHubResult.textContent = "Failed (" + String(result.status) + "): " + detail.substring(0, 60);
    testGitHubResult.style.color = COLOR_ERROR;
  }
}

function showGitHubError(err: unknown): void {
  testGitHubBtn.disabled = false;
  testGitHubBtn.textContent = "Test GitHub";
  testGitHubResult.textContent = "Error: " + errorMessage(err);
  testGitHubResult.style.color = COLOR_ERROR;
}

export function testGitHub(): void {
  const token = githubTokenInput.value.trim();
  if (!token) {
    testGitHubResult.textContent = "Enter a GitHub token";
    testGitHubResult.style.color = COLOR_ERROR;
    return;
  }
  testGitHubBtn.disabled = true;
  testGitHubBtn.textContent = "Testing...";
  testGitHubResult.textContent = "Checking...";
  testGitHubResult.style.color = COLOR_MUTED;
  console.log("[popup testGitHub] testing token for api.github.com/user");
  fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "github-pr-generator-extension",
    },
  })
    .then(readGitHubResponse)
    .then(showGitHubResult)
    .catch(showGitHubError);
}
