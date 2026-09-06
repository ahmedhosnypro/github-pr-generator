// Shared fixtures and mock plumbing for the callAPI unit tests
// (tests/llm.ts and tests/llm-resilience.ts). Mocks global fetch —
// no real network.
import { NO_CONTENT_TIMEOUT_BASE_MS, STREAM_STALL_TIMEOUT_MS } from "../src/background/llm";
import type { ExtensionConfig } from "../src/types";

export const BASE_CONFIG: ExtensionConfig = {
  apiEndpoint: "https://probe.invalid/v1",
  apiKey: "k",
  model: "m",
  githubToken: "gh-t",
  diffEnabled: false,
  diffMaxLines: 10,
  diffMaxBytes: 100,
  thinkingEffort: "default",
};

export type FetchImpl = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

function sseHeaders(): Record<string, string> {
  return { "content-type": "text/event-stream" };
}

export function jsonResponse(payload: object): Response {
  return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
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
        init?.signal?.addEventListener("abort", () => {
          controller.error(new DOMException("The operation was aborted.", "AbortError"));
        });
      },
    }),
    { status: 200, headers: sseHeaders() },
  );
}

/** SSE body that drip-feeds keepalive frames (empty deltas, no content) forever: bytes arrive steadily so the stall watchdog never trips, but no content ever appears. */
export function sseKeepaliveDripResponse(init?: RequestInit): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        const drip = (): void => {
          try {
            controller.enqueue(encoder.encode('data: {"choices":[{"delta":{}}]}\n\n'));
          } catch {
            return; // stream errored (aborted) — stop dripping
          }
          setTimeout(drip, 1);
        };
        drip();
        init?.signal?.addEventListener("abort", () => {
          controller.error(new DOMException("The operation was aborted.", "AbortError"));
        });
      },
    }),
    { status: 200, headers: sseHeaders() },
  );
}

/** An error status followed by a body that never delivers a single byte. */
export function stallingErrorBodyResponse(status: number): Response {
  return new Response(new ReadableStream<Uint8Array>({ start: () => {} }), { status });
}

function shrunk(delay?: number): number | undefined {
  if (delay === STREAM_STALL_TIMEOUT_MS) return 5;
  if (delay === NO_CONTENT_TIMEOUT_BASE_MS) return 60;
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

export function withFetch(impl: FetchImpl, fn: () => Promise<void>): Promise<void> {
  const original = globalThis.fetch;
  globalThis.fetch = impl as typeof fetch;
  return fn().finally(() => {
    globalThis.fetch = original;
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
