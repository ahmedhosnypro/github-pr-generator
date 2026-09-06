import { handleGenerate } from "./compare-generate";
import { BTN_DESC_ID, BTN_ID } from "./constants";
import { createButton, getButton } from "./dom";
import { injectLogToggleButton, log } from "./log";

// Candidate anchors, most specific first. GitHub's new React PR editor does
// not always render the classic `pull_request[title]` name or the Primer
// TextInput chrome, so every placement below degrades to the next anchor
// instead of failing silently.
const TITLE_INPUT_SELECTORS = [
  'input[name="pull_request[title]"]',
  "input#pull_request_title",
  '[data-component="TextInput"] input[type="text"]',
];

const DESC_TEXTAREA_SELECTORS = ["textarea#pull_request_body", 'textarea[name="pull_request[body]"]'];

const TOOLBAR_SELECTORS = ['markdown-toolbar[for="pull_request_body"]', "markdown-toolbar"];

function queryFirst(selectors: string[]): Element | null {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return null;
}

function insertAfter(el: Element, node: HTMLElement): void {
  el.parentElement?.insertBefore(node, el.nextSibling);
}

function injectTitleButton(): boolean {
  if (document.getElementById(BTN_ID)) return true;

  const titleInput = queryFirst(TITLE_INPUT_SELECTORS);
  if (!titleInput) {
    log("warn", "Title input not found for button injection");
    return false;
  }

  const btn = createButton(BTN_ID, "AI Generate", () => {
    void handleGenerate();
  });
  btn.classList.add("ai-generate-btn--title");

  // Layer 1: Primer TextInput action area (classic compare page).
  const wrapper = titleInput.closest('[data-component="TextInput"]');
  const actionArea = wrapper?.querySelector('[data-component="TextInput.Action"]');
  if (actionArea) {
    actionArea.appendChild(btn);
    log("info", "Title button injected into TextInput.Action");
    return true;
  }

  // Layer 2: any TextInput/FormControl wrapper as a positioning context.
  const host =
    titleInput.closest('[data-component="TextInput"]') ??
    titleInput.closest('[data-component="FormControl"]') ??
    titleInput.closest(".form-group");
  if (host instanceof HTMLElement) {
    host.style.position = "relative";
    host.appendChild(btn);
    log("info", "Title button injected into field wrapper");
    return true;
  }

  // Layer 3: bare input — place the button right after it.
  insertAfter(titleInput, btn);
  log("info", "Title button injected after input");
  return true;
}

function injectDescButton(): boolean {
  if (document.getElementById(BTN_DESC_ID)) return true;

  const btn = createButton(BTN_DESC_ID, "AI Generate", () => {
    void handleGenerate();
  });
  btn.classList.add("ai-generate-btn--desc");

  // Layer 1: markdown toolbar with an ActionBar (classic compare page).
  const toolbar = queryFirst(TOOLBAR_SELECTORS);
  if (toolbar) {
    const actionBar = toolbar.querySelector('.ActionBar, [data-component="ActionBar"]');
    if (actionBar) {
      const firstItem = actionBar.querySelector('[data-targets="action-bar.items"]');
      if (firstItem?.parentNode) {
        firstItem.parentNode.insertBefore(btn, firstItem);
      } else {
        actionBar.prepend(btn);
      }
      log("info", "Description button injected into ActionBar");
      return true;
    }
    toolbar.prepend(btn);
    log("info", "Description button injected into toolbar (no ActionBar)");
    return true;
  }

  // Layer 2: no toolbar at all (React editor) — anchor on the textarea.
  const textarea = queryFirst(DESC_TEXTAREA_SELECTORS);
  if (textarea) {
    insertAfter(textarea, btn);
    log("info", "Description button injected after body textarea");
    return true;
  }

  log("warn", "Description anchors not found");
  return false;
}

// Hydration can land after the page-level detection ran: watch for late DOM
// and retry injection until both buttons exist (or the watch window expires).
// Guarded on MutationObserver so Bun unit tests without a real DOM never arm it.
let retryObserver: MutationObserver | null = null;
let retryDeadline = 0;

function watchForLateHydration(): void {
  if (retryObserver !== null || typeof MutationObserver !== "function") return;
  const observer = new MutationObserver(() => {
    if (getButton(BTN_ID) !== null && getButton(BTN_DESC_ID) !== null) {
      retryObserver = null;
      observer.disconnect();
      return;
    }
    if (Date.now() > retryDeadline) {
      retryObserver = null;
      observer.disconnect();
      return;
    }
    injectButtons();
  });
  retryObserver = observer;
  retryDeadline = Date.now() + 30000;
  observer.observe(document.body, { childList: true, subtree: true });
}

export function injectButtons(): void {
  const titleDone = injectTitleButton();
  const descDone = injectDescButton();
  injectLogToggleButton();
  if (!titleDone || !descDone) watchForLateHydration();
}
