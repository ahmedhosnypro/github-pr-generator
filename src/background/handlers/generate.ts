import type { GitHubDiffResult, GitHubHunksByFile } from "../../github-types";
import type { ExtensionConfig, GenerateData, GenerateResponse } from "../../types";
import { hydrateMissingDiffAnchors } from "../anchor-hash";
import { fetchGitHubDiff } from "../github/diff";
import { discoverRepoStyle } from "../github/discovery";
import { resolveDiffLinks } from "../linkify";
import { callAPI } from "../llm";
import { logMsg } from "../log";
import { parseCombinedResponse } from "../parse";
import { buildCombinedPrompt } from "../prompts/combined";
import { refineDescription } from "../refinement";
import type { RepoStyle } from "../repo-style";
import { EMPTY_REPO_STYLE } from "../repo-style";
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
    return { diffText: null, hunkRanges: null };
  }
  return { diffText: null, hunkRanges: null };
}

export async function handleGenerate(data: GenerateData, onChunk?: (delta: string) => void): Promise<GenerateResponse> {
  logMsg(
    "handleGenerate - commits: " +
      String(data.commits ? data.commits.length : 0) +
      ", files: " +
      String(data.fileChanges ? data.fileChanges.length : 0) +
      ", hasBranchContext: " +
      String(!!data.branchContext?.owner),
  );

  const config = await getValidatedConfig();

  // Repo style discovery runs in parallel with the diff fetch; on the PR
  // creation page branchContext may be missing, in which case style is empty.
  const owner = data.branchContext?.owner ?? "";
  const repo = data.branchContext?.repo ?? "";
  const [diffResult, style] = await Promise.all([
    fetchGitHubDiff(config, data.branchContext || {}),
    owner !== "" && repo !== "" ? discoverRepoStyle(config, owner, repo) : Promise.resolve<RepoStyle>(EMPTY_REPO_STYLE),
  ]);
  const { diffText, hunkRanges } = extractDiffOutcome(diffResult, config);

  const changesSummary = buildChangesSummary(data, diffText, hunkRanges);
  logMsg("Built changesSummary, length: " + String(changesSummary.length));

  const combinedPrompt = buildCombinedPrompt(changesSummary, data.existingBody || "", style);
  logMsg("Built combinedPrompt, length: " + String(combinedPrompt.length));

  logMsg("Generating title + description in single call (streaming to memory)...");
  const result = await callAPI(config, combinedPrompt, 0.3, onChunk);
  logMsg("API result length: " + String(result.length));

  const parsed = parseCombinedResponse(result);
  logMsg("Parsed - title: " + parsed.title + ", description length: " + String(parsed.description.length));

  // Hydrate missing anchors for files that had no DOM anchor (compare page flow)
  await hydrateMissingDiffAnchors(data.fileChanges ?? []);

  // Refine the generated description through quality feedback loop
  const { description: refinedDescription, finalScore } = await refineDescription(
    config,
    parsed.title,
    parsed.description,
    data.commits?.map((c) => c.message) ?? [],
    true,
    3, // max iterations
    10, // target score
  );
  logMsg("Refinement complete: " + String(finalScore) + "/10");

  // Convert diffhunk:// markers to real GitHub URLs
  const linkTarget = {
    owner: data.branchContext?.owner ?? "",
    repo: data.branchContext?.repo ?? "",
    kind: "compare" as const,
    baseBranch: data.branchContext?.baseBranch,
    headBranch: data.branchContext?.headBranch,
  };
  const finalDescription = resolveDiffLinks(refinedDescription, linkTarget);
  logMsg(
    "Final description length: " + String(finalDescription.length) + " (refined score: " + String(finalScore) + "/10)",
  );

  return { title: parsed.title, description: finalDescription };
}
