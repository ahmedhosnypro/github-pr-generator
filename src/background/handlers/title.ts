import type { ExtensionConfig, GenerateTitleResponse, OpenedPRData } from "../../types";
import { discoverRepoStyle } from "../github/discovery";
import { updatePRField } from "../github/pr";
import { callAPI } from "../llm";
import { logMsg } from "../log";
import { parseTitleOnlyResponse } from "../parse";
import { buildTitleOnlyPrompt } from "../prompts/pr-prompts";
import type { RepoStyle } from "../repo-style";
import { buildChangesSummary } from "../summary";
import { gatherForFieldUpdate } from "./shared";

const TOKEN_REQUIRED_MESSAGE =
  "GitHub Personal Access Token is required to update PR title. Set it in config.local.json or extension popup (needs 'repo' scope).";

/** Higher temperature so "fresh" titles actually diverge from the obvious canonical one. */
const FRESH_TITLE_TEMPERATURE = 0.9;

/** Angles used to randomize fresh-title attempts so each run approaches the changes differently. */
const FRESH_TITLE_VARIANTS: readonly [string, ...string[]] = [
  "the user-facing behavior or outcome",
  "the technical mechanism being changed",
  "the module or subsystem that is affected",
  "the problem or bug that these changes eliminate",
];

function randomFreshVariant(): string {
  // eslint-disable-next-line sonarjs/pseudo-random -- pick is cosmetic prompt variation, not security-relevant
  return FRESH_TITLE_VARIANTS[Math.floor(Math.random() * FRESH_TITLE_VARIANTS.length)] ?? FRESH_TITLE_VARIANTS[0];
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Generate the new title. In "fresh" mode a randomized emphasis angle plus a higher
 * temperature keep the result away from the canonical phrasing, and we retry once
 * if the model still lands on the current title (compared locally, never sent to it).
 */
async function generateTitleText(
  config: ExtensionConfig,
  changesSummary: string,
  style: RepoStyle | undefined,
  currentTitle: string,
  isFresh: boolean,
): Promise<string> {
  let newTitle = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    const titlePrompt = isFresh
      ? buildTitleOnlyPrompt(changesSummary, "", style, randomFreshVariant())
      : buildTitleOnlyPrompt(changesSummary, currentTitle, style);
    logMsg(
      "handleGenerateTitle - built titlePrompt (attempt " +
        String(attempt) +
        "), length: " +
        String(titlePrompt.length),
    );

    // oxlint-disable-next-line no-await-in-loop -- attempts are sequential by design: retry only if the title matches
    const llmResult = await callAPI(config, titlePrompt, isFresh ? FRESH_TITLE_TEMPERATURE : undefined);
    newTitle = parseTitleOnlyResponse(llmResult);
    logMsg("handleGenerateTitle - parsed title (attempt " + String(attempt) + "): " + newTitle);

    if (!isFresh || !currentTitle || normalizeTitle(newTitle) !== normalizeTitle(currentTitle)) break;
    logMsg("handleGenerateTitle - fresh title matched the current title, retrying with a new angle");
  }
  return newTitle;
}

export async function handleGenerateTitle(data: OpenedPRData): Promise<GenerateTitleResponse> {
  const { config, gathered, linkedIssues, stats } = await gatherForFieldUpdate(
    "handleGenerateTitle",
    data,
    TOKEN_REQUIRED_MESSAGE,
  );
  const style = await discoverRepoStyle(config, gathered.owner, gathered.repo);

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

  // In "fresh" mode the current title must not reach the prompt at all — it is
  // only used afterwards to retry when the model re-derives the same title.
  const currentTitle = gathered.prDetails.title || data.existingTitle || "";
  const isFresh = data.titleMode === "fresh";
  logMsg("handleGenerateTitle - mode: " + (isFresh ? "fresh" : "improve") + ", current title: " + currentTitle);

  const newTitle = await generateTitleText(config, changesSummary, style, currentTitle, isFresh);
  logMsg("handleGenerateTitle - old title: " + currentTitle + " | new title: " + newTitle);

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
