import { handleGenerate } from "./compare-generate";
import { BTN_DESC_ID, BTN_ID } from "./constants";
import { createButton } from "./dom";
import { injectLogToggleButton, log } from "./log";

function injectTitleButton(): void {
  if (document.getElementById(BTN_ID)) return;

  const titleInput = document.querySelector('input[name="pull_request[title]"]');
  if (!titleInput) {
    log("warn", "Title input not found for button injection");
    return;
  }

  const wrapper = titleInput.closest('[data-component="TextInput"]');
  if (!wrapper) {
    log("warn", "TextInput wrapper not found");
    return;
  }

  const actionArea = wrapper.querySelector('[data-component="TextInput.Action"]');
  if (!actionArea) {
    log("warn", "TextInput.Action area not found");
    return;
  }

  const btn = createButton(BTN_ID, "AI Generate", () => {
    void handleGenerate();
  });
  btn.classList.add("ai-generate-btn--title");
  actionArea.appendChild(btn);
  log("info", "Title button injected");
}

function injectDescButton(): void {
  if (document.getElementById(BTN_DESC_ID)) return;

  const toolbar = document.querySelector('markdown-toolbar[for="pull_request_body"]');
  if (!toolbar) {
    log("warn", "Description toolbar not found");
    return;
  }

  const actionBar = toolbar.querySelector(".ActionBar");
  if (!actionBar) {
    log("warn", "ActionBar not found in toolbar");
    return;
  }

  const btn = createButton(BTN_DESC_ID, "AI Generate", () => {
    void handleGenerate();
  });
  btn.classList.add("ai-generate-btn--desc");

  const firstItem = actionBar.querySelector('[data-targets="action-bar.items"]');
  if (firstItem?.parentNode) {
    firstItem.parentNode.insertBefore(btn, firstItem);
  } else {
    actionBar.prepend(btn);
  }
  log("info", "Description button injected");
}

export function injectButtons(): void {
  injectTitleButton();
  injectDescButton();
  injectLogToggleButton();
}
