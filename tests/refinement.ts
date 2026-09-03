import { countCoveredCommits, coverageThreshold } from "../src/background/commit-coverage";
import { ensureArtifactEnding, wrapLongProseLines } from "../src/background/description-normalize";
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

  // A "## Verification" section is an accepted synonym for "## Testing".
  const verified = FULL_DESCRIPTION.replace("## Testing", "## Verification");
  const verifiedScore = await scoreDescription(verified, [], false, LARGE_STATS);
  expectMatch(
    "verification alias satisfies testing checks",
    verifiedScore.failures.every((f) => f.check !== "testingSteps" && f.check !== "testingFormat"),
    true,
  );
}

// Prose wrapping: long one-line paragraphs are split at sentence boundaries,
// structural lines are never touched, and an open `code span` blocks a break.
function testProseWrap(): void {
  const longLine =
    "The deployment workflows previously failed to validate the Tailscale network path reliably because they only checked status output. " +
    "This change adds an active ping check that catches failures before any data is sent over the wire. " +
    "It also scrubs internal IP addresses from the runner logs before they are printed to the console. " +
    "Reviewers can now diagnose preflight failures without exposing internal network details.";
  const wrapped = wrapLongProseLines("## Summary\n\n" + longLine + "\n");
  const lines = wrapped.split("\n");
  expectMatch("long prose line is split", lines.length > 3, true);
  expectMatch(
    "wrapped pieces stay under the limit",
    lines.every((l) => l.length <= 400),
    true,
  );
  expectMatch(
    "wrapping preserves the text (only newlines collapse to spaces)",
    wrapped.replace(/\n+/g, " ").includes(longLine.trim()),
    true,
  );

  const structural = "- a bullet that is long but untouched\n".repeat(12);
  expectMatch("bullet lines never wrapped", wrapLongProseLines(structural), structural);

  const fenced = "```bash\n" + "echo ".repeat(200) + "\n```\n";
  expectMatch("fenced blocks never wrapped", wrapLongProseLines(fenced), fenced);

  const openSpan =
    "Intro with an open `code span that keeps going and going and stays open through many words. ".repeat(3) +
    "Second sentence closes the span` here. " +
    "Tail sentence packs the paragraph way past the limit now. ".repeat(6);
  const spanWrapped = wrapLongProseLines(openSpan);
  expectMatch(
    "no break inside an open code span",
    spanWrapped.split("\n").some((l) => (l.match(/`/g) ?? []).length % 2 === 1 && l.length <= 390),
    false,
  );

  const megaSentence = "word ".repeat(300).trim() + ".";
  expectMatch("a single long sentence is left for refinement", wrapLongProseLines(megaSentence), megaSentence);
}

// Artifact ending: a scope-accounting line is appended only when the draft
// lacks any accepted closing artifact, and the ending check then passes.
async function testArtifactEnding(): Promise<void> {
  const stats = { files: 3, additions: 10, deletions: 2 };
  const badEnding = FULL_DESCRIPTION.replace("\nScope: 3 files, +10/-2", "");
  const fixed = ensureArtifactEnding(badEnding, stats);
  expectMatch("missing artifact ending gains a scope line", fixed.endsWith("Scope: 3 files, +10/-2.\n"), true);
  expectMatch(
    "appended scope line satisfies the ending check",
    (await scoreDescription(fixed, [], false, stats)).failures.every((f) => f.check !== "ending"),
    true,
  );

  const alreadyGood = FULL_DESCRIPTION;
  expectMatch("existing artifact ending kept verbatim", ensureArtifactEnding(alreadyGood, stats), alreadyGood);
  expectMatch("no stats, no append", ensureArtifactEnding(badEnding, null), badEnding);
  expectMatch(
    "zero-file stats, no append",
    ensureArtifactEnding(badEnding, { files: 0, additions: 0, deletions: 0 }),
    badEnding,
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
  testProseWrap();
  await testArtifactEnding();
  testCommitCoverage();

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All refinement testing passed");
}

await main();
