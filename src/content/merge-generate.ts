import type { GenerateMergeDescriptionResponse, GenerateMergeTitleResponse } from "../responses";
import { BTN_MERGE_DESC_ID, BTN_MERGE_TITLE_ID } from "./constants";
import { clearButtonLoading, getButton, setButtonLoading, setReactValue, showToast } from "./dom";
import { errorMessage, errorStack } from "./errors";
import { extractBranchContext } from "./extract-context";
import { log } from "./log";
import {
  extractExistingMergeDescription,
  extractExistingMergeTitle,
  fillMergeFields,
  findMergeDescTextarea,
  findMergeTitleInput,
} from "./merge-fields";
import {
  extractExistingOpenedDescription,
  extractExistingOpenedTitle,
  extractOwnerRepoPRNumber,
} from "./opened-scrape";
import { streamFromBackground } from "./stream";

export async function handleGenerateMergeTitle(): Promise<void> {
  const btn = getButton(BTN_MERGE_TITLE_ID);
  if (!btn || btn.disabled) {
    log("warn", "Merge title button not found or disabled");
    return;
  }
  setButtonLoading(btn);
  const mergeDescBtn = getButton(BTN_MERGE_DESC_ID);
  if (mergeDescBtn) setButtonLoading(mergeDescBtn);

  try {
    await generateMergeTitle();
  } catch (err) {
    log("error", "Error in handleGenerateMergeTitle: " + errorMessage(err) + " | Stack: " + errorStack(err));
    showToast("Error: " + errorMessage(err), true);
  } finally {
    clearButtonLoading(btn);
    if (mergeDescBtn) clearButtonLoading(mergeDescBtn);
  }
}

async function generateMergeTitle(): Promise<void> {
  const ctx = extractOwnerRepoPRNumber();
  const existingTitle = extractExistingOpenedTitle();
  const existingMergeTitle = extractExistingMergeTitle();
  const branchContext = extractBranchContext();
  const existingDescription = extractExistingOpenedDescription();
  if (!ctx.owner || !ctx.repo || !ctx.prNumber) {
    showToast("Could not determine PR owner/repo/number from URL.", true);
    return;
  }
  log("info", "handleGenerateMergeTitle - " + JSON.stringify(ctx));
  let accumulated = "";
  const response = await streamFromBackground<GenerateMergeTitleResponse>(
    {
      type: "generateMergeTitle",
      data: {
        owner: ctx.owner,
        repo: ctx.repo,
        prNumber: ctx.prNumber,
        existingTitle,
        existingMergeTitle,
        existingDescription,
        branchContext,
      },
    },
    (delta) => {
      accumulated += delta;
      const input = findMergeTitleInput();
      if (input) setReactValue(input, accumulated);
    },
  );
  fillMergeFields(response.title, "");
  showToast("Merge commit title generated!");
}

export async function handleGenerateMergeDescription(): Promise<void> {
  const btn = getButton(BTN_MERGE_DESC_ID);
  if (!btn || btn.disabled) {
    log("warn", "Merge desc button not found or disabled");
    return;
  }
  setButtonLoading(btn);
  const mergeTitleBtn = getButton(BTN_MERGE_TITLE_ID);
  if (mergeTitleBtn) setButtonLoading(mergeTitleBtn);

  try {
    await generateMergeDescription();
  } catch (err) {
    log("error", "Error in handleGenerateMergeDescription: " + errorMessage(err) + " | Stack: " + errorStack(err));
    showToast("Error: " + errorMessage(err), true);
  } finally {
    clearButtonLoading(btn);
    if (mergeTitleBtn) clearButtonLoading(mergeTitleBtn);
  }
}

async function generateMergeDescription(): Promise<void> {
  const ctx = extractOwnerRepoPRNumber();
  const existingTitle = extractExistingOpenedTitle();
  const existingMergeTitle = extractExistingMergeTitle();
  const existingDescription = extractExistingOpenedDescription();
  const existingMergeDesc = extractExistingMergeDescription();
  const branchContext = extractBranchContext();
  if (!ctx.owner || !ctx.repo || !ctx.prNumber) {
    showToast("Could not determine PR owner/repo/number from URL.", true);
    return;
  }
  log("info", "handleGenerateMergeDescription - " + JSON.stringify(ctx));
  let accumulated = "";
  const response = await streamFromBackground<GenerateMergeDescriptionResponse>(
    {
      type: "generateMergeDescription",
      data: {
        owner: ctx.owner,
        repo: ctx.repo,
        prNumber: ctx.prNumber,
        existingTitle,
        existingMergeTitle,
        existingDescription,
        existingMergeDescription: existingMergeDesc,
        branchContext,
      },
    },
    (delta) => {
      accumulated += delta;
      const textarea = findMergeDescTextarea();
      if (textarea) setReactValue(textarea, accumulated);
    },
  );
  fillMergeFields("", response.description);
  showToast("Merge commit description generated!");
}
