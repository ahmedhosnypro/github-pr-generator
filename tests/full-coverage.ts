import { buildPromptFromContext } from "./prompt";
import type { CoverageResult, TestContext } from "./testkit";
import { computeCoverageDetails, logCoverageBreakdown, runTest } from "./testkit";

interface FullCoverageInput {
  coveredInSummary: number;
  totalCommits: number;
  hasCommitCoverageSection: boolean;
  existingBody: string;
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
  const { details } = computeCoverageDetails(commits, prDescription);
  const { covered, coverage, coveragePercent } = logCoverageBreakdown(
    "\n=== PR Description Commit Coverage ===",
    details,
  );
  logSummary(input, coveragePercent, covered);
  return buildResult(input, coverage, coveragePercent, covered);
}

async function testGeneratedDescriptionCoverage(ctx: TestContext): Promise<CoverageResult> {
  const existingBody = ctx.prDetails.body ?? "";
  const { commits, prompt, coveredInSummary } = await buildPromptFromContext(
    ctx,
    existingBody,
    "\n=== Extension Prompt Analysis ===",
    "",
  );

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
