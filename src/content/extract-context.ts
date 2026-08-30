import type { BranchContext, FileChange, FileChangeType } from "../types";
import { log } from "./log";

export function extractFileChanges(): FileChange[] {
  const files: FileChange[] = [];
  const tocItems = document.querySelectorAll("#toc ol.content li");

  for (const li of tocItems) {
    const link = li.querySelector('a[href^="#diff-"]');
    if (!link) continue;
    const path = link.textContent.trim();
    const diffAnchor = link.getAttribute("href") ?? "";

    // Validate anchor format: must be GitHub diff hash (e.g., #diff-abc123...)
    const validDiffAnchor = /^#diff-[a-zA-Z0-9_-]{40,}$/.test(diffAnchor) ? diffAnchor : "";
    if (diffAnchor && !validDiffAnchor) {
      log("warn", "extractFileChanges - invalid diff anchor dropped: " + diffAnchor);
    }

    const type = changeTypeOf(li);
    const { additions, deletions } = changeCounts(li);

    files.push({ path, type, additions, deletions, diffAnchor: validDiffAnchor });
  }

  return files;
}

function changeTypeOf(li: Element): FileChangeType {
  if (li.querySelector(".octicon-diff-added")) return "added";
  if (li.querySelector(".octicon-diff-removed")) return "removed";
  if (li.querySelector(".octicon-diff-renamed")) return "renamed";
  return "modified";
}

function changeCounts(li: Element): { additions: number; deletions: number } {
  const successEl = li.querySelector(".color-fg-success");
  const dangerEl = li.querySelector(".color-fg-danger");
  const additions = successEl ? parseInt(successEl.textContent.replace("+", "").trim(), 10) || 0 : 0;
  const deletions = dangerEl ? parseInt(dangerEl.textContent.replace("−", "").replace("-", "").trim(), 10) || 0 : 0;
  return { additions, deletions };
}

function readBranchInputs(): [string, string] {
  const baseSelect = document.querySelector<HTMLSelectElement>('select[name="pull_request[base]"]');
  const headInput = document.querySelector<HTMLInputElement>('input[name="pull_request[head]"]');
  return [baseSelect ? baseSelect.value || "" : "", headInput ? headInput.value || "" : ""];
}

function applyCompareUrl(url: string, base: string, head: string): [string, string] {
  if (base && head) return [base, head];
  const match = /\/compare\/([^?#\s]+?)(?:\?|$|\s)/.exec(url);
  const spec = match?.[1];
  if (spec === undefined) return [base, head];
  const parts = spec.split("...");
  const first = parts[0];
  const second = parts[1];
  if (parts.length === 2) {
    if (!base && first !== undefined) base = first;
    if (!head && second !== undefined) head = second;
  } else if (parts.length === 1 && !head && first !== undefined) {
    head = first;
  }
  return [base, head];
}

function applyBranchTextNodes(selector: string, base: string, head: string): [string, string] {
  const els = document.querySelectorAll(selector);
  const first = els[0];
  const second = els[1];
  if (els.length >= 2) {
    if (!base && first) base = first.textContent.trim();
    if (!head && second) head = second.textContent.trim();
  } else if (els.length === 1 && !head && first) {
    head = first.textContent.trim();
  }
  return [base, head];
}

function stripNamespace(branch: string): string {
  if (branch.includes(":")) {
    return branch.split(":").pop() ?? branch;
  }
  return branch;
}

export function extractBranchContext(): BranchContext {
  const url = window.location.href;
  const pathParts = window.location.pathname.split("/").filter((p) => p.length > 0);
  const owner = pathParts[0] ?? "";
  const repo = pathParts[1] ?? "";

  let [baseBranch, headBranch] = readBranchInputs();
  [baseBranch, headBranch] = applyCompareUrl(url, baseBranch, headBranch);
  [baseBranch, headBranch] = applyBranchTextNodes(".branch-name", baseBranch, headBranch);
  [baseBranch, headBranch] = applyBranchTextNodes(".ref-name", baseBranch, headBranch);
  headBranch = stripNamespace(headBranch);
  baseBranch = stripNamespace(baseBranch);

  const result: BranchContext = { owner, repo, baseBranch, headBranch };
  log("info", "extractBranchContext - " + JSON.stringify(result));
  return result;
}
