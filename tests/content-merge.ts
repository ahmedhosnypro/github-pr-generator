// Unit tests for the merge-dialog content scripts: merge-buttons.ts injection
// (TextInput-wrapper + fallback placement) and merge-generate.ts's title/
// description streaming flows (payload shape, field filling, toast error
// paths). The src/content/* modules must evaluate only AFTER dom-stub has
// installed the document/window/chrome globals, so they are imported
// dynamically (biome's import organizer would hoist static src imports).

import type { StubElement } from "./dom-stub";
import { h, resetPage, setLocation, setStreamHandler, streamRequests, tick } from "./dom-stub";
import { expectMatch, getFailures } from "./expect-helpers";

const { BTN_MERGE_DESC_ID, BTN_MERGE_TITLE_ID } = await import("../src/content/constants");
const { getButton } = await import("../src/content/dom");
const { injectMergeButtons } = await import("../src/content/merge-buttons");
const { findMergeDescTextarea, probeMergeDialogFields } = await import("../src/content/merge-fields");
const { handleGenerateMergeDescription, handleGenerateMergeTitle } = await import("../src/content/merge-generate");

const PR_URL = "https://github.com/o/r/pull/42";
const TOAST_ID = "ai-pr-generator-toast";

interface MergePage {
  body: StubElement;
  titleInput: StubElement;
  titleWrapper: StubElement;
  descTextarea: StubElement;
  descWrapper: StubElement;
}

// Mirrors GitHub's merge dialog: a ConfirmMerge container whose parent holds
// the title input and description textarea, each in a TextInput wrapper.
function buildMergeDialogPage(): MergePage {
  const body = resetPage(PR_URL);
  const titleInput = h("input", {
    type: "text",
    "data-component": "input",
    value: "Merge pull request #42 from o/feature",
  });
  const titleWrapper = h("div", { "data-component": "TextInput" }, titleInput);
  const descTextarea = h("textarea", { placeholder: "Add an optional extended description…" });
  const descWrapper = h("div", { "data-component": "TextInput" }, descTextarea);
  const confirm = h("div", { class: "ConfirmMergeBox ConfirmMerge" });
  body.appendChild(h("div", {}, confirm, titleWrapper, descWrapper));
  return { body, titleInput, titleWrapper, descTextarea, descWrapper };
}

function toastState(): { text: string; isError: boolean } | null {
  const toast = document.getElementById(TOAST_ID);
  if (toast === null) return null;
  const stub = toast as unknown as StubElement;
  return { text: stub.textContent, isError: stub.classNameList.includes("ai-pr-generator-toast--error") };
}

interface CapturedMergeRequest {
  type?: string;
  data?: {
    owner?: string;
    repo?: string;
    prNumber?: string;
    existingMergeTitle?: string;
  };
}

function lastMergeRequest(): CapturedMergeRequest {
  const posted = streamRequests();
  const last = posted[posted.length - 1];
  if (typeof last !== "object" || last === null) return {};
  return last;
}

function testInjectMergeButtons(): void {
  console.log("--- merge-buttons.ts injection ---");
  const page = buildMergeDialogPage();
  injectMergeButtons();

  const titleBtn = getButton(BTN_MERGE_TITLE_ID);
  const descBtn = getButton(BTN_MERGE_DESC_ID);
  expectMatch("merge title button injected", titleBtn !== null, true);
  expectMatch("merge title button inside TextInput wrapper", titleBtn?.parentNode, page.titleWrapper);
  expectMatch("title wrapper gets positioning context", page.titleWrapper.style.position, "relative");
  expectMatch("merge title button modifier class", titleBtn?.classList.contains("ai-generate-btn--merge-title"), true);
  expectMatch("merge title button tooltip", titleBtn?.title, "AI Generate Merge Title");
  expectMatch("merge desc button injected", descBtn !== null, true);
  expectMatch("merge desc button inside TextInput wrapper", descBtn?.parentNode, page.descWrapper);
  expectMatch("desc wrapper gets positioning context", page.descWrapper.style.position, "relative");
  expectMatch("merge desc button modifier class", descBtn?.classList.contains("ai-generate-btn--merge-desc"), true);
  expectMatch("log toggle injected", document.getElementById("ai-pr-log-toggle-btn") !== null, true);

  injectMergeButtons();
  const titleButtons = page.titleWrapper.children.filter((c) => c.id === BTN_MERGE_TITLE_ID);
  expectMatch("injectMergeButtons is idempotent", titleButtons.length, 1);

  // Fallback placement: legacy fields without a TextInput wrapper get the
  // button inserted right after the field.
  const body = resetPage(PR_URL);
  const legacyTitle = h("input", { id: "merge_title_field" });
  const legacyDesc = h("textarea", { id: "merge_message_field" });
  const legacyBox = h("div", {}, legacyTitle, legacyDesc);
  body.appendChild(legacyBox);
  injectMergeButtons();

  const legacyTitleBtn = getButton(BTN_MERGE_TITLE_ID);
  expectMatch("legacy: title button injected", legacyTitleBtn !== null, true);
  expectMatch("legacy: button sibling of input", legacyTitleBtn?.parentNode, legacyBox);
  expectMatch("legacy: button placed after input", legacyBox.children[1], legacyTitleBtn);
  const legacyDescBtn = getButton(BTN_MERGE_DESC_ID);
  expectMatch("legacy: desc button injected", legacyDescBtn !== null, true);
  expectMatch("legacy: desc button placed after textarea", legacyBox.children[3], legacyDescBtn);
  expectMatch(
    "legacy: title button modifier class",
    legacyTitleBtn?.classList.contains("ai-generate-btn--merge-title"),
    true,
  );

  // Empty page: nothing injected, no crash.
  resetPage(PR_URL);
  injectMergeButtons();
  expectMatch("empty page: no merge title button", getButton(BTN_MERGE_TITLE_ID), null);
  expectMatch("empty page: no merge desc button", getButton(BTN_MERGE_DESC_ID), null);
}

function testInjectMergeButtonsReactDialog(): void {
  console.log("--- merge-buttons.ts stable-anchor detection (React dialog) ---");
  // New markup: no ConfirmMerge class, no data-component="input" attribute on
  // the title field — detection must ride on dialog/aria/value anchors alone.
  const body = resetPage(PR_URL);
  const titleInput = h("input", {
    type: "text",
    value: "Merge pull request #42 from o/feature",
    "aria-label": "Commit title for merge",
  });
  const titleWrapper = h("div", { "data-component": "TextInput" }, titleInput);
  const descTextarea = h("textarea", {
    "aria-label": "Extended description",
    placeholder: "Add an optional extended description…",
  });
  const descWrapper = h("div", { "data-component": "TextInput" }, descTextarea);
  body.appendChild(h("dialog", { open: "", role: "dialog" }, titleWrapper, descWrapper));

  injectMergeButtons();

  const titleBtn = getButton(BTN_MERGE_TITLE_ID);
  const descBtn = getButton(BTN_MERGE_DESC_ID);
  expectMatch("react dialog: title button injected", titleBtn !== null, true);
  expectMatch("react dialog: title button inside TextInput wrapper", titleBtn?.parentNode, titleWrapper);
  expectMatch("react dialog: desc button injected", descBtn !== null, true);
  expectMatch("react dialog: desc button inside TextInput wrapper", descBtn?.parentNode, descWrapper);

  // Role-only scope (no <dialog> element) with fields carrying stable ids.
  const body2 = resetPage(PR_URL);
  const legacyTitleOnly = h("input", { id: "merge_title_field", type: "text" });
  const legacyDescOnly = h("textarea", { id: "merge_message_field" });
  body2.appendChild(h("div", { role: "dialog" }, legacyTitleOnly, legacyDescOnly));

  injectMergeButtons();

  const roleTitleBtn = getButton(BTN_MERGE_TITLE_ID);
  const roleDescBtn = getButton(BTN_MERGE_DESC_ID);
  expectMatch("role dialog: title button injected", roleTitleBtn !== null, true);
  expectMatch("role dialog: title button after input", legacyTitleOnly.parentNode?.children[1], roleTitleBtn);
  expectMatch("role dialog: desc button injected", roleDescBtn !== null, true);
  expectMatch("role dialog: desc button after textarea", legacyDescOnly.parentNode?.children[3], roleDescBtn);
}

async function testMergeTitleSuccess(): Promise<void> {
  console.log("--- merge-generate.ts title success ---");
  const page = buildMergeDialogPage();
  injectMergeButtons();

  setStreamHandler((_request, emit) => {
    emit({ kind: "chunk", text: "feat: partial merge title" });
    emit({ kind: "done", result: { title: "feat: final merge title (#42)" } });
  });

  // Drive the flow through the injected button's click wiring.
  getButton(BTN_MERGE_TITLE_ID)?.click();
  await tick();

  expectMatch("title flow posted one request", streamRequests().length, 1);
  const req = lastMergeRequest();
  expectMatch("request type is generateMergeTitle", req.type, "generateMergeTitle");
  expectMatch("owner from URL", req.data?.owner, "o");
  expectMatch("repo from URL", req.data?.repo, "r");
  expectMatch("pr number from URL", req.data?.prNumber, "42");
  expectMatch("existing merge title sent", req.data?.existingMergeTitle, "Merge pull request #42 from o/feature");
  expectMatch("merge title filled", page.titleInput.value, "feat: final merge title (#42)");
  expectMatch("success toast", toastState()?.text, "Merge commit title generated!");
  expectMatch("success toast not error-styled", toastState()?.isError, false);
  expectMatch("title button re-enabled", getButton(BTN_MERGE_TITLE_ID)?.disabled, false);
  expectMatch("desc button re-enabled", getButton(BTN_MERGE_DESC_ID)?.disabled, false);
}

async function testMergeTitleEmptyResult(): Promise<void> {
  console.log("--- merge-generate.ts empty title result ---");
  const page = buildMergeDialogPage();
  injectMergeButtons();

  setStreamHandler((_request, emit) => {
    emit({ kind: "done", result: { title: "" } });
  });
  await handleGenerateMergeTitle();
  expectMatch("empty title result: input unchanged", page.titleInput.value, "Merge pull request #42 from o/feature");
  expectMatch("empty title result: toast", toastState()?.text, "Merge title was empty — nothing applied.");
  expectMatch("empty title result: error styled", toastState()?.isError, true);
  expectMatch("empty title result: button re-enabled", getButton(BTN_MERGE_TITLE_ID)?.disabled, false);
}

async function testMergeDescriptionSuccess(): Promise<void> {
  console.log("--- merge-generate.ts description success ---");
  const page = buildMergeDialogPage();
  injectMergeButtons();

  setStreamHandler((_request, emit) => {
    emit({ kind: "chunk", text: "partial desc" });
    emit({ kind: "done", result: { description: "Generated merge description" } });
  });
  await handleGenerateMergeDescription();

  const req = lastMergeRequest();
  expectMatch("request type is generateMergeDescription", req.type, "generateMergeDescription");
  expectMatch("desc request pr number", req.data?.prNumber, "42");
  expectMatch("merge description filled", page.descTextarea.value, "Generated merge description");
  expectMatch("desc success toast", toastState()?.text, "Merge commit description generated!");
  expectMatch("desc button re-enabled", getButton(BTN_MERGE_DESC_ID)?.disabled, false);
  expectMatch("desc flow re-enables title button", getButton(BTN_MERGE_TITLE_ID)?.disabled, false);
}

async function testMergeErrorPaths(): Promise<void> {
  console.log("--- merge-generate.ts error paths ---");

  // Unparseable URL context: ctx validation fails before any stream starts.
  buildMergeDialogPage();
  injectMergeButtons();
  setLocation("https://github.com/");
  setStreamHandler(() => {
    throw new Error("stream must not start without PR context");
  });
  await handleGenerateMergeTitle();
  expectMatch("no ctx: no stream request", streamRequests().length, 0);
  expectMatch("no ctx: toast", toastState()?.text, "Could not determine PR owner/repo/number from URL.");
  expectMatch("no ctx: error styled", toastState()?.isError, true);
  expectMatch("no ctx: title button re-enabled", getButton(BTN_MERGE_TITLE_ID)?.disabled, false);
  expectMatch("no ctx: desc button re-enabled", getButton(BTN_MERGE_DESC_ID)?.disabled, false);

  // Stream-level error surfaces as an error toast and clears loading.
  buildMergeDialogPage();
  injectMergeButtons();
  setStreamHandler((_request, emit) => {
    emit({ kind: "error", error: "upstream 500" });
  });
  await handleGenerateMergeDescription();
  expectMatch("stream error toast text", toastState()?.text, "Error: upstream 500");
  expectMatch("stream error toast styled", toastState()?.isError, true);
  expectMatch("stream error: desc button re-enabled", getButton(BTN_MERGE_DESC_ID)?.disabled, false);
  expectMatch("stream error: title button re-enabled", getButton(BTN_MERGE_TITLE_ID)?.disabled, false);

  // No buttons at all: handlers are no-ops.
  resetPage(PR_URL);
  await handleGenerateMergeTitle();
  await handleGenerateMergeDescription();
  expectMatch("no buttons: no stream request", streamRequests().length, 0);
  expectMatch("no buttons: no toast", toastState(), null);
}

async function testMergePartialRollback(): Promise<void> {
  console.log("--- merge-generate.ts partial-stream rollback ---");

  // Mid-stream error after chunks: the pre-stream value returns, toast names it.
  const page = buildMergeDialogPage();
  injectMergeButtons();
  setStreamHandler((_request, emit) => {
    emit({ kind: "chunk", text: "feat: truncated partial" });
    emit({ kind: "error", error: "upstream 500" });
  });
  await handleGenerateMergeTitle();
  expectMatch("mid-stream error: prior title restored", page.titleInput.value, "Merge pull request #42 from o/feature");
  expectMatch(
    "mid-stream error toast names rollback",
    toastState()?.text,
    "Error: upstream 500 (the partial streamed text was rolled back)",
  );
  expectMatch("mid-stream error toast styled", toastState()?.isError, true);
  expectMatch("mid-stream error: title button re-enabled", getButton(BTN_MERGE_TITLE_ID)?.disabled, false);

  // Empty final parse after a stream preview: roll back instead of leaving
  // the partial committed under a misleading success toast.
  const page2 = buildMergeDialogPage();
  injectMergeButtons();
  page2.descTextarea.value = "existing merge notes";
  setStreamHandler((_request, emit) => {
    emit({ kind: "chunk", text: "half-written description" });
    emit({ kind: "done", result: { description: "" } });
  });
  await handleGenerateMergeDescription();
  expectMatch("empty final: streamed partial rolled back", page2.descTextarea.value, "existing merge notes");
  expectMatch(
    "empty final: toast names the restore",
    toastState()?.text,
    "Merge description was empty — restored the previous description.",
  );
  expectMatch("empty final: toast error-styled", toastState()?.isError, true);
  expectMatch("empty final: desc button re-enabled", getButton(BTN_MERGE_DESC_ID)?.disabled, false);
}

function testMergeFieldProbe(): void {
  console.log("--- merge-fields.ts quiet probe + finder priority ---");
  const page = buildMergeDialogPage();
  const probe = probeMergeDialogFields();
  expectMatch("probe finds title via live value", probe.hasTitle, true);
  expectMatch("probe ignores locale-fragile placeholder copy", probe.hasDescription, false);
  page.descTextarea.setAttribute("class", "prc-Textarea-TextArea hash");
  expectMatch("probe finds desc via prc class", probeMergeDialogFields().hasDescription, true);

  // The interactive finder prefers the stable Primer class over placeholder
  // copy elsewhere on the page.
  resetPage(PR_URL).appendChild(h("textarea", { placeholder: "Add an optional extended description…" }));
  const prc = h("textarea", { class: "prc-Textarea-TextArea xyz" });
  document.body.appendChild(prc as unknown as Node);
  expectMatch("interactive finder prefers prc over placeholder", findMergeDescTextarea(), prc);
  resetPage(PR_URL);
  const emptyProbe = probeMergeDialogFields();
  expectMatch("empty page probe: no title", emptyProbe.hasTitle, false);
  expectMatch("empty page probe: no description", emptyProbe.hasDescription, false);
}

console.log("=== Content Script (merge dialog) Tests ===\n");
testInjectMergeButtons();
testInjectMergeButtonsReactDialog();
testMergeFieldProbe();
await testMergeTitleSuccess();
await testMergeTitleEmptyResult();
await testMergeDescriptionSuccess();
await testMergeErrorPaths();
await testMergePartialRollback();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All content merge tests passed");
process.exit(0);
