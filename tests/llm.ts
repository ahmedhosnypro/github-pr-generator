// Unit tests for callAPI (llm.ts): JSON parsing, retry policy, and the
// request body contract. Mocks global fetch — no real network. Stall /
// deadline / abort coverage lives in tests/llm-resilience.ts.
import { callAPI, MAX_COMPLETION_TOKENS } from "../src/background/llm";
import { expectMatch, getFailures } from "./expect-helpers";
import { BASE_CONFIG, captureFailure, jsonResponse, sseEmptyResponse, sseFullResponse, withFetch } from "./llm-shared";

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
  let calledFirst = 0;
  await withFetch(
    () => Promise.resolve(calledFirst++ === 0 ? sseEmptyResponse() : sseFullResponse()),
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
      return Promise.resolve(sseEmptyResponse());
    },
    async () => {
      const failure = await captureFailure(() => callAPI(BASE_CONFIG, "prompt"));
      expectMatch(
        "error surfaces original message",
        failure instanceof Error ? failure.message : null,
        "No content in API response",
      );
      expectMatch("two-attempt cap respected", callsSecond, 2);
    },
  );

  // A non-SSE body containing a valid "data: [DONE]" substring must not corrupt JSON.
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

  await testRequestBodyCap();

  reportOutcome();
}

function reportOutcome(): void {
  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All LLM-client tests passed");
}

await main();
