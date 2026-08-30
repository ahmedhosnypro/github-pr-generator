import { log } from "./log";

export interface OwnerRepoPR {
  owner: string;
  repo: string;
  prNumber: string;
}

export function extractOwnerRepoPRNumber(): OwnerRepoPR {
  const pathParts = window.location.pathname.split("/").filter((p) => p.length > 0);
  return {
    owner: pathParts[0] ?? "",
    repo: pathParts[1] ?? "",
    prNumber: pathParts[3] ?? "",
  };
}

export function extractExistingOpenedTitle(): string {
  const titleEls = document.querySelectorAll('[data-component="PH_Title"] span.markdown-title');
  for (const el of titleEls) {
    if (el.closest("h1")) {
      const val = el.textContent.trim();
      log("info", "extractExistingOpenedTitle - " + val);
      return val;
    }
  }
  const first = titleEls[0];
  const fallback = first ? first.textContent.trim() : "";
  log("info", "extractExistingOpenedTitle (fallback) - " + fallback);
  return fallback;
}

export function extractExistingOpenedDescription(): string {
  let bodyEl = document.querySelector<HTMLElement>("div.js-command-palette-pull-body .js-comment-body");
  bodyEl ??= document.querySelector<HTMLElement>("div.js-comment-body");
  const val = bodyEl ? bodyEl.innerText || "" : "";
  log("info", "extractExistingOpenedDescription - length: " + String(val.length));
  return val;
}
