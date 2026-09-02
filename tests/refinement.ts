import { countCoveredCommits, coverageThreshold } from "../src/background/commit-coverage";
import { scoreDescription } from "../src/background/refinement-checks";
import { expectMatch, getFailures } from "./expect-helpers";

const FULL_DESCRIPTION = [
  "## Summary",
  "Fixed the token expiry race by refreshing before each request.",
  "",
  "## Changes",
  "- **Auth** — refresh token early [[1]](diffhunk://#diff-aaaa_L1-R2)",
  "- **Client** — retries once [[2]](diffhunk://#diff-bbbb_L3-R4)",
  "- **Tests** — covers the race [[3]](diffhunk://#diff-cccc_L5-R6)",
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
  "Scope: 3 files, +10/-2",
].join("\n");

const SMALL_STATS = { files: 1, additions: 5, deletions: 2 };
const LARGE_STATS = { files: 12, additions: 600, deletions: 40 };

// Anchors only demanded when the PR has usable scrape targets (run 5/8).
async function testAnchorGating(): Promise<void> {
  const noAnchorDescription = FULL_DESCRIPTION.replaceAll(/\s*\[\[\d+\]\]\(diffhunk:\/\/[^)]+\)/g, "");

  const withAnchors = await scoreDescription(noAnchorDescription, [], false);
  expectMatch(
    "anchor check skipped when no anchors exist",
    withAnchors.failures.some((f) => f.check === "anchors"),
    false,
  );

  const demanded = await scoreDescription(noAnchorDescription, [], true);
  expectMatch(
    "anchor failure reported when anchors exist",
    demanded.failures.some((f) => f.check === "anchors"),
    true,
  );
  expectMatch("skipping the check yields one fewer max point", withAnchors.maxScore, demanded.maxScore - 1);
  expectMatch(
    "skipping the check clears the unfixable anchor failure",
    withAnchors.failures.length === 0 && demanded.failures.length > 0,
    true,
  );

  const good = await scoreDescription(FULL_DESCRIPTION, [], true);
  expectMatch(
    "complete description passes all checks",
    good.failures.length === 0 && good.score === good.maxScore,
    true,
  );
}

// Size proportionality (run 13): small diffs get a 200-word cap, others don't.
async function testProportionalSize(): Promise<void> {
  const padded = `${FULL_DESCRIPTION}\n\n${"filler words to inflate this description far beyond what a small diff needs ".repeat(20)}`;
  const bloated = await scoreDescription(padded, [], false, SMALL_STATS);
  expectMatch(
    "oversized description for small diff flagged",
    bloated.failures.some((f) => f.check === "proportionalSize"),
    true,
  );
  expectMatch("proportional check adds one point to max", bloated.maxScore, 12);
  const compact = await scoreDescription("## Summary\nFixed the config path.", [], false, SMALL_STATS);
  expectMatch(
    "compact description escapes size flag",
    compact.failures.some((f) => f.check === "proportionalSize"),
    false,
  );
  const bigDiff = await scoreDescription(padded, [], false, LARGE_STATS);
  expectMatch(
    "large diffs have no size cap",
    bigDiff.failures.some((f) => f.check === "proportionalSize"),
    false,
  );
  const noStats = await scoreDescription(padded, [], false, null);
  expectMatch(
    "no size check without stats",
    noStats.maxScore === 11 && !noStats.failures.some((f) => f.check === "proportionalSize"),
    true,
  );
}

// Small-diff leniency (run 37): no scaffold sections required on small diffs.
async function testSmallDiffLeniency(): Promise<void> {
  const compact = "## Summary\nFixed the token expiry race.\n\nScope: 1 file, +5/-2";
  const lenient = await scoreDescription(compact, [], false, SMALL_STATS);
  expectMatch(
    "small diff: missing scaffolding is fine",
    lenient.failures.every(
      (f) =>
        f.check !== "boldLabelBullets" &&
        f.check !== "testingSteps" &&
        f.check !== "fences" &&
        f.check !== "testingFormat",
    ),
    true,
  );
  const strictOnLarge = await scoreDescription(compact, [], false, LARGE_STATS);
  expectMatch(
    "large diff: missing scaffolding is still flagged",
    strictOnLarge.failures.some((f) => f.check === "boldLabelBullets") &&
      strictOnLarge.failures.some((f) => f.check === "testingSteps"),
    true,
  );
  const oneFence = compact + "\n```bash\nbun run test\n";
  expectMatch(
    "unbalanced fence fails even on small diff",
    (await scoreDescription(oneFence, [], false, SMALL_STATS)).failures.some((f) => f.check === "fences"),
    true,
  );
}

// Commit coverage: word-match semantics + the scaled threshold curve.
function testCommitCoverage(): void {
  const msgList = ["fix(auth): refresh token race", "docs: update readme", "chore: bump deps"];
  expectMatch(
    "headline word matches count coverage",
    countCoveredCommits(msgList, "Fixes the token race in auth code."),
    1,
  );
  expectMatch(
    "long message body words ignored (headline only)",
    countCoveredCommits(["fix: x\n\nbody elaboration details"], "details"),
    0,
  );
  expectMatch("short words (<4 chars) do not count", countCoveredCommits(["fix a bug"], "a bug"), 0);
  expectMatch("threshold: ≤20 commits requires 90%", coverageThreshold(10), 0.9);
  expectMatch("threshold: 122 commits declines to the 60% floor", coverageThreshold(122), 0.6);
  expectMatch("threshold: 80 commits is 0.6 via linear decline", coverageThreshold(80), 0.6);
  expectMatch("threshold: 50 commits is 0.75 (mid-range)", coverageThreshold(50), 0.9 - 30 * 0.005);
}

async function main(): Promise<void> {
  await testAnchorGating();
  await testProportionalSize();
  await testSmallDiffLeniency();
  testCommitCoverage();

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All refinement testing passed");
}

await main();
