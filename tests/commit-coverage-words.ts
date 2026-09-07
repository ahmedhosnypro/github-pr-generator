// Commit-coverage word matching: paraphrase tolerance (punctuation tokenization
// and plural stemming). Split out of tests/refinement.ts which is at the
// sonarjs/max-lines cap. No network.
import { commitHeadlineWords, countCoveredCommits } from "../src/background/commit-coverage";
import { expectMatch, getFailures } from "./expect-helpers";

function main(): void {
  console.log("=== Commit Coverage Word Matching Tests ===\n");

  expectMatch(
    "bracketed scopes split: docs(dev1-006) yields 'dev1'",
    commitHeadlineWords("docs(dev1-006): add prototype assets and catalog").includes("dev1"),
    true,
  );
  // "006" is only 3 chars — filtered by the >3 minimum, same as before.
  expectMatch(
    "dash splits scopes but 3-char '006' is filtered out",
    commitHeadlineWords("docs(dev1-006): add prototype assets and catalog").includes("006"),
    false,
  );
  // kottaby/kottaby#56: four commits headed "plans" were marked uncovered even
  // though the description says "planning artifacts" — singular stem matches.
  expectMatch(
    "plural headline stem covered by derived form in text",
    countCoveredCommits(["plans"], "Adds sprint planning artifacts."),
    1,
  );
  expectMatch(
    "stemming is not a fake-cover for unrelated text",
    countCoveredCommits(["plans"], "discusses authentication flow only"),
    0,
  );
  expectMatch(
    "exact word match unchanged (auth scope still covers)",
    countCoveredCommits(["docs(dev1-006): add prototype assets and catalog"], "adds `prototype assets` docs"),
    1,
  );
  expectMatch(
    "4-char words stem too ('tests' -> 'test')",
    countCoveredCommits(["write tests"], "coverage from the test suite"),
    1,
  );

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All commit-coverage word-matching tests passed");
}

main();
