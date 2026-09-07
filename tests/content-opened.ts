// Unit tests for the opened-PR scrape + generate content modules:
// - src/content/opened-scrape.ts: owner/repo/PR from the URL, existing
//   title extraction (h1-wrapped preferred), existing description
//   extraction (command-palette wrapper preferred).
// - src/content/opened-generate.ts: handler → chrome.runtime.sendMessage
//   wiring (payload shape, title modes, loading state), the two-phase review
//   gate (proposal modal, Apply, Cancel), plus the toast outcomes for the
//   error / bad-URL paths.
// src modules must evaluate only AFTER dom-stub has installed the globals,
// so they are imported dynamically (biome hoists static imports).
import { h, resetPage, setLocation } from "./dom-stub";
import { expectMatch, getFailures } from "./expect-helpers";
import {
  bgMessages,
  buildOpenedPrPage,
  OPENED_DESCRIPTION,
  OPENED_PR_URL,
  OPENED_TITLE,
  setBgResponder,
  toastState,
  waitUntil,
} from "./opened-fixtures";

// dom-stub's document has addEventListener but not removeEventListener; the
// review modal calls the latter when it closes.
(document as unknown as Record<string, unknown>).removeEventListener = () => {};

const REVIEW_MODAL_ID = "ai-pr-review-modal";
const REVIEW_FIELD_SELECTOR = ".ai-review-modal__field";
const REVIEW_APPLY_SELECTOR = ".ai-review-modal__btn--apply";
const REVIEW_CANCEL_SELECTOR = ".ai-review-modal__btn--cancel";

interface ReviewFieldStub {
  value: string;
  tagName: string;
  click: () => void;
}

function reviewModalOpen(): boolean {
  return document.getElementById(REVIEW_MODAL_ID) !== null;
}

function reviewField(): ReviewFieldStub | null {
  return document.querySelector(REVIEW_FIELD_SELECTOR) as unknown as ReviewFieldStub | null;
}

function clickReviewButton(selector: string): void {
  (document.querySelector(selector) as unknown as ReviewFieldStub | null)?.click();
}

const { extractExistingOpenedDescription, extractExistingOpenedTitle, extractOwnerRepoPRNumber } = await import(
  "../src/content/opened-scrape"
);
const { BTN_OPENED_DESC_ID, BTN_OPENED_TITLE_ID } = await import("../src/content/constants");
const { getButton } = await import("../src/content/dom");
const { injectOpenedPRButtons } = await import("../src/content/opened-buttons");
const { handleGenerateOpenedDescription, handleGenerateOpenedTitle } = await import("../src/content/opened-generate");

function testUrlExtraction(): void {
  console.log("--- opened-scrape: extractOwnerRepoPRNumber ---");
  const cases = [
    { url: OPENED_PR_URL, owner: "octo", repo: "hello-world", pr: "42" },
    { url: OPENED_PR_URL + "/files", owner: "octo", repo: "hello-world", pr: "42" },
    { url: OPENED_PR_URL + "?diff=split#discussion_r1", owner: "octo", repo: "hello-world", pr: "42" },
    { url: "https://github.com/octo/hello-world", owner: "octo", repo: "hello-world", pr: "" },
    { url: "https://github.com/", owner: "", repo: "", pr: "" },
  ];
  for (const c of cases) {
    setLocation(c.url);
    const ctx = extractOwnerRepoPRNumber();
    const label = c.url.replace("https://github.com", "");
    expectMatch(`ctx ${label}: owner`, ctx.owner, c.owner);
    expectMatch(`ctx ${label}: repo`, ctx.repo, c.repo);
    expectMatch(`ctx ${label}: prNumber`, ctx.prNumber, c.pr);
  }
}

function testTitleExtraction(): void {
  console.log("--- opened-scrape: extractExistingOpenedTitle ---");
  buildOpenedPrPage();
  expectMatch("h1-wrapped title extracted", extractExistingOpenedTitle(), OPENED_TITLE);

  // Two PH_Title spans; only the h1-wrapped one may be picked.
  const body = resetPage(OPENED_PR_URL);
  body.appendChild(h("div", { "data-component": "PH_Title" }, h("span", { class: "markdown-title" }, "stray")));
  body.appendChild(
    h("div", { "data-component": "PH_Title" }, h("h1", {}, h("span", { class: "markdown-title" }, "real title"))),
  );
  expectMatch("h1-wrapped span wins over earlier stray", extractExistingOpenedTitle(), "real title");

  resetPage(OPENED_PR_URL).appendChild(
    h("div", { "data-component": "PH_Title" }, h("span", { class: "markdown-title" }, "fallback title")),
  );
  expectMatch("no h1 anywhere: first span is the fallback", extractExistingOpenedTitle(), "fallback title");

  resetPage(OPENED_PR_URL);
  expectMatch("no title markup: empty string", extractExistingOpenedTitle(), "");
}

function testDescriptionExtraction(): void {
  console.log("--- opened-scrape: extractExistingOpenedDescription ---");
  buildOpenedPrPage();
  expectMatch("palette-wrapped body extracted", extractExistingOpenedDescription(), OPENED_DESCRIPTION);

  buildOpenedPrPage({ palette: false });
  expectMatch("bare js-comment-body fallback extracted", extractExistingOpenedDescription(), OPENED_DESCRIPTION);

  resetPage(OPENED_PR_URL);
  expectMatch("no comment body: empty string", extractExistingOpenedDescription(), "");
}

async function testGenerateTitleSuccess(): Promise<void> {
  console.log("--- opened-generate: title review-and-apply flow (fresh mode) ---");
  buildOpenedPrPage();
  injectOpenedPRButtons();
  bgMessages.length = 0;
  setBgResponder((msg) =>
    msg.type === "generateTitle"
      ? { title: "feat: improved parser fixes", updated: false }
      : { title: "applied", updated: true },
  );

  handleGenerateOpenedTitle("fresh");
  expectMatch("title button enters loading immediately", getButton(BTN_OPENED_TITLE_ID)?.disabled, true);
  expectMatch("desc button locked during title flow", getButton(BTN_OPENED_DESC_ID)?.disabled, true);
  expectMatch("background was called", await waitUntil(() => bgMessages.length === 1), true);
  const data = bgMessages[0]?.data ?? {};
  expectMatch("message type is generateTitle", bgMessages[0]?.type, "generateTitle");
  expectMatch("title data: owner", data.owner, "octo");
  expectMatch("title data: repo", data.repo, "hello-world");
  expectMatch("title data: prNumber", data.prNumber, "42");
  expectMatch("title data: fresh mode forwarded", data.titleMode, "fresh");
  expectMatch("title data: existing title scraped", data.existingTitle, OPENED_TITLE);
  expectMatch(
    "title data: branch context attached",
    JSON.stringify(data.branchContext),
    JSON.stringify({ owner: "octo", repo: "hello-world", baseBranch: "", headBranch: "" }),
  );
  expectMatch(
    "title button re-enabled once the review opens",
    await waitUntil(() => getButton(BTN_OPENED_TITLE_ID)?.disabled === false),
    true,
  );
  expectMatch("desc button re-enabled", getButton(BTN_OPENED_DESC_ID)?.disabled, false);

  // Review gate: the proposal is shown for editing; nothing is applied yet.
  expectMatch("review modal opens with the proposal", await waitUntil(reviewModalOpen), true);
  expectMatch("nothing applied before the user clicks Apply", bgMessages.length, 1);
  const field = reviewField();
  expectMatch("review field is a single-line input", field?.tagName, "INPUT");
  expectMatch("review field prefilled with the proposal", field?.value, "feat: improved parser fixes");

  // User edits the proposal, then applies it.
  if (field) field.value = "feat: user-edited approved title";
  clickReviewButton(REVIEW_APPLY_SELECTOR);
  expectMatch("apply message sent", await waitUntil(() => bgMessages.length === 2), true);
  expectMatch("apply message type", bgMessages[1]?.type, "applyTitleUpdate");
  expectMatch("apply carries the user-edited title", bgMessages[1]?.data?.title, "feat: user-edited approved title");
  expectMatch("apply targets the opened PR", bgMessages[1]?.data?.prNumber, "42");
  expectMatch(
    "success toast shown after apply",
    await waitUntil(() => toastState()?.text === "PR title updated via GitHub API!"),
    true,
  );
  expectMatch("success toast not error styled", toastState()?.isError, false);
  expectMatch("review modal closes after apply", await waitUntil(() => !reviewModalOpen()), true);
}

async function testGenerateTitleFailurePaths(): Promise<void> {
  console.log("--- opened-generate: title failure paths ---");

  // "error" response from the background → error toast, loading cleared.
  buildOpenedPrPage();
  injectOpenedPRButtons();
  bgMessages.length = 0;
  setBgResponder(() => ({ error: "boom" }));
  handleGenerateOpenedTitle();
  expectMatch("error flow called background", await waitUntil(() => bgMessages.length === 1), true);
  expectMatch("default title mode is improve", bgMessages[0]?.data?.titleMode, "improve");
  expectMatch("error toast", toastState()?.text, "Error: boom");
  expectMatch("error toast styled as error", toastState()?.isError, true);
  expectMatch(
    "error flow re-enables button",
    await waitUntil(() => getButton(BTN_OPENED_TITLE_ID)?.disabled === false),
    true,
  );

  // Proposal arrives → review modal; user cancels → no apply, cancel toast.
  buildOpenedPrPage();
  injectOpenedPRButtons();
  bgMessages.length = 0;
  setBgResponder(() => ({ title: "feat: x", updated: false }));
  handleGenerateOpenedTitle("improve");
  expectMatch("cancel flow: review modal opens", await waitUntil(reviewModalOpen), true);
  clickReviewButton(REVIEW_CANCEL_SELECTOR);
  expectMatch(
    "cancel toast",
    await waitUntil(() => toastState()?.text === "Update cancelled — the PR was not changed."),
    true,
  );
  expectMatch(
    "cancel sends no apply message",
    bgMessages.some((m) => m.type === "applyTitleUpdate"),
    false,
  );
  expectMatch("modal closed after cancel", reviewModalOpen(), false);

  // URL without PR context: client-side guard, no background call.
  buildOpenedPrPage();
  injectOpenedPRButtons();
  setLocation("https://github.com/octo/hello-world");
  bgMessages.length = 0;
  handleGenerateOpenedTitle("improve");
  expectMatch("bad URL: toast shown", await waitUntil(() => toastState() !== null), true);
  expectMatch("bad URL: no background call", bgMessages.length, 0);
  expectMatch("bad URL: toast explains", toastState()?.text, "Could not determine PR owner/repo/number from URL.");

  // No buttons at all: handlers are no-ops.
  resetPage(OPENED_PR_URL);
  bgMessages.length = 0;
  handleGenerateOpenedTitle("improve");
  handleGenerateOpenedDescription();
  expectMatch("no buttons: no background calls", bgMessages.length, 0);
  expectMatch("no buttons: no toast", toastState(), null);
}

async function testGenerateDescriptionSuccess(): Promise<void> {
  console.log("--- opened-generate: description review-and-apply flow ---");
  buildOpenedPrPage();
  injectOpenedPRButtons();
  bgMessages.length = 0;
  setBgResponder((msg) =>
    msg.type === "generateDescription"
      ? { body: "generated body", updated: false }
      : { body: "applied", updated: true },
  );

  handleGenerateOpenedDescription();
  expectMatch("desc button enters loading immediately", getButton(BTN_OPENED_DESC_ID)?.disabled, true);
  expectMatch("background was called", await waitUntil(() => bgMessages.length === 1), true);
  const data = bgMessages[0]?.data ?? {};
  expectMatch("message type is generateDescription", bgMessages[0]?.type, "generateDescription");
  expectMatch("desc data: prNumber", data.prNumber, "42");
  expectMatch("desc data: existing title scraped", data.existingTitle, OPENED_TITLE);
  expectMatch("desc data: existing description scraped", data.existingDescription, OPENED_DESCRIPTION);
  expectMatch(
    "desc flow re-enables desc button",
    await waitUntil(() => getButton(BTN_OPENED_DESC_ID)?.disabled === false),
    true,
  );
  expectMatch("desc flow re-enables title button", getButton(BTN_OPENED_TITLE_ID)?.disabled, false);

  // Review gate: multiline proposal shown for editing; nothing applied yet.
  expectMatch("review modal opens with the proposal", await waitUntil(reviewModalOpen), true);
  expectMatch("nothing applied before the user clicks Apply", bgMessages.length, 1);
  const field = reviewField();
  expectMatch("review field is a textarea", field?.tagName, "TEXTAREA");
  expectMatch("review field prefilled with the proposal", field?.value, "generated body");

  // User edits the proposal, then applies it.
  if (field) field.value = "reviewer-edited description body";
  clickReviewButton(REVIEW_APPLY_SELECTOR);
  expectMatch("apply message sent", await waitUntil(() => bgMessages.length === 2), true);
  expectMatch("apply message type", bgMessages[1]?.type, "applyDescriptionUpdate");
  expectMatch("apply carries the user-edited body", bgMessages[1]?.data?.body, "reviewer-edited description body");
  expectMatch(
    "desc success toast after apply",
    await waitUntil(() => toastState()?.text === "PR description updated via GitHub API!"),
    true,
  );
  expectMatch("review modal closes after apply", await waitUntil(() => !reviewModalOpen()), true);
}

async function testReviewModalReplacement(): Promise<void> {
  console.log("--- opened-generate: replacing the review modal closes the old instance ---");
  buildOpenedPrPage();
  injectOpenedPRButtons();
  bgMessages.length = 0;

  // Spy on document-level listener wiring so the leaked-Escape-listener
  // regression is observable in the stub DOM.
  const docAny = document as unknown as {
    addEventListener: (type: string, fn: unknown, capture?: boolean) => void;
    removeEventListener?: (type: string, fn: unknown, capture?: boolean) => void;
  };
  const origAdd = docAny.addEventListener;
  const keydownHandlers: unknown[] = [];
  const removedHandlers = new Set<unknown>();
  docAny.addEventListener = (type, fn, capture) => {
    if (type === "keydown") keydownHandlers.push(fn);
    origAdd(type, fn, capture);
  };
  docAny.removeEventListener = (type, fn) => {
    if (type === "keydown") removedHandlers.add(fn);
  };

  setBgResponder((msg) => (msg.type === "generateTitle" ? { title: "feat: proposal A", updated: false } : {}));
  handleGenerateOpenedTitle();
  expectMatch("replacement test: first modal open", await waitUntil(reviewModalOpen), true);
  expectMatch("first modal registered one keydown listener", keydownHandlers.length, 1);

  // Second flow fires while the first modal is still open: the replacement
  // must go through close() — detaching the old Escape listener — and must
  // not fire the stale onCancel.
  setBgResponder((msg) => (msg.type === "generateDescription" ? { body: "proposal B", updated: false } : {}));
  handleGenerateOpenedDescription();
  expectMatch(
    "replacement keeps exactly one modal",
    await waitUntil(() => reviewModalOpen() && document.querySelectorAll("#" + REVIEW_MODAL_ID).length === 1),
    true,
  );
  expectMatch("old keydown listener detached on replace", removedHandlers.has(keydownHandlers[0]), true);
  expectMatch("new modal registered its listener", keydownHandlers.length, 2);
  expectMatch("replacement shows the new proposal", reviewField()?.value, "proposal B");
  expectMatch("replacement field switched to textarea", reviewField()?.tagName, "TEXTAREA");
  expectMatch("stale onCancel did not fire", toastState()?.text ?? "", "");
  expectMatch(
    "no apply message before user acts",
    bgMessages.some((m) => (m.type ?? "").startsWith("apply")),
    false,
  );

  clickReviewButton(REVIEW_CANCEL_SELECTOR);
  expectMatch(
    "cancel toast belongs to the live modal",
    await waitUntil(() => toastState()?.text === "Update cancelled — the PR was not changed."),
    true,
  );
  expectMatch("modal closed after cancel", reviewModalOpen(), false);
  expectMatch("second keydown listener detached on cancel", removedHandlers.has(keydownHandlers[1]), true);
}

console.log("=== Content Script (opened PR scrape/generate) Tests ===\n");
testUrlExtraction();
testTitleExtraction();
testDescriptionExtraction();
await testGenerateTitleSuccess();
await testGenerateTitleFailurePaths();
await testGenerateDescriptionSuccess();
await testReviewModalReplacement();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All content opened-PR tests passed");
process.exit(0);
