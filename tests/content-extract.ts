// Unit tests for the pure-ish content modules: src/content/constants.ts,
// errors.ts, log.ts, extract-commits.ts, and extract-context.ts. The src
// modules must evaluate only after dom-stub installs the document/window/
// chrome globals, so they are imported dynamically at the bottom of the stub
// imports (biome's import organizer would hoist a static src import above
// the stub import).
import type { StubElement } from "./dom-stub";
import { h, resetPage } from "./dom-stub";
import { expectIncludes, expectMatch, getFailures } from "./expect-helpers";

// The dom-stub body is not typed as a DOM Node; this helper keeps the cast
// in one place (at runtime document.body IS the stub body).
function addToPage(el: StubElement): void {
  document.body.appendChild(el as unknown as Node);
}

interface ConsoleCapture {
  log: string[];
  warn: string[];
  error: string[];
  restore: () => void;
}

function captureConsole(): ConsoleCapture {
  const orig = { log: console.log, warn: console.warn, error: console.error };
  const out: string[] = [];
  const warnOut: string[] = [];
  const errOut: string[] = [];
  console.log = (...args: unknown[]) => out.push(args.map(String).join(" "));
  console.warn = (...args: unknown[]) => warnOut.push(args.map(String).join(" "));
  console.error = (...args: unknown[]) => errOut.push(args.map(String).join(" "));
  return {
    log: out,
    warn: warnOut,
    error: errOut,
    restore: () => {
      console.log = orig.log;
      console.warn = orig.warn;
      console.error = orig.error;
    },
  };
}

console.log("=== Content Extract / Log / Constants / Errors Tests ===\n");

// log.ts is imported before the console capture above is used, so the chrome
// stub (no getManifest) pins the fallback prefix. Storage writes are observed
// via a swapped chrome.storage.local for the flush test.
const storageSets: Array<Record<string, unknown>> = [];
let storedLogs: Array<{ at: string; line: string }> = [];
const chromeRef = (
  globalThis as unknown as {
    chrome: { storage: { local: Record<string, unknown> }; runtime: Record<string, unknown> };
  }
).chrome;
chromeRef.storage.local.get = (_keys: unknown, cb: (items: Record<string, unknown>) => void) => {
  cb({ ai_pr_gen_logs: storedLogs });
};
chromeRef.storage.local.set = (items: Record<string, unknown>, cb?: () => void) => {
  storageSets.push(items);
  const next = items.ai_pr_gen_logs;
  if (Array.isArray(next)) storedLogs = next as Array<{ at: string; line: string }>;
  cb?.();
};

const { log, injectLogToggleButton } = await import("../src/content/log");
const { errorMessage, errorStack } = await import("../src/content/errors");
const constants = await import("../src/content/constants");
const { extractCommits, extractLinkedIssues, extractStats } = await import("../src/content/extract-commits");
const { extractBranchContext, extractFileChanges } = await import("../src/content/extract-context");

// --- constants: ids must stay in sync with styles.css / injection code ---
const EXPECTED_IDS: Record<string, string> = {
  BTN_ID: "ai-pr-generate-btn-title",
  BTN_DESC_ID: "ai-pr-generate-btn-desc",
  BTN_OPENED_TITLE_ID: "ai-pr-generate-btn-opened-title",
  BTN_OPENED_TITLE_MENU_ID: "ai-pr-generate-btn-opened-title-menu",
  BTN_OPENED_DESC_ID: "ai-pr-generate-btn-opened-desc",
  BTN_MERGE_TITLE_ID: "ai-pr-generate-btn-merge-title",
  BTN_MERGE_DESC_ID: "ai-pr-generate-btn-merge-desc",
};
for (const [key, expected] of Object.entries(EXPECTED_IDS)) {
  expectMatch(`constants ${key}`, (constants as unknown as Record<string, string>)[key], expected);
}

// --- errors ---
expectMatch("errorMessage(Error)", errorMessage(new Error("boom")), "boom");
expectMatch("errorMessage(string)", errorMessage("plain"), "plain");
expectMatch("errorMessage(number)", errorMessage(7), "7");
expectIncludes("errorStack(Error) contains message", errorStack(new Error("stacked")), "stacked");
expectMatch("errorStack(non-error) empty", errorStack({}), "");

// --- log: prefix, levels, panel ---
const cap = captureConsole();
log("info", "hello", 42, { a: 1 });
cap.restore();
expectIncludes("log prefix fallback has banner", cap.log[cap.log.length - 1] ?? "", "[PR Generator] hello 42");
chromeRef.runtime.getManifest = () => ({ version: "9.9.9" });
const cap2 = captureConsole();
log("warn", "careful");
log("error", "on fire");
cap2.restore();
delete chromeRef.runtime.getManifest;
expectIncludes("log prefix uses manifest version", cap2.warn[0] ?? "", "[PR Generator v9.9.9] careful");
expectIncludes("log error routes to console.error", cap2.error[0] ?? "", "on fire");

resetPage("https://github.com/o/r/pull/1");
const panel = h("div", { id: "ai-pr-generator-log-panel" });
addToPage(panel);
const cap3 = captureConsole();
log("error", "panel line");
cap3.restore();
const panelLines = panel.querySelectorAll(".ai-log-line");
expectMatch("log appends panel line", panelLines.length, 1);
expectMatch("log panel line class carries level", panelLines[0]?.className ?? "", "ai-log-line ai-log-error");

// --- log: batched storage flush (2s debounce, trimmed to 200 entries) ---
// Only warn/error lines persist; entries are stored as { at, line } objects.
storedLogs = Array.from({ length: 199 }, (_, i) => ({ at: new Date().toISOString(), line: "old-" + String(i) }));
const cap4 = captureConsole();
log("warn", "flush me");
cap4.restore();
await new Promise((resolve) => setTimeout(resolve, 2200));
const lastSet = storageSets[storageSets.length - 1];
const flushed = ((lastSet?.ai_pr_gen_logs ?? []) as { line: string }[]).map((entry) => entry.line);
expectMatch("storage flush trims to 200", flushed.length, 200);
expectIncludes("storage flush wrote new line", flushed[flushed.length - 1] ?? "", "flush me");

// --- log: info lines never persist ---
const setsBeforeInfo = storageSets.length;
const capInfo = captureConsole();
log("info", "info-only line");
capInfo.restore();
await new Promise((resolve) => setTimeout(resolve, 2200));
expectMatch("info lines never reach storage", storageSets.length, setsBeforeInfo);

// --- log: secret-shaped tokens redacted + line length capped ---
storedLogs = [];
const setsBeforeSecrets = storageSets.length;
const capSecrets = captureConsole();
log("warn", "token ghp_ABCDEFGHIJKLMNOP1234 and github_pat_11AAAbbb_c0de padding: " + "x".repeat(600));
capSecrets.restore();
await new Promise((resolve) => setTimeout(resolve, 2200));
expectMatch("secret flush wrote to storage", storageSets.length > setsBeforeSecrets, true);
const secretEntry = storedLogs[storedLogs.length - 1];
const secretLine = secretEntry?.line ?? "";
expectMatch("ghp_ token redacted", secretLine.includes("ghp_"), false);
expectMatch("github_pat_ token redacted", secretLine.includes("github_pat_"), false);
expectMatch("redaction marker present", secretLine.includes("[redacted]"), true);
expectMatch("stored line capped at ~500 chars (+time prefix)", secretLine.length <= 530, true);
expectIncludes("stored line truncation marker", secretLine, "truncated");
expectMatch("stored entry has ISO timestamp", Number.isNaN(Date.parse(secretEntry?.at ?? "")), false);

// --- log: legacy/unreadable/stale entries pruned on flush ---
storedLogs = [
  { at: "not-a-date", line: "unreadable timestamp" },
  { at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), line: "stale 25h old" },
  { at: new Date().toISOString(), line: "fresh kept" },
  // Legacy plain strings and garbage shapes are the point of this test.
  ...(["legacy plain string", 42, null, { garbage: true }] as unknown as Array<{ at: string; line: string }>),
];
const setsBeforePrune = storageSets.length;
const capPrune = captureConsole();
log("warn", "prune trigger");
capPrune.restore();
await new Promise((resolve) => setTimeout(resolve, 2200));
expectMatch("prune flush wrote to storage", storageSets.length > setsBeforePrune, true);
const prunedJson = JSON.stringify(storedLogs);
expectMatch("legacy string entry dropped", prunedJson.includes("legacy plain string"), false);
expectMatch("garbage entries dropped", prunedJson.includes("garbage"), false);
expectMatch("unreadable timestamp dropped", prunedJson.includes("unreadable timestamp"), false);
expectMatch("stale >24h entry dropped", prunedJson.includes("stale 25h old"), false);
expectMatch("fresh entry kept", prunedJson.includes("fresh kept"), true);
expectMatch("prune flush kept new line", prunedJson.includes("prune trigger"), true);

// --- injectLogToggleButton ---
resetPage("https://github.com/o/r/compare/a...b");
injectLogToggleButton();
injectLogToggleButton();
expectMatch("toggle button injected once", document.querySelectorAll("#ai-pr-log-toggle-btn").length, 1);
expectMatch("toggle creates log panel", document.getElementById("ai-pr-generator-log-panel") !== null, true);

// --- extractCommits: embedded JSON path ---
function withEmbedded(jsonText: string): void {
  const partial = h("react-partial", { "partial-name": "copilot-generate-pull-title" });
  partial.appendChild(h("script", { type: "application/json", "data-target": "react-partial.embeddedData" }, jsonText));
  addToPage(partial);
}
function withDomCommit(title: string, body = ""): void {
  const item = h("div", { class: "js-commits-list-item" });
  item.appendChild(h("a", { class: "markdown-title" }, title));
  if (body) item.appendChild(h("pre", { class: "text-small" }, body));
  addToPage(item);
}

resetPage("https://github.com/o/r/compare/a...b");
withEmbedded(JSON.stringify({ props: { commits: [{ message: "feat: one" }, { message: "fix: two" }] } }));
withDomCommit("dom fallback should be ignored");
{
  const commits = extractCommits();
  expectMatch("embedded commits win over DOM", commits.length, 2);
  expectMatch("embedded commit message", commits[0]?.message ?? "", "feat: one");
}

resetPage("https://github.com/o/r/compare/a...b");
withEmbedded(JSON.stringify({ props: { commits: [{ message: "good" }, { noMessage: 1 }, { message: 42 }] } }));
{
  const commits = extractCommits();
  expectMatch("malformed embedded entry skipped", commits.length, 1);
  expectMatch("kept the valid entry", commits[0]?.message ?? "", "good");
}

resetPage("https://github.com/o/r/compare/a...b");
withEmbedded("{not valid json");
withDomCommit("dom title", "dom body");
{
  const commits = extractCommits();
  expectMatch("bad embedded JSON falls back to DOM", commits.length, 1);
  expectMatch("DOM commit joins title and body", commits[0]?.message ?? "", "dom title\n\ndom body");
}

resetPage("https://github.com/o/r/compare/a...b");
withDomCommit("first");
withDomCommit(""); // no title -> skipped
withDomCommit("second");
{
  const commits = extractCommits();
  expectMatch("DOM commits extracted", commits.length, 2);
  expectMatch("DOM commit message", commits[1]?.message ?? "", "second");
}

// --- extractStats ---
resetPage("https://github.com/o/r/compare/a...b");
addToPage(h("div", { class: "toc-diff-stats" }, "5 changed files, 1234 additions, 56 deletions"));
{
  const stats = extractStats();
  expectMatch("stats files", stats?.files ?? -1, 5);
  expectMatch("stats additions", stats?.additions ?? -1, 1234);
  expectMatch("stats deletions", stats?.deletions ?? -1, 56);
}
resetPage("https://github.com/o/r/compare/a...b");
expectMatch("stats missing element -> null", extractStats() === null, true);
resetPage("https://github.com/o/r/compare/a...b");
addToPage(h("div", { class: "toc-diff-stats" }, "no numbers here"));
{
  const stats = extractStats();
  expectMatch("stats without matches -> zeros", stats !== null && stats.files === 0 && stats.additions === 0, true);
}

// --- extractLinkedIssues (wrapper around src/linked-issues.ts) ---
{
  const issues = extractLinkedIssues([
    { message: "feat: fixes #12" },
    { message: "chore: closes #34, refs #12" },
    { message: "plain mention #456" },
    { message: "no issues here" },
  ]);
  expectMatch("linked issues deduped in order", JSON.stringify(issues), JSON.stringify(["#12", "#34", "#456"]));
}

// --- extractFileChanges ---
const VALID_ANCHOR = "#diff-" + "a".repeat(40);
function withToc(files: Array<{ path: string; anchor: string; icon?: string; adds?: string; dels?: string }>): void {
  const toc = h("div", { id: "toc" });
  const ol = h("ol", { class: "content" });
  toc.appendChild(ol);
  for (const f of files) {
    const li = h("li", {});
    li.appendChild(h("a", { href: f.anchor }, f.path));
    if (f.icon) li.appendChild(h("span", { class: "octicon " + f.icon }));
    if (f.adds) li.appendChild(h("span", { class: "color-fg-success" }, f.adds));
    if (f.dels) li.appendChild(h("span", { class: "color-fg-danger" }, f.dels));
    ol.appendChild(li);
  }
  addToPage(toc);
}

resetPage("https://github.com/o/r/compare/a...b");
withToc([
  { path: "src/a.ts", anchor: VALID_ANCHOR, icon: "octicon-diff-added", adds: "+10" },
  { path: "src/b.ts", anchor: VALID_ANCHOR + "b", icon: "octicon-diff-removed", dels: "−4" },
  { path: "src/c.ts", anchor: "#diff-tooshort", dels: "-2" },
  { path: "src/d.ts", anchor: VALID_ANCHOR + "c" },
]);
{
  const files = extractFileChanges();
  expectMatch("file changes extracted", files.length, 4);
  expectMatch("added type", files[0]?.type ?? "", "added");
  expectMatch("added count", files[0]?.additions ?? -1, 10);
  expectMatch("removed type", files[1]?.type ?? "", "removed");
  expectMatch("unicode-minus deletions parsed", files[1]?.deletions ?? -1, 4);
  expectMatch("ascii-minus deletions parsed", files[2]?.deletions ?? -1, 2);
  expectMatch("short diff anchor dropped", files[2]?.diffAnchor ?? "left", "");
  expectMatch("valid anchor kept", files[0]?.diffAnchor ?? "", VALID_ANCHOR);
  expectMatch("no icon -> modified", files[3]?.type ?? "", "modified");
}
resetPage("https://github.com/o/r/compare/a...b");
addToPage(
  h("div", { id: "toc" }, h("ol", { class: "content" }, h("li", {}, h("a", { href: "#not-a-diff" }, "skip.ts")))),
);
expectMatch("li without #diff- anchor link skipped", extractFileChanges().length, 0);

// --- extractBranchContext ---
resetPage("https://github.com/octo/repo/compare/main...feature-x");
addToPage(h("select", { name: "pull_request[base]", value: "develop" }));
addToPage(h("input", { name: "pull_request[head]", value: "fork:feature-x" }));
{
  const ctx = extractBranchContext();
  expectMatch("branch inputs win over URL: base", ctx.baseBranch, "develop");
  expectMatch("branch inputs win over URL: head (fork kept)", ctx.headBranch, "fork:feature-x");
  expectMatch("owner from pathname", ctx.owner, "octo");
  expectMatch("repo from pathname", ctx.repo, "repo");
}

resetPage("https://github.com/octo/repo/compare/main...feature-x");
{
  const ctx = extractBranchContext();
  expectMatch("compare URL base", ctx.baseBranch, "main");
  expectMatch("compare URL head", ctx.headBranch, "feature-x");
}

resetPage("https://github.com/octo/repo/compare/feature-only");
expectMatch("compare URL single ref is head", extractBranchContext().headBranch, "feature-only");

resetPage("https://github.com/octo/repo/pull/new/feature-x");
addToPage(h("span", { "data-component": "BranchName" }, "main"));
addToPage(h("span", { "data-component": "BranchName" }, "feature-x"));
{
  const ctx = extractBranchContext();
  expectMatch("BranchName text base", ctx.baseBranch, "main");
  expectMatch("BranchName text head", ctx.headBranch, "feature-x");
}

resetPage("https://github.com/octo/repo/pull/new/feature-x");
addToPage(h("span", { "data-component": "BranchName" }, "feature-x"));
expectMatch("single BranchName fills head only", extractBranchContext().headBranch, "feature-x");

resetPage("https://github.com/octo/repo/some/other/page");
addToPage(h("span", { class: "branch-name" }, "release-1"));
addToPage(h("span", { class: "ref-name" }, "hotfix-2"));
expectMatch("dead legacy selectors ignored", extractBranchContext().headBranch, "");

// Compare-URL specs are percent-encoded in the address; they must be decoded
// before the background encodes them again for the compare API.
resetPage("https://github.com/octo/repo/compare/main...feature%2Fcaf%C3%A9");
expectMatch("encoded compare head decoded", extractBranchContext().headBranch, "feature/café");

// Malformed percent-escapes pass through unchanged instead of throwing.
resetPage("https://github.com/octo/repo/compare/main...feature%zz");
expectMatch("malformed percent-escape kept raw", extractBranchContext().headBranch, "feature%zz");

// Malformed percent-escapes pass through unchanged instead of throwing.
resetPage("https://github.com/octo/repo/compare/main...feature%zz");
expectMatch("malformed percent-escape kept raw", extractBranchContext().headBranch, "feature%zz");

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All content extract tests passed");
process.exit(0);
