// Unit tests for the refinement loop itself (src/background/refinement.ts):
// target clamping, regression-keep, and abort semantics. The loop's LLM call
// goes through callAPI → global fetch, which is stubbed with a scripted queue
// of canned "refined" bodies — no network. Scores come from the real
// scoreDescription, but the tests assert score RELATIONS (worse < broken <
// improved < max), never absolute counts, so adding a rubric check elsewhere
// doesn't turn this file into noise. fixtureSanity pins those relations up
// front so a drift in a deterministic check fails loudly instead of silently
// changing what the loop assertions mean.

import { ensureArtifactEnding } from "../src/background/description-normalize";
import { refineDescription } from "../src/background/refinement";
import { scoreDescription } from "../src/background/refinement-checks";
import type { ExtensionConfig } from "../src/types";
import { expectMatch, getFailures } from "./expect-helpers";

const BASE_CONFIG: ExtensionConfig = {
  apiEndpoint: "https://probe.invalid/v1",
  apiKey: "k",
  model: "m",
  githubToken: "gh-t",
  diffEnabled: false,
  diffMaxLines: 10,
  diffMaxBytes: 100,
  thinkingEffort: "default",
};

const STATS = { files: 3, additions: 10, deletions: 2 };

// A commit whose >3-char headline words never appear in PERFECT/COVERED below,
// so the commitCoverage check fails until a refinement mentions them.
const UNCOVERED_COMMITS = ["chore: frabjous gizmo"];

// Full-marks draft with anchors + stats present: passes every applicable check
// when the commit list is empty (or covered) and the ending stays an artifact.
const PERFECT = [
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

// Full score WITH commits: same body plus a bullet naming the commit words.
const COVERED = PERFECT.replace(
  "- **Tests** — covers the race [[3]](diffhunk://#diff-cccc_L5-R6)",
  "- **Tests** — covers the race [[3]](diffhunk://#diff-cccc_L5-R6)\n" +
    "- **Chore** — includes the frabjous gizmo change [[4]](diffhunk://#diff-dddd_L7-R8)",
);

// Two independent failures: the open fence (never excused, even on small diffs)
// and the uncovered commit. Normalization-stable (short structural lines,
// artifact tail), so refineDescription returns it verbatim.
const BROKEN = PERFECT + "\n\n```bash\necho trailing-open-fence\n";

// Worse than BROKEN: one sprawling >400-char prose sentence plus no anchors,
// commit still uncovered — the normalizer's appended scope line rescues only
// the ending check.
const WORSE =
  "## Summary\n" +
  "Refined output dropped every section and replaced it with a single vague paragraph " +
  "that meanders without specifics about files behavior or verification steps whatsoever " +
  "and keeps padding itself with empty phrases so the attempt clears the minimum length gate " +
  "while saying less and less about anything that a reviewer could actually check or use " +
  "until it finally trails off into more and more empty filler" +
  "\n\n## Notes\nShort filler line.\n";

// Scores measured once from the real scorer; every loop assertion below refers
// to these, so the tests survive rubric check-list changes as long as the
// fixture relations (pinned in fixtureSanity) keep holding.
const SCORE = { broken: 0, worse: 0, perfectUncovered: 0, max: 0 };

type FetchImpl = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

function contentResponse(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

// Serve queued "refined" bodies in call order; more loop calls than queued
// items reject loudly instead of silently reusing a tail entry.
function stubFetchQueue(
  queue: string[],
  onEachCall?: (callIndex: number) => void,
): { calls: () => number; run: <T>(fn: () => Promise<T>) => Promise<T> } {
  let calls = 0;
  const impl: FetchImpl = (_url, _init) => {
    const index = calls++;
    onEachCall?.(index);
    const content = queue[index];
    if (content === undefined) return Promise.reject(new Error("fetch queue exhausted"));
    return Promise.resolve(contentResponse(content));
  };
  return {
    calls: () => calls,
    run: <T>(fn: () => Promise<T>): Promise<T> => {
      const original = globalThis.fetch;
      globalThis.fetch = impl as typeof fetch;
      return fn().finally(() => {
        globalThis.fetch = original;
      });
    },
  };
}

async function fixtureSanity(): Promise<void> {
  SCORE.broken = (await scoreDescription(BROKEN, UNCOVERED_COMMITS, true, STATS)).score;
  SCORE.worse = (await scoreDescription(ensureArtifactEnding(WORSE, STATS), UNCOVERED_COMMITS, true, STATS)).score;
  SCORE.perfectUncovered = (await scoreDescription(PERFECT, UNCOVERED_COMMITS, true, STATS)).score;
  const covered = await scoreDescription(COVERED, UNCOVERED_COMMITS, true, STATS);
  SCORE.max = covered.maxScore;

  expectMatch("sanity: WORSE scores strictly below BROKEN", SCORE.worse < SCORE.broken, true);
  expectMatch("sanity: PERFECT (commit uncovered) improves BROKEN", SCORE.perfectUncovered > SCORE.broken, true);
  expectMatch("sanity: BROKEN is below maxScore", SCORE.broken < SCORE.max, true);
  expectMatch("sanity: PERFECT (commit uncovered) is still below maxScore", SCORE.perfectUncovered < SCORE.max, true);
  expectMatch("sanity: COVERED reaches maxScore", covered.score === covered.maxScore, true);
  expectMatch(
    "sanity: PERFECT with an empty commit list also reaches maxScore",
    (await scoreDescription(PERFECT, [], true, STATS)).score,
    SCORE.max,
  );
}

// Target clamping: targetScore is clamped to maxScore (and not clamped from
// below), so absurd targets never burn iterations the score cannot satisfy.
async function testTargetClamping(): Promise<void> {
  const perfect = stubFetchQueue([]);
  const alreadyDone = await perfect.run(() => refineDescription(BASE_CONFIG, "T", PERFECT, [], true, 3, 999, STATS));
  expectMatch("clamp: maxScore draft + huge target → zero iterations", alreadyDone.iterations, 0);
  expectMatch("clamp: zero LLM calls when already at maxScore", perfect.calls(), 0);
  expectMatch("clamp: maxScore draft returned verbatim", alreadyDone.description, PERFECT);

  // Reaching maxScore stops the loop even under a huge target; without the
  // clamp the loop would keep refining (maxScore < 999) until maxIterations.
  const climbing = stubFetchQueue([COVERED]);
  const finished = await climbing.run(() =>
    refineDescription(BASE_CONFIG, "T", BROKEN, UNCOVERED_COMMITS, true, 5, 999, STATS),
  );
  expectMatch("clamp: huge target still stops at maxScore after one iteration", finished.iterations, 1);
  expectMatch("clamp: exactly one LLM call", climbing.calls(), 1);
  expectMatch("clamp: final state is the full-score refinement", finished.description, COVERED);
  expectMatch("clamp: final score is maxScore", finished.finalScore, SCORE.max);

  // No lower clamp: a target below the current score fails the loop condition
  // immediately — zero iterations, input returned post-normalization.
  const low = stubFetchQueue([]);
  const skipped = await low.run(() =>
    refineDescription(BASE_CONFIG, "T", BROKEN, UNCOVERED_COMMITS, true, 5, 3, STATS),
  );
  expectMatch("clamp: target below current score → zero iterations", skipped.iterations, 0);
  expectMatch("clamp: target below current score → no LLM calls", low.calls(), 0);
  expectMatch("clamp: normalized input returned", skipped.description, BROKEN);
  expectMatch("clamp: current score is the initial score", skipped.finalScore, SCORE.broken);
}

// Regression-keep: a refined candidate scoring below the current best is
// discarded, the previous description is kept, and the loop continues.
async function testRegressionKeep(): Promise<void> {
  const stub = stubFetchQueue([WORSE, COVERED]);
  const result = await stub.run(() =>
    refineDescription(BASE_CONFIG, "T", BROKEN, UNCOVERED_COMMITS, true, 3, SCORE.max, STATS),
  );
  expectMatch("regression: loop continued past the worse attempt", stub.calls(), 2);
  expectMatch("regression: both iterations counted", result.iterations, 2);
  expectMatch("regression: worse candidate discarded, later improvement kept", result.description, COVERED);
  expectMatch("regression: worse text left no trace", result.description.includes("vague paragraph"), false);
  expectMatch("regression: final score is maxScore", result.finalScore, SCORE.max);
}

// Abort: a pre-aborted signal stops the loop before any LLM call and returns
// the normalized input with its initial score.
async function testAbortBeforeStart(): Promise<void> {
  const controller = new AbortController();
  controller.abort(new Error("user navigated away"));
  const stub = stubFetchQueue([COVERED]);
  const result = await stub.run(() =>
    refineDescription(
      BASE_CONFIG,
      "T",
      BROKEN,
      UNCOVERED_COMMITS,
      true,
      3,
      SCORE.max,
      STATS,
      undefined,
      false,
      controller.signal,
    ),
  );
  expectMatch("abort before start: zero iterations", result.iterations, 0);
  expectMatch("abort before start: no LLM calls", stub.calls(), 0);
  expectMatch("abort before start: normalized input returned", result.description, BROKEN);
  expectMatch("abort before start: initial score kept", result.finalScore, SCORE.broken);
}

// Abort mid-loop: the abort lands during the first (successful) refinement; the
// accepted improvement is kept and the loop breaks at the next iteration top.
async function testAbortAfterAcceptedIteration(): Promise<void> {
  const controller = new AbortController();
  const stub = stubFetchQueue([PERFECT], () => {
    controller.abort(new Error("user stopped"));
  });
  const result = await stub.run(() =>
    refineDescription(
      BASE_CONFIG,
      "T",
      BROKEN,
      UNCOVERED_COMMITS,
      true,
      3,
      SCORE.max,
      STATS,
      undefined,
      false,
      controller.signal,
    ),
  );
  expectMatch("abort mid-loop: accepted iteration counted", result.iterations, 1);
  expectMatch("abort mid-loop: exactly one LLM call", stub.calls(), 1);
  expectMatch("abort mid-loop: accepted refinement kept", result.description, PERFECT);
  expectMatch(
    "abort mid-loop: final score reflects the accepted refinement",
    result.finalScore,
    SCORE.perfectUncovered,
  );
}

async function main(): Promise<void> {
  await fixtureSanity();
  await testTargetClamping();
  await testRegressionKeep();
  await testAbortBeforeStart();
  await testAbortAfterAcceptedIteration();

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All refinement-loop tests passed");
}

await main();
