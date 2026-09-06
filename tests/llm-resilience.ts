// Resilience unit tests for callAPI (llm.ts): stall watchdog, no-content
// budget, guarded error-body reads, abortable retry sleeps, caller cancel.
// Mocks global fetch — no real network.
import { callAPI } from "../src/background/llm";
import { expectMatch, getFailures } from "./expect-helpers";
import {
  BASE_CONFIG,
  captureFailure,
  type FetchImpl,
  sseContentDripResponse,
  sseEmptyResponse,
  sseKeepaliveDripResponse,
  sseStallResponse,
  stallingErrorBodyResponse,
  withFastTimers,
  withFetch,
} from "./llm-shared";

const STALL_MESSAGE = "LLM stream stalled: no tokens for 60s";
const NAVIGATED_AWAY = "Generation aborted: user navigated away";
const NO_CONTENT_MESSAGE = "LLM stream produced no content for 300s";

/** A hung/stalling fetch must reject with the watchdog's stall error instead of freezing. */
async function expectStallRejection(label: string, fetchImpl: FetchImpl): Promise<void> {
  await withFastTimers(() =>
    withFetch(fetchImpl, async () => {
      const failure = await captureFailure(() => callAPI(BASE_CONFIG, "prompt"));
      expectMatch(label, failure instanceof Error ? failure.message : null, STALL_MESSAGE);
    }),
  );
}

/** Caller abort during a retry back-sleep must reject promptly instead of sleeping through the cancel. */
async function expectSleepAborts(label: string, makeResponse: () => Response, maxElapsedMs: number): Promise<void> {
  await withFetch(
    () => Promise.resolve(makeResponse()),
    async () => {
      const caller = new AbortController();
      const started = Date.now();
      setTimeout(() => {
        caller.abort(new Error(NAVIGATED_AWAY));
      }, 25);
      const failure = await captureFailure(() =>
        callAPI(BASE_CONFIG, "prompt", 0.3, undefined, true, true, caller.signal),
      );
      expectMatch(label + " surfaces caller reason", failure instanceof Error ? failure.message : null, NAVIGATED_AWAY);
      expectMatch(label + " cut short", Date.now() - started < maxElapsedMs, true);
    },
  );
}

/** Caller cancel mid-stream: rejection carries the caller's reason and is not re-wrapped as a network error. */
async function testCallerAbort(): Promise<void> {
  await withFetch(
    (_url, init) => Promise.resolve(sseStallResponse(init)),
    async () => {
      const caller = new AbortController();
      const chunks: string[] = [];
      const onChunk = (delta: string): void => {
        chunks.push(delta);
        caller.abort(new Error(NAVIGATED_AWAY));
      };
      const failure = await captureFailure(() =>
        callAPI(BASE_CONFIG, "prompt", 0.3, onChunk, true, true, caller.signal),
      );
      expectMatch(
        "caller abort surfaces its own reason",
        failure instanceof Error ? failure.message : null,
        NAVIGATED_AWAY,
      );
      expectMatch(
        "abort is not rewrapped as network error",
        failure instanceof Error && failure.message.includes("Network error"),
        false,
      );
      expectMatch("pre-abort chunks still delivered", chunks.join(""), "partial");
    },
  );
}

/**
 * Acknowledged-but-contentless stream: a keepalive-only drip (bytes every
 * tick, never a single token) must be killed by the no-content budget —
 * under withFastTimers the 5-minute floor shrinks to 60ms.
 */
async function testContentlessDripRejected(): Promise<void> {
  await withFastTimers(() =>
    withFetch(
      (_url, init) => Promise.resolve(sseKeepaliveDripResponse(init)),
      async () => {
        const failure = await captureFailure(() => callAPI(BASE_CONFIG, "prompt"));
        expectMatch(
          "contentless drip killed by no-content budget",
          failure instanceof Error ? failure.message : null,
          NO_CONTENT_MESSAGE,
        );
        expectMatch(
          "budget error is not the per-operation stall error",
          failure instanceof Error && failure.message.includes("stalled"),
          false,
        );
      },
    ),
  );
}

/**
 * The no-content budget scales with prompt size: a 120k-char prompt gets
 * 480s (shrunk to 96ms) instead of the 5-min floor (shrunk to 60ms), so the
 * same contentless drip outlives the floor before being aborted.
 */
async function testScaledBudgetForLargePrompt(): Promise<void> {
  await withFastTimers(() =>
    withFetch(
      (_url, init) => Promise.resolve(sseKeepaliveDripResponse(init)),
      async () => {
        const started = Date.now();
        const failure = await captureFailure(() => callAPI(BASE_CONFIG, "x".repeat(120_000)));
        expectMatch(
          "large prompt gets scaled budget in error",
          failure instanceof Error ? failure.message : null,
          "LLM stream produced no content for 480s",
        );
        expectMatch("large prompt outlasts the floor budget", Date.now() - started >= 85, true);
      },
    ),
  );
}

/**
 * A slow-but-healthy stream (real content trickling the whole time) has no
 * deadline at all: it must run past the shrunk floor budget (~60ms) and
 * complete, where the old flat overall deadline would have cut it off.
 */
async function testSlowContentStreamSurvives(): Promise<void> {
  await withFastTimers(() =>
    withFetch(
      (_url, init) => Promise.resolve(sseContentDripResponse(init, 100, 1)),
      async () => {
        const started = Date.now();
        const out = await callAPI(BASE_CONFIG, "prompt");
        expectMatch("slow content stream completed in full", out, "x".repeat(100));
        expectMatch("stream survived past the floor budget", Date.now() - started >= 85, true);
      },
    ),
  );
}

async function main(): Promise<void> {
  // Stall watchdog coverage: silent stream, never-answering fetch.
  await expectStallRejection("stalled SSE stream rejected by watchdog", () => Promise.resolve(sseStallResponse()));
  await expectStallRejection("never-answering endpoint rejected by watchdog", () => new Promise<Response>(() => {}));

  await testCallerAbort();

  // Error-body reads must be watchdog-guarded (both the transient-retry
  // classification read and the non-transient classification read).
  await expectStallRejection("stalling error body (transient-retry branch) rejected by watchdog", () =>
    Promise.resolve(stallingErrorBodyResponse(400)),
  );
  await expectStallRejection("stalling error body (error-classification branch) rejected by watchdog", () =>
    Promise.resolve(stallingErrorBodyResponse(403)),
  );

  // Content-progress budget: contentless keepalive drips are killed (with
  // prompt-scaled budgets), slow-but-contentful streams survive unbounded.
  await testContentlessDripRejected();
  await testScaledBudgetForLargePrompt();
  await testSlowContentStreamSurvives();

  // Retry back-sleeps must honor caller abort.
  await expectSleepAborts("transient backoff sleep", () => new Response('{"error":"boom"}', { status: 503 }), 1500);
  await expectSleepAborts("empty-retry sleep", sseEmptyResponse, 900);

  reportOutcome();
}

function reportOutcome(): void {
  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All LLM resilience tests passed");
}

await main();
