import type { GenerateMergeDescriptionResponse, GenerateMergeTitleResponse } from "../responses";
import type { OpenedPRData } from "../types";
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
type MergeFieldElement = HTMLInputElement | HTMLTextAreaElement;

interface StreamedField {
  fill: ReturnType<typeof createStreamingFill> | null;
  element: MergeFieldElement | null;
  prior: string | null;
}

function newStreamedField(): StreamedField {
  return { fill: null, element: null, prior: null };
}

function updateStreamedField(field: StreamedField, find: () => MergeFieldElement | null, value: string): void {
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

type MergeGenerateData = Omit<OpenedPRData, "owner" | "repo" | "prNumber">;
type MergeGenerateResponse = GenerateMergeTitleResponse | GenerateMergeDescriptionResponse;

// Everything that differs between the merge title and merge description
// streaming flows: button wiring, scraped fields, target field, response
// accessor, and toasts. The shared runner in streamMergeResult drives both.
interface MergeGenerateFlowSpec<T extends MergeGenerateResponse> {
  buttonId: string;
  siblingButtonId: string;
  notFoundLog: string;
  handlerName: string;
  requestType: "generateMergeTitle" | "generateMergeDescription";
  collect: () => MergeGenerateData;
  findField: () => MergeFieldElement | null;
  resultText: (response: T) => string;
  apply: (text: string) => void;
  successToast: string;
  emptyRestoredToast: string;
  emptyNothingToast: string;
}

const MERGE_TITLE_FLOW: MergeGenerateFlowSpec<GenerateMergeTitleResponse> = {
  buttonId: BTN_MERGE_TITLE_ID,
  siblingButtonId: BTN_MERGE_DESC_ID,
  notFoundLog: "Merge title button not found or disabled",
  handlerName: "handleGenerateMergeTitle",
  requestType: "generateMergeTitle",
  collect: () => {
    const existingTitle = extractExistingOpenedTitle();
    const existingMergeTitle = extractExistingMergeTitle();
    const branchContext = extractBranchContext();
    const existingDescription = extractExistingOpenedDescription();
    return { existingTitle, existingMergeTitle, existingDescription, branchContext };
  },
  findField: findMergeTitleInput,
  resultText: (response) => {
    return response.title;
  },
  apply: (text) => {
    fillMergeFields(text, "");
  },
  successToast: "Merge commit title generated!",
  emptyRestoredToast: "Merge title was empty — restored the previous title.",
  emptyNothingToast: "Merge title was empty — nothing applied.",
};

const MERGE_DESC_FLOW: MergeGenerateFlowSpec<GenerateMergeDescriptionResponse> = {
  buttonId: BTN_MERGE_DESC_ID,
  siblingButtonId: BTN_MERGE_TITLE_ID,
  notFoundLog: "Merge desc button not found or disabled",
  handlerName: "handleGenerateMergeDescription",
  requestType: "generateMergeDescription",
  collect: () => {
    const existingTitle = extractExistingOpenedTitle();
    const existingMergeTitle = extractExistingMergeTitle();
    const existingDescription = extractExistingOpenedDescription();
    const existingMergeDescription = extractExistingMergeDescription();
    const branchContext = extractBranchContext();
    return { existingTitle, existingMergeTitle, existingDescription, existingMergeDescription, branchContext };
  },
  findField: findMergeDescTextarea,
  resultText: (response) => {
    return response.description;
  },
  apply: (text) => {
    fillMergeFields("", text);
  },
  successToast: "Merge commit description generated!",
  emptyRestoredToast: "Merge description was empty — restored the previous description.",
  emptyNothingToast: "Merge description was empty — nothing applied.",
};

export async function handleGenerateMergeTitle(): Promise<void> {
  await runMergeGenerateFlow(MERGE_TITLE_FLOW);
}

export async function handleGenerateMergeDescription(): Promise<void> {
  await runMergeGenerateFlow(MERGE_DESC_FLOW);
}

async function runMergeGenerateFlow<T extends MergeGenerateResponse>(spec: MergeGenerateFlowSpec<T>): Promise<void> {
  const btn = getButton(spec.buttonId);
  if (!btn || btn.disabled) {
    log("warn", spec.notFoundLog);
    return;
  }
  setButtonLoading(btn);
  const siblingBtn = getButton(spec.siblingButtonId);
  if (siblingBtn) setButtonLoading(siblingBtn);

  try {
    await streamMergeResult(spec);
  } catch (err) {
    log("error", "Error in " + spec.handlerName + ": " + errorMessage(err) + " | Stack: " + errorStack(err));
    showToast("Error: " + errorMessage(err), true);
  } finally {
    clearButtonLoading(btn);
    if (siblingBtn) clearButtonLoading(siblingBtn);
  }
}

async function streamMergeResult<T extends MergeGenerateResponse>(spec: MergeGenerateFlowSpec<T>): Promise<void> {
  const ctx = extractOwnerRepoPRNumber();
  const existing = spec.collect();
  if (!ctx.owner || !ctx.repo || !ctx.prNumber) {
    showToast("Could not determine PR owner/repo/number from URL.", true);
    return;
  }
  log("info", spec.handlerName + " - " + JSON.stringify(ctx));
  let accumulated = "";
  const field = newStreamedField();
  let response: T;
  try {
    response = await streamFromBackground<T>(
      {
        type: spec.requestType,
        data: {
          owner: ctx.owner,
          repo: ctx.repo,
          prNumber: ctx.prNumber,
          ...existing,
        },
      },
      (delta) => {
        accumulated += delta;
        updateStreamedField(field, spec.findField, accumulated);
      },
    );
  } catch (err) {
    if (rollbackStreamedField(field)) {
      throw new Error(errorMessage(err) + " (the partial streamed text was rolled back)", { cause: err });
    }
    throw err;
  }
  field.fill?.finish();
  const text = spec.resultText(response);
  if (text.trim().length > 0) {
    spec.apply(text);
    showToast(spec.successToast);
  } else if (rollbackStreamedField(field)) {
    // The parse came back empty after partial text was already committed —
    // restore the pre-stream value instead of leaving truncated text.
    showToast(spec.emptyRestoredToast, true);
  } else {
    showToast(spec.emptyNothingToast, true);
  }
}
