// Unit tests for src/content/opened-buttons.ts: split-button injection into
// the opened-PR header/comment actions, idempotency, anchor-miss guards, and
// the mode menu's caret toggle + item wiring through to the background.
// src modules must evaluate only AFTER dom-stub has installed the globals,
// so they are imported dynamically (biome hoists static imports).
import type { StubElement } from "./dom-stub";
import { h, resetPage } from "./dom-stub";
import { expectMatch, getFailures } from "./expect-helpers";
import { bgMessages, buildOpenedPrPage, OPENED_PR_URL, setBgResponder, waitUntil } from "./opened-fixtures";

const { BTN_OPENED_DESC_ID, BTN_OPENED_TITLE_ID, BTN_OPENED_TITLE_MENU_ID } = await import("../src/content/constants");
const { getButton } = await import("../src/content/dom");
const { injectOpenedPRButtons } = await import("../src/content/opened-buttons");

function titleWrapper(): StubElement | null {
  return document.getElementById(BTN_OPENED_TITLE_MENU_ID) as unknown as StubElement | null;
}

// `hidden` is a DOM property the stub does not model; the src code sets it as
// an expando, so read it back through a structural cast.
function isHidden(el: StubElement): boolean {
  return (el as unknown as { hidden: boolean }).hidden;
}

function testInjection(): void {
  console.log("--- opened-buttons injection ---");
  const page = buildOpenedPrPage();
  injectOpenedPRButtons();

  const wrapper = titleWrapper();
  expectMatch("split wrapper created", wrapper !== null, true);
  expectMatch("wrapper is sibling of the markdown-title span", wrapper?.parentNode, page.titleSpan.parentNode);
  const titleBtn = getButton(BTN_OPENED_TITLE_ID);
  expectMatch("title button created", titleBtn !== null, true);
  expectMatch("title button lives in the split wrapper", titleBtn?.parentNode, wrapper);
  const menu = wrapper?.querySelector(".ai-generate-menu") ?? null;
  expectMatch("mode menu created", menu !== null, true);
  expectMatch("mode menu starts hidden", menu !== null && isHidden(menu), true);
  expectMatch("mode menu has two entries", menu?.querySelectorAll(".ai-generate-menu__item").length, 2);

  const descBtn = getButton(BTN_OPENED_DESC_ID);
  expectMatch("desc button created", descBtn !== null, true);
  expectMatch("desc button prepended to comment actions", page.actionsDiv.children[0], descBtn);
  expectMatch("log toggle button injected", document.getElementById("ai-pr-log-toggle-btn") !== null, true);

  // Idempotency: a second inject adds nothing.
  injectOpenedPRButtons();
  const container = page.titleSpan.parentNode;
  expectMatch(
    "re-injection does not duplicate the wrapper",
    container?.children.filter((c) => c.id === BTN_OPENED_TITLE_MENU_ID).length,
    1,
  );
  expectMatch(
    "re-injection does not duplicate the desc button",
    page.actionsDiv.children.filter((c) => c.id === BTN_OPENED_DESC_ID).length,
    1,
  );
}

function testMissingAnchors(): void {
  console.log("--- opened-buttons anchor guards ---");

  resetPage(OPENED_PR_URL);
  injectOpenedPRButtons();
  expectMatch("empty page: no title button", getButton(BTN_OPENED_TITLE_ID), null);
  expectMatch("empty page: no desc button", getButton(BTN_OPENED_DESC_ID), null);
  expectMatch("empty page: log toggle still injected", document.getElementById("ai-pr-log-toggle-btn") !== null, true);

  const noSpan = resetPage(OPENED_PR_URL);
  noSpan.appendChild(h("div", { "data-component": "PH_Title" }));
  injectOpenedPRButtons();
  expectMatch("PH_Title without markdown-title span: no title button", getButton(BTN_OPENED_TITLE_ID), null);

  const noActions = resetPage(OPENED_PR_URL);
  const commentBody = h("div", { class: "js-comment-body" }, "x");
  const header = h("div", { class: "timeline-comment-header" });
  noActions.appendChild(h("div", { class: "timeline-comment-group" }, header, commentBody));
  injectOpenedPRButtons();
  expectMatch("comment thread without actions row: no desc button", getButton(BTN_OPENED_DESC_ID), null);

  // Legacy .comment container still anchors the description button.
  const legacy = resetPage(OPENED_PR_URL);
  const legacyActions = h("div", { class: "timeline-comment-actions" });
  const legacyHeader = h("div", { class: "timeline-comment-header" }, legacyActions);
  legacy.appendChild(h("div", { class: "comment" }, legacyHeader, h("div", { class: "js-comment-body" }, "x")));
  injectOpenedPRButtons();
  expectMatch(".comment container: desc button injected", getButton(BTN_OPENED_DESC_ID) !== null, true);
  expectMatch(".comment container: button prepended", legacyActions.children[0], getButton(BTN_OPENED_DESC_ID));
}

async function testMenuInteraction(): Promise<void> {
  console.log("--- opened-buttons menu interaction ---");
  buildOpenedPrPage();
  injectOpenedPRButtons();
  bgMessages.length = 0;
  setBgResponder(() => ({ title: "feat: regenerated", updated: true }));

  const wrapper = titleWrapper();
  const menu = wrapper?.querySelector(".ai-generate-menu") ?? null;
  const caret = wrapper?.querySelector(".ai-generate-caret") ?? null;
  expectMatch("caret rendered inside wrapper", caret?.parentNode, wrapper);
  if (menu === null || caret === null) return;

  // The caret handler calls event.stopPropagation(), which the stub's plain
  // click() event lacks — dispatch a full event object instead.
  const clickEvent = { type: "click", stopPropagation: () => {} };
  caret.dispatchEvent(clickEvent);
  expectMatch("caret opens the menu", isHidden(menu), false);
  caret.dispatchEvent(clickEvent);
  expectMatch("second caret click closes the menu", isHidden(menu), true);

  // "Generate fresh title" item: closes the menu and starts a fresh-mode flow.
  caret.dispatchEvent(clickEvent);
  const items = menu.querySelectorAll(".ai-generate-menu__item");
  items[1]?.click();
  expectMatch("menu item click closes the menu", isHidden(menu), true);
  expectMatch("menu item started a background request", await waitUntil(() => bgMessages.length === 1), true);
  expectMatch("menu item wired to fresh mode", bgMessages[0]?.data?.titleMode, "fresh");
  expectMatch(
    "menu item flow re-enables the button",
    await waitUntil(() => getButton(BTN_OPENED_TITLE_ID)?.disabled === false),
    true,
  );

  // The injected description button drives handleGenerateOpenedDescription.
  bgMessages.length = 0;
  setBgResponder(() => ({ body: "generated", updated: true }));
  getButton(BTN_OPENED_DESC_ID)?.click();
  expectMatch("desc button click started a background request", await waitUntil(() => bgMessages.length === 1), true);
  expectMatch("desc button click requests generateDescription", bgMessages[0]?.type, "generateDescription");
}

console.log("=== Content Script (opened PR buttons) Tests ===\n");
testInjection();
testMissingAnchors();
await testMenuInteraction();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All content opened-buttons tests passed");
process.exit(0);
