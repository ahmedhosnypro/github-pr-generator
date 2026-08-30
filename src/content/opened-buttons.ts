import { BTN_OPENED_DESC_ID, BTN_OPENED_TITLE_ID } from "./constants";
import { createButton } from "./dom";
import { injectLogToggleButton, log } from "./log";
import { handleGenerateOpenedDescription, handleGenerateOpenedTitle } from "./opened-generate";

function injectOpenedPRTitleButton(): void {
  if (document.getElementById(BTN_OPENED_TITLE_ID)) return;

  const titleArea = document.querySelector('[data-component="PH_Title"]');
  if (!titleArea) {
    log("warn", "PH_Title not found for opened PR title button");
    return;
  }

  const titleSpan = titleArea.querySelector("span.markdown-title");
  if (!titleSpan) {
    log("warn", "markdown-title span not found in PH_Title");
    return;
  }

  const parentSpan = titleSpan.closest("span") ?? titleSpan.parentElement;
  if (!parentSpan) {
    log("warn", "No parent span for title span");
    return;
  }

  const btn = createButton(BTN_OPENED_TITLE_ID, "AI Title", handleGenerateOpenedTitle);
  btn.classList.add("ai-generate-btn--opened-title");
  parentSpan.appendChild(btn);
  log("info", "Opened PR title button injected");
}

function injectOpenedPRDescButton(): void {
  if (document.getElementById(BTN_OPENED_DESC_ID)) return;

  let commentBody = document.querySelector("div.js-command-palette-pull-body .js-comment-body");
  commentBody ??= document.querySelector("div.js-comment-body");
  if (!commentBody) {
    log("warn", "js-comment-body not found for opened PR desc button");
    return;
  }

  let commentContainer = commentBody.closest(".timeline-comment-group");
  commentContainer ??= commentBody.closest(".comment");
  commentContainer ??= commentBody.parentElement;
  if (!commentContainer) {
    log("warn", "No comment container for desc button");
    return;
  }

  const commentHeader = commentContainer.querySelector(".timeline-comment-header");
  if (!commentHeader) {
    log("warn", "No timeline-comment-header for desc button");
    return;
  }

  const actionsDiv = commentHeader.querySelector(".timeline-comment-actions");
  if (!actionsDiv) {
    log("warn", "No timeline-comment-actions for desc button");
    return;
  }

  const btn = createButton(BTN_OPENED_DESC_ID, "AI Description", handleGenerateOpenedDescription);
  btn.classList.add("ai-generate-btn--opened-desc");
  actionsDiv.prepend(btn);
  log("info", "Opened PR description button injected");
}

export function injectOpenedPRButtons(): void {
  injectOpenedPRTitleButton();
  injectOpenedPRDescButton();
  injectLogToggleButton();
}
