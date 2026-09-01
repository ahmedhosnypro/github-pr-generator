import { fetchPRCommits } from "./shared";
import type { CoverageResult, TestContext } from "./testkit";
import { computeCoverageDetails, logCoverageVerdictBlock, runTest } from "./testkit";

function logCommitList(commits: string[]): void {
  console.log(`Total commits in PR: ${String(commits.length)}`);
  console.log("\nCommit messages:");
  commits.forEach((msg, i) => {
    const headline = msg.split("\n")[0] ?? "";
    console.log(`  ${String(i + 1)}. ${headline}`);
  });
}

function analyzeDescription(commits: string[], prDescription: string): CoverageResult {
  console.log("\n=== PR Description Analysis ===");
  console.log(`Description length: ${String(prDescription.length)} chars`);

  const { details } = computeCoverageDetails(commits, prDescription);
  const { coverage, coveragePercent } = logCoverageVerdictBlock(
    "\n=== Coverage Results ===",
    "Commits covered",
    details,
  );
  return { passed: coverage >= 90, coverage: coveragePercent };
}

function testCommitCoverage(ctx: TestContext): CoverageResult {
  const { testPr, prDetails } = ctx;
  const commits = fetchPRCommits(testPr);

  console.log("\n=== Commit Coverage Test ===");
  console.log(`PR: ${testPr.owner}/${testPr.repo}#${String(testPr.number)}`);
  logCommitList(commits);

  return analyzeDescription(commits, prDetails.body ?? "");
}

await runTest("=== GitHub PR Generator - Commit Coverage Test ===", testCommitCoverage);
