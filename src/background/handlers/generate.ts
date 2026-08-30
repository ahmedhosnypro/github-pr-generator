import type { GitHubDiffResult, GitHubHunksByFile } from "../../github-types";
import type { ExtensionConfig, GenerateData, GenerateResponse } from "../../types";
import { fetchGitHubDiff } from "../github/diff";
import { callAPI } from "../llm";
import { logMsg } from "../log";
import { parseCombinedResponse } from "../parse";
import { buildCombinedPrompt } from "../prompts/combined";
import { buildChangesSummary } from "../summary";
import { getValidatedConfig } from "./shared";

function extractDiffOutcome(
  diffResult: GitHubDiffResult,
  config: ExtensionConfig,
): { diffText: string | null; hunkRanges: GitHubHunksByFile | null } {
  if (diffResult && "diff" in diffResult) {
    logMsg(
      "Diff included in prompt, length: " +
        String(diffResult.diff.length) +
        ", hunks: " +
        String(Object.keys(diffResult.hunks).length) +
        " files",
    );
    return { diffText: diffResult.diff, hunkRanges: diffResult.hunks };
  }
  if (diffResult && "error" in diffResult) {
    logMsg("Diff fetch returned error: " + diffResult.error + " — continuing without diff");
    if (diffResult.error === "GITHUB_404" && !config.githubToken) {
      logMsg("Hint: Private repo requires GitHub PAT. Suggesting user to configure it.");
    } else if (diffResult.error === "GITHUB_RATE_LIMITED") {
      logMsg("Hint: GitHub API rate limit hit. Suggesting user to add GitHub PAT for higher limits.");
    }
  }
  return { diffText: null, hunkRanges: null };
}

export async function handleGenerate(data: GenerateData): Promise<GenerateResponse> {
  logMsg(
    "handleGenerate - commits: " +
      String(data.commits ? data.commits.length : 0) +
      ", files: " +
      String(data.fileChanges ? data.fileChanges.length : 0) +
      ", hasBranchContext: " +
      String(!!(data.branchContext && data.branchContext.owner)),
  );

  const config = await getValidatedConfig();

  const diffResult = await fetchGitHubDiff(config, data.branchContext || {});
  const { diffText, hunkRanges } = extractDiffOutcome(diffResult, config);

  const changesSummary = buildChangesSummary(data, diffText, hunkRanges);
  logMsg("Built changesSummary, length: " + String(changesSummary.length));

  const combinedPrompt = buildCombinedPrompt(changesSummary, data.existingBody || "");
  logMsg("Built combinedPrompt, length: " + String(combinedPrompt.length));

  logMsg("Generating title + description in single call...");
  const result = await callAPI(config, combinedPrompt);
  logMsg("API result length: " + String(result.length));

  const parsed = parseCombinedResponse(result);
  logMsg("Parsed - title: " + parsed.title + ", description length: " + String(parsed.description.length));

  return parsed;
}
