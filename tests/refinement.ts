import { stripBotArtifacts } from "../src/background/bot-artifacts";
import { countCoveredCommits, coverageThreshold } from "../src/background/commit-coverage";
import {
  ensureArtifactEnding,
  missingAuthoredSentences,
  wrapLongProseLines,
} from "../src/background/description-normalize";
import { renderedLineLength, scoreDescription } from "../src/background/refinement-checks";
import { expectMatch, getFailures } from "./expect-helpers";
import { FULL_DESCRIPTION, LARGE_STATS, SMALL_STATS } from "./refinement-shared";

// Anchors only demanded when the PR has usable scrape targets (run 5/8).
async function testAnchorGating(): Promise<void> {
  const noAnchorDescription = FULL_DESCRIPTION.replaceAll(/\s*\[\[\d+\]\]\(diffhunk:\/\/[^)]+\)/g, "");

  const withAnchors = await scoreDescription(noAnchorDescription, [], false);
  expectMatch(
    "anchor check skipped without anchors",
    withAnchors.failures.some((f) => f.check === "anchors"),
    false,
  );

  const demanded = await scoreDescription(noAnchorDescription, [], true);
  expectMatch(
    "anchor failure fires when anchors exist",
    demanded.failures.some((f) => f.check === "anchors"),
    true,
  );
  expectMatch("skipping the check yields one fewer max point", withAnchors.maxScore, demanded.maxScore - 1);
  expectMatch(
    "skip clears the anchor failure",
    withAnchors.failures.length === 0 && demanded.failures.length > 0,
    true,
  );

  const good = await scoreDescription(FULL_DESCRIPTION, [], true);
  expectMatch("full description passes all checks", good.failures.length === 0 && good.score === good.maxScore, true);

  // The anchor floor scales with file count (mirroring tests/pr-lab-rubric.ts),
  // so a 1-file PR isn't forced to duplicate links to reach 3.
  const oneAnchor =
    "## Summary\nFixed the token expiry race.\n\n## Changes\n- **Auth** — refresh early [[1]](diffhunk://#diff-aaaa_L1-R2)\n\nScope: 1 file, +5/-2";
  const oneFile = await scoreDescription(oneAnchor, [], true, SMALL_STATS);
  expectMatch(
    "1-file PR passes with a single anchor",
    oneFile.failures.some((f) => f.check === "anchors"),
    false,
  );
  const threeFiles = await scoreDescription(oneAnchor, [], true, { files: 3, additions: 5, deletions: 2 });
  expectMatch(
    "3-file PR still demands 3 anchors",
    threeFiles.failures.some((f) => f.check === "anchors"),
    true,
  );
}

// Size proportionality (run 13): small diffs get a 200-word cap, others don't.
async function testProportionalSize(): Promise<void> {
  const padded = `${FULL_DESCRIPTION}\n\n${"filler words to inflate this description far beyond what a small diff needs ".repeat(20)}`;
  const bloated = await scoreDescription(padded, [], false, SMALL_STATS);
  expectMatch(
    "oversized small-diff description flagged",
    bloated.failures.some((f) => f.check === "proportionalSize"),
    true,
  );
  expectMatch("proportional check adds one point to max", bloated.maxScore, 12);
  const compact = await scoreDescription("## Summary\nFixed the config path.", [], false, SMALL_STATS);
  expectMatch(
    "compact description escapes size cap",
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
  const scaffoldChecks = new Set(["boldLabelBullets", "testingSteps", "fences", "testingFormat"]);
  expectMatch(
    "small diff: missing scaffolding is fine",
    lenient.failures.every((f) => !scaffoldChecks.has(f.check)),
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
  const testingOk = verifiedScore.failures.every((f) => f.check !== "testingSteps" && f.check !== "testingFormat");
  expectMatch("verification alias satisfies testing checks", testingOk, true);
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
  expectMatch("wrap only collapses newlines", wrapped.replace(/\n+/g, " ").includes(longLine.trim()), true);

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
    "no append for zero files",
    ensureArtifactEnding(badEnding, { files: 0, additions: 0, deletions: 0 }),
    badEnding,
  );
}

// Commit coverage word-match semantics, driven as a table:
// [name, headline(s), description text, expected covered count]. Matching
// tolerates punctuation tokenization, Unicode (RTL/CJK) tokens, and a
// trailing-"s" stem for paraphrases like "plans" → "planning".
function testCoverageWordMatch(): void {
  const msgList = ["fix(auth): refresh token race", "docs: update readme", "chore: bump deps"];
  const cases: Array<[string, string[], string, number]> = [
    ["headline word matches count coverage", msgList, "Fixes the token race in auth code.", 1],
    ["long message body words ignored (headline only)", ["fix: x\n\nbody elaboration details"], "details", 0],
    ["short words (<4 chars) do not count", ["fix a bug"], "a bug", 0],
    ["punctuation splits headline tokens", ["docs(dev1-006): add prototype assets"], "adds `prototype assets` docs", 1],
    [
      "tokenized headline misses unrelated text",
      ["docs(dev1-006): add prototype assets"],
      "rewrites the billing pipeline",
      0,
    ],
    ["plural headline stem covered by derived form", ["plans"], "Adds sprint planning artifacts.", 1],
    ["stemming is not a fake-cover for unrelated text", ["plans"], "discusses authentication flow only", 0],
    ["singular headline word matches its plural in text", ["plan"], "updates the plans section", 1],
    ["stem too short (api from apis) does not match", ["apis"], "uses the api layer", 0],
    ["RTL (Arabic) headline covered by quoted words", ["إصلاح مشكلة تسجيل الدخول"], "أصلحنا مشكلة تسجيل الدخول", 1],
    ["RTL (Arabic) headline missed when absent", ["إصلاح مشكلة تسجيل الدخول"], "reworks the caching layer only", 0],
    ["CJK headline covered by quoted headline", ["修复登录过期导致的问题"], "本次发布包含修复登录过期导致的问题。", 1],
    ["CJK headline missed when text differs", ["修复登录过期导致的问题"], "优化了列表页面的渲染性能。", 0],
    ["word-less headline falls back to full-headline match", ["a b c"], "mentions a b c verbatim", 1],
    ["word-less headline still misses when absent", ["a b c"], "unrelated text", 0],
  ];
  for (const [name, commits, text, expected] of cases) {
    expectMatch(name, countCoveredCommits(commits, text), expected);
  }
}

// Commit coverage: the scaled threshold curve and the listed-subset regression.
async function testCommitCoverage(): Promise<void> {
  expectMatch("threshold: ≤20 commits requires 90%", coverageThreshold(10), 0.9);
  expectMatch("threshold: 122 commits declines to the 60% floor", coverageThreshold(122), 0.6);
  expectMatch("threshold: 80 commits is 0.6 via linear decline", coverageThreshold(80), 0.6);
  expectMatch("threshold: 50 commits is 0.75 (mid-range)", coverageThreshold(50), 0.9 - 30 * 0.005);

  // Regression: coverage is judged against the listed commits (the 150 the
  // prompt shows), not the full array — above ~250 commits the old 60% floor
  // was mathematically unreachable.
  const manyCommits = Array.from({ length: 300 }, (_, i) => `feat: implement gadget${String(i)} module`);
  const coveredNames = Array.from({ length: 100 }, (_, i) => "gadget" + String(i)).join(" ");
  const scoredEnough = await scoreDescription("Ships " + coveredNames + ".", manyCommits, false);
  expectMatch(
    "60% of 150 listed commits satisfies coverage",
    scoredEnough.failures.every((f) => f.check !== "commitCoverage"),
    true,
  );
  const underCovered = await scoreDescription("Ships gadget0 only.", manyCommits, false);
  expectMatch(
    "thin coverage on the listed subset still fails",
    underCovered.failures.some((f) => f.check === "commitCoverage" && f.detail.includes("1/150")),
    true,
  );
}

// lineLength is judged on rendered markdown, not raw source: link payloads
// (diffhunk anchors) are invisible in the PR body and must not count toward
// the 400/600 prose-wall limits.
async function testRenderedLineLength(): Promise<void> {
  const plain = "plain prose without links";
  expectMatch("plain line length unchanged", renderedLineLength(plain), plain.length);
  const linked = "refresh [[1]](diffhunk://#diff-aaaa_L1-R2) early";
  expectMatch("link payload excluded from rendered length", renderedLineLength(linked), "refresh [[1]] early".length);
  expectMatch("multiple link payloads stripped", renderedLineLength("[[1]](x) and [[2]](y)"), "[[1]] and [[2]]".length);

  // Integration: the 639-raw/184-rendered incident shape — an anchor-stuffed
  // bullet is raw-huge but renders short, so it must pass lineLength.
  const payload = `[[1]](diffhunk://#diff-${"a".repeat(40)}_L10-R20)`;
  const heavyBullet = `- **Links** — wires the panel ${(payload + " ").repeat(12).trim()}`;
  expectMatch(
    "fixture bullet raw >600, rendered ≤600",
    heavyBullet.length > 600 && renderedLineLength(heavyBullet) <= 600,
    true,
  );
  const heavyDesc = `## Summary\nWires the panel.\n\n## Changes\n${heavyBullet}\n\nScope: 1 file, +5/-2`;
  const heavy = await scoreDescription(heavyDesc, [], false, SMALL_STATS);
  expectMatch(
    "anchor-stuffed bullet passes",
    heavy.failures.every((f) => f.check !== "lineLength"),
    true,
  );

  const wallDesc = `## Summary\nPads a bullet.\n\n## Changes\n- ${"verbiage ".repeat(80).trim()}\n\nScope: 1 file, +5/-2`;
  const walled = await scoreDescription(wallDesc, [], false, SMALL_STATS);
  expectMatch(
    "rendered-long bullet fails lineLength",
    walled.failures.some((f) => f.check === "lineLength"),
    true,
  );
}

// Opener limit is tied to the normalizer's wrap target (PROSE_LINE_TARGET =
// 390): a 301..390-char opener line is never wrapped, so the check must accept
// it — otherwise the length is unfixable without a wasted LLM iteration.
async function testOpenerDeadZone(): Promise<void> {
  const opener = `Fixed ${"the token expiry race condition ".repeat(11)}for good.`; // 373 chars
  expectMatch("opener sits in the old dead zone", opener.length > 300 && opener.length <= 390, true);
  const desc = FULL_DESCRIPTION.replace("Fixed the token expiry race by refreshing before each request.", opener);
  const stats = { files: 3, additions: 10, deletions: 2 };
  expectMatch(
    "dead-zone opener passes the opener check",
    (await scoreDescription(desc, [], true, stats)).failures.every((f) => f.check !== "opener"),
    true,
  );
}

// The anchor requirement is capped by the anchors the prompt actually offered
// (anchorCount), not by the file count.
async function testAnchorSupplyCap(): Promise<void> {
  const oneAnchor =
    "## Summary\nFixed the token expiry race early.\n\n## Changes\n- **Auth** — refresh early [[1]](diffhunk://#diff-aaaa_L1-R2)\n\nScope: 5 files, +12/-3";
  const fiveFiles = { files: 5, additions: 12, deletions: 3 };
  const capped = await scoreDescription(oneAnchor, [], true, fiveFiles, "full", 1);
  expectMatch(
    "1 offered anchor demands only 1 link",
    capped.failures.every((f) => f.check !== "anchors"),
    true,
  );
  const uncapped = await scoreDescription(oneAnchor, [], true, fiveFiles, "full", 5);
  expectMatch(
    "5 offered anchors still demand 3 links",
    uncapped.failures.some((f) => f.check === "anchors"),
    true,
  );
}

// Preserve-authored guard: substantial authored sentences (>80 chars) must
// survive verbatim (up to whitespace re-flow); short notes are not sampled.
function testAuthoredSentenceGuard(): void {
  const longSentence =
    "This fixes the token expiry race I hit while dogfooding the extension nightly and it kept recurring.";
  const before = `${longSentence}\n\nShort note.`;
  expectMatch("identical text keeps every sentence", missingAuthoredSentences(before, before).length, 0);
  expectMatch(
    "re-wrapped sentence counts as preserved",
    missingAuthoredSentences(before, before.replace("race I hit", "race\nI hit")).length,
    0,
  );
  expectMatch("dropped long sentence is reported", missingAuthoredSentences(before, "Short note.").length, 1);
  expectMatch("dropped short sentence is not sampled", missingAuthoredSentences(before, longSentence).length, 0);
}

// Bot-artifact edge cases: '>' inside a whole-comment marker, and a generated
// body that only matches isLikelyTemplate's bare 2+-heading clause must still
// lose its rubber-stamp checklist.
function testBotArtifactEdges(): void {
  const marked = stripBotArtifacts("Body text.\n<!-- coderabbit: src > dist -->\nMore text.");
  expectMatch("comment marker containing '>' is stripped", marked.includes("coderabbit"), false);

  const generated = "## Summary\nReal fix.\n\n## Verification\n- [x] Tested locally\n- [x] Verified no regressions";
  const cleaned = stripBotArtifacts(generated);
  expectMatch("2-heading generated body is not a template", cleaned.includes("Tested locally"), false);
  expectMatch("generated prose itself kept", cleaned.includes("Real fix."), true);
}

async function main(): Promise<void> {
  await testAnchorGating();
  await testProportionalSize();
  await testSmallDiffLeniency();
  testProseWrap();
  await testArtifactEnding();
  testCoverageWordMatch();
  await testCommitCoverage();
  await testRenderedLineLength();
  await testOpenerDeadZone();
  await testAnchorSupplyCap();
  testAuthoredSentenceGuard();
  testBotArtifactEdges();

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All refinement testing passed");
}

await main();
