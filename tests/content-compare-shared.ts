// Shared DOM fixtures for the compare-page content-script tests
// (content-compare.ts, content-compare-generate.ts, content-compare-log.ts).
// Importing this module installs the dom-stub globals via its own import.
import type { StubElement } from "./dom-stub";
import { h, resetPage } from "./dom-stub";

export const COMPARE_URL = "https://github.com/o/r/compare/main...feature";
export const TOAST_ID = "ai-pr-generator-toast";

export interface ComparePage {
  actionArea: StubElement;
  actionBar: StubElement;
  body: StubElement;
  titleInput: StubElement;
  bodyTextarea: StubElement;
}

// Mirrors GitHub's compare/PR-form DOM: title input inside a Primer TextInput
// wrapper with an Action area, and a markdown toolbar with an ActionBar.
export function buildComparePage(): ComparePage {
  const body = resetPage(COMPARE_URL);
  const titleInput = h("input", { name: "pull_request[title]", type: "text" });
  const actionArea = h("div", { "data-component": "TextInput.Action" });
  const titleWrapper = h("div", { "data-component": "TextInput" }, titleInput, actionArea);
  const actionBar = h("div", { class: "ActionBar" }, h("div", { "data-targets": "action-bar.items" }));
  const toolbar = h("markdown-toolbar", { for: "pull_request_body" }, actionBar);
  const bodyTextarea = h("textarea", { id: "pull_request_body" });
  body.appendChild(titleWrapper);
  body.appendChild(toolbar);
  body.appendChild(bodyTextarea);
  return { actionArea, actionBar, body, titleInput, bodyTextarea };
}

// Adds one commit row and one file toc row so the extractors find data.
export function addCompareData(page: ComparePage): void {
  const commit = h(
    "div",
    { class: "js-commits-list-item" },
    h("a", { class: "markdown-title" }, "feat: add streaming"),
    h("pre", { class: "text-small" }, "refs #123"),
  );
  const tocItem = h(
    "li",
    {},
    h("a", { href: "#diff-" + "a".repeat(40) }, "src/foo.ts"),
    h("span", { class: "octicon-diff-added" }),
    h("span", { class: "color-fg-success" }, "+12"),
    h("span", { class: "color-fg-danger" }, "-3"),
  );
  const toc = h("div", { id: "toc" }, h("ol", { class: "content" }, tocItem));
  page.body.appendChild(commit);
  page.body.appendChild(toc);
}

export function toastState(): { text: string; isError: boolean } | null {
  const toast = document.getElementById(TOAST_ID);
  if (toast === null) return null;
  const stub = toast as unknown as StubElement;
  return { text: stub.textContent, isError: stub.classNameList.includes("ai-pr-generator-toast--error") };
}
