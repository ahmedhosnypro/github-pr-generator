import { buildChangesSummary } from "../src/background/summary";
import type { FileChangeType, GenerateData } from "../src/types";
import type { FileChange, GhPrDetails } from "./shared";
import { extractLinkedIssues, fetchPRCommits, fetchPRFiles } from "./shared";
import type { CoverageResult, TestContext } from "./testkit";
import { computeCoverageDetails, countCoveredCommits, logCoverageVerdictBlock, runTest } from "./testkit";

// Uses the real src summary builder so the coverage test sees the exact format
// the extension emits (not a forked copy). gh-CLI files lack type/diffAnchor —
// filled with the extension's scrape-time defaults.
function buildExtensionSummary(
  prDetails: GhPrDetails,
  commits: string[],
  files: FileChange[],
  owner: string,
  repo: string,
): string {
  const data: GenerateData = {
    commits: commits.map((message) => ({ message })),
    fileChanges: files.map((f) => ({
      path: f.path,
      type: (f.type ?? "modified") as FileChangeType,
      additions: f.additions,
      deletions: f.deletions,
      diffAnchor: f.diffAnchor ?? "",
    })),
    stats: { files: prDetails.files.length, additions: prDetails.additions, deletions: prDetails.deletions },
    branchContext: { owner, repo, baseBranch: prDetails.baseRefName, headBranch: prDetails.headRefName },
    linkedIssues: extractLinkedIssues(commits),
    existingBody: prDetails.body ?? "",
  };
  return buildChangesSummary(data, null, null);
}

function testExtensionCommitCoverage(ctx: TestContext): CoverageResult {
  const { testPr, prDetails } = ctx;
  const commits = fetchPRCommits(testPr);
  const files = fetchPRFiles(testPr);

  const changesSummary = buildExtensionSummary(prDetails, commits, files, testPr.owner, testPr.repo);

  console.log("\n=== Extension Prompt Analysis ===");
  console.log(`Changes summary length: ${String(changesSummary.length)} chars`);
  console.log(`Commits in summary: ${String(commits.length)}`);
  console.log(`Files in summary: ${String(files.length)}`);

  const coveredInSummary = countCoveredCommits(commits, changesSummary);
  console.log(`\nCommits represented in changes summary: ${String(coveredInSummary)}/${String(commits.length)}`);

  const prDescription = prDetails.body ?? "";
  const { details } = computeCoverageDetails(commits, prDescription);
  const { covered, coverage, coveragePercent } = logCoverageVerdictBlock(
    "\n=== PR Description Commit Coverage ===",
    "Commits covered in PR description",
    details,
  );
  return { passed: coverage >= 90, coverage: coveragePercent, covered, total: commits.length };
}

await runTest("=== GitHub PR Generator - Extension Commit Coverage Test ===", testExtensionCommitCoverage);
