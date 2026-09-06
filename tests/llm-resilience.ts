// Resilience unit tests for callAPI (llm.ts): stall watchdog, overall
// deadline, guarded error-body reads, abortable retry sleeps, caller cancel.
// Mocks global fetch — no real network.
import { callAPI } from "../src/background/llm";
import { expectMatch, getFailures } from "./expect-helpers";
import {
  BASE_CONFIG,
  captureFailure,
  type FetchImpl,
  sseDripFeedResponse,
  sseEmptyResponse,
  sseStallResponse,
  stallingErrorBodyResponse,
  withFastTimers,
  withFetch,
} from "./llm-shared";

const STALL_MESSAGE = "LLM stream stalled: no tokens for 60s";
const NAVIGATED_AWAY = "Generation aborted: user navigated away";

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

/** A stream that trickles a token faster than the stall window forever must still hit the overall deadline. */
async function testDripFeedDeadline(): Promise<void> {
  await withFastTimers(() =>
    withFetch(
      (_url, init) => Promise.resolve(sseDripFeedResponse(init)),
      async () => {
        let chunks = 0;
        const onChunk = (): void => {
          chunks++;
        };
        const failure = await captureFailure(() => callAPI(BASE_CONFIG, "prompt", 0.3, onChunk));
        expectMatch("drip feed kept chunks flowing", chunks > 0, true);
        expectMatch(
          "drip feed killed by overall deadline",
          failure instanceof Error ? failure.message : null,
          "LLM call exceeded overall deadline of 300s",
        );
        expectMatch(
          "deadline error is not the per-operation stall error",
          failure instanceof Error && failure.message.includes("stalled"),
          false,
        );
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

  // Drip-feed stream: stall watchdog never fires, overall deadline must.
  await testDripFeedDeadline();

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
