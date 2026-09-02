// Unit tests for callAPI (llm.ts): the run 20 empty-stream retry, plus the
// JSON parse fallback from run 15. Mocks global fetch — no real network.
import { callAPI } from "../src/background/llm";
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

function withFetch(impl: FetchImpl, fn: () => Promise<void>): Promise<void> {
  const original = globalThis.fetch;
  globalThis.fetch = impl as typeof fetch;
  return fn().finally(() => {
    globalThis.fetch = original;
  });
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

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All LLM-client tests passed");
}

await main();
