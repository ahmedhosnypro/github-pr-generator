// Unit tests for discoverRepoStyle (background/github/discovery.ts): the
// chrome.storage.session cache (hit / TTL expiry / short-TTL caching of empty
// results) and the PR-template discovery priority. Mocks global fetch and
// chrome.storage.session — no real network, no real extension APIs.
import { discoverRepoStyle } from "../src/background/github/discovery";
import { EMPTY_REPO_STYLE, type RepoStyle } from "../src/background/repo-style";
import type { ExtensionConfig } from "../src/types";
import { expectMatch, getFailures } from "./expect-helpers";

const BASE_CONFIG: ExtensionConfig = {
  apiEndpoint: "https://probe.invalid/v1",
  apiKey: "k",
  model: "m",
  githubToken: "gh-t",
  diffEnabled: false,
  diffMaxLines: 10,
  diffMaxBytes: 100,
  thinkingEffort: "default",
};

type FetchImpl = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface FetchSpy {
  urls: string[];
}

interface SessionStore {
  data: Map<string, unknown>;
  setCalls: Record<string, unknown>[];
}

function freshStore(): SessionStore {
  return { data: new Map<string, unknown>(), setCalls: [] };
}

function installChrome(store: SessionStore): void {
  const stub = {
    storage: {
      session: {
        get: (key: string) => Promise.resolve(store.data.has(key) ? { [key]: store.data.get(key) } : {}),
        set: (items: Record<string, unknown>) => {
          store.setCalls.push(items);
          for (const key of Object.keys(items)) store.data.set(key, items[key]);
          return Promise.resolve();
        },
      },
    },
  };
  globalThis.chrome = stub as unknown as typeof chrome;
}

function urlString(url: string | URL | Request): string {
  if (typeof url === "string") return url;
  return url instanceof URL ? url.href : url.url;
}

// URL-keyed fetch: exact URLs fan out to canned Responses; anything unmapped
// answers 404. Every call is recorded for assertions.
function urlFetch(routes: Record<string, () => Response>, spy: FetchSpy): FetchImpl {
  return (url) => {
    const u = urlString(url);
    spy.urls.push(u);
    const hit = routes[u];
    return Promise.resolve(hit ? hit() : new Response("not found", { status: 404 }));
  };
}

const originalFetch = globalThis.fetch;
const originalChrome = (globalThis as Record<string, unknown>).chrome;

function withFetch(impl: FetchImpl, fn: () => Promise<void>): Promise<void> {
  globalThis.fetch = impl as typeof fetch;
  return fn().finally(() => {
    globalThis.fetch = originalFetch;
  });
}

// Background logMsg writes straight to console.log; capture those lines so a
// test can assert on what was logged during one discovery run.
async function withCapturedLogs<T>(fn: () => Promise<T>): Promise<{ result: T; logs: string[] }> {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  };
  try {
    const result = await fn();
    return { result, logs };
  } finally {
    console.log = originalLog;
  }
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
}

const SEVEN_HOURS_MS = 7 * 60 * 60 * 1000;
const TWENTY_MINUTES_MS = 20 * 60 * 1000;

function cacheKey(owner: string, repo: string): string {
  return `repoStyle:${owner.toLowerCase()}/${repo.toLowerCase()}`;
}

function pullsUrl(owner: string, repo: string): string {
  return `https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=100`;
}

function dirUrl(owner: string, repo: string, dir: string): string {
  const suffix = dir === "" ? "" : "/" + dir;
  return `https://api.github.com/repos/${owner}/${repo}/contents${suffix}`;
}

function mergedPr(title: string, body: string): object {
  return { title, body, merged_at: "2026-08-01T00:00:00Z", user: { login: "alice" } };
}

// Five human merged PRs with conventional-commit titles: enough for
// inferRepoStyle to produce a non-empty style (titleStyle + length set).
function conventionalPrs(): object[] {
  return [
    mergedPr("feat: add retry logic", "Small change with a few words."),
    mergedPr("fix: handle empty diff", "Another small change."),
    mergedPr("docs: update README", "Tiny documentation tweak."),
    mergedPr("feat: discover repo style", "Adds caching and templates."),
    mergedPr("chore: bump deps", "Routine dependency bump."),
  ];
}

// (1) Cache hit: a fresh entry under the lowercased key short-circuits —
// no fetch at all, cached style returned verbatim (same reference).
async function testCacheHit(): Promise<void> {
  const store = freshStore();
  const cachedStyle: RepoStyle = {
    template: "## Template",
    titleStyle: "conventional",
    exampleTitles: ["feat: x"],
    length: "S",
    templateHeavy: false,
    aiDisclosure: false,
  };
  store.data.set(cacheKey("Octo", "Hello-World"), { at: Date.now(), style: cachedStyle });
  installChrome(store);
  const spy: FetchSpy = { urls: [] };
  await withFetch(urlFetch({}, spy), async () => {
    const style = await discoverRepoStyle(BASE_CONFIG, "Octo", "Hello-World");
    expectMatch("cache hit returns the cached style object", style === cachedStyle, true);
    expectMatch("cache hit makes no fetch calls", spy.urls.length, 0);
    expectMatch("cache hit never writes to storage", store.setCalls.length, 0);
  });
}

// (2) TTL expiry: an entry stale by 7h (TTL is 6h) is ignored — GitHub is
// re-queried and the new style overwrites the stale record.
async function testTtlExpiry(): Promise<void> {
  const store = freshStore();
  const staleStyle: RepoStyle = { ...EMPTY_REPO_STYLE, titleStyle: "imperative" };
  store.data.set(cacheKey("octo", "stale-repo"), { at: Date.now() - SEVEN_HOURS_MS, style: staleStyle });
  installChrome(store);
  const spy: FetchSpy = { urls: [] };
  await withFetch(
    urlFetch({ [pullsUrl("octo", "stale-repo")]: () => jsonResponse(conventionalPrs()) }, spy),
    async () => {
      const style = await discoverRepoStyle(BASE_CONFIG, "octo", "stale-repo");
      expectMatch("stale entry triggers a refetch", spy.urls.length > 0, true);
      expectMatch("stale style is not returned", style === staleStyle, false);
      expectMatch("refetched style is non-empty (conventional titles)", style.titleStyle, "conventional");
      const written = store.data.get(cacheKey("octo", "stale-repo")) as { at: number; style: RepoStyle } | undefined;
      expectMatch("fresh result overwrites stale record", written?.style === style, true);
      expectMatch("new record has a fresh timestamp", (written?.at ?? 0) > Date.now() - SEVEN_HOURS_MS, true);
    },
  );
}

// (3) Empty results ARE cached: every fetch 404s (no template, no PR list) →
// an empty style comes back AND is written to storage (short TTL), so a
// discovery loop does not hammer GitHub for a repo that has nothing. A fresh
// empty entry is honored (no fetch); an entry older than the 15-minute empty
// TTL is thrown away, re-fetched, and re-cached.
async function testEmptyCacheTtl(): Promise<void> {
  // discoverRepoStyle returns a fresh inferred object when uncached (not the
  // EMPTY_REPO_STYLE singleton), so compare structurally.
  const emptyJson = JSON.stringify(EMPTY_REPO_STYLE);
  const store = freshStore();
  installChrome(store);
  const spy: FetchSpy = { urls: [] };
  await withFetch(urlFetch({}, spy), async () => {
    const style = await discoverRepoStyle(BASE_CONFIG, "octo", "nothing-here");
    expectMatch("all-404 run returns an empty style", JSON.stringify(style), emptyJson);
    expectMatch("empty result is written to cache once", store.setCalls.length, 1);
    expectMatch("fetch was still attempted for templates and PRs", spy.urls.length > 0, true);
  });

  const freshStore2 = freshStore();
  freshStore2.data.set(cacheKey("octo", "still-empty"), { at: Date.now(), style: EMPTY_REPO_STYLE });
  installChrome(freshStore2);
  const freshSpr: FetchSpy = { urls: [] };
  await withFetch(urlFetch({}, freshSpr), async () => {
    const style = await discoverRepoStyle(BASE_CONFIG, "octo", "still-empty");
    expectMatch("fresh empty entry returned from cache", style === EMPTY_REPO_STYLE, true);
    expectMatch("fresh empty entry makes no fetch calls", freshSpr.urls.length, 0);
  });

  const staleStore = freshStore();
  staleStore.data.set(cacheKey("octo", "retry-me"), { at: Date.now() - TWENTY_MINUTES_MS, style: EMPTY_REPO_STYLE });
  installChrome(staleStore);
  const staleSpy: FetchSpy = { urls: [] };
  await withFetch(urlFetch({}, staleSpy), async () => {
    const style = await discoverRepoStyle(BASE_CONFIG, "octo", "retry-me");
    expectMatch("stale empty entry triggers a refetch", staleSpy.urls.length > 0, true);
    expectMatch("stale empty entry refetches to an empty style", JSON.stringify(style), emptyJson);
    const written = staleStore.data.get(cacheKey("octo", "retry-me")) as { at: number } | undefined;
    const fresh = (written?.at ?? 0) > Date.now() - TWENTY_MINUTES_MS;
    expectMatch("re-fetched empty entry is re-cached fresh", fresh, true);
  });
}

// (4) Non-empty results ARE cached: set is called exactly once with a
// {at, style} record under the lowercased key.
async function testNonEmptyCached(): Promise<void> {
  const store = freshStore();
  installChrome(store);
  const spy: FetchSpy = { urls: [] };
  await withFetch(
    urlFetch({ [pullsUrl("Octo", "Mixed-Case-Repo")]: () => jsonResponse(conventionalPrs()) }, spy),
    async () => {
      const style = await discoverRepoStyle(BASE_CONFIG, "Octo", "Mixed-Case-Repo");
      expectMatch("non-empty style cached exactly once", store.setCalls.length, 1);
      const record = store.data.get(cacheKey("Octo", "Mixed-Case-Repo")) as
        | { at: unknown; style: RepoStyle }
        | undefined;
      expectMatch("cached under the lowercased key", typeof record?.at, "number");
      expectMatch("cached record carries the returned style", record?.style === style, true);
      expectMatch("cached timestamp is fresh", typeof record?.at === "number" && record.at <= Date.now(), true);
    },
  );
}

// (5) Invalid owner/repo: fails fast with EMPTY_REPO_STYLE, zero fetch.
async function testInvalidNames(): Promise<void> {
  const store = freshStore();
  installChrome(store);
  const spy: FetchSpy = { urls: [] };
  await withFetch(urlFetch({}, spy), async () => {
    const badOwner = await discoverRepoStyle(BASE_CONFIG, "bad owner!", "repo");
    const badRepo = await discoverRepoStyle(BASE_CONFIG, "owner", "bad/repo");
    expectMatch("invalid owner returns EMPTY_REPO_STYLE", badOwner === EMPTY_REPO_STYLE, true);
    expectMatch("invalid repo returns EMPTY_REPO_STYLE", badRepo === EMPTY_REPO_STYLE, true);
    expectMatch("invalid names never hit the network", spy.urls.length, 0);
  });
}

// (6) Template priority: a .github/ listing containing
// pull_request_template.md short-circuits discovery — its content is the
// template and docs/ + root are never listed.
async function testTemplatePriority(): Promise<void> {
  const store = freshStore();
  installChrome(store);
  const templateBody = "## Summary\n\n## Testing\n";
  const listing = [
    { name: "ISSUE_TEMPLATE", path: ".github/ISSUE_TEMPLATE", type: "dir" },
    { name: "pull_request_template.md", path: ".github/pull_request_template.md", type: "file" },
    { name: "workflows", path: ".github/workflows", type: "dir" },
  ];
  const routes: Record<string, () => Response> = {
    [dirUrl("octo", "templated", ".github")]: () => jsonResponse(listing),
    [dirUrl("octo", "templated", ".github/pull_request_template.md")]: () => new Response(templateBody),
  };
  const spy: FetchSpy = { urls: [] };
  await withFetch(urlFetch(routes, spy), async () => {
    const style = await discoverRepoStyle(BASE_CONFIG, "octo", "templated");
    expectMatch("template content comes from .github/", style.template, templateBody);
    expectMatch(
      "template fetch hit the file path",
      spy.urls.includes(dirUrl("octo", "templated", ".github/pull_request_template.md")),
      true,
    );
    expectMatch("docs/ not probed after .github hit", spy.urls.includes(dirUrl("octo", "templated", "docs")), false);
    expectMatch("root not probed after .github hit", spy.urls.includes(dirUrl("octo", "templated", "")), false);
    expectMatch("non-empty template style is cached", store.setCalls.length, 1);
  });
}

// (7) Oversized template: a template longer than MAX_TEMPLATE_CHARS
// (12_000) is skipped — the style reports no template and the skip is
// logged, so it is distinguishable from "repo has no template".
async function testOversizedTemplateSkipped(): Promise<void> {
  const store = freshStore();
  installChrome(store);
  const templatePath = ".github/pull_request_template.md";
  const listing = [{ name: "pull_request_template.md", path: templatePath, type: "file" }];
  const routes: Record<string, () => Response> = {
    [dirUrl("octo", "big-template", ".github")]: () => jsonResponse(listing),
    [dirUrl("octo", "big-template", templatePath)]: () => new Response("x".repeat(12_001)),
  };
  const spy: FetchSpy = { urls: [] };
  await withFetch(urlFetch(routes, spy), async () => {
    const { result: style, logs } = await withCapturedLogs(() =>
      discoverRepoStyle(BASE_CONFIG, "octo", "big-template"),
    );
    expectMatch("oversized template still yields no template", style.template, null);
    expectMatch(
      "oversized skip is logged with path, size, and cap",
      logs.some(
        (line) =>
          line.includes(templatePath) && line.includes("12001") && line.includes("over the 12000 char cap, skipping"),
      ),
      true,
    );
    expectMatch("empty (template-skipped) result is cached once", store.setCalls.length, 1);
  });
}

// (8) Multi-template dir: the dir listing arrives unsorted
// (b_bug.md before a_feature.md); discovery must pick a_feature.md
// deterministically instead of whichever entry the API lists first.
async function testMultiTemplateDirDeterministic(): Promise<void> {
  const store = freshStore();
  installChrome(store);
  const listing = [{ name: "PULL_REQUEST_TEMPLATE", path: ".github/PULL_REQUEST_TEMPLATE", type: "dir" }];
  const subListing = [
    { name: "b_bug.md", path: ".github/PULL_REQUEST_TEMPLATE/b_bug.md", type: "file" },
    { name: "a_feature.md", path: ".github/PULL_REQUEST_TEMPLATE/a_feature.md", type: "file" },
  ];
  const routes: Record<string, () => Response> = {
    [dirUrl("octo", "multi-template", ".github")]: () => jsonResponse(listing),
    [dirUrl("octo", "multi-template", ".github/PULL_REQUEST_TEMPLATE")]: () => jsonResponse(subListing),
    [dirUrl("octo", "multi-template", ".github/PULL_REQUEST_TEMPLATE/a_feature.md")]: () =>
      new Response("## Feature\n"),
    [dirUrl("octo", "multi-template", ".github/PULL_REQUEST_TEMPLATE/b_bug.md")]: () => new Response("## Bug\n"),
  };
  const spy: FetchSpy = { urls: [] };
  await withFetch(urlFetch(routes, spy), async () => {
    const style = await discoverRepoStyle(BASE_CONFIG, "octo", "multi-template");
    expectMatch("multi-template dir picks the alphabetically first file", style.template, "## Feature\n");
    expectMatch(
      "the alphabetically later file is never fetched",
      spy.urls.includes(dirUrl("octo", "multi-template", ".github/PULL_REQUEST_TEMPLATE/b_bug.md")),
      false,
    );
  });
}

async function main(): Promise<void> {
  console.log("=== Discovery Cache Tests ===\n");
  await testCacheHit();
  await testTtlExpiry();
  await testEmptyCacheTtl();
  await testNonEmptyCached();
  await testInvalidNames();
  await testTemplatePriority();
  await testOversizedTemplateSkipped();
  await testMultiTemplateDirDeterministic();

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All discovery tests passed");
}

await main();
(globalThis as Record<string, unknown>).chrome = originalChrome;
