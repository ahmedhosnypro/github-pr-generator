import { injectButtons } from "./content/compare-buttons";
import { log } from "./content/log";
import { injectMergeButtons } from "./content/merge-buttons";
import { injectOpenedPRButtons } from "./content/opened-buttons";
import { isMergeConfirmationPage, isPRCreationPage, isPROpenedPage } from "./content/page-detect";

function nodeHasPRFields(el: Element): boolean {
  return (
    Boolean(el.querySelector('input[name="pull_request[title]"]')) ||
    Boolean(el.querySelector("textarea#pull_request_body")) ||
    el.matches('input[name="pull_request[title]"]') ||
    el.matches("textarea#pull_request_body")
  );
}

function nodeHasOpenedPRMarkers(el: Element): boolean {
  return (
    Boolean(el.querySelector('[data-component="PH_Title"]')) ||
    Boolean(el.querySelector("div.js-comment-body")) ||
    el.matches('[data-component="PH_Title"]')
  );
}

function nodeHasMergeMarkers(el: Element): boolean {
  return (
    Boolean(el.querySelector('[class*="ConfirmMerge"]')) ||
    Boolean(el.querySelector('input[data-component="input"][type="text"]')) ||
    Boolean(
      el.querySelector('textarea[class*="prc-Textarea-TextArea"], textarea[placeholder*="extended description"]'),
    ) ||
    el.matches('[class*="ConfirmMerge"]') ||
    el.matches('[class*="prc-Textarea-TextArea"]')
  );
}

function handleAddedNode(node: Node): "stop" | "merge" | null {
  if (!(node instanceof Element)) return null;
  if (nodeHasPRFields(node)) {
    injectButtons();
    return "stop";
  }
  if (nodeHasOpenedPRMarkers(node) && isPROpenedPage()) {
    injectOpenedPRButtons();
  }
  return nodeHasMergeMarkers(node) ? "merge" : null;
}

const observer = new MutationObserver((mutations) => {
  let mergeDetected = false;
  for (const mutation of mutations) {
    if (mutation.type !== "childList" || mutation.addedNodes.length === 0) continue;
    for (const node of mutation.addedNodes) {
      const result = handleAddedNode(node);
      if (result === "stop") return;
      if (result === "merge") mergeDetected = true;
    }
  }
  if (mergeDetected && isMergeConfirmationPage()) {
    injectMergeButtons();
  }
});

let mergeCheckInterval: ReturnType<typeof setInterval> | null = null;

function startMergeCheckInterval(): void {
  if (mergeCheckInterval) return;
  mergeCheckInterval = setInterval(() => {
    if (!isPROpenedPage() && !isMergeConfirmationPage()) {
      // Navigated away from PR pages — polling is pointless.
      if (mergeCheckInterval) clearInterval(mergeCheckInterval);
      mergeCheckInterval = null;
      return;
    }
    if (isMergeConfirmationPage()) {
      // Keep polling: the dialog can close and reopen (its DOM, including our
      // injected buttons, is recreated each time). injectMergeButtons is
      // id-guarded, so repeat calls on the same dialog are no-ops.
      injectMergeButtons();
    }
  }, 1000);
}

const turbListener = (): void => {
  setTimeout(() => {
    // Turbo soft navigation can replace <body>; re-attach the observer to the
    // new body (it silently dies otherwise), then re-run id-guarded injections.
    observer.disconnect();
    if (isPRCreationPage() || isPROpenedPage() || isMergeConfirmationPage()) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
    if (isPRCreationPage()) {
      injectButtons();
    }
    if (isPROpenedPage()) {
      injectOpenedPRButtons();
      startMergeCheckInterval();
    }
    if (isMergeConfirmationPage()) {
      injectMergeButtons();
    }
  }, 1000);
};

document.addEventListener("turbo:load", turbListener);
document.addEventListener("turbo:render", turbListener);
document.addEventListener("pjax:end", turbListener);

function init(): void {
  log("info", "init called on URL: " + window.location.href);
  const isCreation = isPRCreationPage();
  const isOpened = isPROpenedPage();
  const isMerge = isMergeConfirmationPage();

  if (isCreation) {
    log("info", "PR creation page detected, injecting buttons...");
    injectButtons();
  }
  if (isOpened) {
    log("info", "Opened PR page detected, injecting buttons...");
    injectOpenedPRButtons();
    // Start periodic merge dialog check — merge dialog appears on click
    startMergeCheckInterval();
  }
  if (isMerge) {
    log("info", "Merge confirmation page detected, injecting merge buttons...");
    injectMergeButtons();
  }
  if (isCreation || isOpened || isMerge) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    log("info", "MutationObserver started");
  } else {
    log("info", "Not a PR creation, opened PR, or merge page, skipping");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  setTimeout(init, 500);
}
