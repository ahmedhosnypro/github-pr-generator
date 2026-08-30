import { buildChangesSummary, buildCombinedPrompt, buildSummaryData, fetchPRDiff } from "./prompt";
import { fetchPRCommits, fetchPRFiles } from "./shared";
import type { CoverageResult, TestContext } from "./testkit";
import { countCoveredCommits, runTest } from "./testkit";

function logPromptAnalysis(
  prompt: string,
  changesSummary: string,
  commitCount: number,
  fileCount: number,
  diffText: string | null,
  existingBody: string,
): void {
  const diffIncluded = diffText !== null ? `Yes (${String(diffText.length)} chars)` : "No";
  console.log("\n=== PR Creation Page Prompt Analysis ===");
  console.log(`Prompt length: ${String(prompt.length)} chars`);
  console.log(`Changes summary length: ${String(changesSummary.length)} chars`);
  console.log(`Commits in prompt: ${String(commitCount)}`);
  console.log(`Files in prompt: ${String(fileCount)}`);
  console.log(`Diff included: ${diffIncluded}`);
  console.log(`Existing body length: ${String(existingBody.length)} chars (simulated empty)`);
}

function evaluatePrompt(commits: string[], changesSummary: string, prompt: string): CoverageResult {
  const coveredInSummary = countCoveredCommits(commits, changesSummary);
  console.log(`\nCommits represented in changes summary: ${String(coveredInSummary)}/${String(commits.length)}`);

  const hasCommitCoverageSection = prompt.includes("Commit Coverage") && prompt.includes("MUST cover every commit");
  console.log(
    `Prompt includes Commit Coverage section: ${hasCommitCoverageSection ? "Yes" : "No"} (expected: Yes - no existing body)`,
  );

  const promptHasAllCommits = coveredInSummary === commits.length;
  if (promptHasAllCommits && hasCommitCoverageSection) {
    console.log("\n✅ TEST PASSED: PR creation page prompt includes all commits and coverage instruction");
    return { passed: true };
  }
  if (promptHasAllCommits) {
    console.log("\n⚠️  TEST PARTIAL: Prompt includes all commits but missing coverage instruction");
    return { passed: false };
  }
  console.log("\n❌ TEST FAILED: Prompt missing commits or instruction");
  return { passed: false };
}

async function testPRCreationPagePrompt(ctx: TestContext): Promise<CoverageResult> {
  const { testPr, prDetails, githubToken } = ctx;
  const commits = fetchPRCommits(testPr);
  const files = fetchPRFiles(testPr);
  const diffText = await fetchPRDiff(testPr, githubToken);

  const existingBody = ""; // Simulate PR creation page - no existing body
  const data = buildSummaryData(prDetails, commits, files, existingBody);
  const changesSummary = buildChangesSummary(data, diffText);
  const prompt = buildCombinedPrompt(changesSummary, existingBody);

  logPromptAnalysis(prompt, changesSummary, commits.length, files.length, diffText, existingBody);
  return evaluatePrompt(commits, changesSummary, prompt);
}

await runTest("=== GitHub PR Generator - PR Creation Page Prompt Test ===", testPRCreationPagePrompt);
