import type { GenerateTitleResponse, OpenedPRData } from "../../types";
import { updatePRField } from "../github/pr";
import { callAPI } from "../llm";
import { logMsg } from "../log";
import { parseTitleOnlyResponse } from "../parse";
import { buildTitleOnlyPrompt } from "../prompts/pr-prompts";
import { buildChangesSummary } from "../summary";
import { buildStats, extractLinkedIssues, gatherPRData, getValidatedConfig } from "./shared";

const TOKEN_REQUIRED_MESSAGE =
  "GitHub Personal Access Token is required to update PR title. Set it in config.local.json or extension popup (needs 'repo' scope).";

export async function handleGenerateTitle(data: OpenedPRData): Promise<GenerateTitleResponse> {
  logMsg(
    "handleGenerateTitle - owner: " +
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

  const gathered = await gatherPRData("handleGenerateTitle", config, data);
  const linkedIssues = extractLinkedIssues(gathered.commits);
  const stats = buildStats(gathered.prDetails, gathered.fileChanges);

  const changesSummary = buildChangesSummary(
    {
      commits: gathered.commits,
      fileChanges: gathered.fileChanges,
      stats,
      branchContext: gathered.branchContext,
      linkedIssues,
      existingBody: gathered.prDetails.body || "",
    },
    gathered.diffText,
    gathered.hunkRanges,
  );
  logMsg("handleGenerateTitle - built changesSummary, length: " + String(changesSummary.length));

  const titlePrompt = buildTitleOnlyPrompt(changesSummary, gathered.prDetails.title || data.existingTitle || "");
  logMsg("handleGenerateTitle - built titlePrompt, length: " + String(titlePrompt.length));

  const llmResult = await callAPI(config, titlePrompt);
  const newTitle = parseTitleOnlyResponse(llmResult);
  logMsg("handleGenerateTitle - parsed title: " + newTitle);

  const updateResult = await updatePRField(config, gathered.owner, gathered.repo, gathered.prNumber, {
    title: newTitle,
  });
  if ("error" in updateResult) {
    if (updateResult.error === "GITHUB_NO_TOKEN") {
      throw new Error(TOKEN_REQUIRED_MESSAGE);
    }
    throw new Error("Failed to update PR title: " + (updateResult.message || updateResult.error));
  }

  return { title: newTitle, updated: true };
}
