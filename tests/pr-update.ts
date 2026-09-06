// Unit tests for updatePRField and fetchPRDetails (src/background/github/pr.ts):
// token/context guards, prNumber validation, success mapping, per-status error
// codes, and network failure handling. Mocks global fetch — no real network.
// Second section: the two-phase opened-PR review gate — generate handlers only
// PROPOSE, apply handlers PATCH exactly the user-approved text.
import { fetchPRDetails, updatePRField } from "../src/background/github/pr";
import type { FetchPRDetailsResult, PRUpdateFields, UpdatePRResult } from "../src/github-types";
import type { ExtensionConfig } from "../src/types";
import { expectIncludes, expectMatch, getFailures } from "./expect-helpers";
import {
  captureRejection,
  chainHandlers,
  githubPrHandler,
  installBackgroundHarness,
  llmCallCount,
  llmResponder,
  patchCalls,
  resetHarness,
} from "./handlers-harness";

// Harness must be installed before importing the background handlers:
// config.ts touches chrome.runtime at module scope.
const bgHarness = installBackgroundHarness();
const { handleGenerateTitle, handleApplyTitleUpdate } = await import("../src/background/handlers/title");
const { handleApplyDescriptionUpdate, handleGenerateDescription } = await import(
  "../src/background/handlers/description"
);

const OPENED = { owner: "octo", repo: "demo", prNumber: "123" };
const TOKEN_MESSAGE_BASE = "GitHub Personal Access Token is required to update PR";

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
    const cases: [name: string, owner: string, repo: string][] = [
      ["invalid owner", "bad/owner", "hello-world"],
      ["invalid repo", "octocat", "bad repo!"],
      ['repo ".."', "octocat", ".."],
    ];
    for (const [name, owner, repo] of cases) {
      // oxlint-disable-next-line no-await-in-loop -- sequential on purpose: one shared spy, order-insensitive cases
      const out = await updatePRField(BASE_CONFIG, owner, repo, "1", FIELDS);
      expectMatch(name + " returns GITHUB_INVALID_CONTEXT", "error" in out && out.error, "GITHUB_INVALID_CONTEXT");
    }
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
    for (const prNumber of ["..", "abc", ""]) {
      // oxlint-disable-next-line no-await-in-loop -- sequential on purpose: one shared spy, order-insensitive cases
      const out = await updatePRField(BASE_CONFIG, "octocat", "hello-world", prNumber, FIELDS);
      expectMatch(
        `update: prNumber ${JSON.stringify(prNumber)} returns GITHUB_INVALID_CONTEXT`,
        "error" in out && out.error,
        "GITHUB_INVALID_CONTEXT",
      );
    }
    const fetched = await fetchPRDetails(BASE_CONFIG, "octocat", "hello-world", "..");
    expectMatch(
      'fetch: prNumber ".." returns GITHUB_INVALID_CONTEXT',
      "error" in fetched && fetched.error,
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
  async function updateOnce(impl: FetchImpl): Promise<UpdatePRResult> {
    let out: UpdatePRResult = { error: "GITHUB_API_ERROR" };
    await withFetch(impl, async () => {
      out = await updatePRField(BASE_CONFIG, "octocat", "hello-world", "1", FIELDS);
    });
    return out;
  }
  const forbidden = await updateOnce(() => Promise.resolve(new Response("Forbidden", { status: 403 })));
  expectMatch("403 returns GITHUB_403", "error" in forbidden && forbidden.error, "GITHUB_403");
  const validation = await updateOnce(() =>
    Promise.resolve(new Response("Validation Failed: title is too long", { status: 422 })),
  );
  expectMatch("422 returns GITHUB_422", "error" in validation && validation.error, "GITHUB_422");
  const msg = "error" in validation ? String(validation.message) : "";
  expectMatch("422 message contains response text", msg.includes("Validation Failed: title is too long"), true);
  const boom = await updateOnce(() => Promise.resolve(new Response("boom", { status: 500 })));
  expectMatch("500 returns GITHUB_API_ERROR", "error" in boom && boom.error, "GITHUB_API_ERROR");
  expectMatch("500 carries status", "error" in boom && boom.status, 500);
  const network = await updateOnce(() => Promise.reject(new Error("socket hang up")));
  expectMatch("thrown fetch returns GITHUB_NETWORK_ERROR", "error" in network && network.error, "GITHUB_NETWORK_ERROR");
  expectMatch("network error carries message", "error" in network && network.message, "socket hang up");
}

// === Two-phase opened-PR review gate: generate only proposes; apply patches the approved text. ===

async function testGenerateTitleIsProposalOnly(): Promise<void> {
  resetHarness(bgHarness, {}, chainHandlers(llmResponder(["Polished Widget Title"]), githubPrHandler()));
  const result = await handleGenerateTitle(OPENED);
  expectMatch("two-phase: generate title returns the proposal", result.title, "Polished Widget Title");
  expectMatch("two-phase: generate title reports not updated", result.updated, false);
  expectMatch("two-phase: generate title performs no PATCH", patchCalls(bgHarness).length, 0);
}

async function testGenerateDescriptionIsProposalOnly(): Promise<void> {
  resetHarness(
    bgHarness,
    {},
    chainHandlers(llmResponder(["## Summary\nMock description body for proposal."]), githubPrHandler()),
  );
  const result = await handleGenerateDescription(OPENED);
  expectIncludes("two-phase: generate description returns the proposal", result.body, "Mock description body");
  expectMatch("two-phase: generate description reports not updated", result.updated, false);
  expectMatch("two-phase: generate description performs no PATCH", patchCalls(bgHarness).length, 0);
}

async function testApplyTitlePatchesApprovedText(): Promise<void> {
  resetHarness(bgHarness, {}, githubPrHandler());
  const result = await handleApplyTitleUpdate({ ...OPENED, title: "User-edited approved title" });
  expectMatch("apply title reports updated", result.updated, true);
  const patches = patchCalls(bgHarness);
  expectMatch("apply title performs exactly one PATCH", patches.length, 1);
  expectMatch("apply title PATCHes exactly the approved text", patches[0]?.body.title, "User-edited approved title");
  expectMatch("apply title does not touch the body field", "body" in (patches[0]?.body ?? {}), false);
  expectMatch("apply title never calls the LLM", llmCallCount(bgHarness), 0);
}

async function testApplyDescriptionPatchesApprovedText(): Promise<void> {
  resetHarness(bgHarness, {}, githubPrHandler());
  const approved = "## Edited\nby the reviewer before applying";
  const result = await handleApplyDescriptionUpdate({ ...OPENED, body: approved });
  expectMatch("apply description reports updated", result.updated, true);
  const patches = patchCalls(bgHarness);
  expectMatch("apply description performs exactly one PATCH", patches.length, 1);
  expectMatch("apply description PATCHes exactly the approved text", patches[0]?.body.body, approved);
  expectMatch("apply description does not touch the title field", "title" in (patches[0]?.body ?? {}), false);
  expectMatch("apply description never calls the LLM", llmCallCount(bgHarness), 0);
}

// Apply validation: blank text, missing coordinates, or no token all reject before any PATCH.
async function testApplyRejectsEmptyText(): Promise<void> {
  resetHarness(bgHarness, {}, githubPrHandler());
  const titleMessage = await captureRejection(() => handleApplyTitleUpdate({ ...OPENED, title: "   " }));
  expectMatch("apply title rejects blank text", titleMessage, "Cannot apply an empty title to the PR.");
  const missingMessage = await captureRejection(() => handleApplyTitleUpdate({ ...OPENED }));
  expectMatch("apply title rejects missing text", missingMessage, "Cannot apply an empty title to the PR.");
  const descMessage = await captureRejection(() => handleApplyDescriptionUpdate({ ...OPENED, body: "" }));
  expectMatch("apply description rejects empty text", descMessage, "Cannot apply an empty description to the PR.");
  expectMatch("rejected apply performs no PATCH", patchCalls(bgHarness).length, 0);
}

async function testApplyRejectsMissingContext(): Promise<void> {
  resetHarness(bgHarness, {}, githubPrHandler());
  const message = await captureRejection(() => handleApplyTitleUpdate({ title: "Some title" }));
  expectMatch(
    "apply title rejects missing owner/repo/prNumber",
    message,
    "Missing PR owner/repo/number for the title update.",
  );
  expectMatch("missing-context apply performs no PATCH", patchCalls(bgHarness).length, 0);
}

async function testApplyRequiresToken(): Promise<void> {
  resetHarness(bgHarness, { githubToken: "" }, githubPrHandler());
  const titleMessage = await captureRejection(() => handleApplyTitleUpdate({ ...OPENED, title: "Some title" }));
  expectMatch(
    "apply title without a PAT rejects with the token message",
    (titleMessage ?? "").includes(TOKEN_MESSAGE_BASE),
    true,
  );
  const descMessage = await captureRejection(() => handleApplyDescriptionUpdate({ ...OPENED, body: "Some body" }));
  expectMatch(
    "apply description without a PAT rejects with the token message",
    (descMessage ?? "").includes(". Set it in the extension popup (needs 'repo' scope)."),
    true,
  );
  expectMatch("tokenless apply performs no PATCH", patchCalls(bgHarness).length, 0);
}

async function testApplySurfacesPatchFailure(): Promise<void> {
  resetHarness(bgHarness, {}, githubPrHandler({ patchStatus: 403 }));
  const message = await captureRejection(() => handleApplyTitleUpdate({ ...OPENED, title: "Some title" }));
  expectMatch(
    "apply title surfaces the 403 update failure",
    message,
    "Failed to update PR title: GitHub PAT may lack repo scope or insufficient permissions.",
  );
}

// (3b) fetchPRDetails maps the API response; a same-repo head label
// "owner:branch" folds back to the bare ref while a fork keeps its label.
async function testFetchDetailsMapsFields(): Promise<void> {
  async function run(payload: object): Promise<FetchPRDetailsResult> {
    let out: FetchPRDetailsResult = { error: "GITHUB_API_ERROR" };
    await withFetch(
      () => Promise.resolve(jsonResponse(payload)),
      async () => {
        out = await fetchPRDetails(BASE_CONFIG, "octocat", "hello-world", "42");
      },
    );
    return out;
  }
  const same = await run({
    title: "T",
    base: { ref: "main" },
    head: { ref: "feature", label: "octocat:feature", repo: { full_name: "octocat/hello-world" } },
    additions: 5,
    changed_files: 3,
  });
  expectMatch("same-repo label folds to bare ref", "title" in same && same.headBranch, "feature");
  expectMatch("counters mapped", "title" in same && same.additions, 5);
  expectMatch("changed files mapped", "title" in same && same.changedFiles, 3);
  const labelCases: [name: string, head: object, expected: string][] = [
    [
      "fork label keeps owner:prefix",
      { ref: "f", label: "EVILfork:f", repo: { full_name: "EVILfork/hello-world" } },
      "EVILfork:f",
    ],
    ["deleted head keeps its last-known label", { ref: "gone", label: "octocat:gone", repo: null }, "octocat:gone"],
    ["missing label falls back to ref", { ref: "bare-branch" }, "bare-branch"],
  ];
  for (const [name, head, expected] of labelCases) {
    // oxlint-disable-next-line no-await-in-loop -- each scenario re-spies global fetch; scenarios must not interleave
    const out = await run({ title: "T", base: { ref: "main" }, head });
    expectMatch(name, "title" in out && out.headBranch, expected);
  }
}

async function main(): Promise<void> {
  console.log("=== PR Update Tests ===\n");
  await testNoToken();
  await testInvalidContext();
  await testInvalidPrNumber();
  await testSuccess();
  await testFetchDetailsMapsFields();
  await testErrorBranches();
  console.log("\n=== Two-Phase Review Gate Tests ===\n");
  await testGenerateTitleIsProposalOnly();
  await testGenerateDescriptionIsProposalOnly();
  await testApplyTitlePatchesApprovedText();
  await testApplyDescriptionPatchesApprovedText();
  await testApplyRejectsEmptyText();
  await testApplyRejectsMissingContext();
  await testApplyRequiresToken();
  await testApplySurfacesPatchFailure();

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All PR update tests passed");
}

await main();
