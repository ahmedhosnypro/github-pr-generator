// Unit tests for callAPI (llm.ts): JSON parsing, retry policy, and the
// request body contract. Mocks global fetch — no real network. Stall /
// no-content-budget / abort coverage lives in tests/llm-resilience.ts.
import { callAPI, MAX_COMPLETION_TOKENS, NO_CONTENT_TIMEOUT_BASE_MS, noContentTimeoutMs } from "../src/background/llm";
import type { ExtensionConfig } from "../src/types";
import { expectMatch, getFailures } from "./expect-helpers";
import {
  BASE_CONFIG,
  captureFailure,
  jsonResponse,
  sseEmptyResponse,
  sseFullResponse,
  sseReasoningOnlyResponse,
  sseReasoningThenContentResponse,
  sseSnapshotResponse,
  withFetch,
} from "./llm-shared";

const REASONING_ONLY_MESSAGE =
  'The model returned only its thinking and no answer (reasoning consumed the output budget). Set Thinking Effort to "low" or "none" in the popup, or use a model without thinking.';

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

  // SSE body that only carries full message.content snapshots (NIM-style):
  // the aggregated result is the last snapshot, delivered as one chunk.
  await withFetch(
    () => Promise.resolve(sseSnapshotResponse("snapshot body only")),
    async () => {
      const chunks: string[] = [];
      const out = await callAPI(BASE_CONFIG, "prompt", 0.3, (delta) => chunks.push(delta));
      expectMatch("snapshot-only SSE body parses", out, "snapshot body only");
      expectMatch("snapshot delivered as one chunk", chunks.join(""), "snapshot body only");
    },
  );

  await testReasoningOnlyStream();
  await testExplicitEffortReasoningOnly();
  await testNonStreamReasoningOnly();
  await testReasoningThenContent();

  await testRequestBodyCap();
  await testMidMultibyteChunkSplit();
  testNoContentBudgetScaling();

  reportOutcome();
}

/**
 * Thinking-model starvation (Gemini 3 on default effort): the stream ends
 * having carried only reasoning_content. Under the out-of-box "default"
 * effort this is not fail-fast: the one change that resolves the starvation
 * is a retry with reasoning_effort: "low", capped at a single fallback
 * attempt — same shape as the transient/empty retries.
 */
async function testReasoningOnlyStream(): Promise<void> {
  let reasoningCalls = 0;
  await withFetch(
    () => {
      reasoningCalls++;
      return Promise.resolve(reasoningCalls === 1 ? sseReasoningOnlyResponse() : sseFullResponse());
    },
    async () => {
      const out = await callAPI(BASE_CONFIG, "prompt");
      expectMatch("reasoning starvation falls back to low effort and wins", out, "recovered");
      expectMatch("exactly two attempts on reasoning starvation", reasoningCalls, 2);
    },
  );
  // Re-run capturing the request bodies to assert the fallback actually sends
  // reasoning_effort: "low", and only on the fallback attempt.
  let bodyRunCalls = 0;
  const efforts: (string | undefined)[] = [];
  await withFetch(
    (_url, init) => {
      bodyRunCalls++;
      const body = init?.body;
      efforts.push(
        (JSON.parse(typeof body === "string" ? body : "{}") as { reasoning_effort?: string }).reasoning_effort,
      );
      return Promise.resolve(bodyRunCalls === 1 ? sseReasoningOnlyResponse() : sseFullResponse());
    },
    async () => {
      const out = await callAPI(BASE_CONFIG, "prompt");
      expectMatch("fallback retry wins", out, "recovered");
      expectMatch("first attempt omits reasoning_effort (default)", efforts[0], undefined);
      expectMatch("fallback attempt sends reasoning_effort low", efforts[1], "low");
      expectMatch("exactly two attempts in body-capture run", bodyRunCalls, 2);
    },
  );
}

/** Under an explicit (non-default) effort the same starvation is fail-fast: the user already picked the knob. */
async function testExplicitEffortReasoningOnly(): Promise<void> {
  const config: ExtensionConfig = { ...BASE_CONFIG, thinkingEffort: "high" };
  let calls = 0;
  await withFetch(
    () => {
      calls++;
      return Promise.resolve(sseReasoningOnlyResponse());
    },
    async () => {
      const failure = await captureFailure(() => callAPI(config, "prompt"));
      expectMatch(
        "explicit-effort reasoning-only gets the thinking diagnosis",
        failure instanceof Error ? failure.message : null,
        REASONING_ONLY_MESSAGE,
      );
      expectMatch("explicit-effort starvation is not retried", calls, 1);
    },
  );
}

/** The same diagnosis applies to a non-streaming (plain JSON) responder that puts the thinking in message.reasoning_content. */
async function testNonStreamReasoningOnly(): Promise<void> {
  await withFetch(
    () => Promise.resolve(jsonResponse({ choices: [{ message: { content: "", reasoning_content: "only thought" } }] })),
    async () => {
      const failure = await captureFailure(() => callAPI(BASE_CONFIG, "prompt"));
      expectMatch(
        "non-stream reasoning-only gets the same diagnosis",
        failure instanceof Error ? failure.message : null,
        REASONING_ONLY_MESSAGE,
      );
    },
  );
}

/** Healthy thinking stream: reasoning first, then the answer. The result and the streamed chunks carry only the answer — thinking never leaks through. */
async function testReasoningThenContent(): Promise<void> {
  await withFetch(
    () => Promise.resolve(sseReasoningThenContentResponse()),
    async () => {
      const chunks: string[] = [];
      const out = await callAPI(BASE_CONFIG, "prompt", 0.3, (delta) => chunks.push(delta));
      expectMatch("reasoning-then-content returns the answer", out, "answer");
      expectMatch("reasoning never reaches onChunk", chunks.join(""), "answer");
    },
  );
}

/** The no-content budget floors at 5 min for small prompts, grows 4ms/char for big ones, caps at 10 min. */
function testNoContentBudgetScaling(): void {
  expectMatch("small prompt keeps 5-min budget floor", noContentTimeoutMs(100), NO_CONTENT_TIMEOUT_BASE_MS);
  expectMatch("mid-size prompt still floored", noContentTimeoutMs(10_000), NO_CONTENT_TIMEOUT_BASE_MS);
  // The kottaby#56 case: a near-budget 120k-char prompt spends minutes in
  // prefill (keepalives only) — it must get ~8 minutes of budget, not the flat
  // 5-minute floor that killed the real generation while content had not even
  // started.
  expectMatch("near-cap prompt gets a scaled budget", noContentTimeoutMs(120_000), 480_000);
  expectMatch("budget capped at 10 minutes", noContentTimeoutMs(1_000_000), 600_000);
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
