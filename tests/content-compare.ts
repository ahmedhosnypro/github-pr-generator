// Unit tests for the compare-page content scripts: dom.ts widget helpers and
// compare-buttons.ts injection (including fallback anchors). Generate-flow and
// log/storage tests live in content-compare-generate.ts and
// content-compare-log.ts. The src/content/* modules must evaluate only AFTER
// dom-stub has installed the document/window/chrome globals, so they are
// imported dynamically (biome's import organizer would hoist static src
// imports ahead of the stub).

import { buildComparePage, COMPARE_URL, toastState } from "./content-compare-shared";
import type { StubElement } from "./dom-stub";
import { h, resetPage } from "./dom-stub";
import { expectIncludes, expectMatch, getFailures } from "./expect-helpers";

const { injectButtons } = await import("../src/content/compare-buttons");
const { BTN_DESC_ID, BTN_ID } = await import("../src/content/constants");
const { clearButtonLoading, createButton, createStreamingFill, getButton, setButtonLoading, setReactValue, showToast } =
  await import("../src/content/dom");

function testDomHelpers(): void {
  console.log("--- dom.ts helpers ---");
  const body = resetPage(COMPARE_URL);

  expectMatch("getButton returns null when missing", getButton(BTN_ID), null);

  const notAButton = h("div", { id: BTN_ID });
  body.appendChild(notAButton);
  expectMatch("getButton ignores non-button element with same id", getButton(BTN_ID), null);
  notAButton.remove();

  let clicks = 0;
  const btn = createButton(BTN_ID, "AI Generate", () => {
    clicks++;
  });
  body.appendChild(btn as unknown as StubElement);
  expectMatch("createButton sets id", getButton(BTN_ID)?.id, BTN_ID);
  expectMatch("createButton sets type=button", getButton(BTN_ID)?.type, "button");
  expectMatch("createButton sets base class", getButton(BTN_ID)?.classList.contains("ai-generate-btn"), true);
  expectIncludes("createButton renders label", btn.innerHTML, "AI Generate");
  btn.click();
  expectMatch("createButton click fires handler", clicks, 1);

  btn.innerHTML = "<span>orig</span>";
  setButtonLoading(btn);
  expectMatch("setButtonLoading disables", btn.disabled, true);
  expectMatch("setButtonLoading adds loading class", btn.classList.contains("ai-generate-btn--loading"), true);
  expectIncludes("setButtonLoading swaps content", btn.innerHTML, "Generating...");
  expectMatch("setButtonLoading stores original html", btn.dataset.originalHtml, "<span>orig</span>");
  clearButtonLoading(btn);
  expectMatch("clearButtonLoading re-enables", btn.disabled, false);
  expectMatch("clearButtonLoading drops loading class", btn.classList.contains("ai-generate-btn--loading"), false);
  expectMatch("clearButtonLoading restores html", btn.innerHTML, "<span>orig</span>");

  const input = h("input", {});
  body.appendChild(input);
  const events: string[] = [];
  input.addEventListener("input", () => {
    events.push("input");
  });
  input.addEventListener("change", () => {
    events.push("change");
  });
  setReactValue(input as unknown as HTMLInputElement, "new title");
  expectMatch("setReactValue sets input value", input.value, "new title");
  expectMatch("setReactValue fires input+change", events.join(","), "input,change");

  const area = h("textarea", {});
  body.appendChild(area);
  setReactValue(area as unknown as HTMLTextAreaElement, "new body");
  expectMatch("setReactValue sets textarea value", area.value, "new body");

  // createStreamingFill: the value tracks every update, but input+change
  // events are batched — finish() flushes exactly one final pair.
  const streamInput = h("input", {});
  body.appendChild(streamInput);
  const streamEvents: string[] = [];
  streamInput.addEventListener("input", () => {
    streamEvents.push("input");
  });
  streamInput.addEventListener("change", () => {
    streamEvents.push("change");
  });
  const fill = createStreamingFill(streamInput as unknown as HTMLInputElement);
  fill.update("t");
  fill.update("ti");
  fill.update("tit");
  expectMatch("streaming fill keeps value current", streamInput.value, "tit");
  expectMatch("streaming fill batches events within window", streamEvents.length, 0);
  fill.finish();
  expectMatch("streaming fill finish flushes input+change", streamEvents.join(","), "input,change");
  fill.finish();
  expectMatch("streaming fill finish is idempotent once flushed", streamEvents.length, 2);
}

function testToast(): void {
  console.log("--- dom.ts toast ---");
  resetPage(COMPARE_URL);
  showToast("first toast");
  showToast("second toast", true);
  const toasts = document.querySelectorAll("#ai-pr-generator-toast");
  expectMatch("showToast replaces previous toast", toasts.length, 1);
  const state = toastState();
  expectMatch("toast text", state?.text, "second toast");
  expectMatch("toast error class", state?.isError, true);
}

function testInjectButtons(): void {
  console.log("--- compare-buttons.ts injection ---");
  const page = buildComparePage();
  injectButtons();

  const titleBtn = getButton(BTN_ID);
  const descBtn = getButton(BTN_DESC_ID);
  expectMatch("title button injected", titleBtn !== null, true);
  expectMatch("title button placed in TextInput.Action", titleBtn?.parentNode, page.actionArea);
  expectMatch("title button modifier class", titleBtn?.classList.contains("ai-generate-btn--title"), true);
  expectMatch("desc button injected", descBtn !== null, true);
  expectMatch("desc button modifier class", descBtn?.classList.contains("ai-generate-btn--desc"), true);
  expectMatch("desc button prepended before first action item", page.actionBar.children[0], descBtn);
  expectMatch("log toggle injected", document.getElementById("ai-pr-log-toggle-btn") !== null, true);

  injectButtons();
  const titleButtons = page.actionArea.children.filter((c) => c.id === BTN_ID);
  expectMatch("injectButtons is idempotent", titleButtons.length, 1);

  // Partial DOM: title input exists but the toolbar is missing.
  const body = resetPage(COMPARE_URL);
  const loneTitle = h("input", { name: "pull_request[title]", type: "text" });
  const loneAction = h("div", { "data-component": "TextInput.Action" });
  body.appendChild(h("div", { "data-component": "TextInput" }, loneTitle, loneAction));
  injectButtons();
  expectMatch("missing toolbar: title button still injected", getButton(BTN_ID) !== null, true);
  expectMatch("missing toolbar: no desc button", getButton(BTN_DESC_ID), null);

  // No PR form at all: nothing crashes, nothing injected.
  resetPage(COMPARE_URL);
  injectButtons();
  expectMatch("empty page: no title button", getButton(BTN_ID), null);
  expectMatch("empty page: no desc button", getButton(BTN_DESC_ID), null);
}

function testInjectButtonsFallbackAnchors(): void {
  console.log("--- compare-buttons.ts fallback anchors ---");

  // Bare fields without Primer chrome (new React editor): input with no
  // TextInput wrapper, body textarea with no markdown toolbar.
  const body = resetPage(COMPARE_URL);
  const bareTitle = h("input", { name: "pull_request[title]", type: "text" });
  const bareBody = h("textarea", { id: "pull_request_body" });
  body.appendChild(h("div", {}, bareTitle));
  body.appendChild(h("div", {}, bareBody));
  injectButtons();
  const bareTitleBtn = getButton(BTN_ID);
  const bareDescBtn = getButton(BTN_DESC_ID);
  expectMatch("bare fields: title button injected", bareTitleBtn !== null, true);
  expectMatch("bare fields: title button placed after input", bareTitle.parentNode?.children[1], bareTitleBtn);
  expectMatch("bare fields: desc button injected", bareDescBtn !== null, true);
  expectMatch("bare fields: desc button placed after textarea", bareBody.parentNode?.children[1], bareDescBtn);

  // React editor title input keyed by id rather than name.
  const body2 = resetPage(COMPARE_URL);
  body2.appendChild(h("div", {}, h("input", { id: "pull_request_title", type: "text" })));
  injectButtons();
  expectMatch("id anchor: title button injected", getButton(BTN_ID) !== null, true);

  // Toolbar present but without an ActionBar: button joins the toolbar itself.
  const body3 = resetPage(COMPARE_URL);
  const plainToolbar = h("markdown-toolbar", { for: "pull_request_body" }, h("button", { class: "md-btn" }, "B"));
  body3.appendChild(
    h(
      "div",
      {},
      h("div", { "data-component": "TextInput" }, h("input", { name: "pull_request[title]", type: "text" })),
      plainToolbar,
    ),
  );
  injectButtons();
  const toolbarDescBtn = getButton(BTN_DESC_ID);
  expectMatch("toolbar without ActionBar: desc button injected", toolbarDescBtn !== null, true);
  expectMatch("toolbar without ActionBar: button prepended to toolbar", plainToolbar.children[0], toolbarDescBtn);
}

console.log("=== Content Script (compare page: dom + injection) Tests ===\n");
testDomHelpers();
testToast();
testInjectButtons();
testInjectButtonsFallbackAnchors();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All content compare tests passed");
process.exit(0);
