// Unit tests for updatePRField and fetchPRDetails (src/background/github/pr.ts),
// the GitHub write/read paths: token/context guards, prNumber validation,
// success mapping, per-status error codes, and network failure handling.
// Mocks global fetch — no real network.
import { fetchPRDetails, updatePRField } from "../src/background/github/pr";
import type { PRUpdateFields } from "../src/github-types";
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

const FIELDS: PRUpdateFields = { title: "New title", body: "New body" };

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

// (1) No githubToken → GITHUB_NO_TOKEN, fetch never called.
async function testNoToken(): Promise<void> {
  let calls = 0;
  await withFetch(
    () => {
      calls++;
      return Promise.resolve(jsonResponse({}));
    },
    async () => {
      const out = await updatePRField({ ...BASE_CONFIG, githubToken: "" }, "octocat", "hello-world", "1", FIELDS);
      expectMatch("no token returns GITHUB_NO_TOKEN", "error" in out && out.error, "GITHUB_NO_TOKEN");
      expectMatch("no token means fetch never called", calls, 0);
    },
  );
}

// (2) Invalid owner/repo → GITHUB_INVALID_CONTEXT, fetch never called.
async function testInvalidContext(): Promise<void> {
  let calls = 0;
  const spy: FetchImpl = () => {
    calls++;
    return Promise.resolve(jsonResponse({}));
  };
  await withFetch(spy, async () => {
    const badOwner = await updatePRField(BASE_CONFIG, "bad/owner", "hello-world", "1", FIELDS);
    expectMatch(
      "invalid owner returns GITHUB_INVALID_CONTEXT",
      "error" in badOwner && badOwner.error,
      "GITHUB_INVALID_CONTEXT",
    );
  });
  await withFetch(spy, async () => {
    const badRepo = await updatePRField(BASE_CONFIG, "octocat", "bad repo!", "1", FIELDS);
    expectMatch(
      "invalid repo returns GITHUB_INVALID_CONTEXT",
      "error" in badRepo && badRepo.error,
      "GITHUB_INVALID_CONTEXT",
    );
  });
  await withFetch(spy, async () => {
    const dotRepo = await updatePRField(BASE_CONFIG, "octocat", "..", "1", FIELDS);
    expectMatch(
      'repo ".." returns GITHUB_INVALID_CONTEXT',
      "error" in dotRepo && dotRepo.error,
      "GITHUB_INVALID_CONTEXT",
    );
  });
  expectMatch("invalid context means fetch never called", calls, 0);
}

// (2b) Invalid prNumber → GITHUB_INVALID_CONTEXT, fetch never called.
async function testInvalidPrNumber(): Promise<void> {
  let calls = 0;
  const spy: FetchImpl = () => {
    calls++;
    return Promise.resolve(jsonResponse({}));
  };
  await withFetch(spy, async () => {
    const dots = await updatePRField(BASE_CONFIG, "octocat", "hello-world", "..", FIELDS);
    expectMatch(
      'update: prNumber ".." returns GITHUB_INVALID_CONTEXT',
      "error" in dots && dots.error,
      "GITHUB_INVALID_CONTEXT",
    );
  });
  await withFetch(spy, async () => {
    const dots = await fetchPRDetails(BASE_CONFIG, "octocat", "hello-world", "..");
    expectMatch(
      'fetch: prNumber ".." returns GITHUB_INVALID_CONTEXT',
      "error" in dots && dots.error,
      "GITHUB_INVALID_CONTEXT",
    );
  });
  await withFetch(spy, async () => {
    const alpha = await updatePRField(BASE_CONFIG, "octocat", "hello-world", "abc", FIELDS);
    expectMatch(
      'update: prNumber "abc" returns GITHUB_INVALID_CONTEXT',
      "error" in alpha && alpha.error,
      "GITHUB_INVALID_CONTEXT",
    );
  });
  await withFetch(spy, async () => {
    const empty = await updatePRField(BASE_CONFIG, "octocat", "hello-world", "", FIELDS);
    expectMatch(
      "update: empty prNumber returns GITHUB_INVALID_CONTEXT",
      "error" in empty && empty.error,
      "GITHUB_INVALID_CONTEXT",
    );
  });
  expectMatch("invalid prNumber means fetch never called", calls, 0);
}

// (3) Success → {success: true, title, body} mapped from response JSON; PATCH with fields body.
async function testSuccess(): Promise<void> {
  let seenMethod = "";
  let seenUrl = "";
  let seenBody = "";
  let seenAuth = "";
  await withFetch(
    (url, init) => {
      seenUrl = urlString(url);
      seenMethod = String(init?.method);
      seenBody = typeof init?.body === "string" ? init.body : "";
      seenAuth = String((init?.headers as Record<string, string> | undefined)?.Authorization);
      return Promise.resolve(jsonResponse({ title: "Updated title", body: "Updated body" }));
    },
    async () => {
      const out = await updatePRField(BASE_CONFIG, "octocat", "hello-world", "42", FIELDS);
      expectMatch("success flag set", "success" in out && out.success, true);
      expectMatch("success maps title", "success" in out && out.title, "Updated title");
      expectMatch("success maps body", "success" in out && out.body, "Updated body");
    },
  );
  expectMatch("request hits PR endpoint", seenUrl, "https://api.github.com/repos/octocat/hello-world/pulls/42");
  expectMatch("request uses PATCH", seenMethod, "PATCH");
  expectMatch("request sends fields as JSON", seenBody, JSON.stringify(FIELDS));
  expectMatch("request carries Bearer token", seenAuth, "Bearer gh-token");
}

// (4)–(7) HTTP error statuses map to typed error codes; a thrown fetch maps to GITHUB_NETWORK_ERROR.
async function testErrorBranches(): Promise<void> {
  await withFetch(
    () => Promise.resolve(new Response("Forbidden", { status: 403 })),
    async () => {
      const out = await updatePRField(BASE_CONFIG, "octocat", "hello-world", "1", FIELDS);
      expectMatch("403 returns GITHUB_403", "error" in out && out.error, "GITHUB_403");
    },
  );

  await withFetch(
    () => Promise.resolve(new Response("Validation Failed: title is too long", { status: 422 })),
    async () => {
      const out = await updatePRField(BASE_CONFIG, "octocat", "hello-world", "1", FIELDS);
      expectMatch("422 returns GITHUB_422", "error" in out && out.error, "GITHUB_422");
      const msg = "error" in out ? String(out.message) : "";
      expectMatch("422 message contains response text", msg.includes("Validation Failed: title is too long"), true);
    },
  );

  await withFetch(
    () => Promise.resolve(new Response("boom", { status: 500 })),
    async () => {
      const out = await updatePRField(BASE_CONFIG, "octocat", "hello-world", "1", FIELDS);
      expectMatch("500 returns GITHUB_API_ERROR", "error" in out && out.error, "GITHUB_API_ERROR");
      expectMatch("500 carries status", "error" in out && out.status, 500);
    },
  );

  await withFetch(
    () => Promise.reject(new Error("socket hang up")),
    async () => {
      const out = await updatePRField(BASE_CONFIG, "octocat", "hello-world", "1", FIELDS);
      expectMatch("thrown fetch returns GITHUB_NETWORK_ERROR", "error" in out && out.error, "GITHUB_NETWORK_ERROR");
      expectMatch("network error carries message", "error" in out && out.message, "socket hang up");
    },
  );
}

async function main(): Promise<void> {
  console.log("=== PR Update Tests ===\n");
  await testNoToken();
  await testInvalidContext();
  await testInvalidPrNumber();
  await testSuccess();
  await testErrorBranches();

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All PR update tests passed");
}

await main();
