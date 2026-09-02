import { buildPromptFromContext } from "./prompt";
import type { CoverageResult, TestContext } from "./testkit";
import { runTest } from "./testkit";

const CORPUS_WORDING_ASSERTIONS: [string, string, boolean][] = [
  ["A1", "scaled to the change", true],
  ["A4", "copy-pasteable", true],
  ["A8", "Match the repo's title style", true],
  ["A7", "Do NOT imitate bot output", true],
  ["A2", "root cause in one line", true],
  ["A3 (section removed)", "## Breaking Changes\nAny", false],
  ["A9 (gated Problem section)", "(Conditional) ## Problem", true],
];

function evaluatePrompt(commits: string[], prompt: string, coveredInSummary: number): CoverageResult {
  const hasCommitCoverageSection = prompt.includes("Commit Coverage") && prompt.includes("MUST cover every commit");
  console.log(
    `Prompt includes Commit Coverage section: ${hasCommitCoverageSection ? "Yes" : "No"} (expected: Yes - no existing body)`,
  );

  let wordingOk = true;
  console.log("\nCorpus-wording assertions:");
  for (const [label, needle, expected] of CORPUS_WORDING_ASSERTIONS) {
    const found = prompt.includes(needle);
    const ok = found === expected;
    if (!ok) wordingOk = false;
    console.log(`  ${ok ? "✅" : "❌"} ${label}: ${needle.slice(0, 50)}`);
  }

  const promptHasAllCommits = coveredInSummary === commits.length;
  if (promptHasAllCommits && hasCommitCoverageSection && wordingOk) {
    console.log("\n✅ TEST PASSED: PR creation page prompt includes all commits and coverage instruction");
    return { passed: true };
  }
  if (promptHasAllCommits && hasCommitCoverageSection) {
    console.log("\n⚠️  TEST PARTIAL: Prompt structurally fine but corpus-wording assertion(s) failed");
    return { passed: false };
  }
  if (promptHasAllCommits) {
    console.log("\n⚠️  TEST PARTIAL: Prompt includes all commits but missing coverage instruction");
    return { passed: false };
  }
  console.log("\n❌ TEST FAILED: Prompt missing commits or instruction");
  return { passed: false };
}

async function testPRCreationPagePrompt(ctx: TestContext): Promise<CoverageResult> {
  // Simulate PR creation page - no existing body
  const { commits, prompt, coveredInSummary } = await buildPromptFromContext(
    ctx,
    "",
    "\n=== PR Creation Page Prompt Analysis ===",
    " (simulated empty)",
  );
  return evaluatePrompt(commits, prompt, coveredInSummary);
}

await runTest("=== GitHub PR Generator - PR Creation Page Prompt Test ===", testPRCreationPagePrompt);
