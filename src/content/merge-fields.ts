/** Merge confirmation dialog: field location, extraction and filling. */

import { setReactValue } from "./dom";
import { log } from "./log";

export function findMergeTitleInput(): HTMLInputElement | null {
  // The ConfirmMerge container is a sibling of the title/desc FormControls.
  // If it exists on the page, scan the parent wrapper for the merge title input.
  const confirmContainer = document.querySelector('[class*="ConfirmMerge"]');
  if (confirmContainer) {
    const parentWrapper = confirmContainer.parentElement;
    if (parentWrapper) {
      const input = parentWrapper.querySelector<HTMLInputElement>('input[data-component="input"][type="text"]');
      if (input) {
        log("info", "findMergeTitleInput - found near ConfirmMerge container");
        return input;
      }
    }
  }

  // Fallback: look for input with value starting with "Merge pull request"
  const allInputs = document.querySelectorAll<HTMLInputElement>('input[type="text"][data-component="input"]');
  for (const input of allInputs) {
    const val = input.value || "";
    if (val.indexOf("Merge pull request") === 0) {
      log("info", "findMergeTitleInput - found by value pattern");
      return input;
    }
  }

  // Legacy fallback: old GitHub DOM
  const legacy = document.querySelector<HTMLInputElement>('input#merge_title_field, input[name="merge_title_field"]');
  if (legacy) {
    log("info", "findMergeTitleInput - found legacy selector");
    return legacy;
  }

  log("warn", "findMergeTitleInput - not found");
  return null;
}

export function findMergeDescTextarea(): HTMLTextAreaElement | null {
  // Primary: textarea with "extended description" placeholder near ConfirmMerge container
  const confirmContainer = document.querySelector('[class*="ConfirmMerge"]');
  if (confirmContainer) {
    const parentWrapper = confirmContainer.parentElement;
    if (parentWrapper) {
      const textarea = parentWrapper.querySelector<HTMLTextAreaElement>(
        // Hash-agnostic Primer class (the -<hash> suffix rotates every Primer release)
        'textarea[class*="prc-Textarea-TextArea"], textarea[placeholder*="extended description"]',
      );
      if (textarea) {
        log("info", "findMergeDescTextarea - found near ConfirmMerge container");
        return textarea;
      }
    }
  }

  // Fallback: any textarea with "extended description" placeholder
  const allTextareas = document.querySelectorAll<HTMLTextAreaElement>('textarea[placeholder*="extended description"]');
  const first = allTextareas[0];
  if (allTextareas.length > 0 && first) {
    log("info", "findMergeDescTextarea - found by placeholder");
    return first;
  }

  // Fallback: Primer Textarea class, matched hash-agnostically
  const prcTextarea = document.querySelector<HTMLTextAreaElement>('textarea[class*="prc-Textarea-TextArea"]');
  if (prcTextarea) {
    log("info", "findMergeDescTextarea - found by prc class");
    return prcTextarea;
  }

  // Legacy fallback
  const legacy = document.querySelector<HTMLTextAreaElement>(
    'textarea#merge_message_field, textarea[name="merge_message_field"]',
  );
  if (legacy) {
    log("info", "findMergeDescTextarea - found legacy selector");
    return legacy;
  }

  log("warn", "findMergeDescTextarea - not found");
  return null;
}

export function extractExistingMergeTitle(): string {
  const input = findMergeTitleInput();
  const val = input ? input.value || "" : "";
  log("info", "extractExistingMergeTitle - " + val);
  return val;
}

export function extractExistingMergeDescription(): string {
  const textarea = findMergeDescTextarea();
  const val = textarea ? textarea.value || "" : "";
  log("info", "extractExistingMergeDescription - length: " + String(val.length));
  return val;
}

export function fillMergeFields(title: string, description: string): void {
  log(
    "info",
    "fillMergeFields called - title: " +
      title +
      ", description length: " +
      String(description ? description.length : 0),
  );
  const titleInput = findMergeTitleInput();
  const descTextarea = findMergeDescTextarea();

  if (titleInput && title) {
    setReactValue(titleInput, title);
    titleInput.focus();
    titleInput.blur();
    log("info", "Merge title input filled");
  } else if (!titleInput && title) {
    log("error", "Merge title input not found!");
  }

  if (descTextarea && description) {
    setReactValue(descTextarea, description);
    descTextarea.dispatchEvent(new Event("change", { bubbles: true }));
    log("info", "Merge description textarea filled");
  } else if (!descTextarea && description) {
    log("error", "Merge description textarea not found!");
  }
}
