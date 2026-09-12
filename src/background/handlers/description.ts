import type {
  ApplyDescriptionResponse,
  ApplyDescriptionUpdateData,
  GenerateDescriptionResponse,
  OpenedPRData,
} from "../../types";
import { hydrateMissingDiffAnchors } from "../anchor-hash";
import { discoverRepoStyle } from "../github/discovery";
import { updatePRField } from "../github/pr";
import { resolveDiffLinks } from "../linkify";
import { callAPI } from "../llm";
import { logMsg } from "../log";
import { isLikelyTemplate } from "../prompts/common";
import { buildDescriptionOnlyPrompt } from "../prompts/pr-prompts";
import { buildChangesSummary, countUsableAnchors, hasUsableAnchors } from "../summary";
import { gatherForFieldUpdate, parseAndRefineDescription, prepareFieldApply } from "./shared";

const TOKEN_REQUIRED_MESSAGE =
  "GitHub Personal Access Token is required to update PR description. Set it in the extension popup (needs 'repo' scope).";

/**
 * Generate phase of the opened-PR description flow: gathers context, calls the
 * LLM (plus refinement) and returns the proposal. It never PATCHes — the
 * content script shows the result in a review panel and only
 * applyDescriptionUpdate (below) writes.
 */
export async function handleGenerateDescription(data: OpenedPRData): Promise<GenerateDescriptionResponse> {
  const { config, gathered, linkedIssues, stats } = await gatherForFieldUpdate(
    "handleGenerateDescription",
    data,
    TOKEN_REQUIRED_MESSAGE,
  );
  const style = await discoverRepoStyle(config, gathered.owner, gathered.repo);

  const existingTitle = gathered.prDetails.title || data.existingTitle || "";
  const existingDescription = data.existingDescription || gathered.prDetails.body || "";
  const preserveAuthored = existingDescription.trim().length > 0 && !isLikelyTemplate(existingDescription);

  // Hydrate missing anchors BEFORE building the summary so the prompt's
  // anchors section and the refinement anchor check see the same set.
  await hydrateMissingDiffAnchors(gathered.fileChanges);

  const changesSummary = buildChangesSummary(
    {
      commits: gathered.commits,
      fileChanges: gathered.fileChanges,
      stats,
      branchContext: gathered.branchContext,
      linkedIssues,
      existingBody: existingDescription,
    },
    gathered.diffText,
    gathered.hunkRanges,
  );
  logMsg("handleGenerateDescription - built changesSummary, length: " + String(changesSummary.length));

  const descPrompt = buildDescriptionOnlyPrompt(changesSummary, existingTitle, existingDescription, style);
  logMsg("handleGenerateDescription - built descPrompt, length: " + String(descPrompt.length));

  const llmResult = await callAPI(config, descPrompt);
  const { description: refinedDescription, finalScore } = await parseAndRefineDescription("handleGenerateDescription", {
    config,
    styleAiDisclosure: style.aiDisclosure,
    llmResult,
    title: gathered.prDetails.title || data.existingTitle || "",
    commitMessages: gathered.commits.map((c) => c.message),
    hasAnchors: gathered.fileChanges.length > 0 && hasUsableAnchors(gathered.fileChanges, gathered.hunkRanges),
    anchorCount: countUsableAnchors(gathered.fileChanges, gathered.hunkRanges),
    stats,
    preserveAuthored,
  });
  logMsg("Refinement complete: score " + String(finalScore));

  const finalDescription = resolveDiffLinks(refinedDescription, {
    owner: gathered.owner,
    repo: gathered.repo,
    kind: "pull",
    prNumber: gathered.prNumber,
  });
  logMsg(
    "handleGenerateDescription - final description length: " +
      String(finalDescription.length) +
      " (refined score: " +
      String(finalScore) +
      ")",
  );

  return { body: finalDescription, updated: false };
}

/**
 * Apply phase: the user reviewed (and possibly edited) the proposal and clicked
 * "Apply to PR". PATCHes exactly the approved body.
 */
export async function handleApplyDescriptionUpdate(
  data: ApplyDescriptionUpdateData,
): Promise<ApplyDescriptionResponse> {
  const { config, owner, repo, prNumber, text } = await prepareFieldApply(
    "handleApplyDescriptionUpdate",
    data,
    "description",
    data.body,
    TOKEN_REQUIRED_MESSAGE,
  );

  const updateResult = await updatePRField(config, owner, repo, prNumber, { body: text });
  if ("error" in updateResult) {
    if (updateResult.error === "GITHUB_NO_TOKEN") {
      throw new Error(TOKEN_REQUIRED_MESSAGE);
    }
    throw new Error("Failed to update PR description: " + (updateResult.message || updateResult.error));
  }
  return { body: text, updated: true };
}
