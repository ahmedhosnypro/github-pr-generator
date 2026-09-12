// Unit tests for concurrent callAPI calls (llm.ts): two generations in flight
// at once over one mocked fetch must stay isolated — each call aggregates only
// its own stream content, a stalled/aborted call never aborts its sibling
// (watchdogs are per-call AbortControllers), and per-call reasoning_content
// stays separate. Mocks global fetch — no real network.
import { callAPI } from "../src/background/llm";
import { expectMatch, getFailures } from "./expect-helpers";
import { BASE_CONFIG, captureFailure, withFetch } from "./llm-shared";

interface RecordedCall {
  url: string;
  signal: AbortSignal;
  body: { model?: string };
}

type FetchUrl = string | URL | Request;

/** SSE frame for one content delta. */
function deltaFrame(json: string): string {
  return 'data: {"choices":[{"delta":' + json + "}]}\n\n";
}

/** Interleaving stream: pushes this call's tokens then ends with [DONE]. */
function controlledStream(tokens: string[], signal: AbortSignal): Response {
  const encoder = new TextEncoder();
  let index = 0;
  return new Response(
    new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (signal.aborted) {
          controller.error(new DOMException("The operation was aborted.", "AbortError"));
          return;
        }
        if (index < tokens.length) {
          controller.enqueue(encoder.encode(deltaFrame('{"content":' + JSON.stringify(tokens[index]) + "}")));
          index++;
          return;
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    { status: 200, headers: { "content-type": "text/event-stream" } },
  );
}

/** Two SSE bodies pushed in lockstep: A's and B's chunks alternate on the wire. */
async function testTwoCallsInterleavedStreams(): Promise<void> {
  const calls: RecordedCall[] = [];
  const fetchImpl = (_url: FetchUrl, init?: RequestInit): Promise<Response> => {
    const signal = init?.signal ?? new AbortSignal();
    const call: RecordedCall = {
      url: _url instanceof Request ? _url.url : String(_url),
      signal,
      body: JSON.parse(typeof init?.body === "string" ? init.body : "{}") as { model?: string },
    };
    calls.push(call);
    const tokens = calls.length === 1 ? ["A-one ", "A-two "] : ["B-one ", "B-two "];
    const stream = controlledStream(tokens, signal);
    return Promise.resolve(stream);
  };

  await withFetch(fetchImpl, async () => {
    // Both calls start together and settle together; each must end with only
    // its own content, proving no cross-call bleed in the per-call SSE parser.
    const [a, b] = await Promise.all([callAPI(BASE_CONFIG, "prompt A"), callAPI(BASE_CONFIG, "prompt B")]);
    expectMatch("call A aggregated only its own content", a, "A-one A-two");
    expectMatch("call B aggregated only its own content", b, "B-one B-two");
    expectMatch("exactly two fetches issued", calls.length, 2);
    expectMatch("each call carries its own abort signal", calls[0]?.signal !== calls[1]?.signal, true);
    expectMatch(
      "neither sibling signal was aborted",
      calls.every((c) => !c.signal.aborted),
      true,
    );
  });
}

/** One call stalls its stream until aborted; its sibling must complete untouched. */
async function testAbortedSiblingDoesNotPoison(): Promise<void> {
  const calls: RecordedCall[] = [];
  const fetchImpl = (_url: FetchUrl, init?: RequestInit): Promise<Response> => {
    const signal = init?.signal ?? new AbortSignal();
    calls.push({ url: _url instanceof Request ? _url.url : String(_url), signal, body: {} });
    if (calls.length === 1) {
      // First (doomed) call: one token, then silence until the abort arrives.
      const encoder = new TextEncoder();
      return Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"doomed "}}]}\n\n'));
              signal.addEventListener("abort", () => {
                controller.error(new DOMException("The operation was aborted.", "AbortError"));
              });
            },
          }),
          { status: 200, headers: { "content-type": "text/event-stream" } },
        ),
      );
    }
    // Second (healthy) call: a complete stream.
    return Promise.resolve(
      new Response('data: {"choices":[{"delta":{"content":"healthy answer"}}]}\n\ndata: [DONE]\n\n', {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      }),
    );
  };

  await withFetch(fetchImpl, async () => {
    // The healthy sibling is given no cap of its own; it must resolve while the
    // doomed call is cancelled via its own caller signal (an external cancel —
    // as when its tab navigated away) and the watchdogs stay per-call.
    const doomedController = new AbortController();
    const doomed = callAPI(BASE_CONFIG, "prompt doomed", 0.3, undefined, undefined, undefined, doomedController.signal);
    const healthy = callAPI(BASE_CONFIG, "prompt healthy");
    const healthyResult = await healthy;
    expectMatch("healthy sibling completed while the other was stalled", healthyResult, "healthy answer");

    const doomedError = await captureFailure(async () => {
      doomedController.abort(new Error("Generation aborted: user navigated away"));
      await doomed;
    });
    expectMatch(
      "doomed call rejected with the cancel reason",
      doomedError instanceof Error && doomedError.message === "Generation aborted: user navigated away",
      true,
    );
    expectMatch("doomed call's own signal carried the abort", calls[0]?.signal.aborted, true);
    expectMatch("healthy sibling's signal untouched", calls[1]?.signal.aborted, false);

    // The pipeline is still fully usable after the cancel: a fresh call works.
    let postCancel = "";
    await withFetch(
      () =>
        Promise.resolve(
          new Response('data: {"choices":[{"delta":{"content":"fresh after cancel"}}]}\n\ndata: [DONE]\n\n', {
            status: 200,
            headers: { "content-type": "text/event-stream" },
          }),
        ),
      async () => {
        postCancel = await callAPI(BASE_CONFIG, "prompt after");
      },
    );
    expectMatch("fresh call after a sibling cancel works", postCancel, "fresh after cancel");
  });
}

/** Two thinking-model streams in flight: per-call reasoning must never cross streams. */
async function testParallelReasoningIsolated(): Promise<void> {
  let callCount = 0;
  const fetchImpl = (): Promise<Response> => {
    callCount++;
    const reasoning = callCount === 1 ? "thinking for A" : "thinking for B";
    const body =
      deltaFrame('{"reasoning_content":' + JSON.stringify(reasoning) + "}") +
      deltaFrame('{"content":"answer ' + String(callCount) + '"}') +
      "data: [DONE]\n\n";
    return Promise.resolve(new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } }));
  };

  await withFetch(fetchImpl, async () => {
    const [a, b] = await Promise.all([callAPI(BASE_CONFIG, "prompt A"), callAPI(BASE_CONFIG, "prompt B")]);
    expectMatch("call A answer unpolluted by B's reasoning", a, "answer 1");
    expectMatch("call B answer unpolluted by A's reasoning", b, "answer 2");
  });
}

console.log("=== LLM Parallel Concurrency Tests ===\n");

await testTwoCallsInterleavedStreams();
await testAbortedSiblingDoesNotPoison();
await testParallelReasoningIsolated();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All LLM parallel concurrency tests passed");
