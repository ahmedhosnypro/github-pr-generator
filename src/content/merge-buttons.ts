import { BTN_MERGE_DESC_ID, BTN_MERGE_TITLE_ID } from "./constants";
import { createButton } from "./dom";
import { injectLogToggleButton, log } from "./log";
import { findMergeDescTextarea, findMergeTitleInput } from "./merge-fields";
import { handleGenerateMergeDescription, handleGenerateMergeTitle } from "./merge-generate";

// The merge confirmation form moves around GitHub's markup: the minified
// "ConfirmMerge" class rotates with each Primer build, and `value=` HTML
// attributes are dead once React hydrates. Detection therefore anchors on
// stable semantics first — an open <dialog>/role=dialog/data-view-component
// scope plus per-field affordances (value content, aria-label, stable ids) —
// and only then falls back to merge-fields.ts' legacy heuristics, which still
// cover the old markup.
function mergeDialogScopes(): Element[] {
  return [...document.querySelectorAll('dialog[open], [role="dialog"], [data-view-component="true"]')];
}

function findMergeTitleInputStable(): HTMLInputElement | null {
  for (const scope of mergeDialogScopes()) {
    const inputs = scope.querySelectorAll<HTMLInputElement>('input#merge_title_field, input[type="text"]');
    for (const input of inputs) {
      if (input.id === "merge_title_field") return input;
      const labelish = (input.getAttribute("aria-label") ?? "") + " " + (input.getAttribute("placeholder") ?? "");
      if (/merge/i.test(labelish)) return input;
      if (input.value.startsWith("Merge pull request")) return input;
    }
  }
  return null;
}

function findMergeDescTextareaStable(): HTMLTextAreaElement | null {
  for (const scope of mergeDialogScopes()) {
    const textarea = scope.querySelector<HTMLTextAreaElement>(
      'textarea#merge_message_field, textarea[aria-label*="description"], textarea[placeholder*="extended description"]',
    );
    if (textarea) return textarea;
  }
  return null;
}

function resolveMergeTitleInput(): HTMLInputElement | null {
  return findMergeTitleInputStable() ?? findMergeTitleInput();
}

function resolveMergeDescTextarea(): HTMLTextAreaElement | null {
  return findMergeDescTextareaStable() ?? findMergeDescTextarea();
}

// Preferred host for an injected button: the Primer TextInput wrapper gets a
// positioning context; older markup's FormControl/.form-group works too.
function findFieldHost(field: Element): HTMLElement | null {
  const host =
    field.closest('[data-component="TextInput"]') ??
    field.closest('[data-component="FormControl"]') ??
    field.closest(".form-group");
  return host instanceof HTMLElement ? host : null;
}

function injectMergeTitleButton(): void {
  if (document.getElementById(BTN_MERGE_TITLE_ID)) return;

  const mergeTitleInput = resolveMergeTitleInput();
  if (!mergeTitleInput) {
    log("warn", "Merge title input not found for button injection");
    return;
  }

  const host = findFieldHost(mergeTitleInput);
  if (host) {
    host.style.position = "relative";
    const btn = createButton(BTN_MERGE_TITLE_ID, "✨", () => {
      void handleGenerateMergeTitle();
    });
    btn.classList.add("ai-generate-btn--merge-title");
    btn.title = "AI Generate Merge Title";
    host.appendChild(btn);
    log("info", "Merge title button injected inside field host");
    return;
  }

  // Fallback: insert right after the input
  const btn2 = createButton(BTN_MERGE_TITLE_ID, "AI Merge Title", () => {
    void handleGenerateMergeTitle();
  });
  btn2.classList.add("ai-generate-btn--merge-title");
  const parentEl = mergeTitleInput.parentElement;
  if (parentEl) {
    parentEl.insertBefore(btn2, mergeTitleInput.nextSibling);
    log("info", "Merge title button injected after input (fallback)");
  }
}

function injectMergeDescButton(): void {
  if (document.getElementById(BTN_MERGE_DESC_ID)) return;

  const textarea = resolveMergeDescTextarea();
  if (!textarea) {
    log("warn", "Merge description textarea not found for button injection");
    return;
  }

  const host = findFieldHost(textarea);
  if (host) {
    host.style.position = "relative";
    const btn = createButton(BTN_MERGE_DESC_ID, "✨", () => {
      void handleGenerateMergeDescription();
    });
    btn.classList.add("ai-generate-btn--merge-desc");
    btn.title = "AI Generate Merge Description";
    host.appendChild(btn);
    log("info", "Merge description button injected inside field host");
    return;
  }

  // Last resort: insert right after the textarea
  const btn2 = createButton(BTN_MERGE_DESC_ID, "✨", () => {
    void handleGenerateMergeDescription();
  });
  btn2.classList.add("ai-generate-btn--merge-desc");
  btn2.title = "AI Generate Merge Description";
  const parentEl = textarea.parentElement;
  if (parentEl) {
    parentEl.insertBefore(btn2, textarea.nextSibling);
    log("info", "Merge description button injected after textarea (last resort)");
  }
}

export function injectMergeButtons(): void {
  injectMergeTitleButton();
  injectMergeDescButton();
  injectLogToggleButton();
}
