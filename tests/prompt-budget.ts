// Prompt budget-cap tests (split out of prompt-logic.ts): oversized summaries
// must stay within MAX_PROMPT_CHARS for every builder, with the diff trimmed
// before stats/files sections and a truncation note appended.
import { buildCombinedPrompt as buildSrcCombinedPrompt, MAX_PROMPT_CHARS } from "../src/background/prompts/combined";
import { buildMergeDescriptionPrompt, buildMergeTitlePrompt } from "../src/background/prompts/merge-prompts";
import { buildDescriptionOnlyPrompt, buildTitleOnlyPrompt } from "../src/background/prompts/pr-prompts";
import { expectIncludes, expectMatch, getFailures } from "./expect-helpers";

function testPromptBudgetCap(): void {
  const bullet = "- [m] src/" + "module/component/feature/widget/".repeat(12) + "file.ts (+12/-3)\n";
  let hugeSummary = "## Changed Files\n\n";
  while (hugeSummary.length <= 200_000) {
    hugeSummary += bullet;
  }
  const capped = buildSrcCombinedPrompt(hugeSummary, "");
  expectMatch("oversized summary stays within budget", capped.length <= MAX_PROMPT_CHARS + 120, true);
  expectIncludes("truncation note present", capped, "... (truncated: prompt budget reached");
  expectIncludes("output-format tail survives", capped, "OUTPUT FORMAT:");
  expectIncludes("rules tail survives", capped, "RULES:");
}

function testBudgetCapAppliesToAllBuilders(): void {
  let hugeSummary = "## Commits\n\n- feat: something\n";
  while (hugeSummary.length <= 200_000) {
    hugeSummary += "- [m] src/" + "module/component/feature/".repeat(12) + "file.ts (+12/-3)\n";
  }
  expectMatch(
    "title-only prompt stays within budget",
    buildTitleOnlyPrompt(hugeSummary, "").length <= MAX_PROMPT_CHARS + 120,
    true,
  );
  expectMatch(
    "description-only prompt stays within budget",
    buildDescriptionOnlyPrompt(hugeSummary, "", "").length <= MAX_PROMPT_CHARS + 120,
    true,
  );
  expectMatch(
    "merge title prompt stays within budget",
    buildMergeTitlePrompt(hugeSummary, "", "").length <= MAX_PROMPT_CHARS + 120,
    true,
  );
  expectMatch(
    "merge description prompt stays within budget",
    buildMergeDescriptionPrompt(hugeSummary, "", "", "", "").length <= MAX_PROMPT_CHARS + 120,
    true,
  );
  expectIncludes(
    "description-only truncation note present",
    buildDescriptionOnlyPrompt(hugeSummary, "", ""),
    "... (truncated: prompt budget reached",
  );
}

function testBudgetTrimCutsDiffBeforeStatsAndFiles(): void {
  const diffLine = "+const value" + " = computeSomethingVerboseHere".repeat(4) + "();\n";
  let hugeDiff = "";
  while (hugeDiff.length <= 200_000) {
    hugeDiff += diffLine;
  }
  const hugeSummary =
    "## Commits\n\n- feat: large refactor\n" +
    "\n## Diff\n\n" +
    hugeDiff +
    "\n## Changed Files\n\n- [m] src/big.ts (+3000/-2000)\n" +
    "\n## Stats\n\n- 40 changed files\n- 3000 additions\n- 2000 deletions\n";
  const combined = buildSrcCombinedPrompt(hugeSummary, "");
  expectMatch("diff-heavy summary stays within budget", combined.length <= MAX_PROMPT_CHARS + 120, true);
  expectIncludes("stats section survives trimming", combined, "## Stats");
  expectIncludes("stats numbers survive trimming", combined, "- 3000 additions");
  expectIncludes("changed-files section survives trimming", combined, "## Changed Files");
  expectIncludes("size-tier directive survives trimming", combined, "## Size Tier — Large Change");
  expectIncludes("truncation note present", combined, "... (truncated: prompt budget reached");

  const description = buildDescriptionOnlyPrompt(hugeSummary, "", "");
  expectMatch("description-only diff-heavy within budget", description.length <= MAX_PROMPT_CHARS + 120, true);
  expectIncludes("description-only keeps size-tier directive", description, "## Size Tier — Large Change");
}

console.log("=== Prompt Budget Tests ===\n");
testPromptBudgetCap();
testBudgetCapAppliesToAllBuilders();
testBudgetTrimCutsDiffBeforeStatsAndFiles();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All prompt budget checks passed");
