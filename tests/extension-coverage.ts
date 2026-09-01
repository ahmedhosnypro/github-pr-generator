import type { FileChange, GhPrDetails } from "./shared";
import { extractLinkedIssues, fetchPRCommits, fetchPRFiles } from "./shared";
import type { CoverageResult, TestContext } from "./testkit";
import { computeCoverageDetails, countCoveredCommits, logCoverageVerdictBlock, runTest } from "./testkit";

interface ExtensionStats {
  files: number;
  additions: number;
  deletions: number;
}

function buildChangesSummary(
  commits: string[],
  fileChanges: FileChange[],
  stats: ExtensionStats,
  baseBranch: string,
  headBranch: string,
  linkedIssues: string[],
  existingBody: string,
): string {
  let summary = "";

  summary += "## Commits\n";
  commits.forEach((commit, i) => {
    summary += `${String(i + 1)}. ${commit}\n\n`;
  });

  summary += "## File Changes\n";
  fileChanges.forEach((file) => {
    summary += `- ${file.path} (${String(file.type)}): +${String(file.additions)}/-${String(file.deletions)}\n`;
  });

  summary += "\n## Stats\n";
  summary += `- Files: ${String(stats.files)}\n`;
  summary += `- Additions: ${String(stats.additions)}\n`;
  summary += `- Deletions: ${String(stats.deletions)}\n`;

  summary += "\n## Branch Context\n";
  summary += `- Base: ${baseBranch}\n`;
  summary += `- Head: ${headBranch}\n`;

  if (linkedIssues.length > 0) {
    summary += "\n## Linked Issues\n";
    linkedIssues.forEach((issue) => {
      summary += `- ${issue}\n`;
    });
  }

  if (existingBody) {
    summary += "\n## Existing Description\n";
    summary += existingBody.substring(0, 2000);
  }

  return summary;
}

function buildExtensionSummary(prDetails: GhPrDetails, commits: string[], files: FileChange[]): string {
  const stats: ExtensionStats = {
    files: prDetails.files.length,
    additions: prDetails.additions,
    deletions: prDetails.deletions,
  };
  const linkedIssues = extractLinkedIssues(commits);
  const existingBody = prDetails.body ?? "";
  return buildChangesSummary(
    commits,
    files,
    stats,
    prDetails.baseRefName,
    prDetails.headRefName,
    linkedIssues,
    existingBody,
  );
}

function testExtensionCommitCoverage(ctx: TestContext): CoverageResult {
  const { testPr, prDetails } = ctx;
  const commits = fetchPRCommits(testPr);
  const files = fetchPRFiles(testPr);

  const changesSummary = buildExtensionSummary(prDetails, commits, files);

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
