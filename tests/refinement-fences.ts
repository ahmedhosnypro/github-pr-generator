// Fence-semantics checks for scoreDescription (split out of refinement.ts):
// content inside ``` fences is not authored content and never satisfies or
// trips the structural checks.
import { scoreDescription } from "../src/background/refinement-checks";
import { expectMatch, getFailures } from "./expect-helpers";
import { FULL_DESCRIPTION, LARGE_STATS } from "./refinement-shared";

// Any fence language (or a bare fence) satisfies the Testing format checks —
// the prompts promise generic fences, not ```bash specifically.
async function testTestingFormatFences(): Promise<void> {
  for (const lang of ["sh", "console", "text", ""]) {
    const opener = lang === "" ? "```" : "```" + lang;
    const variant = FULL_DESCRIPTION.replaceAll("```bash", opener);
    const result = await scoreDescription(variant, [], true, LARGE_STATS);
    const label = lang === "" ? "bare" : lang;
    expectMatch(
      `testingSteps passes with ${label} fences`,
      result.failures.every((f) => f.check !== "testingSteps"),
      true,
    );
    expectMatch(
      `testingFormat passes with ${label} fences`,
      result.failures.every((f) => f.check !== "testingFormat"),
      true,
    );
  }

  const inlineExpected = [
    "## Summary",
    "Fixed the token expiry race.",
    "",
    "## Testing",
    "1. Run the suite with `bun run test` Expected: all green",
    "2. Retry with an expired token before the refresh",
    "",
    "Scope: 2 files, +4/-1",
  ].join("\n");
  expectMatch(
    "Expected: on the command's own line still fails",
    (await scoreDescription(inlineExpected, [], false, LARGE_STATS)).failures.some((f) => f.check === "testingFormat"),
    true,
  );
}

// Numbered steps and diffhunk:// anchors quoted inside ``` fences do not
// count as authored steps/anchors.
async function testFenceBlindnessStepsAndAnchors(): Promise<void> {
  const fencedSteps = [
    "## Summary",
    "Fixed the token expiry race.",
    "",
    "## Testing",
    "Sample output of a run:",
    "```text",
    "1. build compiled",
    "2. tests green",
    "3. smoke passed",
    "```",
    "",
    "Scope: 2 files, +4/-1",
  ].join("\n");
  expectMatch(
    "numbered lines inside a fence do not count as steps",
    (await scoreDescription(fencedSteps, [], false, LARGE_STATS)).failures.some((f) => f.check === "testingSteps"),
    true,
  );

  const fencedAnchors = [
    "## Summary",
    "Fixed the token expiry race.",
    "",
    "## Changes",
    "- **Auth** — refresh token early",
    "- **Client** — retries once",
    "- **Tests** — covers the race",
    "",
    "Previous description quoted verbatim:",
    "```text",
    "- **Auth** — refresh early [[1]](diffhunk://#diff-aaaa_L1-R2)",
    "- **Client** — retries once [[2]](diffhunk://#diff-bbbb_L3-R4)",
    "- **Tests** — covers the race [[3]](diffhunk://#diff-cccc_L5-R6)",
    "- see [[4]] for context",
    "```",
    "",
    "Scope: 3 files, +10/-2",
  ].join("\n");
  const fencedAnchorScore = await scoreDescription(fencedAnchors, [], true, LARGE_STATS);
  const anchorFailures = fencedAnchorScore.failures.filter((f) => f.check === "anchors");
  expectMatch(
    "diffhunk:// links inside a fence do not count as anchors",
    anchorFailures.some((f) => f.detail.includes("0 anchors")),
    true,
  );
  expectMatch(
    "bare [[N]] inside a fence is not reported",
    anchorFailures.every((f) => !f.detail.includes("bare")),
    true,
  );
}

// Oversized bullets / Expected lines inside ``` fences do not trip the size
// caps that apply to authored content.
async function testFenceBlindnessSizeCaps(): Promise<void> {
  const longBullet = "- " + "filler ".repeat(70).trim();
  const longExpected = "Expected: " + "x".repeat(450);
  const fenced = FULL_DESCRIPTION.replace(
    "\nScope: 3 files, +10/-2",
    `\n\`\`\`text\n${longBullet}\n${longExpected}\n\`\`\`\n\nScope: 3 files, +10/-2`,
  );
  const fencedScore = await scoreDescription(fenced, [], true, LARGE_STATS);
  expectMatch(
    ">60-word bullet inside a fence does not trip bulletWords",
    fencedScore.failures.every((f) => f.check !== "bulletWords"),
    true,
  );
  expectMatch(
    ">400-char Expected line inside a fence does not trip expectedLineLength",
    fencedScore.failures.every((f) => f.check !== "expectedLineLength"),
    true,
  );

  const unfenced = fenced.replace("```text\n", "").replace("\n```\n\nScope", "\n\nScope");
  const unfencedScore = await scoreDescription(unfenced, [], true, LARGE_STATS);
  expectMatch(
    "same long bullet outside a fence trips bulletWords",
    unfencedScore.failures.some((f) => f.check === "bulletWords"),
    true,
  );
  expectMatch(
    "same long Expected line outside a fence trips expectedLineLength",
    unfencedScore.failures.some((f) => f.check === "expectedLineLength"),
    true,
  );
}

async function main(): Promise<void> {
  await testTestingFormatFences();
  await testFenceBlindnessStepsAndAnchors();
  await testFenceBlindnessSizeCaps();

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All refinement fence tests passed");
}

await main();
