// Fixtures and test plumbing shared by the opened-PR content-script tests
// (tests/content-opened.ts, tests/content-opened-buttons.ts): a GitHub
// opened-PR page builder, toast inspection, a chrome.runtime.sendMessage
// capture (dom-stub's chrome has no sendMessage — the opened-PR generate
// flows use it, unlike the merge flow's stream port), and an async poll.
import type { StubElement } from "./dom-stub";
import { h, resetPage, StubElement as StubElementClass, tick } from "./dom-stub";

// The shared stub models appendChild/prepend but not multi-node append(),
// which opened-buttons.ts uses when assembling the split title button.
(StubElementClass.prototype as unknown as Record<string, unknown>).append = function (
  this: StubElement,
  ...nodes: StubElement[]
): void {
  for (const node of nodes) this.appendChild(node);
};

export const OPENED_PR_URL = "https://github.com/octo/hello-world/pull/42";
export const TOAST_ID = "ai-pr-generator-toast";
export const OPENED_TITLE = "fix: repair the diff parser";
export const OPENED_DESCRIPTION = "The original description body.";

export interface OpenedPrPage {
  body: StubElement;
  titleArea: StubElement;
  titleSpan: StubElement;
  commentBody: StubElement;
  actionsDiv: StubElement;
}

// Mirrors GitHub's opened-PR page: PH_Title > h1 > span.markdown-title for the
// title, and a timeline comment whose body sits under the command-palette
// wrapper (set palette:false for the bare .js-comment-body fallback shape).
export function buildOpenedPrPage(opts: { palette?: boolean } = {}): OpenedPrPage {
  const body = resetPage(OPENED_PR_URL);
  const titleSpan = h("span", { class: "markdown-title" }, OPENED_TITLE);
  const titleArea = h("div", { "data-component": "PH_Title" }, h("h1", {}, titleSpan));
  const commentBody = h("div", { class: "js-comment-body" }, OPENED_DESCRIPTION);
  const actionsDiv = h("div", { class: "timeline-comment-actions" });
  const header = h("div", { class: "timeline-comment-header" }, actionsDiv);
  const wrappedBody =
    opts.palette === false ? commentBody : h("div", { class: "js-command-palette-pull-body" }, commentBody);
  const group = h("div", { class: "timeline-comment-group" }, header, wrappedBody);
  body.appendChild(titleArea);
  body.appendChild(group);
  return { body, titleArea, titleSpan, commentBody, actionsDiv };
}

export function toastState(): { text: string; isError: boolean } | null {
  const toast = document.getElementById(TOAST_ID);
  if (toast === null) return null;
  const stub = toast as unknown as StubElement;
  return { text: stub.textContent, isError: stub.classNameList.includes("ai-pr-generator-toast--error") };
}

// Poll a condition across macrotasks so click-dispatched `void handle*()`
// chains can settle before asserting.
export async function waitUntil(cond: () => boolean): Promise<boolean> {
  for (let i = 0; i < 100; i++) {
    if (cond()) return true;
    await tick();
  }
  return false;
}

export interface BgMessage {
  type?: string;
  data?: Record<string, unknown>;
}

/** Every chrome.runtime.sendMessage payload, in order. */
export const bgMessages: BgMessage[] = [];

function defaultResponder(_message: BgMessage): unknown {
  return {};
}

let bgResponder: (message: BgMessage) => unknown = defaultResponder;

export function setBgResponder(responder: (message: BgMessage) => unknown): void {
  bgResponder = responder;
}

(chrome.runtime as unknown as Record<string, unknown>).sendMessage = (
  message: BgMessage,
  callback: (response: unknown) => void,
): void => {
  bgMessages.push(message);
  callback(bgResponder(message));
};
