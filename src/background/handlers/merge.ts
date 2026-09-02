import type { GenerateMergeDescriptionResponse, GenerateMergeTitleResponse, OpenedPRData } from "../../types";
import { discoverRepoStyle } from "../github/discovery";
import { callAPI } from "../llm";
import { logMsg } from "../log";
import { parseDescriptionOnlyResponse, parseTitleOnlyResponse } from "../parse";
import { buildMergeDescriptionPrompt, buildMergeTitlePrompt } from "../prompts/merge-prompts";
import { refineDescription } from "../refinement";
import { buildChangesSummary, hasUsableAnchors } from "../summary";
import { buildStats, extractLinkedIssues, gatherPRData, getValidatedConfig } from "./shared";

export async function handleGenerateMergeTitle(
  data: OpenedPRData,
  onChunk?: (delta: string) => void,
): Promise<GenerateMergeTitleResponse> {
  logMsg(
    "handleGenerateMergeTitle - owner: " +
      (data.owner || "") +
      ", repo: " +
      (data.repo || "") +
      ", prNumber: " +
      (data.prNumber || ""),
  );

  const config = await getValidatedConfig();
  const gathered = await gatherPRData("handleGenerateMergeTitle", config, data);
  const stats = buildStats(gathered.prDetails, gathered.fileChanges);
  const style = await discoverRepoStyle(config, gathered.owner, gathered.repo);

  const changesSummary = buildChangesSummary(
    {
      commits: gathered.commits,
      fileChanges: gathered.fileChanges,
      stats,
      branchContext: gathered.branchContext,
      linkedIssues: extractLinkedIssues(gathered.commits),
      existingBody: gathered.prDetails.body || "",
    },
    gathered.diffText,
    gathered.hunkRanges,
  );
  logMsg("handleGenerateMergeTitle - built changesSummary, length: " + String(changesSummary.length));

  const mergeTitlePrompt = buildMergeTitlePrompt(
    changesSummary,
    data.existingTitle || gathered.prDetails.title || "",
    data.existingMergeTitle || "",
    style,
  );
  logMsg("handleGenerateMergeTitle - built mergeTitlePrompt, length: " + String(mergeTitlePrompt.length));

  const llmResult = await callAPI(config, mergeTitlePrompt, 0.3, onChunk);
  const newTitle = parseTitleOnlyResponse(llmResult);
  logMsg("handleGenerateMergeTitle - parsed title: " + newTitle);

  return { title: newTitle };
}

export async function handleGenerateMergeDescription(
  data: OpenedPRData,
  onChunk?: (delta: string) => void,
): Promise<GenerateMergeDescriptionResponse> {
  logMsg(
    "handleGenerateMergeDescription - owner: " +
      (data.owner || "") +
      ", repo: " +
      (data.repo || "") +
      ", prNumber: " +
      (data.prNumber || ""),
  );

  const config = await getValidatedConfig();
  const gathered = await gatherPRData("handleGenerateMergeDescription", config, data);
  const stats = buildStats(gathered.prDetails, gathered.fileChanges);
  const style = await discoverRepoStyle(config, gathered.owner, gathered.repo);

  const existingTitle = data.existingTitle || gathered.prDetails.title || "";
  const existingMergeTitle = data.existingMergeTitle || "";
  const existingDescription = data.existingDescription || gathered.prDetails.body || "";
  const existingMergeDesc = data.existingMergeDescription || "";

  const changesSummary = buildChangesSummary(
    {
      commits: gathered.commits,
      fileChanges: gathered.fileChanges,
      stats,
      branchContext: gathered.branchContext,
      linkedIssues: extractLinkedIssues(gathered.commits),
      existingBody: existingDescription,
    },
    gathered.diffText,
    gathered.hunkRanges,
  );
  logMsg("handleGenerateMergeDescription - built changesSummary, length: " + String(changesSummary.length));

  const mergeDescPrompt = buildMergeDescriptionPrompt(
    changesSummary,
    existingTitle,
    existingDescription,
    existingMergeTitle,
    existingMergeDesc,
    style,
  );
  logMsg("handleGenerateMergeDescription - built mergeDescPrompt, length: " + String(mergeDescPrompt.length));

  const llmResult = await callAPI(config, mergeDescPrompt, 0.3, onChunk);
  const newDescription = parseDescriptionOnlyResponse(llmResult);
  logMsg("handleGenerateMergeDescription - parsed description length: " + String(newDescription.length));

  // Same quality loop as the PR description flow: generate → score → refine.
  const { description: refinedDescription, finalScore } = await refineDescription(
    config,
    gathered.prDetails.title || data.existingTitle || "",
    newDescription,
    gathered.commits.map((c) => c.message),
    gathered.fileChanges.length > 0 && hasUsableAnchors(gathered.fileChanges, gathered.hunkRanges),
    3, // max iterations
    10, // target score
    buildStats(gathered.prDetails, gathered.fileChanges),
  );
  logMsg("handleGenerateMergeDescription - refinement score: " + String(finalScore));

  return { description: refinedDescription };
}
