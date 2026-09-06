// Unit tests for fetchPRCommits / fetchPRFiles (src/background/github/list-pages.ts):
// prNumber validation guards and happy-path pagination/mapping.
// Mocks global fetch — no real network.
import { fetchPRCommits, fetchPRFiles } from "../src/background/github/list-pages";
import type { ExtensionConfig } from "../src/types";
import { expectMatch, getFailures } from "./expect-helpers";

const BASE_CONFIG: ExtensionConfig = {
  apiEndpoint: "https://probe.invalid/v1",
  apiKey: "k",
  model: "m",
  githubToken: "gh-token",
  diffEnabled: false,
  diffMaxLines: 10,
  diffMaxBytes: 100,
  thinkingEffort: "default",
};

type FetchImpl = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

function jsonResponse(payload: object, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
}

function withFetch(impl: FetchImpl, fn: () => Promise<void>): Promise<void> {
  const original = globalThis.fetch;
  globalThis.fetch = impl as typeof fetch;
  return fn().finally(() => {
    globalThis.fetch = original;
  });
}

function urlString(url: string | URL | Request): string {
  if (typeof url === "string") return url;
  return url instanceof URL ? url.href : url.url;
}

// (1) fetchPRCommits with invalid prNumber → GITHUB_INVALID_CONTEXT, fetch never called.
async function testCommitsInvalidPrNumber(): Promise<void> {
  let calls = 0;
  const spy: FetchImpl = () => {
    calls++;
    return Promise.resolve(jsonResponse([]));
  };
  await withFetch(spy, async () => {
    const traversal = await fetchPRCommits(BASE_CONFIG, "octocat", "hello-world", "..");
    expectMatch(
      'prNumber ".." returns GITHUB_INVALID_CONTEXT',
      "error" in traversal && traversal.error,
      "GITHUB_INVALID_CONTEXT",
    );
  });
  await withFetch(spy, async () => {
    const alpha = await fetchPRCommits(BASE_CONFIG, "octocat", "hello-world", "abc");
    expectMatch(
      'prNumber "abc" returns GITHUB_INVALID_CONTEXT',
      "error" in alpha && alpha.error,
      "GITHUB_INVALID_CONTEXT",
    );
  });
  expectMatch("invalid prNumber means fetch never called", calls, 0);
}

// (2) fetchPRFiles with empty prNumber → GITHUB_INVALID_CONTEXT, fetch never called.
async function testFilesInvalidPrNumber(): Promise<void> {
  let calls = 0;
  await withFetch(
    () => {
      calls++;
      return Promise.resolve(jsonResponse([]));
    },
    async () => {
      const out = await fetchPRFiles(BASE_CONFIG, "octocat", "hello-world", "");
      expectMatch(
        "empty prNumber returns GITHUB_INVALID_CONTEXT",
        "error" in out && out.error,
        "GITHUB_INVALID_CONTEXT",
      );
      expectMatch("empty prNumber means fetch never called", calls, 0);
    },
  );
}

// (3) fetchPRCommits happy path → commits mapped, URL targets /pulls/42/commits.
async function testCommitsSuccess(): Promise<void> {
  let seenUrl = "";
  await withFetch(
    (url) => {
      seenUrl = urlString(url);
      return Promise.resolve(jsonResponse([{ commit: { message: "fix: thing" } }]));
    },
    async () => {
      const out = await fetchPRCommits(BASE_CONFIG, "octocat", "hello-world", "42");
      expectMatch("commits result has one commit", "commits" in out && out.commits.length, 1);
      expectMatch("commit message mapped", "commits" in out && out.commits[0]?.message, "fix: thing");
    },
  );
  expectMatch(
    "request hits commits endpoint with paging params",
    seenUrl.includes("/pulls/42/commits?page=1&per_page=100"),
    true,
  );
}

// (4) fetchPRFiles happy path → files mapped, URL targets /pulls/42/files.
async function testFilesSuccess(): Promise<void> {
  let seenUrl = "";
  await withFetch(
    (url) => {
      seenUrl = urlString(url);
      return Promise.resolve(jsonResponse([{ filename: "a.ts", status: "added", additions: 3, deletions: 1 }]));
    },
    async () => {
      const out = await fetchPRFiles(BASE_CONFIG, "octocat", "hello-world", "42");
      expectMatch("files result has one file", "files" in out && out.files.length, 1);
      expectMatch("file path mapped", "files" in out && out.files[0]?.path, "a.ts");
      expectMatch("file type mapped", "files" in out && out.files[0]?.type, "added");
    },
  );
  expectMatch(
    "request hits files endpoint with paging params",
    seenUrl.includes("/pulls/42/files?page=1&per_page=100"),
    true,
  );
}

// (5) 429 → GITHUB_RATE_LIMITED (previously collapsed into GITHUB_API_ERROR).
async function testCommitsRateLimited429(): Promise<void> {
  await withFetch(
    () => Promise.resolve(new Response("rate limited", { status: 429, headers: { "X-RateLimit-Remaining": "10" } })),
    async () => {
      const out = await fetchPRCommits(BASE_CONFIG, "octocat", "hello-world", "42");
      expectMatch("429 maps to GITHUB_RATE_LIMITED", "error" in out && out.error, "GITHUB_RATE_LIMITED");
    },
  );
}

// (6) 403 disambiguation: remaining 0 → GITHUB_RATE_LIMITED; remaining > 0 →
// GITHUB_API_ERROR with detail (SSO/permissions, not rate limiting).
async function testFiles403Disambiguation(): Promise<void> {
  await withFetch(
    () => Promise.resolve(new Response("exhausted", { status: 403, headers: { "X-RateLimit-Remaining": "0" } })),
    async () => {
      const out = await fetchPRFiles(BASE_CONFIG, "octocat", "hello-world", "42");
      expectMatch(
        "403 with remaining 0 maps to GITHUB_RATE_LIMITED",
        "error" in out && out.error,
        "GITHUB_RATE_LIMITED",
      );
    },
  );
  await withFetch(
    () => Promise.resolve(new Response("forbidden", { status: 403, headers: { "X-RateLimit-Remaining": "59" } })),
    async () => {
      const out = await fetchPRFiles(BASE_CONFIG, "octocat", "hello-world", "42");
      expectMatch("403 with remaining 59 maps to GITHUB_API_ERROR", "error" in out && out.error, "GITHUB_API_ERROR");
      expectMatch("403 with remaining 59 carries status", "error" in out && out.status, 403);
    },
  );
}

// (6b) Invalid owner/repo guards on fetchPRCommits and fetchPRFiles.
async function testInvalidOwnerRepo(): Promise<void> {
  let calls = 0;
  const spy: FetchImpl = () => {
    calls++;
    return Promise.resolve(jsonResponse([]));
  };
  await withFetch(spy, async () => {
    const badOwner = await fetchPRCommits(BASE_CONFIG, "bad/owner", "hello-world", "42");
    expectMatch(
      "commits: invalid owner returns GITHUB_INVALID_CONTEXT",
      "error" in badOwner && badOwner.error,
      "GITHUB_INVALID_CONTEXT",
    );
  });
  await withFetch(spy, async () => {
    const badRepo = await fetchPRFiles(BASE_CONFIG, "octocat", "..", "42");
    expectMatch(
      "files: invalid repo returns GITHUB_INVALID_CONTEXT",
      "error" in badRepo && badRepo.error,
      "GITHUB_INVALID_CONTEXT",
    );
  });
  expectMatch("invalid owner/repo means fetch never called", calls, 0);
}

// (6c) Pagination is bounded: a server that always returns full pages stops
// at MAX_PAGES (10 × 100 items) instead of looping forever.
async function testPaginationBounded(): Promise<void> {
  let calls = 0;
  const fullPage = () => jsonResponse(Array.from({ length: 100 }, () => ({ commit: { message: "m" } })));
  await withFetch(
    () => {
      calls++;
      return Promise.resolve(fullPage());
    },
    async () => {
      const out = await fetchPRCommits(BASE_CONFIG, "octocat", "hello-world", "42");
      expectMatch("bounded pagination stops at 10 pages", calls, 10);
      expectMatch("bounded pagination returns 10x100 commits", "commits" in out && out.commits.length, 1000);
    },
  );
}

// (7) Timeout: fetch rejects with the DOMException AbortSignal.timeout would
// raise → GITHUB_NETWORK_ERROR with a timeout message (not a hang).
async function testCommitsFetchTimeout(): Promise<void> {
  let sawSignal = false;
  await withFetch(
    (_url, init) => {
      sawSignal = init?.signal instanceof AbortSignal;
      return Promise.reject(new DOMException("The operation timed out.", "TimeoutError"));
    },
    async () => {
      const out = await fetchPRCommits(BASE_CONFIG, "octocat", "hello-world", "42");
      expectMatch("timeout maps to GITHUB_NETWORK_ERROR", "error" in out && out.error, "GITHUB_NETWORK_ERROR");
      expectMatch(
        "timeout message mentions it was a timeout",
        "error" in out && typeof out.message === "string" && out.message.includes("timed out"),
        true,
      );
    },
  );
  expectMatch("request carries an AbortSignal", sawSignal, true);
}

async function main(): Promise<void> {
  console.log("=== PR Lists Tests ===\n");
  await testCommitsInvalidPrNumber();
  await testFilesInvalidPrNumber();
  await testCommitsSuccess();
  await testFilesSuccess();
  await testCommitsRateLimited429();
  await testFiles403Disambiguation();
  await testInvalidOwnerRepo();
  await testPaginationBounded();
  await testCommitsFetchTimeout();

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All PR list tests passed");
}

await main();
