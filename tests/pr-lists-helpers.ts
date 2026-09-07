// Shared helpers for the PR-list pagination tests (tests/pr-lists.ts and
// tests/pr-lists-partial.ts). Both files mock global fetch only — no real
// network.
import type { ExtensionConfig } from "../src/types";

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

// A full (100-item) commits page, for tests that exercise pagination bounds.
export function fullCommitPage(): Response {
  return jsonResponse(Array.from({ length: 100 }, () => ({ commit: { message: "m" } })));
}

// A full (100-item) files page, for tests that exercise pagination bounds.
export function fullFilePage(): Response {
  return jsonResponse(Array.from({ length: 100 }, () => ({ filename: "a.ts", status: "added" })));
}
