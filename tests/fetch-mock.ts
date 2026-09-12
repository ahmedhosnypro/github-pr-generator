// Shared fetch-mock plumbing for the unit tests that stub globalThis.fetch —
// no real network. Also hosts the BASE_CONFIG fixture shared by the GitHub-API
// and LLM test suites.
import type { ExtensionConfig } from "../src/types";
import { expectMatch } from "./expect-helpers";

export const BASE_CONFIG: ExtensionConfig = {
  apiEndpoint: "https://probe.invalid/v1",
  apiKey: "k",
  model: "m",
  githubToken: "gh-token",
  diffEnabled: false,
  diffMaxLines: 10,
  diffMaxBytes: 100,
  thinkingEffort: "default",
};

export type FetchImpl = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

export function jsonResponse(payload: object, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
}

export function withFetch(impl: FetchImpl, fn: () => Promise<void>): Promise<void> {
  const original = globalThis.fetch;
  globalThis.fetch = impl as typeof fetch;
  return fn().finally(() => {
    globalThis.fetch = original;
  });
}

// Captures console.log output (logMsg's sink) while fn runs; assertions must
// happen after restore so expectMatch output is not swallowed.
export async function withCapturedLogs(fn: () => Promise<void>): Promise<string[]> {
  const captured: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    captured.push(args.map(String).join(" "));
  };
  try {
    await fn();
  } finally {
    console.log = original;
  }
  return captured;
}

export function urlString(url: string | URL | Request): string {
  if (typeof url === "string") return url;
  return url instanceof URL ? url.href : url.url;
}

/** A fetch stub that counts every call and answers with respond()'s response. */
export function countingFetchSpy(respond: () => Response): { impl: FetchImpl; calls: () => number } {
  let calls = 0;
  const impl: FetchImpl = () => {
    calls++;
    return Promise.resolve(respond());
  };
  return { impl, calls: () => calls };
}

/**
 * Fetch rejects with the DOMException AbortSignal.timeout would raise; the
 * caller's result must map to GITHUB_NETWORK_ERROR with a timeout message
 * (not a hang). Returns whether the outgoing request carried an AbortSignal.
 */
export async function expectTimeoutMapsToNetworkError<T>(call: () => Promise<T>): Promise<boolean> {
  let sawSignal = false;
  await withFetch(
    (_url, init) => {
      sawSignal = init?.signal instanceof AbortSignal;
      return Promise.reject(new DOMException("The operation timed out.", "TimeoutError"));
    },
    async () => {
      const out = (await call()) as object;
      expectMatch("timeout maps to GITHUB_NETWORK_ERROR", "error" in out && out.error, "GITHUB_NETWORK_ERROR");
      expectMatch(
        "timeout message mentions it was a timeout",
        "message" in out && typeof out.message === "string" && out.message.includes("timed out"),
        true,
      );
    },
  );
  return sawSignal;
}
