import { buildChangesSummary, buildCombinedPrompt, buildSummaryData, fetchPRDiff } from "./prompt";
import { fetchPRCommits, fetchPRFiles } from "./shared";
import type { CoverageResult, TestContext } from "./testkit";
import { computeCoverageDetails, countCoveredCommits, runTest } from "./testkit";

interface FullCoverageInput {
  coveredInSummary: number;
  totalCommits: number;
  hasCommitCoverageSection: boolean;
  existingBody: string;
}

function logPromptAnalysis(
  prompt: string,
  changesSummary: string,
  commitCount: number,
  fileCount: number,
  diffText: string | null,
  existingBody: string,
): void {
  const diffIncluded = diffText !== null ? `Yes (${String(diffText.length)} chars)` : "No";
  console.log("\n=== Extension Prompt Analysis ===");
  console.log(`Prompt length: ${String(prompt.length)} chars`);
  console.log(`Changes summary length: ${String(changesSummary.length)} chars`);
  console.log(`Commits in prompt: ${String(commitCount)}`);
  console.log(`Files in prompt: ${String(fileCount)}`);
  console.log(`Diff included: ${diffIncluded}`);
  console.log(`Existing body length: ${String(existingBody.length)} chars`);
}

function logSummary(input: FullCoverageInput, coveragePercent: string, covered: number): void {
  console.log("\n=== SUMMARY ===");
  console.log(
    `Commits covered in PR description: ${String(covered)}/${String(input.totalCommits)} (${coveragePercent}%)`,
  );
  console.log(`Extension prompt includes all commits: ${input.coveredInSummary === input.totalCommits ? "Yes" : "No"}`);
  const expected = input.existingBody.length === 0 ? "Yes" : "No - PR has existing body";
  console.log(
    `Prompt has Commit Coverage instruction: ${input.hasCommitCoverageSection ? "Yes" : "No"} (expected: ${expected})`,
  );
}

function buildResult(
  input: FullCoverageInput,
  coverage: number,
  coveragePercent: string,
  covered: number,
): CoverageResult {
  const promptHasAllCommits = input.coveredInSummary === input.totalCommits;
  const descriptionHasGoodCoverage = coverage >= 90;
  const instructionOk = input.existingBody.length === 0 ? input.hasCommitCoverageSection : true;
  const result: CoverageResult = { passed: false, coverage: coveragePercent, covered, total: input.totalCommits };

  if (descriptionHasGoodCoverage && promptHasAllCommits && instructionOk) {
    const suffix = input.existingBody.length === 0 ? " and coverage instruction" : "";
    console.log(
      `\n✅ TEST PASSED: Excellent commit coverage (${coveragePercent}%), prompt includes all commits${suffix}`,
    );
    return { ...result, passed: true };
  }
  if (descriptionHasGoodCoverage && promptHasAllCommits) {
    console.log(
      `\n⚠️  TEST PARTIAL: Good commit coverage (${coveragePercent}%), prompt includes all commits but missing coverage instruction when expected`,
    );
    return result;
  }
  if (descriptionHasGoodCoverage) {
    console.log(
      `\n⚠️  TEST PARTIAL: Good commit coverage (${coveragePercent}%) but prompt missing commits or instruction`,
    );
    return result;
  }
  console.log(`\n❌ TEST FAILED: Poor commit coverage (${coveragePercent}%)`);
  return result;
}

function evaluateDescriptionCoverage(
  commits: string[],
  prDescription: string,
  input: FullCoverageInput,
): CoverageResult {
  const { covered, details } = computeCoverageDetails(commits, prDescription);

  console.log("\n=== PR Description Commit Coverage ===");
  details.forEach((d) => {
    const status = d.covered ? "✓ COVERED" : "✗ MISSING";
    console.log(`  ${status}: ${d.headline}`);
  });

  const coverage = (covered / commits.length) * 100;
  const coveragePercent = coverage.toFixed(1);
  logSummary(input, coveragePercent, covered);
  return buildResult(input, coverage, coveragePercent, covered);
}

async function testGeneratedDescriptionCoverage(ctx: TestContext): Promise<CoverageResult> {
  const { testPr, prDetails, githubToken } = ctx;
  const commits = fetchPRCommits(testPr);
  const files = fetchPRFiles(testPr);
  const diffText = await fetchPRDiff(testPr, githubToken);

  const existingBody = prDetails.body ?? "";
  const data = buildSummaryData(prDetails, commits, files, existingBody);
  const changesSummary = buildChangesSummary(data, diffText);
  const prompt = buildCombinedPrompt(changesSummary, existingBody);

  logPromptAnalysis(prompt, changesSummary, commits.length, files.length, diffText, existingBody);

  const coveredInSummary = countCoveredCommits(commits, changesSummary);
  console.log(`\nCommits represented in changes summary: ${String(coveredInSummary)}/${String(commits.length)}`);

  const hasCommitCoverageSection = prompt.includes("Commit Coverage") && prompt.includes("MUST cover every commit");
  console.log(`Prompt includes Commit Coverage section: ${hasCommitCoverageSection ? "Yes" : "No"}`);
  const hasBody = existingBody.length > 0 ? "Yes" : "No";
  console.log(`(Note: Only added when no existing description - this PR has existing body: ${hasBody})`);

  const input: FullCoverageInput = {
    coveredInSummary,
    totalCommits: commits.length,
    hasCommitCoverageSection,
    existingBody,
  };
  return evaluateDescriptionCoverage(commits, existingBody, input);
}

await runTest("=== GitHub PR Generator - Full Extension Coverage Test ===", testGeneratedDescriptionCoverage);
