// Unit tests for fetchGitHubDiff (src/background/github/diff.ts), focused on
// the 404 fallback to /pulls/<prNumber>: the fallback URL must only fire for
// a valid numeric PR number, and its diff text must come back through. Mocks
// global fetch - no real network.
import { fetchGitHubDiff } from "../src/background/github/diff";
import type { BranchContext, ExtensionConfig } from "../src/types";
import { expectMatch, getFailures } from "./expect-helpers";

const BASE_CONFIG: ExtensionConfig = {
  apiEndpoint: "https://probe.invalid/v1",
  apiKey: "k",
  model: "m",
  githubToken: "gh-token",
  diffEnabled: true,
  diffMaxLines: 50,
  diffMaxBytes: 4096,
  thinkingEffort: "default",
};

const BRANCH: BranchContext = {
  owner: "octocat",
  repo: "hello-world",
  baseBranch: "main",
  headBranch: "feature",
};

const SAMPLE_DIFF = "diff --git a/a.txt b/a.txt\n--- a/a.txt\n+++ b/a.txt\n@@ -1 +1 @@\n-old\n+new\n";

const notFound = () => new Response("Not Found", { status: 404 });

type FetchImpl = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

function withFetch(impl: FetchImpl, fn: () => Promise<void>): Promise<void> {
  const original = globalThis.fetch;
  globalThis.fetch = impl as typeof fetch;
  return fn().finally(() => {
    globalThis.fetch = original;
  });
}

// Captures console.log output (logMsg's sink) while fn runs; assertions must
// happen after restore so expectMatch output is not swallowed.
async function withCapturedLogs(fn: () => Promise<void>): Promise<string[]> {
  const captured: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    captured.push(args.map(String).join(" "));
  };
  try {
    await fn();
  } finally {
    console.log = original;
  }
  return captured;
}

function urlString(url: string | URL | Request): string {
  if (typeof url === "string") return url;
  return url instanceof URL ? url.href : url.url;
}

// (1) Compare 404 + invalid prNumber ".." → GITHUB_INVALID_CONTEXT, and the
// fallback /pulls/ request never fires (fetch called exactly once).
async function testInvalidPrNumberTraversal(): Promise<void> {
  let calls = 0;
  await withFetch(
    () => {
      calls++;
      return Promise.resolve(new Response("Not Found", { status: 404 }));
    },
    async () => {
      const out = await fetchGitHubDiff(BASE_CONFIG, BRANCH, "..");
      expectMatch(
        "traversal prNumber returns GITHUB_INVALID_CONTEXT",
        out !== null && "error" in out && out.error,
        "GITHUB_INVALID_CONTEXT",
      );
    },
  );
  expectMatch("traversal prNumber means fallback never fires", calls, 1);
}

// (2) Compare 404 + valid prNumber "123" → fallback /pulls/123 fires and its
// diff text comes back as the result payload.
async function testValidPrNumberFallback(): Promise<void> {
  const urls: string[] = [];
  await withFetch(
    (url) => {
      urls.push(urlString(url));
      if (urls.length === 1) {
        return Promise.resolve(new Response("Not Found", { status: 404 }));
      }
      return Promise.resolve(new Response(SAMPLE_DIFF, { status: 200 }));
    },
    async () => {
      const out = await fetchGitHubDiff(BASE_CONFIG, BRANCH, "123");
      expectMatch("fallback fires (compare + pulls)", urls.length, 2);
      expectMatch(
        "fallback hits /pulls/123",
        urlString(urls[1] ?? "").endsWith("/repos/octocat/hello-world/pulls/123"),
        true,
      );
      expectMatch("fallback diff text returned", out !== null && "diff" in out && out.diff, SAMPLE_DIFF);
    },
  );
}

// (3) Invalid prNumber "1?x=1" → GITHUB_INVALID_CONTEXT, single fetch call.
async function testInvalidPrNumberQueryInjection(): Promise<void> {
  let calls = 0;
  await withFetch(
    () => {
      calls++;
      return Promise.resolve(new Response("Not Found", { status: 404 }));
    },
    async () => {
      const out = await fetchGitHubDiff(BASE_CONFIG, BRANCH, "1?x=1");
      expectMatch(
        "query-injected prNumber returns GITHUB_INVALID_CONTEXT",
        out !== null && "error" in out && out.error,
        "GITHUB_INVALID_CONTEXT",
      );
    },
  );
  expectMatch("query-injected prNumber means fallback never fires", calls, 1);
}

// (4) 429 → GITHUB_RATE_LIMITED (primary signal: status 429).
async function testRateLimited429(): Promise<void> {
  await withFetch(
    () => Promise.resolve(new Response("rate limited", { status: 429, headers: { "X-RateLimit-Remaining": "40" } })),
    async () => {
      const out = await fetchGitHubDiff(BASE_CONFIG, BRANCH);
      expectMatch(
        "429 maps to GITHUB_RATE_LIMITED",
        out !== null && "error" in out && out.error,
        "GITHUB_RATE_LIMITED",
      );
    },
  );
}

// (5) 403 + X-RateLimit-Remaining: 0 → GITHUB_RATE_LIMITED.
async function testRateLimited403(): Promise<void> {
  await withFetch(
    () => Promise.resolve(new Response("forbidden", { status: 403, headers: { "X-RateLimit-Remaining": "0" } })),
    async () => {
      const out = await fetchGitHubDiff(BASE_CONFIG, BRANCH);
      expectMatch(
        "403 with remaining 0 maps to GITHUB_RATE_LIMITED",
        out !== null && "error" in out && out.error,
        "GITHUB_RATE_LIMITED",
      );
    },
  );
}

// (6) 403 with quota remaining → GITHUB_API_ERROR with detail (the shared
// mapping treats only an exhausted quota as GITHUB_RATE_LIMITED). No header
// → also GITHUB_API_ERROR.
async function testForbidden403(): Promise<void> {
  await withFetch(
    () => Promise.resolve(new Response("forbidden", { status: 403, headers: { "X-RateLimit-Remaining": "42" } })),
    async () => {
      const out = await fetchGitHubDiff(BASE_CONFIG, BRANCH);
      expectMatch(
        "403 with remaining 42 maps to GITHUB_API_ERROR",
        out !== null && "error" in out && out.error,
        "GITHUB_API_ERROR",
      );
      expectMatch(
        "403 with remaining 42 carries status and message",
        out !== null && "error" in out && out.status === 403 && typeof out.message === "string",
        true,
      );
    },
  );
  await withFetch(
    () => Promise.resolve(new Response("forbidden", { status: 403 })),
    async () => {
      const out = await fetchGitHubDiff(BASE_CONFIG, BRANCH);
      expectMatch(
        "403 without rate-limit header maps to GITHUB_API_ERROR",
        out !== null && "error" in out && out.error,
        "GITHUB_API_ERROR",
      );
    },
  );
}

// (7) Timeout: fetch rejects with the DOMException AbortSignal.timeout would
// raise → GITHUB_NETWORK_ERROR with a timeout message (not a hang). Also
// verifies the outgoing request carries an AbortSignal.
async function testFetchTimeout(): Promise<void> {
  let sawSignal = false;
  await withFetch(
    (_url, init) => {
      sawSignal = init?.signal instanceof AbortSignal;
      return Promise.reject(new DOMException("The operation timed out.", "TimeoutError"));
    },
    async () => {
      const out = await fetchGitHubDiff(BASE_CONFIG, BRANCH);
      expectMatch(
        "timeout maps to GITHUB_NETWORK_ERROR",
        out !== null && "error" in out && out.error,
        "GITHUB_NETWORK_ERROR",
      );
      expectMatch(
        "timeout message mentions it was a timeout",
        out !== null && "error" in out && typeof out.message === "string" && out.message.includes("timed out"),
        true,
      );
    },
  );
  expectMatch("request carries an AbortSignal", sawSignal, true);
}

// (8) The 404 log hint is token-aware: with a token configured the message
// does not blame auth (the 404 means the ref/repo is gone); without a token it
// keeps the private-repo PAT hint.
async function testNotFoundHintIsTokenAware(): Promise<void> {
  const withTokenLogs = await withCapturedLogs(async () => {
    await withFetch(
      () => Promise.resolve(notFound()),
      async () => {
        await fetchGitHubDiff(BASE_CONFIG, BRANCH);
      },
    );
  });
  expectMatch("404 with a token does not suggest a PAT", withTokenLogs.join("\n").includes("PAT"), false);
  expectMatch("404 with a token explains it is not auth", withTokenLogs.join("\n").includes("not an auth issue"), true);

  const noTokenLogs = await withCapturedLogs(async () => {
    await withFetch(
      () => Promise.resolve(notFound()),
      async () => {
        await fetchGitHubDiff({ ...BASE_CONFIG, githubToken: "" }, BRANCH);
      },
    );
  });
  expectMatch(
    "404 without a token keeps the PAT hint",
    noTokenLogs.join("\n").includes("may need PAT for private repo"),
    true,
  );
}

async function main(): Promise<void> {
  console.log("=== Diff Fetch Tests ===\n");
  await testInvalidPrNumberTraversal();
  await testValidPrNumberFallback();
  await testInvalidPrNumberQueryInjection();
  await testRateLimited429();
  await testRateLimited403();
  await testForbidden403();
  await testFetchTimeout();
  await testNotFoundHintIsTokenAware();

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All diff fetch tests passed");
}

await main();
