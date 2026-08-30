import type { GenerateDescriptionResponse, OpenedPRData } from "../../types";
import { updatePRField } from "../github/pr";
import { callAPI } from "../llm";
import { logMsg } from "../log";
import { parseDescriptionOnlyResponse } from "../parse";
import { buildDescriptionOnlyPrompt } from "../prompts/pr-prompts";
import { buildChangesSummary } from "../summary";
import { buildStats, extractLinkedIssues, gatherPRData, getValidatedConfig } from "./shared";

const TOKEN_REQUIRED_MESSAGE =
  "GitHub Personal Access Token is required to update PR description. Set it in config.local.json or extension popup (needs 'repo' scope).";

export async function handleGenerateDescription(data: OpenedPRData): Promise<GenerateDescriptionResponse> {
  logMsg(
    "handleGenerateDescription - owner: " +
      (data.owner || "") +
      ", repo: " +
      (data.repo || "") +
      ", prNumber: " +
      (data.prNumber || ""),
  );

  const config = await getValidatedConfig();

  if (!config.githubToken) {
    throw new Error(TOKEN_REQUIRED_MESSAGE);
  }

  const gathered = await gatherPRData("handleGenerateDescription", config, data);
  const linkedIssues = extractLinkedIssues(gathered.commits);
  const stats = buildStats(gathered.prDetails, gathered.fileChanges);

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

  const descPrompt = buildDescriptionOnlyPrompt(changesSummary, existingTitle, existingDescription);
  logMsg("handleGenerateDescription - built descPrompt, length: " + String(descPrompt.length));

  const llmResult = await callAPI(config, descPrompt);
  const newDescription = parseDescriptionOnlyResponse(llmResult);
  logMsg("handleGenerateDescription - parsed description length: " + String(newDescription.length));

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
