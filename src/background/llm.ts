import type { ChatCompletionResponse } from "../github-types";
import type { ExtensionConfig } from "../types";
import { errorMessage, logMsg } from "./log";
import { SYSTEM_PROMPT } from "./prompts/common";
import { createSSEParser } from "./sse";

async function postChatCompletion(
  url: string,
  config: ExtensionConfig,
  prompt: string,
  temperature: number,
): Promise<Response> {
  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.apiKey,
      },
      // Always ask for a stream: servers that ignore it answer with plain JSON,
      // which the fallback path in callAPI handles as before.
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature,
        stream: true,
        // "default" omits the field so the provider applies its own effort default.
        ...(config.thinkingEffort === "default" ? {} : { reasoning_effort: config.thinkingEffort }),
      }),
    });
  } catch (fetchErr) {
    logMsg("Fetch failed (network error): " + errorMessage(fetchErr));
    throw new Error("Network error calling API at " + url + ": " + errorMessage(fetchErr), { cause: fetchErr });
  }
}

async function assertOkResponse(response: Response, errorBody?: string): Promise<void> {
  logMsg("API response status: " + String(response.status));
  if (!response.ok) {
    const text = errorBody ?? (await response.text());
    logMsg("API error body: " + text.substring(0, 300));
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "API authentication failed (status " + String(response.status) + "). Check your API key in config.local.json.",
      );
    }
    throw new Error("API error " + String(response.status) + ": " + text.substring(0, 200));
  }
}

/** Incrementally read a text/event-stream response, forwarding each content delta to onChunk. */
async function readStreamedCompletion(
  response: Response,
  onChunk: ((delta: string) => void) | undefined,
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
      // oxlint-disable-next-line no-await-in-loop -- a stream reader is sequential by nature: chunks must be read in order
      const { done, value } = await reader.read();
      if (done) break;
      deliver(parser.push(decoder.decode(value, { stream: true })));
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
): Promise<string> {
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
  const response = await postChatCompletion(url, config, prompt, temperature);
  // Transient 5xx/429s — retry once with backoff. The LLM serving layer is
  // flaky enough (observed 503s mid-run) that a single retry saves a refinement
  // iteration from dying to what is a momentary infrastructure hiccup. Gateway
  // chains add one more flavor: a 400 "API key not valid" that is really the
  // upstream provider's quota tripping (observed on the free gemini route) —
  // the same key works seconds later, so that specific 400 retries too. A
  // genuinely bad key just fails again after the single retry.
  if (!response.ok && allowTransientRetry) {
    const errBody = await response.text();
    const transient =
      [429, 500, 502, 503, 504].includes(response.status) ||
      (response.status === 400 && /API key not valid/i.test(errBody));
    if (transient) {
      logMsg("Transient API error " + String(response.status) + " — retrying once after 2s");
      await new Promise((r) => setTimeout(r, 2000));
      return callAPI(config, prompt, temperature, onChunk, allowEmptyRetry, false);
    }
    await assertOkResponse(response, errBody);
  } else {
    await assertOkResponse(response);
  }

  const contentType = response.headers.get("content-type") || "";
  let content: string;
  let fromStream: boolean;
  if (contentType.includes("event-stream")) {
    content = await readStreamedCompletion(response, onChunk);
    fromStream = true;
  } else {
    const json = parseJsonResponseBody(await response.text());
    content = json.choices?.[0]?.message?.content || "";
    fromStream = false;
  }

  if (!content) {
    // Empty stream aggregation happens on transient server hiccups (observed
    // in parallel lab runs); retry the whole request once before failing.
    if (allowEmptyRetry) {
      logMsg("No content in API response — retrying once");
      await new Promise((r) => setTimeout(r, 1000));
      return callAPI(config, prompt, temperature, onChunk, false);
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
