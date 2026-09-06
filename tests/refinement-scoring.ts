// Preserve-authored mode and ending/size-tier scoring checks (split out of
// refinement.ts): authored-body preservation, scope-ending acceptance, the
// small-diff OR predicate, and authored-text retention.
import { ensureArtifactEnding, missingAuthoredText } from "../src/background/description-normalize";
import { scoreDescription } from "../src/background/refinement-checks";
import { expectMatch, getFailures } from "./expect-helpers";
import { FULL_DESCRIPTION, LARGE_STATS } from "./refinement-shared";

const AUTHORED_BODY = [
  "This fixes the token expiry race I hit while dogfooding the extension.",
  "",
  "## Testing",
  "1. Run the suite",
  "```bash",
  "bun run test",
  "```",
  "Expected: all green",
  "",
  "2. Retry with an expired token",
  "```bash",
  "bun run dev",
  "```",
  "Expected: request succeeds after refresh",
  "",
  "Closes #42",
].join("\n");

// Preserve-authored mode: when the PR body already carries human-written prose,
// the scorer must only demand the polish checks (6 max), not the full scaffold.
async function testPreserveAuthoredMode(): Promise<void> {
  const preserved = await scoreDescription(AUTHORED_BODY, [], false, null, "preserve-authored");
  expectMatch(
    "preserve mode passes authored body without restructuring",
    preserved.failures.length === 0 && preserved.score === preserved.maxScore && preserved.maxScore === 6,
    true,
  );

  const full = await scoreDescription(AUTHORED_BODY, [], false, null);
  expectMatch(
    "full mode still demands the scaffold on the same body",
    full.failures.some((f) => f.check === "opener") && full.failures.some((f) => f.check === "boldLabelBullets"),
    true,
  );
  expectMatch("preserve mode maxScore is smaller than full mode", preserved.maxScore < full.maxScore, true);

  const unbalanced = `${AUTHORED_BODY}\n\`\`\`bash\noops\n`;
  expectMatch(
    "unbalanced fence still fails in preserve mode",
    (await scoreDescription(unbalanced, [], false, null, "preserve-authored")).failures.some(
      (f) => f.check === "fences",
    ),
    true,
  );

  const withoutTesting = "This fixes the token expiry race I hit while dogfooding the extension.";
  expectMatch(
    "missing Testing section still flagged in preserve mode",
    (await scoreDescription(withoutTesting, [], false, LARGE_STATS, "preserve-authored")).failures.some(
      (f) => f.check === "testingSteps",
    ),
    true,
  );
}

// Ending: prose mentions of the word "scope" are not a closing artifact;
// only the Scope-accounting shape (or the other accepted artifacts) counts.
async function testScopeEnding(): Promise<void> {
  const stats = { files: 3, additions: 10, deletions: 2 };
  const proseScope = FULL_DESCRIPTION.replace(
    "\nScope: 3 files, +10/-2",
    "\nThe remaining refactors are out of scope for this change.",
  );
  expectMatch(
    "tail merely mentioning the word scope fails the ending check",
    (await scoreDescription(proseScope, [], false, stats)).failures.some((f) => f.check === "ending"),
    true,
  );
  const appended = ensureArtifactEnding(proseScope, stats);
  expectMatch(
    "normalizer appends a real Scope line despite the prose mention",
    appended.endsWith("Scope: 3 files, +10/-2.\n"),
    true,
  );
  expectMatch(
    "appended Scope line satisfies the ending check",
    (await scoreDescription(appended, [], false, stats)).failures.every((f) => f.check !== "ending"),
    true,
  );

  expectMatch(
    "real Scope line passes the ending check",
    (await scoreDescription(FULL_DESCRIPTION, [], false, stats)).failures.every((f) => f.check !== "ending"),
    true,
  );
  expectMatch(
    "real Scope line is not double-appended",
    ensureArtifactEnding(FULL_DESCRIPTION, stats),
    FULL_DESCRIPTION,
  );
}

// Size tier uses the same OR predicate as the prompt note: ≤3 files or ≤50
// changed lines on its own puts the PR on the small/compact path.
async function testSizeTierOrcPredicate(): Promise<void> {
  const manyFilesFewLines = { files: 10, additions: 25, deletions: 15 };
  const fewFilesManyLines = { files: 2, additions: 4000, deletions: 2000 };
  const compact = "## Summary\nFixed the token expiry race.\n\nScope: 10 files, +25/-15";
  const padded = `${compact} ${"extra padding words pushing the body far past the compact small-diff word cap ".repeat(15)}`;

  const lenient = await scoreDescription(compact, [], false, manyFilesFewLines);
  expectMatch(
    "many files but few lines counts as small (scaffolding lenient)",
    lenient.failures.every((f) => f.check !== "boldLabelBullets" && f.check !== "testingSteps"),
    true,
  );
  expectMatch(
    "proportional size cap applies to many-files/few-lines diffs",
    (await scoreDescription(padded, [], false, manyFilesFewLines)).failures.some((f) => f.check === "proportionalSize"),
    true,
  );

  const bigLinesLenient = await scoreDescription(compact, [], false, fewFilesManyLines);
  expectMatch(
    "few files but many lines counts as small (scaffolding lenient)",
    bigLinesLenient.failures.every((f) => f.check !== "boldLabelBullets" && f.check !== "testingSteps"),
    true,
  );

  expectMatch(
    "zero-file/zero-line stats are never small",
    (await scoreDescription(compact, [], false, { files: 0, additions: 0, deletions: 0 })).failures.some(
      (f) => f.check === "boldLabelBullets",
    ),
    true,
  );
}

// Preservation guard: authored paragraphs survive verbatim, modulo whitespace
// re-flow; deleted or reworded paragraphs are reported.
function testMissingAuthoredText(): void {
  const before = [
    "This fixes the token expiry race I hit while dogfooding the extension.",
    "",
    "It reproduces every time the tab sleeps for more than ten minutes.",
  ].join("\n");
  expectMatch("identical text preserves everything", missingAuthoredText(before, before).length, 0);
  expectMatch(
    "re-wrapped paragraph counts as preserved",
    missingAuthoredText(before, before.replace("race I hit", "race\nI hit")).length,
    0,
  );
  expectMatch(
    "deleted paragraph is reported",
    missingAuthoredText(before, "This fixes the token expiry race I hit while dogfooding the extension.").length,
    1,
  );
  expectMatch(
    "reworded paragraph is reported",
    missingAuthoredText(
      before,
      "This fixes the token expiry race I hit while testing the tool.\n\nIt reproduces every time the tab sleeps for more than ten minutes.",
    ).length,
    1,
  );
}

async function main(): Promise<void> {
  await testPreserveAuthoredMode();
  await testScopeEnding();
  await testSizeTierOrcPredicate();
  testMissingAuthoredText();

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All refinement scoring tests passed");
}

await main();
