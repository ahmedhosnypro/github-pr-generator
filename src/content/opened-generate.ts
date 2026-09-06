import type {
  ApplyDescriptionResponse,
  ApplyTitleResponse,
  GenerateDescriptionResponse,
  GenerateTitleResponse,
} from "../responses";
import type { TitleGenerationMode } from "../types";
import { BTN_OPENED_DESC_ID, BTN_OPENED_TITLE_ID } from "./constants";
import {
  clearButtonLoading,
  getButton,
  type ReviewControls,
  setButtonLoading,
  showReviewModal,
  showToast,
} from "./dom";
import { errorMessage, errorStack } from "./errors";
import { extractBranchContext } from "./extract-context";
import { log } from "./log";
import { sendToBackground } from "./messaging";
import {
  extractExistingOpenedDescription,
  extractExistingOpenedTitle,
  extractOwnerRepoPRNumber,
} from "./opened-scrape";

export function handleGenerateOpenedTitle(mode: TitleGenerationMode = "improve"): void {
  const btn = getButton(BTN_OPENED_TITLE_ID);
  if (!btn || btn.disabled) {
    log("warn", "Opened title button not found or disabled");
    return;
  }
  setButtonLoading(btn);
  const openedDescBtn = getButton(BTN_OPENED_DESC_ID);
  if (openedDescBtn) setButtonLoading(openedDescBtn);

  void generateOpenedTitle(mode).finally(() => {
    clearButtonLoading(btn);
    if (openedDescBtn) clearButtonLoading(openedDescBtn);
  });
}

async function generateOpenedTitle(mode: TitleGenerationMode): Promise<void> {
  try {
    const ctx = extractOwnerRepoPRNumber();
    const existingTitle = extractExistingOpenedTitle();
    const branchContext = extractBranchContext();
    if (!ctx.owner || !ctx.repo || !ctx.prNumber) {
      showToast("Could not determine PR owner/repo/number from URL.", true);
      return;
    }
    log("info", "handleGenerateOpenedTitle (" + mode + ") - PR context resolved, generating proposal");
    const response = await sendToBackground<GenerateTitleResponse>({
      type: "generateTitle",
      data: {
        owner: ctx.owner,
        repo: ctx.repo,
        prNumber: ctx.prNumber,
        titleMode: mode,
        existingTitle,
        branchContext,
      },
    });
    if ("error" in response) {
      log("error", "Error from background (generateTitle): " + response.error);
      showToast("Error: " + response.error, true);
      return;
    }
    if (!response.title) {
      showToast("The model returned an empty title proposal.", true);
      return;
    }
    showReviewModal({
      heading: "Review proposed PR title",
      value: response.title,
      onApply: (value, controls) => {
        void applyTitle(ctx.owner, ctx.repo, ctx.prNumber, value, controls);
      },
      onCancel: () => {
        showToast("Update cancelled — the PR was not changed.");
      },
    });
  } catch (err) {
    reportOpenedError("handleGenerateOpenedTitle", err);
  }
}

async function applyTitle(
  owner: string,
  repo: string,
  prNumber: string,
  title: string,
  controls: ReviewControls,
): Promise<void> {
  try {
    const response = await sendToBackground<ApplyTitleResponse>({
      type: "applyTitleUpdate",
      data: { owner, repo, prNumber, title },
    });
    if ("error" in response) {
      log("error", "Error from background (applyTitleUpdate): " + response.error);
      showToast("Error: " + response.error, true);
      controls.setBusy(false);
      return;
    }
    controls.close();
    showToast("PR title updated via GitHub API!");
  } catch (err) {
    reportOpenedError("applyTitleUpdate", err);
    controls.setBusy(false);
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
    log("info", "handleGenerateOpenedDescription - PR context resolved, generating proposal");
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
    if (!response.body) {
      showToast("The model returned an empty description proposal.", true);
      return;
    }
    showReviewModal({
      heading: "Review proposed PR description",
      value: response.body,
      multiline: true,
      onApply: (value, controls) => {
        void applyDescription(ctx.owner, ctx.repo, ctx.prNumber, value, controls);
      },
      onCancel: () => {
        showToast("Update cancelled — the PR was not changed.");
      },
    });
  } catch (err) {
    reportOpenedError("handleGenerateOpenedDescription", err);
  }
}

async function applyDescription(
  owner: string,
  repo: string,
  prNumber: string,
  body: string,
  controls: ReviewControls,
): Promise<void> {
  try {
    const response = await sendToBackground<ApplyDescriptionResponse>({
      type: "applyDescriptionUpdate",
      data: { owner, repo, prNumber, body },
    });
    if ("error" in response) {
      log("error", "Error from background (applyDescriptionUpdate): " + response.error);
      showToast("Error: " + response.error, true);
      controls.setBusy(false);
      return;
    }
    controls.close();
    showToast("PR description updated via GitHub API!");
  } catch (err) {
    reportOpenedError("applyDescriptionUpdate", err);
    controls.setBusy(false);
  }
}

function reportOpenedError(context: string, err: unknown): void {
  log("error", "Error in " + context + ": " + errorMessage(err) + " | Stack: " + errorStack(err));
  showToast("Error: " + errorMessage(err), true);
}
