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

/** A multibyte UTF-8 char split across two body byte-chunks must survive TextDecoder streaming in readStreamedCompletion. */
async function testMidMultibyteChunkSplit(): Promise<void> {
  const payload = 'data: {"choices":[{"delta":{"content":"héllo 🎉 world"}}]}\n\ndata: [DONE]\n\n';
  const bytes = new TextEncoder().encode(payload);
  // Split inside the 4-byte emoji: the first chunk ends on a continuation byte.
  const emojiOffset = new TextEncoder().encode(payload.slice(0, payload.indexOf("🎉"))).length;
  const splitAt = emojiOffset + 2;
  expectMatch("split lands on a UTF-8 continuation byte", ((bytes[splitAt] ?? 0) & 0xc0) === 0x80, true);
  await withFetch(
    () =>
      Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(bytes.slice(0, splitAt));
              controller.enqueue(bytes.slice(splitAt));
              controller.close();
            },
          }),
          { status: 200, headers: { "content-type": "text/event-stream" } },
        ),
      ),
    async () => {
      const out = await callAPI(BASE_CONFIG, "prompt");
      expectMatch("multibyte char split across byte chunks reassembled", out, "héllo 🎉 world");
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
  await testMidMultibyteChunkSplit();

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
