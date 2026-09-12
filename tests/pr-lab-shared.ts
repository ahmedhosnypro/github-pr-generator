// Shared lab pipeline step: hydrate missing diff anchors and build the
// prompt summary from gathered PR data. Used by both the live generate
// verifier (generate-live.ts) and the lab run (pr-lab-run.ts) so the two
// read-only pipelines assemble the summary exactly the same way.
import { hydrateMissingDiffAnchors } from "../src/background/anchor-hash";
import { buildStats, type GatheredPRData } from "../src/background/handlers/shared";
import { buildChangesSummary } from "../src/background/summary";
import type { PRStats } from "../src/types";

// Hydrate missing anchors BEFORE building the summary so the prompt's
// anchors section and the refinement anchor check see the same set —
// mirrors handleGenerateDescription. linkedIssues defaults to [] for the
// combined generate path; the description-only lab path passes the
// commits' linked issues.
export async function hydrateAndBuildSummary(
  gathered: GatheredPRData,
  linkedIssues: string[] = [],
): Promise<{ stats: PRStats; summary: string }> {
  await hydrateMissingDiffAnchors(gathered.fileChanges);
  const stats = buildStats(gathered.prDetails, gathered.fileChanges);
  const summary = buildChangesSummary(
    {
      commits: gathered.commits,
      fileChanges: gathered.fileChanges,
      stats,
      branchContext: gathered.branchContext,
      linkedIssues,
      existingBody: gathered.prDetails.body,
    },
    gathered.diffText,
    gathered.hunkRanges,
  );
  return { stats, summary };
}
