import type { GenerateDescriptionResponse, GenerateTitleResponse } from "../responses";
import { BTN_OPENED_DESC_ID, BTN_OPENED_TITLE_ID } from "./constants";
import { clearButtonLoading, getButton, setButtonLoading, showToast } from "./dom";
import { errorMessage, errorStack } from "./errors";
import { extractBranchContext } from "./extract-context";
import { log } from "./log";
import { sendToBackground } from "./messaging";
import {
  extractExistingOpenedDescription,
  extractExistingOpenedTitle,
  extractOwnerRepoPRNumber,
} from "./opened-scrape";

export function handleGenerateOpenedTitle(): void {
  const btn = getButton(BTN_OPENED_TITLE_ID);
  if (!btn || btn.disabled) {
    log("warn", "Opened title button not found or disabled");
    return;
  }
  setButtonLoading(btn);
  const openedDescBtn = getButton(BTN_OPENED_DESC_ID);
  if (openedDescBtn) setButtonLoading(openedDescBtn);

  void generateOpenedTitle().finally(() => {
    clearButtonLoading(btn);
    if (openedDescBtn) clearButtonLoading(openedDescBtn);
  });
}

async function generateOpenedTitle(): Promise<void> {
  try {
    const ctx = extractOwnerRepoPRNumber();
    const existingTitle = extractExistingOpenedTitle();
    const branchContext = extractBranchContext();
    if (!ctx.owner || !ctx.repo || !ctx.prNumber) {
      showToast("Could not determine PR owner/repo/number from URL.", true);
      return;
    }
    log("info", "handleGenerateOpenedTitle - " + JSON.stringify(ctx));
    const response = await sendToBackground<GenerateTitleResponse>({
      type: "generateTitle",
      data: {
        owner: ctx.owner,
        repo: ctx.repo,
        prNumber: ctx.prNumber,
        existingTitle,
        branchContext,
      },
    });
    if ("error" in response) {
      log("error", "Error from background (generateTitle): " + response.error);
      showToast("Error: " + response.error, true);
      return;
    }
    if (response.updated) {
      showToast("PR title updated via GitHub API!");
    } else {
      showToast("Title generated but update status unknown.");
    }
  } catch (err) {
    reportOpenedError("handleGenerateOpenedTitle", err);
  }
}

export function handleGenerateOpenedDescription(): void {
  const btn = getButton(BTN_OPENED_DESC_ID);
  if (!btn || btn.disabled) {
    log("warn", "Opened desc button not found or disabled");
    return;
  }
  setButtonLoading(btn);
  const openedTitleBtn = getButton(BTN_OPENED_TITLE_ID);
  if (openedTitleBtn) setButtonLoading(openedTitleBtn);

  void generateOpenedDescription().finally(() => {
    clearButtonLoading(btn);
    if (openedTitleBtn) clearButtonLoading(openedTitleBtn);
  });
}

async function generateOpenedDescription(): Promise<void> {
  try {
    const ctx = extractOwnerRepoPRNumber();
    const existingTitle = extractExistingOpenedTitle();
    const existingDescription = extractExistingOpenedDescription();
    const branchContext = extractBranchContext();
    if (!ctx.owner || !ctx.repo || !ctx.prNumber) {
      showToast("Could not determine PR owner/repo/number from URL.", true);
      return;
    }
    log("info", "handleGenerateOpenedDescription - " + JSON.stringify(ctx));
    const response = await sendToBackground<GenerateDescriptionResponse>({
      type: "generateDescription",
      data: {
        owner: ctx.owner,
        repo: ctx.repo,
        prNumber: ctx.prNumber,
        existingTitle,
        existingDescription,
        branchContext,
      },
    });
    if ("error" in response) {
      log("error", "Error from background (generateDescription): " + response.error);
      showToast("Error: " + response.error, true);
      return;
    }
    if (response.updated) {
      showToast("PR description updated via GitHub API!");
    } else {
      showToast("Description generated but update status unknown.");
    }
  } catch (err) {
    reportOpenedError("handleGenerateOpenedDescription", err);
  }
}

function reportOpenedError(context: string, err: unknown): void {
  log("error", "Error in " + context + ": " + errorMessage(err) + " | Stack: " + errorStack(err));
  showToast("Error: " + errorMessage(err), true);
}
