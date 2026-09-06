// Unit tests for callAPI (llm.ts): the run 20 empty-stream retry, plus the
// JSON parse fallback from run 15. Mocks global fetch — no real network.
import { callAPI, MAX_COMPLETION_TOKENS, STREAM_STALL_TIMEOUT_MS } from "../src/background/llm";
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

type FetchImpl = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

function jsonResponse(payload: object): Response {
  return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
}

function sseEmptyFactory(): () => Response {
  return () => new Response("data: [DONE]\n\n", { status: 200, headers: { "content-type": "text/event-stream" } });
}

function sseFullFactory(): () => Response {
  return () =>
    new Response('data: {"choices":[{"delta":{"content":"recovered"}}]}\n\ndata: [DONE]\n\n', {
      status: 200,
      headers: { "content-type": "text/event-stream" },
    });
}

/** SSE body that delivers one chunk and then goes silent forever. */
function sseStallFactory(): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n'));
        // then silence — no further chunks, ever
      },
    }),
    { status: 200, headers: { "content-type": "text/event-stream" } },
  );
}

/** Same silent SSE body, but errors when the fetch signal aborts — like real fetch. */
function sseStallUntilAbortResponse(init: RequestInit | undefined): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n'));
        init?.signal?.addEventListener("abort", () => {
          controller.error(new DOMException("The operation was aborted.", "AbortError"));
        });
      },
    }),
    { status: 200, headers: { "content-type": "text/event-stream" } },
  );
}

/** Shrink the stall watchdog window so stall tests don't wait out the real 60s. */
function withFastStallWatchdog(fn: () => Promise<void>): Promise<void> {
  const original = globalThis.setTimeout;
  const fast = ((callback: (...args: never[]) => void, delay?: number) =>
    original(callback, delay === STREAM_STALL_TIMEOUT_MS ? 5 : delay)) as unknown as typeof setTimeout;
  globalThis.setTimeout = fast;
  return fn().finally(() => {
    globalThis.setTimeout = original;
  });
}

function withFetch(impl: FetchImpl, fn: () => Promise<void>): Promise<void> {
  const original = globalThis.fetch;
  globalThis.fetch = impl as typeof fetch;
  return fn().finally(() => {
    globalThis.fetch = original;
  });
}

/** Stalled SSE stream (one chunk, then silence) must abort and reject with a descriptive stall error. */
async function testStalledStream(): Promise<void> {
  await withFastStallWatchdog(() =>
    withFetch(
      () => Promise.resolve(sseStallFactory()),
      async () => {
        let failure: unknown = null;
        await callAPI(BASE_CONFIG, "prompt").catch((e: unknown) => {
          failure = e;
        });
        expectMatch(
          "stalled SSE stream rejected by watchdog",
          failure instanceof Error ? failure.message : null,
          "LLM stream stalled: no tokens for 60s",
        );
      },
    ),
  );
}

/** A server that accepts the POST but never answers at all is caught by the same watchdog at the fetch stage. */
async function testHungFetch(): Promise<void> {
  await withFastStallWatchdog(() =>
    withFetch(
      () => new Promise<Response>(() => {}),
      async () => {
        let failure: unknown = null;
        await callAPI(BASE_CONFIG, "prompt").catch((e: unknown) => {
          failure = e;
        });
        expectMatch(
          "never-answering endpoint rejected by watchdog",
          failure instanceof Error ? failure.message : null,
          "LLM stream stalled: no tokens for 60s",
        );
      },
    ),
  );
}

/** Caller cancel mid-stream: rejection carries the caller's reason and is not re-wrapped as a network error. */
async function testCallerAbort(): Promise<void> {
  await withFetch(
    (_url, init) => Promise.resolve(sseStallUntilAbortResponse(init)),
    async () => {
      const caller = new AbortController();
      const chunks: string[] = [];
      let failure: unknown = null;
      await callAPI(
        BASE_CONFIG,
        "prompt",
        0.3,
        (delta) => {
          chunks.push(delta);
          caller.abort(new Error("Generation aborted: user navigated away"));
        },
        true,
        true,
        caller.signal,
      ).catch((e: unknown) => {
        failure = e;
      });
      expectMatch(
        "caller abort surfaces its own reason",
        failure instanceof Error ? failure.message : null,
        "Generation aborted: user navigated away",
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

function reportOutcome(): void {
  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All LLM-client tests passed");
}

/** The request body must cap completions at MAX_COMPLETION_TOKENS so long template fills are not truncated. */
async function testRequestBodyCap(): Promise<void> {
  let capturedBody: { max_tokens?: number; model?: string; stream?: boolean } = {};
  await withFetch(
    (_url, init) => {
      const body = init?.body;
      capturedBody = JSON.parse(typeof body === "string" ? body : "") as typeof capturedBody;
      return Promise.resolve(jsonResponse({ choices: [{ message: { content: "body-captured" } }] }));
    },
    async () => {
      const out = await callAPI(BASE_CONFIG, "prompt");
      expectMatch("body-captured response parsed", out, "body-captured");
      expectMatch("request sets max_tokens", capturedBody.max_tokens, MAX_COMPLETION_TOKENS);
      expectMatch("request still sends model", capturedBody.model, BASE_CONFIG.model);
      expectMatch("request still asks for stream", capturedBody.stream, true);
    },
  );
}

async function main(): Promise<void> {
  // Plain JSON response — no SSE, no stream.
  await withFetch(
    () => Promise.resolve(jsonResponse({ choices: [{ message: { content: "hello" } }] })),
    async () => {
      const out = await callAPI(BASE_CONFIG, "prompt");
      expectMatch("plain JSON parses", out, "hello");
    },
  );

  // Empty SSE body then a contentful retry — one retry must suffice.
  const makeEmpty = sseEmptyFactory();
  const makeFull = sseFullFactory();
  let calledFirst = 0;
  await withFetch(
    () => Promise.resolve(calledFirst++ === 0 ? makeEmpty() : makeFull()),
    async () => {
      const out = await callAPI(BASE_CONFIG, "prompt");
      expectMatch("empty stream retries once and wins", out, "recovered");
      expectMatch("exactly two calls made", calledFirst, 2);
    },
  );

  // Empty both times → throw, but only after exactly 2 attempts (no infinite retry).
  let callsSecond = 0;
  await withFetch(
    () => {
      callsSecond++;
      return Promise.resolve(makeEmpty());
    },
    async () => {
      let threw = false;
      try {
        await callAPI(BASE_CONFIG, "prompt");
      } catch (e) {
        threw = true;
        expectMatch("error surfaces original message", (e as Error).message, "No content in API response");
      }
      expectMatch("two-attempt cap respected", threw && callsSecond === 2, true);
    },
  );

  // A non-SSE body containing a valid "data: [DONE]" substring must not corrupt JSON (run 15).
  await withFetch(
    () => Promise.resolve(jsonResponse({ choices: [{ message: { content: "Note: data: [DONE] is fine here" } }] })),
    async () => {
      const out = await callAPI(BASE_CONFIG, "prompt");
      expectMatch("data: [DONE] inside JSON survives", out.includes("[DONE]"), true);
    },
  );

  // Transient 503 → one retry (after 2s backoff) then success.
  let transientCalls = 0;
  await withFetch(
    () => {
      transientCalls++;
      return transientCalls === 1
        ? Promise.resolve(new Response('{"error":"SERVICE_UNAVAILABLE"}', { status: 503 }))
        : Promise.resolve(jsonResponse({ choices: [{ message: { content: "ok-after-503" } }] }));
    },
    async () => {
      const out = await callAPI(BASE_CONFIG, "prompt");
      expectMatch("transient 503 retried once, succeeds", out, "ok-after-503");
      expectMatch("exactly two attempts on transient", transientCalls, 2);
    },
  );

  // Stall watchdog and caller-cancel coverage.
  await testStalledStream();
  await testHungFetch();
  await testCallerAbort();

  // The request body must cap completions at MAX_COMPLETION_TOKENS so long
  // template fills are not silently truncated by a provider-side default.
  await testRequestBodyCap();

  reportOutcome();
}

await main();
