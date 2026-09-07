import type { GenerateResponse } from "../responses";
import { BTN_DESC_ID, BTN_ID } from "./constants";
import {
  clearButtonLoading,
  createStreamingFill,
  getButton,
  type StreamingFieldFill,
  setButtonLoading,
  setReactValue,
  showToast,
} from "./dom";
import { errorMessage, errorStack } from "./errors";
import { extractCommits, extractLinkedIssues, extractStats } from "./extract-commits";
import { extractBranchContext, extractFileChanges } from "./extract-context";
import { log } from "./log";
import { splitStreamedCombined, streamFromBackground } from "./stream";

/** Per-token fill during streaming: batched via createStreamingFill so each chunk updates the value but events fire at most once per batch window. */
interface StreamingFillState {
  fill: StreamingFieldFill;
  element: HTMLInputElement | HTMLTextAreaElement;
  /** Field value captured before the stream started, for rollback. */
  prior: string;
}

interface StreamingFills {
  title: StreamingFillState | null;
  desc: StreamingFillState | null;
}

function fillPRFieldsStreaming(fills: StreamingFills, title: string, description: string): void {
  if (title) {
    if (!fills.title) {
      const el = document.querySelector<HTMLInputElement>('input[name="pull_request[title]"]');
      if (el) fills.title = { fill: createStreamingFill(el), element: el, prior: el.value || "" };
    }
    fills.title?.fill.update(title);
  }
  if (description) {
    if (!fills.desc) {
      const el = document.querySelector<HTMLTextAreaElement>("textarea#pull_request_body");
      if (el) fills.desc = { fill: createStreamingFill(el), element: el, prior: el.value || "" };
    }
    fills.desc?.fill.update(description);
  }
}

// An empty final parse or a mid-stream error must not leave partial streamed
// text committed: restore what each streamed field held before generation.
function rollbackStreamingFills(fills: StreamingFills): boolean {
  let rolledBack = false;
  for (const state of [fills.title, fills.desc]) {
    if (state) {
      setReactValue(state.element, state.prior);
      rolledBack = true;
    }
  }
  return rolledBack;
}

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
    // Never overwrite the user's existing title with an empty parse result.
    if (title.trim().length > 0) {
      setReactValue(titleInput, title);
      titleInput.focus();
      titleInput.blur();
      log("info", "Title input filled");
    } else {
      log("warn", "Skipped empty title — keeping the user's existing value");
    }
  } else {
    log("error", "Title input not found!");
  }

  if (bodyTextarea) {
    if (description.trim().length > 0) {
      setReactValue(bodyTextarea, description);
      bodyTextarea.dispatchEvent(new Event("change", { bubbles: true }));
      log("info", "Description textarea filled");
    } else {
      log("warn", "Skipped empty description — keeping the user's existing text");
    }

    const writeTab = document.querySelector<HTMLButtonElement>(
      'button.write-tab.js-write-tab:not([aria-selected="true"])',
    );
    if (writeTab) {
      writeTab.click();
    } else {
      // React editor (or Write already selected) has no classic write-tab:
      // the synthetic input event from setReactValue above is what React
      // listens to, so no tab switch is needed.
      log("info", "No write-tab to activate (React editor or write already selected)");
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

  log("info", "Streaming generate request over background port...");
  let accumulated = "";
  const fills: StreamingFills = { title: null, desc: null };
  let result: GenerateResponse;
  try {
    result = await streamFromBackground<GenerateResponse>(
      {
        type: "generate",
        data: {
          commits: commits.map((c) => ({ message: c.message })),
          fileChanges,
          stats,
          branchContext,
          linkedIssues,
          existingBody,
        },
      },
      (delta) => {
        accumulated += delta;
        const partial = splitStreamedCombined(accumulated);
        fillPRFieldsStreaming(fills, partial.title, partial.description);
      },
    );
  } catch (err) {
    if (rollbackStreamingFills(fills)) {
      throw new Error(errorMessage(err) + " (the partial streamed text was rolled back)", { cause: err });
    }
    throw err;
  }
  log("info", "Stream completed");

  // Commit the final batch of events before the authoritative fill below.
  fills.title?.fill.finish();
  fills.desc?.fill.finish();
  fillPRFields(result.title, result.description);
  if (result.title.trim().length > 0 || result.description.trim().length > 0) {
    log("info", "PR fields filled successfully - title: " + result.title);
    showToast("PR title and description generated!");
  } else if (rollbackStreamingFills(fills)) {
    // The final parse dropped everything the stream previewed — restore the
    // pre-stream field values rather than leaving truncated partials behind.
    showToast("The model returned an empty response — restored the previous text.", true);
  } else {
    showToast("The model returned an empty response — nothing was applied.", true);
  }
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
