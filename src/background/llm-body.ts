// Response-body readers split out of llm.ts (the file carries a 300-line
// sonarjs budget): the SSE incremental reader and the plain-body JSON parser
// with its SSE-despite-content-type tolerance. Everything here is
// streaming/response plumbing — request construction, the retry policy, the
// stall/no-content budgets, and the exported callAPI stay in llm.ts, which
// passes its watchdog and signal into these readers.
import type { ChatCompletionResponse } from "../github-types";
import { errorMessage, logMsg } from "./log";
import { createSSEParser } from "./sse";

// An endpoint that opens a stream and then goes silent (or a body read that
// never completes) would otherwise hang until the content budget elapses:
// bytes stop but the content timer was last re-armed by real progress. Race
// every pending read/fetch against this stall watchdog instead — it aborts
// the shared watchdog so the whole call unwinds with the stall reason.
export const STREAM_STALL_TIMEOUT_MS = 60_000;

function stallError(): Error {
  return new Error("LLM stream stalled: no tokens for " + String(STREAM_STALL_TIMEOUT_MS / 1000) + "s");
}

function noContentError(budgetMs: number): Error {
  return new Error("LLM stream produced no content for " + String(Math.round(budgetMs / 1000)) + "s");
}

/** Race a pending fetch/read against the stall watchdog; the timer is cleared on every settle path. */
export function withStallWatchdog<T>(pending: Promise<T>, watchdog: AbortController): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stall = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = stallError();
      watchdog.abort(err);
      reject(err);
    }, STREAM_STALL_TIMEOUT_MS);
  });
  return Promise.race([pending, stall]).finally(() => {
    clearTimeout(timer);
  });
}

/**
 * Incrementally read a text/event-stream response, forwarding each content
 * delta to onChunk. Returns the aggregated answer plus any thinking-model
 * reasoning captured alongside it (reasoning never reaches onChunk).
 *
 * The content-progress timer (unlike the caller's stall watchdog, which any
 * bytes — even an empty keepalive frame — satisfy) only resets when real
 * content progresses: a content delta arrives, a NIM-style full-content
 * snapshot grows, or reasoning_content grows. A keepalive-only drip or a
 * stream that never starts is killed once the budget elapses; a stream that
 * keeps producing tokens gets unlimited total time no matter how slowly.
 */
export async function readStreamedCompletion(
  response: Response,
  onChunk: ((delta: string) => void) | undefined,
  watchdog: AbortController,
  signal: AbortSignal,
  contentBudgetMs: number,
): Promise<{ content: string; reasoning: string }> {
  const parser = createSSEParser();
  const decoder = new TextDecoder();
  let aggregated = "";
  let contentTimer: ReturnType<typeof setTimeout> | undefined;
  const armContentTimer = (): void => {
    clearTimeout(contentTimer);
    contentTimer = setTimeout(() => {
      watchdog.abort(noContentError(contentBudgetMs));
    }, contentBudgetMs);
  };
  armContentTimer();
  let snapshotLength = 0;
  let reasoningLength = 0;
  const deliver = (deltas: string[]): void => {
    let gotContent = false;
    for (const delta of deltas) {
      if (delta) gotContent = true;
      aggregated += delta;
      onChunk?.(delta);
    }
    if (gotContent) armContentTimer();
    // NIM-style snapshot streams: deltas stay empty while message.content
    // grows frame by frame. That growth is real content progress too — without
    // re-arming here the stream dies at the budget floor mid-generation.
    const snapshot = parser.getSnapshot();
    if (snapshot.length > snapshotLength) {
      snapshotLength = snapshot.length;
      armContentTimer();
    }
    // Thinking models (Gemini 3, DeepSeek-R1, …) can stream minutes of
    // reasoning_content before the first answer token. That growth is also
    // real progress — the model is demonstrably working — so it re-arms the
    // content budget the same way; reasoning itself never reaches onChunk.
    const reasoning = parser.getReasoning();
    if (reasoning.length > reasoningLength) {
      reasoningLength = reasoning.length;
      armContentTimer();
    }
  };

  try {
    const body = response.body;
    if (body) {
      const reader = body.getReader();
      for (;;) {
        let read: Awaited<ReturnType<typeof reader.read>>;
        try {
          // oxlint-disable-next-line no-await-in-loop -- a stream reader is sequential by nature: chunks must be read in order
          read = await watchdogRace(reader.read(), watchdog);
        } catch (readErr) {
          if (signal.aborted) {
            // Watchdog stall, content timeout, or caller cancel aborted the fetch mid-stream.
            const reason = abortErrorFrom(signal);
            logMsg("Stream read aborted: " + reason.message);
            throw reason;
          }
          throw readErr;
        }
        if (read.done) break;
        deliver(parser.push(decoder.decode(read.value, { stream: true })));
      }
      deliver(parser.push(decoder.decode()));
    }
    deliver(parser.flush());

    if (!aggregated && parser.getSnapshot()) {
      // Server answered SSE but with full message content instead of deltas (e.g. NVIDIA NIM).
      aggregated = parser.getSnapshot();
      onChunk?.(aggregated);
    }
    if (!aggregated) {
      logMsg("SSE: no content aggregated from stream");
    }
    return { content: aggregated, reasoning: parser.getReasoning() };
  } finally {
    clearTimeout(contentTimer);
  }
}

/** The caller's watchdog rejected the read: surface its descriptive reason. */
function abortErrorFrom(signal: AbortSignal): Error {
  const reason: unknown = signal.reason;
  if (reason instanceof Error && !(reason instanceof DOMException && reason.name === "AbortError")) return reason;
  return new Error("Generation aborted");
}

/** Race a pending read against the caller's stall/no-content watchdog; the watchdog owns the timer. */
function watchdogRace<T>(pending: Promise<T>, watchdog: AbortController): Promise<T> {
  return withStallWatchdog(pending, watchdog);
}

/** Fallback for servers that ignored stream:true and sent a plain (or unlabeled SSE) body. */
export function parseJsonResponseBody(responseText: string): ChatCompletionResponse {
  // Tolerate an SSE body that arrived without the event-stream content type:
  // aggregate it with the same parser used by the streaming path.
  if (/^data:\s/m.test(responseText)) {
    logMsg("Response body is SSE despite content-type; aggregating chunks");
    const parser = createSSEParser();
    const aggregated = parser.push(responseText + "\n").join("") || parser.getSnapshot();
    return { choices: [{ message: { content: aggregated, reasoning_content: parser.getReasoning() || undefined } }] };
  }

  // Try strict JSON first; only fall back to stripping a trailing SSE [DONE]
  // line when parsing fails — stripping unconditionally could eat a legitimate
  // "data: [DONE]" substring inside a JSON payload and corrupt it.
  try {
    return JSON.parse(responseText) as ChatCompletionResponse;
  } catch (parseErr) {
    const cleaned = responseText.replace(/\n?data:\s*\[DONE\][^\n]*\s*$/, "").trim();
    if (cleaned !== responseText.trim()) {
      logMsg("Stripped trailing SSE data from response");
      try {
        return JSON.parse(cleaned) as ChatCompletionResponse;
      } catch {
        // fall through to the error below with the original parse error
      }
    }
    logMsg("JSON.parse failed: " + errorMessage(parseErr));
    logMsg("Response text (first 300): " + responseText.substring(0, 300));
    throw new Error("Failed to parse API response as JSON: " + errorMessage(parseErr), { cause: parseErr });
  }
}
