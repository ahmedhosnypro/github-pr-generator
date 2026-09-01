import type { ExtensionConfig, GenerateDescriptionResponse, OpenedPRData } from "../../types";
import { hydrateMissingDiffAnchors } from "../anchor-hash";
import { discoverRepoStyle } from "../github/discovery";
import { updatePRField } from "../github/pr";
import { resolveDiffLinks } from "../linkify";
import { callAPI } from "../llm";
import { logMsg } from "../log";
import { parseDescriptionOnlyResponse } from "../parse";
import { buildDescriptionOnlyPrompt } from "../prompts/pr-prompts";
import { refineDescription } from "../refinement";
import { buildChangesSummary, hasUsableAnchors } from "../summary";
import type { GatheredPRData } from "./shared";
import { gatherForFieldUpdate } from "./shared";

const TOKEN_REQUIRED_MESSAGE =
  "GitHub Personal Access Token is required to update PR description. Set it in config.local.json or extension popup (needs 'repo' scope).";

async function applyDescriptionUpdate(
  config: ExtensionConfig,
  gathered: GatheredPRData,
  newDescription: string,
): Promise<GenerateDescriptionResponse> {
  const updateResult = await updatePRField(config, gathered.owner, gathered.repo, gathered.prNumber, {
    body: newDescription,
  });
  if ("error" in updateResult) {
    if (updateResult.error === "GITHUB_NO_TOKEN") {
      throw new Error(TOKEN_REQUIRED_MESSAGE);
    }
    throw new Error("Failed to update PR description: " + (updateResult.message || updateResult.error));
  }
  return { body: newDescription, updated: true };
}

export async function handleGenerateDescription(data: OpenedPRData): Promise<GenerateDescriptionResponse> {
  const { config, gathered, linkedIssues, stats } = await gatherForFieldUpdate(
    "handleGenerateDescription",
    data,
    TOKEN_REQUIRED_MESSAGE,
  );
  const style = await discoverRepoStyle(config, gathered.owner, gathered.repo);

  const existingTitle = gathered.prDetails.title || data.existingTitle || "";
  const existingDescription = data.existingDescription || gathered.prDetails.body || "";

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
  const newDescription = parseDescriptionOnlyResponse(llmResult);
  logMsg("handleGenerateDescription - parsed description length: " + String(newDescription.length));

  // Hydrate missing anchors and resolve diff links for opened-PR flow
  await hydrateMissingDiffAnchors(gathered.fileChanges);

  // Refine the generated description through quality feedback loop
  const { description: refinedDescription, finalScore } = await refineDescription(
    config,
    gathered.prDetails.title || data.existingTitle || "",
    newDescription,
    gathered.commits.map((c) => c.message),
    gathered.fileChanges.length > 0 && hasUsableAnchors(gathered.fileChanges, gathered.hunkRanges),
    3, // max iterations
    10, // target score
  );
  logMsg("Refinement complete: " + String(finalScore) + "/10");

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
      "/10)",
  );

  return applyDescriptionUpdate(config, gathered, finalDescription);
}
