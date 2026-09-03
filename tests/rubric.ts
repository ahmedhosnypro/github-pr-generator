// Unit tests for the PR-lab acceptance rubric (tests/pr-lab-rubric.ts).
// The rubric is what says a generated description is "good enough" — it must
// encode size awareness and detect anchor degeneration, not just keywords.
import { countDiffAnchors } from "../src/background/parse";
import { expectMatch, getFailures } from "./expect-helpers";
import { scoreDescription } from "./pr-lab-rubric";

const GOOD = `## Summary
Fixed the race by deduplicating the refresh call.

## Changes
- **Auth** — refresh earlier [[1]](diffhunk://abc_L10-R20)
- **Client** — retries [[2]](diffhunk://abc_L30-R40)
- **Cache** — clear on 401 [[3]](diffhunk://abc_L50-R60)

## Testing
1. Run tests
\`\`\`bash
bun run test
\`\`\`
Expected: passes

Scope: 3 files, +20/-8`;

async function main(): Promise<void> {
  console.log("=== PR-Lab Rubric Tests ===\n");

  const good = scoreDescription(GOOD, "fix: x", ["fix: the race"]);
  expectMatch("good description scores 10", good.score, 10);

  // Bare [[N]] refs without URLs are invalid anchors.
  const bareOnly = GOOD.replaceAll(/\[\[(\d+)\]\]\(([^)]+)\)/g, "[[$1]]");
  expectMatch("bare ref counting", countDiffAnchors(bareOnly), 0);
  const bareScored = scoreDescription(bareOnly, "fix: x", ["fix: the race"]);
  expectMatch(
    "bare refs fail anchors check",
    bareScored.checks.some((c) => c.name.includes("anchors") && !c.ok),
    true,
  );
  expectMatch("bare refs below 10", bareScored.score < 10, true);

  // Small diffs may skip Changes/Testing; new leniency triggers on fileCount ≤3.
  const small = "## Summary\nFixed the token race in one place.\n\nScope: 1 file, +3/-1";
  const smallScored = scoreDescription(small, "fix: token race", ["fix: token race"], {
    fileCount: 2,
    expectAnchors: false,
  });
  expectMatch(
    "small diff: no Changes/Testing is fine",
    smallScored.checks.every((c) => c.ok || c.name.startsWith("testing skipped") || c.name.includes("folded")),
    true,
  );

  // A missing Summary on a large diff fails multiple checks.
  const noSummary =
    "## Changes\n- **Auth** — x [[1]](diffhunk://abc_L1-R2)\n\n## Testing\n1. step\n```bash\ncmd\n```\nExpected: ok";
  const noSummaryScored = scoreDescription(noSummary, "fix: x", ["fix: x"], { expectAnchors: true });
  expectMatch(
    "no opener",
    noSummaryScored.checks.some((c) => c.name.includes("summary") && !c.ok),
    true,
  );

  // expectAnchors=false rejects invented links.
  const invented = scoreDescription(GOOD, "fix: x", ["fix: the race"], { expectAnchors: false });
  expectMatch("invented anchors rejected when prompt had none", invented.score < 10, true);

  // A "Verification" section is a synonym for "## Testing" — steps there count.
  const verificationAlias = GOOD.replace("## Testing", "## Verification");
  const aliasScored = scoreDescription(verificationAlias, "fix: x", ["fix: the race"]);
  expectMatch("verification alias satisfies testing check", aliasScored.score, 10);

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All rubric tests passed");
}

await main();
