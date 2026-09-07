// Unit tests for compare-generate.ts's streaming generate flow: button
// wiring, guards, field filling, and toast error paths. The src/content/*
// modules must evaluate only AFTER dom-stub has installed the globals (done
// via content-compare-shared), so they are imported dynamically.

import { addCompareData, buildComparePage, toastState } from "./content-compare-shared";
import { expectIncludes, expectMatch, getFailures } from "./expect-helpers";

const { injectButtons } = await import("../src/content/compare-buttons");
const { handleGenerate } = await import("../src/content/compare-generate");
const { BTN_DESC_ID, BTN_ID } = await import("../src/content/constants");
const { getButton } = await import("../src/content/dom");
const { setStreamHandler, streamRequests, tick } = await import("./dom-stub");

async function testGenerateGuards(): Promise<void> {
  console.log("--- compare-generate.ts guards ---");

  // No buttons in the DOM: handleGenerate must be a no-op.
  buildComparePage();
  await handleGenerate();
  expectMatch("no buttons: no stream request", streamRequests().length, 0);
  expectMatch("no buttons: no toast", toastState(), null);

  // Disabled button: must not start a stream.
  buildComparePage();
  injectButtons();
  const btn = getButton(BTN_ID);
  if (btn !== null) btn.disabled = true;
  await handleGenerate();
  expectMatch("disabled button: no stream request", streamRequests().length, 0);
  expectMatch("disabled button: no toast", toastState(), null);

  // Buttons present but the page yields no commits/files: error toast.
  buildComparePage();
  injectButtons();
  await handleGenerate();
  expectMatch("empty page: no stream request", streamRequests().length, 0);
  expectMatch("empty page: error toast text", toastState()?.text, "No commits or file changes found on this page.");
  expectMatch("empty page: error toast styled", toastState()?.isError, true);
  expectMatch("empty page: title button re-enabled", getButton(BTN_ID)?.disabled, false);
  expectMatch("empty page: desc button re-enabled", getButton(BTN_DESC_ID)?.disabled, false);
}

async function testGenerateSuccess(): Promise<void> {
  console.log("--- compare-generate.ts success flow ---");
  const page = buildComparePage();
  addCompareData(page);
  injectButtons();

  interface CapturedGenerate {
    type?: string;
    data?: {
      commits?: { message: string }[];
      fileChanges?: { path: string }[];
      linkedIssues?: string[];
    };
  }
  setStreamHandler((request, emit) => {
    const captured = request as CapturedGenerate;
    expectMatch("request type is generate", captured.type, "generate");
    expectMatch("one commit extracted", captured.data?.commits?.length, 1);
    expectMatch(
      "commit message captured",
      captured.data?.commits?.[0]?.message.startsWith("feat: add streaming"),
      true,
    );
    expectMatch("one file extracted", captured.data?.fileChanges?.length, 1);
    expectMatch("file path captured", captured.data?.fileChanges?.[0]?.path, "src/foo.ts");
    expectMatch("linked issue extracted", captured.data?.linkedIssues?.includes("#123"), true);
    emit({ kind: "chunk", text: "feat: streaming title\n\n" });
    emit({ kind: "chunk", text: "Streamed body" });
    emit({ kind: "done", result: { title: "feat: final title", description: "Final description body" } });
  });

  // Drive the flow through the injected button's click wiring.
  getButton(BTN_ID)?.click();
  await tick();

  expectMatch("stream request posted", streamRequests().length, 1);
  expectMatch("title filled from final result", page.titleInput.value, "feat: final title");
  expectMatch("description filled from final result", page.bodyTextarea.value, "Final description body");
  expectMatch("success toast", toastState()?.text, "PR title and description generated!");
  expectMatch("success toast not error-styled", toastState()?.isError, false);
  expectMatch("title button re-enabled after success", getButton(BTN_ID)?.disabled, false);
  expectMatch("desc button re-enabled after success", getButton(BTN_DESC_ID)?.disabled, false);
  expectIncludes("title button label restored", getButton(BTN_ID)?.innerHTML ?? "", "AI Generate");
}

async function testGenerateStreamError(): Promise<void> {
  console.log("--- compare-generate.ts stream error ---");
  const page = buildComparePage();
  addCompareData(page);
  injectButtons();

  setStreamHandler((_request, emit) => {
    emit({ kind: "error", error: "model exploded" });
  });
  await handleGenerate();
  expectMatch("error toast text", toastState()?.text, "Error: model exploded");
  expectMatch("error toast styled", toastState()?.isError, true);
  expectMatch("title button re-enabled after error", getButton(BTN_ID)?.disabled, false);
  expectMatch("desc button re-enabled after error", getButton(BTN_DESC_ID)?.disabled, false);
}

async function testGenerateEmptyTitleGuard(): Promise<void> {
  console.log("--- compare-generate.ts empty-title guard ---");
  const page = buildComparePage();
  addCompareData(page);
  injectButtons();
  page.titleInput.value = "User typed title";

  setStreamHandler((_request, emit) => {
    emit({ kind: "done", result: { title: "", description: "Only a body" } });
  });
  await handleGenerate();
  expectMatch("empty result title keeps user title", page.titleInput.value, "User typed title");
  expectMatch("non-empty description still applied", page.bodyTextarea.value, "Only a body");
  expectMatch("still a success toast", toastState()?.text, "PR title and description generated!");
}

async function testGeneratePartialRollback(): Promise<void> {
  console.log("--- compare-generate.ts partial-stream rollback ---");

  // Mid-stream error after chunks streamed: both fields return to their
  // pre-stream values and the toast names the rollback.
  const page = buildComparePage();
  addCompareData(page);
  injectButtons();
  page.titleInput.value = "User typed title";
  page.bodyTextarea.value = "User typed body";

  setStreamHandler((_request, emit) => {
    emit({ kind: "chunk", text: "feat: partial title\n\npartial body" });
    emit({ kind: "error", error: "model exploded" });
  });
  await handleGenerate();
  expectMatch("mid-stream error: title restored", page.titleInput.value, "User typed title");
  expectMatch("mid-stream error: body restored", page.bodyTextarea.value, "User typed body");
  expectMatch(
    "mid-stream error toast names rollback",
    toastState()?.text,
    "Error: model exploded (the partial streamed text was rolled back)",
  );
  expectMatch("mid-stream error toast styled", toastState()?.isError, true);
  expectMatch("mid-stream error: button re-enabled", getButton(BTN_ID)?.disabled, false);

  // Empty final parse after a streamed preview: restore rather than leaving
  // truncated partials behind under a misleading success toast.
  const page2 = buildComparePage();
  addCompareData(page2);
  injectButtons();
  page2.titleInput.value = "User typed title";
  page2.bodyTextarea.value = "User typed body";

  setStreamHandler((_request, emit) => {
    emit({ kind: "chunk", text: "feat: partial title\n\npartial body" });
    emit({ kind: "done", result: { title: "", description: "" } });
  });
  await handleGenerate();
  expectMatch("empty final: title restored", page2.titleInput.value, "User typed title");
  expectMatch("empty final: body restored", page2.bodyTextarea.value, "User typed body");
  expectMatch(
    "empty final: honest toast",
    toastState()?.text,
    "The model returned an empty response — restored the previous text.",
  );
  expectMatch("empty final: error-styled toast", toastState()?.isError, true);

  // Empty final with nothing streamed at all: fields untouched, plain toast.
  const page3 = buildComparePage();
  addCompareData(page3);
  injectButtons();
  page3.titleInput.value = "User typed title";
  page3.bodyTextarea.value = "User typed body";
  setStreamHandler((_request, emit) => {
    emit({ kind: "done", result: { title: "", description: "" } });
  });
  await handleGenerate();
  expectMatch("empty result, no stream: title untouched", page3.titleInput.value, "User typed title");
  expectMatch("empty result, no stream: body untouched", page3.bodyTextarea.value, "User typed body");
  expectMatch(
    "empty result, no stream: toast",
    toastState()?.text,
    "The model returned an empty response — nothing was applied.",
  );
  expectMatch("empty result, no stream: error-styled", toastState()?.isError, true);
}

console.log("=== Content Script (compare page: generate flow) Tests ===\n");
await testGenerateGuards();
await testGenerateSuccess();
await testGenerateStreamError();
await testGenerateEmptyTitleGuard();
await testGeneratePartialRollback();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All content compare generate tests passed");
process.exit(0);
