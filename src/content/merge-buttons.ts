import { BTN_MERGE_DESC_ID, BTN_MERGE_TITLE_ID } from "./constants";
import { createButton } from "./dom";
import { injectLogToggleButton, log } from "./log";
import { findMergeDescTextarea, findMergeTitleInput } from "./merge-fields";
import { handleGenerateMergeDescription, handleGenerateMergeTitle } from "./merge-generate";

function injectMergeTitleButton(): void {
  if (document.getElementById(BTN_MERGE_TITLE_ID)) return;

  const mergeTitleInput = findMergeTitleInput();
  if (!mergeTitleInput) {
    log("warn", "Merge title input not found for button injection");
    return;
  }

  // Make the TextInput wrapper a positioning context
  const textInputWrapper = mergeTitleInput.closest('[data-component="TextInput"]');
  if (textInputWrapper instanceof HTMLElement) {
    textInputWrapper.style.position = "relative";
    const btn = createButton(BTN_MERGE_TITLE_ID, "✨", () => {
      void handleGenerateMergeTitle();
    });
    btn.classList.add("ai-generate-btn--merge-title");
    btn.title = "AI Generate Merge Title";
    textInputWrapper.appendChild(btn);
    log("info", "Merge title button injected inside TextInput wrapper");
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

  const textarea = findMergeDescTextarea();
  if (!textarea) {
    log("warn", "Merge description textarea not found for button injection");
    return;
  }

  // Make the TextInput wrapper a positioning context
  const textInputWrapper = textarea.closest('[data-component="TextInput"]');
  if (textInputWrapper instanceof HTMLElement) {
    textInputWrapper.style.position = "relative";
    const btn = createButton(BTN_MERGE_DESC_ID, "✨", () => {
      void handleGenerateMergeDescription();
    });
    btn.classList.add("ai-generate-btn--merge-desc");
    btn.title = "AI Generate Merge Description";
    textInputWrapper.appendChild(btn);
    log("info", "Merge description button injected inside TextInput wrapper");
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
