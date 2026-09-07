import type { GenerateMergeDescriptionResponse, GenerateMergeTitleResponse } from "../responses";
import { BTN_MERGE_DESC_ID, BTN_MERGE_TITLE_ID } from "./constants";
import { clearButtonLoading, createStreamingFill, getButton, setButtonLoading, setReactValue, showToast } from "./dom";
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

// Tracks a streaming fill plus the field value captured before the stream
// started, so an empty final parse or a mid-stream error can roll the field
// back instead of leaving partial streamed text committed.
interface StreamedField {
  fill: ReturnType<typeof createStreamingFill> | null;
  element: HTMLInputElement | HTMLTextAreaElement | null;
  prior: string | null;
}

function newStreamedField(): StreamedField {
  return { fill: null, element: null, prior: null };
}

function updateStreamedField(
  field: StreamedField,
  find: () => HTMLInputElement | HTMLTextAreaElement | null,
  value: string,
): void {
  if (!field.fill) {
    const el = find();
    if (el) {
      field.element = el;
      field.prior = el.value || "";
      field.fill = createStreamingFill(el);
    }
  }
  field.fill?.update(value);
}

/** Restores the pre-stream value once a streamed fill committed partial text. */
function rollbackStreamedField(field: StreamedField): boolean {
  if (field.element === null || field.prior === null) return false;
  setReactValue(field.element, field.prior);
  return true;
}

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
  const field = newStreamedField();
  let response: GenerateMergeTitleResponse;
  try {
    response = await streamFromBackground<GenerateMergeTitleResponse>(
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
        updateStreamedField(field, findMergeTitleInput, accumulated);
      },
    );
  } catch (err) {
    if (rollbackStreamedField(field)) {
      throw new Error(errorMessage(err) + " (the partial streamed text was rolled back)", { cause: err });
    }
    throw err;
  }
  field.fill?.finish();
  if (response.title.trim().length > 0) {
    fillMergeFields(response.title, "");
    showToast("Merge commit title generated!");
  } else if (rollbackStreamedField(field)) {
    // The parse came back empty after partial text was already committed —
    // restore the pre-stream value instead of leaving a truncated title.
    showToast("Merge title was empty — restored the previous title.", true);
  } else {
    showToast("Merge title was empty — nothing applied.", true);
  }
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
  const field = newStreamedField();
  let response: GenerateMergeDescriptionResponse;
  try {
    response = await streamFromBackground<GenerateMergeDescriptionResponse>(
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
        updateStreamedField(field, findMergeDescTextarea, accumulated);
      },
    );
  } catch (err) {
    if (rollbackStreamedField(field)) {
      throw new Error(errorMessage(err) + " (the partial streamed text was rolled back)", { cause: err });
    }
    throw err;
  }
  field.fill?.finish();
  if (response.description.trim().length > 0) {
    fillMergeFields("", response.description);
    showToast("Merge commit description generated!");
  } else if (rollbackStreamedField(field)) {
    showToast("Merge description was empty — restored the previous description.", true);
  } else {
    showToast("Merge description was empty — nothing applied.", true);
  }
}
