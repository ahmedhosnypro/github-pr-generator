/** Merge confirmation dialog: field location, extraction and filling. */

import { setReactValue } from "./dom";
import { log } from "./log";

// GitHub composes the default merge commit title server-side ("Merge pull
// request #N from owner/branch"), so unlike UI copy (placeholders, labels) it
// does not vary with the viewer's locale. Match on the live .value property:
// React hydration drops the original `value=` attribute, so attribute
// selectors go stale once the page has booted.
function isDefaultMergeTitle(value: string): boolean {
  return value.startsWith("Merge pull request");
}

// The locators below take a hit reporter so the interactive finders can log
// how a field was found while page-detect's per-second poller passes a no-op
// — logging from a 1s poll would flood the log panel.
type HitReporter = (how: string) => void;

function reportNothing(): void {}

function locateMergeTitleInput(report: HitReporter): HTMLInputElement | null {
  // The ConfirmMerge container is a sibling of the title/desc FormControls.
  // If it exists on the page, scan the parent wrapper for the title input.
  const confirmContainer = document.querySelector('[class*="ConfirmMerge"]');
  if (confirmContainer) {
    const parentWrapper = confirmContainer.parentElement;
    if (parentWrapper) {
      const input = parentWrapper.querySelector<HTMLInputElement>('input[data-component="input"][type="text"]');
      if (input) {
        report("near ConfirmMerge container");
        return input;
      }
    }
  }

  // Live .value scan over every text input: post-hydration markup may drop
  // the data-component attribute entirely, so the current value is the anchor.
  for (const input of document.querySelectorAll<HTMLInputElement>('input[type="text"]')) {
    if (isDefaultMergeTitle(input.value || "")) {
      report("by live title value");
      return input;
    }
  }

  // Legacy fallback: old GitHub DOM
  const legacy = document.querySelector<HTMLInputElement>('input#merge_title_field, input[name="merge_title_field"]');
  if (legacy) {
    report("legacy selector");
    return legacy;
  }
  return null;
}

function locateMergeDescTextarea(report: HitReporter, matchPlaceholder: boolean): HTMLTextAreaElement | null {
  const confirmContainer = document.querySelector('[class*="ConfirmMerge"]');
  if (confirmContainer) {
    const parentWrapper = confirmContainer.parentElement;
    if (parentWrapper) {
      const nearSelector = matchPlaceholder
        ? 'textarea[class*="prc-Textarea-TextArea"], textarea[placeholder*="extended description"]'
        : 'textarea[class*="prc-Textarea-TextArea"]';
      const textarea = parentWrapper.querySelector<HTMLTextAreaElement>(nearSelector);
      if (textarea) {
        report("near ConfirmMerge container");
        return textarea;
      }
    }
  }

  // Primer Textarea class, matched hash-agnostically (the -<hash> suffix
  // rotates every Primer release)
  const prcTextarea = document.querySelector<HTMLTextAreaElement>('textarea[class*="prc-Textarea-TextArea"]');
  if (prcTextarea) {
    report("prc class");
    return prcTextarea;
  }

  if (matchPlaceholder) {
    const placeholder = document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="extended description"]');
    if (placeholder) {
      report("placeholder");
      return placeholder;
    }
  }

  // Legacy fallback
  const legacy = document.querySelector<HTMLTextAreaElement>(
    'textarea#merge_message_field, textarea[name="merge_message_field"]',
  );
  if (legacy) {
    report("legacy selector");
    return legacy;
  }
  return null;
}

export function findMergeTitleInput(): HTMLInputElement | null {
  const input = locateMergeTitleInput((how) => {
    log("info", "findMergeTitleInput - found " + how);
  });
  if (!input) log("warn", "findMergeTitleInput - not found");
  return input;
}

export function findMergeDescTextarea(): HTMLTextAreaElement | null {
  const textarea = locateMergeDescTextarea((how) => {
    log("info", "findMergeDescTextarea - found " + how);
  }, true);
  if (!textarea) log("warn", "findMergeDescTextarea - not found");
  return textarea;
}

export interface MergeFieldProbe {
  hasTitle: boolean;
  hasDescription: boolean;
}

// Quiet probe for page-detection polling: same structural anchors as the
// interactive finders, minus logging and minus placeholder-text matching
// (UI copy is locale-dependent; the server-composed default title and the
// Primer classes are not).
export function probeMergeDialogFields(): MergeFieldProbe {
  return {
    hasTitle: locateMergeTitleInput(reportNothing) !== null,
    hasDescription: locateMergeDescTextarea(reportNothing, false) !== null,
  };
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
