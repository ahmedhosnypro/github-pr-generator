// Shared fixtures and mock plumbing for the callAPI unit tests
// (tests/llm.ts and tests/llm-resilience.ts). Mocks global fetch —
// no real network.
import { STREAM_STALL_TIMEOUT_MS } from "../src/background/llm";
import { jsonResponse, withFetch } from "./fetch-mock";

export { BASE_CONFIG, type FetchImpl } from "./fetch-mock";
export { jsonResponse, withFetch };

function sseHeaders(): Record<string, string> {
  return { "content-type": "text/event-stream" };
}

/** React to the request signal like a real fetch would: error the stream. */
function abortAsStreamError(
  init: RequestInit | undefined,
  controller: ReadableStreamDefaultController<Uint8Array>,
): void {
  init?.signal?.addEventListener("abort", () => {
    controller.error(new DOMException("The operation was aborted.", "AbortError"));
  });
}

/**
 * The one drip-loop shape shared by every streaming SSE fixture: enqueue
 * frames one per intervalMs until a tick enqueues the final frame and returns
 * true (closing the stream); an abort errors the stream instead of leaving it
 * open.
 */
function dripStream(
  init: RequestInit | undefined,
  intervalMs: number,
  tick: (encoder: TextEncoder, controller: ReadableStreamDefaultController<Uint8Array>) => boolean,
): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        const drip = (): void => {
          try {
            if (tick(encoder, controller)) {
              controller.close();
              return;
            }
          } catch {
            return; // stream errored (aborted) — stop dripping
          }
          setTimeout(drip, intervalMs);
        };
        drip();
        abortAsStreamError(init, controller);
      },
    }),
    { status: 200, headers: sseHeaders() },
  );
}

export function sseEmptyResponse(): Response {
  return new Response("data: [DONE]\n\n", { status: 200, headers: sseHeaders() });
}

export function sseFullResponse(): Response {
  return new Response('data: {"choices":[{"delta":{"content":"recovered"}}]}\n\ndata: [DONE]\n\n', {
    status: 200,
    headers: sseHeaders(),
  });
}

/** SSE body that delivers one chunk and then goes silent forever; errors on abort like a real fetch. */
export function sseStallResponse(init?: RequestInit): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n'));
        // then silence — no further chunks, ever
        abortAsStreamError(init, controller);
      },
    }),
    { status: 200, headers: sseHeaders() },
  );
}

/** SSE body that drip-feeds keepalive frames (empty deltas, no content) forever: bytes arrive steadily so the stall watchdog never trips, but no content ever appears. */
export function sseKeepaliveDripResponse(init?: RequestInit): Response {
  return dripStream(init, 1, (encoder, controller) => {
    controller.enqueue(encoder.encode('data: {"choices":[{"delta":{}}]}\n\n'));
    return false;
  });
}

/**
 * SSE body that trickles real content deltas (one per intervalMs for
 * chunkCount chunks) and then closes with [DONE]. Bytes and content keep
 * arriving, so neither the stall watchdog nor the no-content budget should
 * ever fire — modelling a slow-but-healthy generation.
 */
export function sseContentDripResponse(
  init: RequestInit | undefined,
  chunkCount: number,
  intervalMs: number,
): Response {
  return dripNFrames(init, chunkCount, intervalMs, () => 'data: {"choices":[{"delta":{"content":"x"}}]}\n\n');
}

/**
 * The one counted-drip shape shared by the reasoning and snapshot fixtures:
 * drip `chunkCount` frames (one per intervalMs, each built by `frame`) and
 * then enqueue `finalFrame` and close.
 */
function dripNFrames(
  init: RequestInit | undefined,
  chunkCount: number,
  intervalMs: number,
  frame: (sent: number) => string,
  finalFrame = "data: [DONE]\n\n",
): Response {
  let sent = 0;
  return dripStream(init, intervalMs, (encoder, controller) => {
    if (sent >= chunkCount) {
      controller.enqueue(encoder.encode(finalFrame));
      return true;
    }
    sent++;
    controller.enqueue(encoder.encode(frame(sent)));
    return false;
  });
}

/** A complete SSE stream that carries only reasoning_content (thinking) and ends — the Gemini-3-on-default-effort starvation shape. */
export function sseReasoningOnlyResponse(): Response {
  return new Response(
    'data: {"choices":[{"delta":{"reasoning_content":"thinking…"}}]}\n\ndata: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
    { status: 200, headers: sseHeaders() },
  );
}

/** A healthy thinking-model stream: reasoning deltas first, then the answer; nothing of the former may leak into the latter. */
export function sseReasoningThenContentResponse(): Response {
  return new Response(
    'data: {"choices":[{"delta":{"reasoning_content":"thinking…"}}]}\n\ndata: {"choices":[{"delta":{"content":"answer","reasoning_content":"still thinking"}}]}\n\ndata: [DONE]\n\n',
    { status: 200, headers: sseHeaders() },
  );
}

/**
 * SSE body that drips reasoning_content (one per intervalMs) and then delivers
 * the answer + [DONE]. Reasoning growth is real model progress: the no-content
 * budget must keep re-arming while thinking streams, so a long thinking phase
 * survives past the budget floor.
 */
export function sseReasoningDripResponse(
  init: RequestInit | undefined,
  chunkCount: number,
  intervalMs: number,
): Response {
  return dripNFrames(
    init,
    chunkCount,
    intervalMs,
    () => 'data: {"choices":[{"delta":{"reasoning_content":"x"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":"answer"}}]}\n\ndata: [DONE]\n\n',
  );
}

/** An error status followed by a body that never delivers a single byte. */
export function stallingErrorBodyResponse(status: number): Response {
  return new Response(new ReadableStream<Uint8Array>({ start: () => {} }), { status });
}

/** A complete SSE answer that carries full message.content (NIM-style), no deltas. */
export function sseSnapshotResponse(content: string): Response {
  return new Response(
    'data: {"choices":[{"message":{"content":' + JSON.stringify(content) + "}}]}\n\ndata: [DONE]\n\n",
    {
      status: 200,
      headers: sseHeaders(),
    },
  );
}

/**
 * SSE body that drips full message.content snapshots (NIM-style): no delta
 * content ever arrives, but each frame carries the whole answer so far. With
 * `grow` the snapshots lengthen every tick — the no-content budget must treat
 * that as progress; without growth they repeat byte-identical and the budget
 * must still kill the stream.
 */
export function sseSnapshotDripResponse(
  init: RequestInit | undefined,
  chunkCount: number,
  intervalMs: number,
  grow = true,
): Response {
  return dripNFrames(init, chunkCount, intervalMs, (sent) => {
    const snapshot = grow ? "x".repeat(sent) : "snapshot";
    return 'data: {"choices":[{"message":{"content":' + JSON.stringify(snapshot) + "}}]}\n\n";
  });
}

function shrunk(delay?: number): number | undefined {
  if (delay === STREAM_STALL_TIMEOUT_MS) return 5;
  // Scale the no-content budget ~5000× down rather than matching one exact
  // value, so prompt-scaled budgets keep their ordering (300s→60ms,
  // 480s→96ms, 600s→120ms) and a test can observe a large prompt outliving
  // the 5-minute floor. Only timeouts above the stall watchdog are budgets.
  if (delay !== undefined && delay > STREAM_STALL_TIMEOUT_MS) return Math.round(delay / 5000);
  return delay;
}

/** Shrink the stall watchdog and no-content budget so timeout tests don't wait out the real windows. */
export function withFastTimers(fn: () => Promise<void>): Promise<void> {
  const original = globalThis.setTimeout;
  const fast = ((callback: (...args: never[]) => void, delay?: number) =>
    original(callback, shrunk(delay))) as unknown as typeof setTimeout;
  globalThis.setTimeout = fast;
  return fn().finally(() => {
    globalThis.setTimeout = original;
  });
}

/** Run fn and return its rejection reason (null if it resolved). */
export async function captureFailure(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    return null;
  } catch (e) {
    return e;
  }
}
