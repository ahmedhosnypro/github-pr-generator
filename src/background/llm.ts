import type { ExtensionConfig } from "../types";
import { parseJsonResponseBody, readStreamedCompletion, STREAM_STALL_TIMEOUT_MS, withStallWatchdog } from "./llm-body";
import { errorMessage, logMsg } from "./log";
import { SYSTEM_PROMPT } from "./prompts/common";

export { STREAM_STALL_TIMEOUT_MS };

// An endpoint that accepts the request and then stalls (or opens SSE and goes
// silent) would otherwise hang generation forever: the keepalive pings from
// the content script keep the MV3 worker alive, so nothing else ever times
// out. Abort when no response/token arrives within this window.
// STREAM_STALL_TIMEOUT_MS and withStallWatchdog live in llm-body.ts (re-exported).

// A budget for *content progress*, not call duration. The failure shapes:
//  - no response at all (headers never arrive) → the stall watchdog above
//  - acknowledged but contentless: a keepalive-only drip, a stream that never
//    starts producing tokens, or one that goes content-silent mid-way → this
//    budget; abort when nothing but empty frames has arrived for Ns
//  - a healthy but slow stream (content keeps trickling) → NO timeout: real
//    tokens may take as long as the model needs. Measured motivation: a 120k-
//    char prompt needs ~324s end-to-end on a congested 550B gateway route,
//    which any fixed overall deadline (vs the old flat 300s) killed moments
//    before completion even though content was flowing the whole time.
export const NO_CONTENT_TIMEOUT_BASE_MS = 5 * 60_000;

// The no-content budget scales with prompt size: a near-cap prompt spends
// minutes in prefill (keepalives only) on slow hosted models before the first
// token. The 10-minute ceiling still bounds a contentless drip.
const MS_PER_PROMPT_CHAR = 4;
const NO_CONTENT_TIMEOUT_MAX_MS = 10 * 60_000;

export function noContentTimeoutMs(promptChars: number): number {
  return Math.min(NO_CONTENT_TIMEOUT_MAX_MS, Math.max(NO_CONTENT_TIMEOUT_BASE_MS, promptChars * MS_PER_PROMPT_CHAR));
}

// When max_tokens is omitted the provider applies its own default (often
// small), so long template fills get cut off mid-output and the truncated
// markdown then fails the downstream fence-balance check in
// refinement-checks.ts. 8192 covers even long template fills while staying
// within common per-model output ceilings.
export const MAX_COMPLETION_TOKENS = 8192;

// Distinct from a plain empty response: a thinking model that streams only
// reasoning_content (Gemini 3 on its default effort, DeepSeek-R1, …) has
// consumed the whole output budget on thinking — max_tokens is shared between
// reasoning and the answer — so the answer never started. Retrying unchanged
// reproduces it; the message names the knob that fixes it.
function reasoningOnlyError(): Error {
  return new Error(
    'The model returned only its thinking and no answer (reasoning consumed the output budget). Set Thinking Effort to "low" or "none" in the popup, or use a model without thinking.',
  );
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

/** The request's reasoning_effort field. "default" omits the field so the
 * provider applies its own effort default — an explicit
 * `reasoning_effort: "default"` is rejected by upstream routers (observed:
 * 400 "unknown variant `default`" on the NVIDIA route). The starvation-retry
 * fallback override wins over both. */
function reasoningEffortField(config: ExtensionConfig, override?: string): { reasoning_effort?: string } {
  if (override) return { reasoning_effort: override };
  if (config.thinkingEffort === "default") return {};
  return { reasoning_effort: config.thinkingEffort };
}

async function postChatCompletion(
  url: string,
  config: ExtensionConfig,
  prompt: string,
  temperature: number,
  signal: AbortSignal,
  watchdog: AbortController,
  reasoningEffortOverride?: string,
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
          ...reasoningEffortField(config, reasoningEffortOverride),
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

/** Read the answer + reasoning out of an SSE stream or a plain JSON body, per content type. */
async function readResponseContent(
  contentType: string,
  response: Response,
  onChunk: ((delta: string) => void) | undefined,
  watchdog: AbortController,
  signal: AbortSignal,
  contentBudgetMs: number,
): Promise<{ content: string; reasoning: string; fromStream: boolean }> {
  if (contentType.includes("event-stream")) {
    const read = await readStreamedCompletion(response, onChunk, watchdog, signal, contentBudgetMs);
    return { ...read, fromStream: true };
  }
  // Watchdog covers a body download that never completes; aborting the
  // fetch cancels response.text() consumption as well.
  const json = parseJsonResponseBody(await withStallWatchdog(response.text(), watchdog));
  return {
    content: json.choices?.[0]?.message?.content || "",
    reasoning: json.choices?.[0]?.message?.reasoning_content || "",
    fromStream: false,
  };
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
  // No absolute call-length deadline: timeouts are content-based. The stall
  // watchdog covers no-response/no-bytes, the no-content budget inside
  // readStreamedCompletion covers acknowledged-but-contentless streams, and a
  // stream that keeps producing tokens may run as long as it needs.
  return callAPIAttempt(config, prompt, temperature, onChunk, allowEmptyRetry, allowTransientRetry, callerSignal);
}

async function callAPIAttempt(
  config: ExtensionConfig,
  prompt: string,
  temperature: number,
  onChunk: ((delta: string) => void) | undefined,
  allowEmptyRetry: boolean,
  allowTransientRetry: boolean,
  callerSignal: AbortSignal | undefined,
  reasoningEffortOverride?: string,
): Promise<string> {
  const watchdog = new AbortController();
  // Caller cancel and the stall watchdog share one signal toward fetch;
  // AbortSignal.any forwards whichever aborts first, with its reason.
  const signal = AbortSignal.any(callerSignal ? [callerSignal, watchdog.signal] : [watchdog.signal]);
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
      (reasoningEffortOverride ?? config.thinkingEffort) +
      ", prompt chars: " +
      String(prompt.length),
  );

  const requestStarted = Date.now();
  const response = await postChatCompletion(
    url,
    config,
    prompt,
    temperature,
    signal,
    watchdog,
    reasoningEffortOverride,
  );
  if (response.ok) {
    return consumeResponse(
      config,
      prompt,
      temperature,
      onChunk,
      allowEmptyRetry,
      callerSignal,
      reasoningEffortOverride,
      response,
      watchdog,
      signal,
      requestStarted,
    );
  }
  return handleErrorResponse(
    config,
    prompt,
    temperature,
    onChunk,
    allowEmptyRetry,
    allowTransientRetry,
    callerSignal,
    response,
    watchdog,
    signal,
  );
}

/** Handle a non-ok response: one transient retry with backoff, then a classified throw. */
async function handleErrorResponse(
  config: ExtensionConfig,
  prompt: string,
  temperature: number,
  onChunk: ((delta: string) => void) | undefined,
  allowEmptyRetry: boolean,
  allowTransientRetry: boolean,
  callerSignal: AbortSignal | undefined,
  response: Response,
  watchdog: AbortController,
  signal: AbortSignal,
): Promise<string> {
  // A server can send an error status and then stall its body; read it
  // under the watchdog so that hang fails fast instead of freezing here.
  const errBody = await withStallWatchdog(response.text(), watchdog);
  logMsg("API response status: " + String(response.status));
  // Transient 5xx/429s — retry once with backoff. The LLM serving layer is
  // flaky enough (observed 503s mid-run) that a single retry saves a refinement
  // iteration from dying to what is a momentary infrastructure hiccup. Gateway
  // chains add one more flavor: a 400 "API key not valid" that is really the
  // upstream provider's quota tripping (observed on the free gemini route) —
  // the same key works seconds later, so that specific 400 retries too. A
  // genuinely bad key just fails again after the single retry.
  const transient =
    [429, 500, 502, 503, 504].includes(response.status) ||
    (response.status === 400 && /API key not valid/i.test(errBody));
  if (transient && allowTransientRetry) {
    logMsg("Transient API error " + String(response.status) + " — retrying once after 2s");
    await sleepOrAbort(2000, signal);
    return callAPIAttempt(config, prompt, temperature, onChunk, allowEmptyRetry, false, callerSignal);
  }
  throwForErrorResponse(response, errBody);
}

/** Consume a successful response: read the answer, apply the starvation/empty retries, surface the result. */
async function consumeResponse(
  config: ExtensionConfig,
  prompt: string,
  temperature: number,
  onChunk: ((delta: string) => void) | undefined,
  allowEmptyRetry: boolean,
  callerSignal: AbortSignal | undefined,
  reasoningEffortOverride: string | undefined,
  response: Response,
  watchdog: AbortController,
  signal: AbortSignal,
  requestStarted: number,
): Promise<string> {
  const contentType = response.headers.get("content-type") || "";
  const read = await readResponseContent(
    contentType,
    response,
    onChunk,
    watchdog,
    signal,
    noContentTimeoutMs(prompt.length),
  );
  if (!read.content) {
    // A stream that ended with non-empty reasoning but no answer means the
    // model's thinking consumed the whole output budget (max_tokens is shared
    // between reasoning and the answer). Under the out-of-box "default" effort
    // the provider's own default thinking is what starved the answer, so
    // retrying with reasoning_effort: "low" is the one change that resolves
    // it — same shape as the empty/transient single retries below. Under any
    // explicit effort the user already picked the knob, so fail fast.
    if (read.reasoning) {
      logMsg("Stream carried reasoning_content but no answer content");
      if (config.thinkingEffort === "default" && reasoningEffortOverride === undefined) {
        logMsg('Default-effort thinking starvation — retrying once with reasoning_effort: "low"');
        return callAPIAttempt(config, prompt, temperature, onChunk, false, false, callerSignal, "low");
      }
      throw reasoningOnlyError();
    }
    // Empty stream aggregation happens on transient server hiccups (observed
    // in parallel lab runs); retry the whole request once before failing.
    if (allowEmptyRetry) {
      logMsg("No content in API response — retrying once");
      await sleepOrAbort(1000, signal);
      return callAPIAttempt(config, prompt, temperature, onChunk, false, true, callerSignal);
    }
    logMsg("No content in API response");
    throw new Error("No content in API response");
  }

  if (!read.fromStream) onChunk?.(read.content); // non-streaming endpoint: surface the whole answer as one chunk
  logMsg(
    "API call took " +
      ((Date.now() - requestStarted) / 1000).toFixed(1) +
      "s — content length: " +
      String(read.content.length) +
      (read.fromStream ? " (from stream)" : ""),
  );
  return read.content.trim();
}
