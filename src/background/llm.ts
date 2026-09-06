import type { ChatCompletionResponse } from "../github-types";
import type { ExtensionConfig } from "../types";
import { errorMessage, logMsg } from "./log";
import { SYSTEM_PROMPT } from "./prompts/common";
import { createSSEParser } from "./sse";

// An endpoint that accepts the request and then stalls (or opens SSE and goes
// silent) would otherwise hang generation forever: the keepalive pings from
// the content script keep the MV3 worker alive, so nothing else ever times
// out. Abort when no response/token arrives within this window.
export const STREAM_STALL_TIMEOUT_MS = 60_000;

// The stall watchdog resets on every operation, so a drip-feeding server (one
// token every few seconds, forever) would stream indefinitely without ever
// tripping it. This absolute budget caps the whole call — retries and backoff
// sleeps included — no matter how steadily chunks trickle in.
export const OVERALL_CALL_TIMEOUT_MS = 5 * 60_000;

// When max_tokens is omitted the provider applies its own default (often
// small), so long template fills get cut off mid-output and the truncated
// markdown then fails the downstream fence-balance check in
// refinement-checks.ts. 8192 covers even long template fills while staying
// within common per-model output ceilings.
export const MAX_COMPLETION_TOKENS = 8192;

function stallError(): Error {
  return new Error("LLM stream stalled: no tokens for " + String(STREAM_STALL_TIMEOUT_MS / 1000) + "s");
}

function deadlineError(): Error {
  return new Error("LLM call exceeded overall deadline of " + String(OVERALL_CALL_TIMEOUT_MS / 1000) + "s");
}

function isAbortException(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

/** Cancellation/stall as a plain descriptive Error — never leak fetch's DOMException AbortError into "network error" paths. */
function abortErrorFrom(signal: AbortSignal): Error {
  const reason: unknown = signal.reason;
  if (reason instanceof Error && !isAbortException(reason)) return reason;
  return new Error("Generation aborted");
}

/** Race a pending fetch/read against the stall watchdog; the timer is cleared on every settle path. */
function withStallWatchdog<T>(pending: Promise<T>, watchdog: AbortController): Promise<T> {
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

/** Sleep for `ms`, rejecting promptly when the caller/deadline signal aborts mid-sleep instead of sleeping through a cancel. */
function sleepOrAbort(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(abortErrorFrom(signal));
  return new Promise((resolve, reject) => {
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(abortErrorFrom(signal));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function postChatCompletion(
  url: string,
  config: ExtensionConfig,
  prompt: string,
  temperature: number,
  signal: AbortSignal,
  watchdog: AbortController,
): Promise<Response> {
  try {
    return await withStallWatchdog(
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + config.apiKey,
        },
        // Caller cancel (tab closed) and the stall watchdog share this signal.
        signal,
        // Always ask for a stream: servers that ignore it answer with plain JSON,
        // which the fallback path in callAPI handles as before.
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: MAX_COMPLETION_TOKENS,
          stream: true,
          // "default" omits the field so the provider applies its own effort default.
          ...(config.thinkingEffort === "default" ? {} : { reasoning_effort: config.thinkingEffort }),
        }),
      }),
      watchdog,
    );
  } catch (fetchErr) {
    if (signal.aborted || isAbortException(fetchErr)) {
      // Stall watchdog or caller-initiated cancel — distinct from a real network failure.
      const reason = abortErrorFrom(signal);
      logMsg("Fetch aborted: " + reason.message);
      throw reason;
    }
    logMsg("Fetch failed (network error): " + errorMessage(fetchErr));
    throw new Error("Network error calling API at " + url + ": " + errorMessage(fetchErr), { cause: fetchErr });
  }
}

/** Classify an already-read error body; the (guarded) body read happens at the call site. */
function throwForErrorResponse(response: Response, errorBody: string): never {
  logMsg("API response status: " + String(response.status));
  logMsg("API error body: " + errorBody.substring(0, 300));
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      "API authentication failed (status " + String(response.status) + "). Check your API key in the extension popup.",
    );
  }
  throw new Error("API error " + String(response.status) + ": " + errorBody.substring(0, 200));
}

/** Incrementally read a text/event-stream response, forwarding each content delta to onChunk. */
async function readStreamedCompletion(
  response: Response,
  onChunk: ((delta: string) => void) | undefined,
  watchdog: AbortController,
  signal: AbortSignal,
): Promise<string> {
  const parser = createSSEParser();
  const decoder = new TextDecoder();
  let aggregated = "";
  const deliver = (deltas: string[]): void => {
    for (const delta of deltas) {
      aggregated += delta;
      onChunk?.(delta);
    }
  };

  const body = response.body;
  if (body) {
    const reader = body.getReader();
    for (;;) {
      let read: Awaited<ReturnType<typeof reader.read>>;
      try {
        // oxlint-disable-next-line no-await-in-loop -- a stream reader is sequential by nature: chunks must be read in order
        read = await withStallWatchdog(reader.read(), watchdog);
      } catch (readErr) {
        if (signal.aborted) {
          // Watchdog stall or caller cancel aborted the fetch mid-stream.
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
  return aggregated;
}

/** Fallback for servers that ignored stream:true and sent a plain (or unlabeled SSE) body. */
function parseJsonResponseBody(responseText: string): ChatCompletionResponse {
  // Tolerate an SSE body that arrived without the event-stream content type:
  // aggregate it with the same parser used by the streaming path.
  if (/^data:\s/m.test(responseText)) {
    logMsg("Response body is SSE despite content-type; aggregating chunks");
    const parser = createSSEParser();
    const aggregated = parser.push(responseText + "\n").join("") || parser.getSnapshot();
    return { choices: [{ message: { content: aggregated } }] };
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

export async function callAPI(
  config: ExtensionConfig,
  prompt: string,
  temperature = 0.3,
  onChunk?: (delta: string) => void,
  allowEmptyRetry = true,
  allowTransientRetry = true,
  callerSignal?: AbortSignal,
): Promise<string> {
  // Absolute deadline spanning retries and backoff sleeps: unlike the
  // per-operation stall watchdog, this never resets, so a drip-feed stream
  // cannot keep the call alive forever.
  const overall = new AbortController();
  const deadline = setTimeout(() => {
    overall.abort(deadlineError());
  }, OVERALL_CALL_TIMEOUT_MS);
  try {
    return await callAPIAttempt(
      config,
      prompt,
      temperature,
      onChunk,
      allowEmptyRetry,
      allowTransientRetry,
      callerSignal,
      overall.signal,
    );
  } finally {
    clearTimeout(deadline);
  }
}

async function callAPIAttempt(
  config: ExtensionConfig,
  prompt: string,
  temperature: number,
  onChunk: ((delta: string) => void) | undefined,
  allowEmptyRetry: boolean,
  allowTransientRetry: boolean,
  callerSignal: AbortSignal | undefined,
  overall: AbortSignal,
): Promise<string> {
  const watchdog = new AbortController();
  // Caller cancel, the overall deadline and the stall watchdog share one
  // signal toward fetch; AbortSignal.any forwards whichever aborts first,
  // with its reason.
  const signal = AbortSignal.any(callerSignal ? [callerSignal, watchdog.signal, overall] : [watchdog.signal, overall]);
  if (signal.aborted) throw abortErrorFrom(signal);
  // Normalize "https://host/v1/" → "https://host/v1/chat/completions"; the popup
  // test path strips trailing slashes too, so a "//chat" URL would only ever hit
  // this generation path, not validation.
  const url = config.apiEndpoint.replace(/\/+$/, "") + "/chat/completions";
  logMsg(
    "Calling API: " +
      url +
      ", model: " +
      config.model +
      ", temperature: " +
      String(temperature) +
      ", reasoning_effort: " +
      config.thinkingEffort +
      ", prompt chars: " +
      String(prompt.length),
  );

  const requestStarted = Date.now();
  const response = await postChatCompletion(url, config, prompt, temperature, signal, watchdog);
  // Transient 5xx/429s — retry once with backoff. The LLM serving layer is
  // flaky enough (observed 503s mid-run) that a single retry saves a refinement
  // iteration from dying to what is a momentary infrastructure hiccup. Gateway
  // chains add one more flavor: a 400 "API key not valid" that is really the
  // upstream provider's quota tripping (observed on the free gemini route) —
  // the same key works seconds later, so that specific 400 retries too. A
  // genuinely bad key just fails again after the single retry.
  if (!response.ok) {
    // A server can send an error status and then stall its body; read it
    // under the watchdog so that hang fails fast instead of freezing here.
    const errBody = await withStallWatchdog(response.text(), watchdog);
    logMsg("API response status: " + String(response.status));
    if (allowTransientRetry) {
      const transient =
        [429, 500, 502, 503, 504].includes(response.status) ||
        (response.status === 400 && /API key not valid/i.test(errBody));
      if (transient) {
        logMsg("Transient API error " + String(response.status) + " — retrying once after 2s");
        await sleepOrAbort(2000, signal);
        return callAPIAttempt(config, prompt, temperature, onChunk, allowEmptyRetry, false, callerSignal, overall);
      }
    }
    throwForErrorResponse(response, errBody);
  }

  const contentType = response.headers.get("content-type") || "";
  let content: string;
  let fromStream: boolean;
  if (contentType.includes("event-stream")) {
    content = await readStreamedCompletion(response, onChunk, watchdog, signal);
    fromStream = true;
  } else {
    // Watchdog covers a body download that never completes; aborting the
    // fetch cancels response.text() consumption as well.
    const json = parseJsonResponseBody(await withStallWatchdog(response.text(), watchdog));
    content = json.choices?.[0]?.message?.content || "";
    fromStream = false;
  }

  if (!content) {
    // Empty stream aggregation happens on transient server hiccups (observed
    // in parallel lab runs); retry the whole request once before failing.
    if (allowEmptyRetry) {
      logMsg("No content in API response — retrying once");
      await sleepOrAbort(1000, signal);
      return callAPIAttempt(config, prompt, temperature, onChunk, false, true, callerSignal, overall);
    }
    logMsg("No content in API response");
    throw new Error("No content in API response");
  }

  if (!fromStream) onChunk?.(content); // non-streaming endpoint: surface the whole answer as one chunk
  logMsg(
    "API call took " +
      ((Date.now() - requestStarted) / 1000).toFixed(1) +
      "s — content length: " +
      String(content.length) +
      (fromStream ? " (from stream)" : ""),
  );
  return content.trim();
}
