import type { GenerateResponse } from "../responses";
import { BTN_DESC_ID, BTN_ID } from "./constants";
import { clearButtonLoading, getButton, setButtonLoading, setReactValue, showToast } from "./dom";
import { errorMessage, errorStack } from "./errors";
import { extractCommits, extractLinkedIssues, extractStats } from "./extract-commits";
import { extractBranchContext, extractFileChanges } from "./extract-context";
import { log } from "./log";
import { sendToBackground } from "./messaging";

function extractExistingBody(): string {
  const textarea = document.querySelector<HTMLTextAreaElement>("textarea#pull_request_body");
  const value = textarea ? textarea.value || "" : "";
  log("info", "extractExistingBody - length: " + String(value.length));
  return value;
}

function fillPRFields(title: string, description: string): void {
  log(
    "info",
    "fillPRFields called - title: " + title + ", description length: " + String(description ? description.length : 0),
  );
  const titleInput = document.querySelector<HTMLInputElement>('input[name="pull_request[title]"]');
  const bodyTextarea = document.querySelector<HTMLTextAreaElement>("textarea#pull_request_body");

  if (titleInput) {
    setReactValue(titleInput, title);
    titleInput.focus();
    titleInput.blur();
    log("info", "Title input filled");
  } else {
    log("error", "Title input not found!");
  }

  if (bodyTextarea) {
    setReactValue(bodyTextarea, description);
    bodyTextarea.dispatchEvent(new Event("change", { bubbles: true }));
    log("info", "Description textarea filled");

    const writeTab = document.querySelector<HTMLButtonElement>(
      'button.write-tab.js-write-tab:not([aria-selected="true"])',
    );
    if (writeTab) {
      writeTab.click();
    }
  } else {
    log("error", "Description textarea not found!");
  }
}

async function runGenerate(): Promise<void> {
  const commits = extractCommits();
  const fileChanges = extractFileChanges();
  const stats = extractStats();
  const branchContext = extractBranchContext();
  const linkedIssues = extractLinkedIssues(commits);
  const existingBody = extractExistingBody();
  log(
    "info",
    "Extracted - commits: " +
      String(commits.length) +
      ", files: " +
      String(fileChanges.length) +
      ", stats: " +
      JSON.stringify(stats) +
      ", branch: " +
      JSON.stringify(branchContext) +
      ", issues: " +
      String(linkedIssues.length),
  );

  if (commits.length === 0 && fileChanges.length === 0) {
    log("error", "No commits or file changes found");
    showToast("No commits or file changes found on this page.", true);
    return;
  }

  log("info", "Sending message to background script...");
  const response = await sendToBackground<GenerateResponse>({
    type: "generate",
    data: {
      commits: commits.map((c) => ({ message: c.message })),
      fileChanges,
      stats,
      branchContext,
      linkedIssues,
      existingBody,
    },
  });
  log("info", "Response from background: " + JSON.stringify(response));

  if ("error" in response) {
    log("error", "Error from background: " + response.error);
    log("error", "Full response object: " + response.error);
    showToast("Error: " + response.error, true);
    return;
  }

  fillPRFields(response.title, response.description);
  log("info", "PR fields filled successfully - title: " + response.title);
  showToast("PR title and description generated!");
}

export async function handleGenerate(): Promise<void> {
  const titleBtn = getButton(BTN_ID);
  const descBtn = getButton(BTN_DESC_ID);
  const activeBtn = titleBtn ?? descBtn;
  log(
    "info",
    "handleGenerate called - titleBtn: " + String(Boolean(titleBtn)) + ", descBtn: " + String(Boolean(descBtn)),
  );
  if (!activeBtn) {
    log("error", "No active button found");
    return;
  }
  if (activeBtn.disabled) {
    log("warn", "Button is disabled");
    return;
  }

  setButtonLoading(activeBtn);
  if (descBtn && descBtn !== activeBtn) setButtonLoading(descBtn);

  try {
    await runGenerate();
  } catch (err) {
    log("error", "Error in handleGenerate: " + errorMessage(err) + " | Stack: " + errorStack(err));
    showToast("Error: " + errorMessage(err), true);
  } finally {
    clearButtonLoading(activeBtn);
    if (descBtn && descBtn !== activeBtn) clearButtonLoading(descBtn);
  }
}
