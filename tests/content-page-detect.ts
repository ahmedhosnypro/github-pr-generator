// Unit tests for src/content/page-detect.ts — the URL x DOM matrix that
// classifies which GitHub page surface the content script is sitting on
// (PR creation form, opened PR conversation, merge confirmation dialog).
// The src module must evaluate only AFTER dom-stub has installed the
// document/window globals, so it is imported dynamically (biome's import
// organizer would hoist a static src import above the dom-stub import).
import type { StubElement } from "./dom-stub";
import { h, resetPage } from "./dom-stub";
import { expectMatch, getFailures } from "./expect-helpers";

const { isMergeConfirmationPage, isPRCreationPage, isPROpenedPage } = await import("../src/content/page-detect");

const COMPARE_URL = "https://github.com/octo/hello-world/compare/main...feature";
const PR_URL = "https://github.com/octo/hello-world/pull/42";
const OFFSITE_COMPARE_URL = "https://git.example.com/octo/hello-world/compare/main...feature";
const OFFSITE_PR_URL = "https://git.example.com/octo/hello-world/pull/42";

interface DetectCase {
  name: string;
  url: string;
  build: (body: StubElement) => void;
  expected: boolean;
}

function detect(suite: string, isPage: () => boolean, cases: DetectCase[]): void {
  for (const c of cases) {
    const body = resetPage(c.url);
    c.build(body);
    expectMatch(`${suite}: ${c.name}`, isPage(), c.expected);
  }
}

function nothing(): void {}
function creationForm(body: StubElement): void {
  body.appendChild(h("input", { name: "pull_request[title]" }));
  body.appendChild(h("textarea", { id: "pull_request_body" }));
}
function creationTitleOnly(body: StubElement): void {
  body.appendChild(h("input", { name: "pull_request[title]" }));
}
function openedHeader(body: StubElement): void {
  body.appendChild(
    h("div", { "data-component": "PH_Title" }, h("h1", {}, h("span", { class: "markdown-title" }, "t"))),
  );
}
function confirmMergeBox(body: StubElement): void {
  body.appendChild(h("div", { class: "ConfirmMergeDialog ConfirmMerge" }));
}
// The merge dialog's title input matches on the *attribute* ("Merge pull
// request" initial value), so it must be setAttribute'd, not property-set.
function mergeInput(): StubElement {
  const input = h("input", { "data-component": "input", type: "text" });
  input.setAttribute("value", "Merge pull request #42 from octo/feature");
  return input;
}
function mergeInputOnly(body: StubElement): void {
  body.appendChild(mergeInput());
}
function mergePairPrcTextarea(body: StubElement): void {
  body.appendChild(mergeInput());
  body.appendChild(h("textarea", { class: "prc-Textarea-TextArea abc" }));
}
function mergePairPlaceholderTextarea(body: StubElement): void {
  body.appendChild(mergeInput());
  body.appendChild(h("textarea", { placeholder: "Add an optional extended description…" }));
}

console.log("=== Page Detection Tests ===\n");

detect("creation", isPRCreationPage, [
  { name: "compare URL with full form detected", url: COMPARE_URL, build: creationForm, expected: true },
  { name: "compare URL without form rejected", url: COMPARE_URL, build: nothing, expected: false },
  { name: "form missing body textarea rejected", url: COMPARE_URL, build: creationTitleOnly, expected: false },
  { name: "form on /pull/ URL also detected", url: PR_URL, build: creationForm, expected: true },
  { name: "non-github host with form rejected", url: OFFSITE_COMPARE_URL, build: creationForm, expected: false },
]);

detect("opened", isPROpenedPage, [
  { name: "plain PR URL with header detected", url: PR_URL, build: openedHeader, expected: true },
  { name: "files subpage rejected", url: PR_URL + "/files", build: openedHeader, expected: false },
  { name: "commits subpage rejected", url: PR_URL + "/commits", build: openedHeader, expected: false },
  { name: "edit URL rejected", url: PR_URL + "/edit", build: openedHeader, expected: false },
  { name: "compare URL rejected", url: COMPARE_URL, build: openedHeader, expected: false },
  {
    name: "non-numeric pull id rejected",
    url: "https://github.com/octo/hello-world/pull/abc",
    build: openedHeader,
    expected: false,
  },
  { name: "missing PH_Title header rejected", url: PR_URL, build: nothing, expected: false },
  { name: "non-github host rejected", url: OFFSITE_PR_URL, build: openedHeader, expected: false },
]);

detect("merge", isMergeConfirmationPage, [
  { name: "ConfirmMerge container detected", url: PR_URL, build: confirmMergeBox, expected: true },
  { name: "merge input + prc textarea pair detected", url: PR_URL, build: mergePairPrcTextarea, expected: true },
  {
    name: "merge input + placeholder textarea detected",
    url: PR_URL,
    build: mergePairPlaceholderTextarea,
    expected: true,
  },
  { name: "merge input alone insufficient", url: PR_URL, build: mergeInputOnly, expected: false },
  { name: "bare PR page rejected", url: PR_URL, build: nothing, expected: false },
  { name: "non-github host rejected", url: OFFSITE_PR_URL, build: confirmMergeBox, expected: false },
]);

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All page detection tests passed");
process.exit(0);
