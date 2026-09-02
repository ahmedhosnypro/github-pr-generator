import { BTN_OPENED_DESC_ID, BTN_OPENED_TITLE_ID, BTN_OPENED_TITLE_MENU_ID } from "./constants";
import { createButton } from "./dom";
import { injectLogToggleButton, log } from "./log";
import { handleGenerateOpenedDescription, handleGenerateOpenedTitle } from "./opened-generate";

/** Document-level dismiss for the opened-title dropdown menu (bound once). */
let titleMenuDismissBound = false;

function closeTitleMenu(): void {
  const menu = document.getElementById(BTN_OPENED_TITLE_MENU_ID)?.querySelector(".ai-generate-menu");
  if (menu instanceof HTMLElement) menu.hidden = true;
}

function bindTitleMenuDismiss(): void {
  if (titleMenuDismissBound) return;
  titleMenuDismissBound = true;
  document.addEventListener(
    "click",
    (event) => {
      const wrapper = document.getElementById(BTN_OPENED_TITLE_MENU_ID);
      if (wrapper && event.target instanceof Node && !wrapper.contains(event.target)) {
        closeTitleMenu();
      }
    },
    true,
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeTitleMenu();
  });
}

function createTitleMenuItem(label: string, hint: string, onSelect: () => void): HTMLButtonElement {
  const item = document.createElement("button");
  item.type = "button";
  item.className = "ai-generate-menu__item";
  const strong = document.createElement("span");
  strong.className = "ai-generate-menu__label";
  strong.textContent = label;
  const small = document.createElement("span");
  small.className = "ai-generate-menu__hint";
  small.textContent = hint;
  item.append(strong, small);
  item.addEventListener("click", () => {
    closeTitleMenu();
    onSelect();
  });
  return item;
}

/** Split button: main click improves the current title; caret opens a mode menu. */
function buildOpenedTitleSplitButton(): HTMLSpanElement {
  const wrapper = document.createElement("span");
  wrapper.id = BTN_OPENED_TITLE_MENU_ID;
  wrapper.className = "ai-generate-split";

  const btn = createButton(BTN_OPENED_TITLE_ID, "AI Title", () => {
    handleGenerateOpenedTitle("improve");
  });
  btn.classList.add("ai-generate-btn--opened-title");

  const caret = document.createElement("button");
  caret.type = "button";
  caret.className = "ai-generate-btn ai-generate-caret";
  caret.title = "Title generation options";
  caret.setAttribute("aria-haspopup", "menu");
  caret.innerHTML =
    '<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: middle;">' +
    '<path d="M4.427 6.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 6H4.604a.25.25 0 00-.177.427z"/>' +
    "</svg>";
  caret.addEventListener("click", (event) => {
    event.stopPropagation();
    const menu = wrapper.querySelector(".ai-generate-menu");
    if (menu instanceof HTMLElement) menu.hidden = !menu.hidden;
  });

  const menu = document.createElement("span");
  menu.className = "ai-generate-menu";
  menu.setAttribute("role", "menu");
  menu.hidden = true;
  menu.append(
    createTitleMenuItem("Improve current title", "Refine the existing title", () => {
      handleGenerateOpenedTitle("improve");
    }),
    createTitleMenuItem(
      "Generate fresh title",
      "Craft a brand-new title from the changes only — the current title is never sent to the AI",
      () => {
        handleGenerateOpenedTitle("fresh");
      },
    ),
  );

  wrapper.append(btn, caret, menu);
  bindTitleMenuDismiss();
  return wrapper;
}

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

  // Insert as a SIBLING of the markdown-title span, not inside it:
  // extractExistingOpenedTitle() reads that span's textContent, and children of
  // the span (including hidden split-button menu items) would corrupt the title.
  const container = titleSpan.parentElement;
  if (!container) {
    log("warn", "No parent element for title span");
    return;
  }

  container.appendChild(buildOpenedTitleSplitButton());
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
