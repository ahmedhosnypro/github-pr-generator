import type { ChatCompletionResponse } from "../github-types";
import type { ExtensionConfig } from "../types";
import { errorMessage, logMsg } from "./log";
import { SYSTEM_PROMPT } from "./prompts/common";

async function postChatCompletion(url: string, config: ExtensionConfig, prompt: string): Promise<Response> {
  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.apiKey,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        stream: false,
      }),
    });
  } catch (fetchErr) {
    logMsg("Fetch failed (network error): " + errorMessage(fetchErr));
    throw new Error("Network error calling API at " + url + ": " + errorMessage(fetchErr), { cause: fetchErr });
  }
}

async function assertOkResponse(response: Response): Promise<void> {
  logMsg("API response status: " + String(response.status));
  if (!response.ok) {
    const text = await response.text();
    logMsg("API error body: " + text.substring(0, 300));
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "API authentication failed (status " + String(response.status) + "). Check your API key in config.local.json.",
      );
    }
    throw new Error("API error " + String(response.status) + ": " + text.substring(0, 200));
  }
}

// Some OpenAI-compatible servers (e.g. NVIDIA NIM) default to streaming
// (text/event-stream) even when the client doesn't ask for it, returning
// `data: {...}` SSE chunks instead of a single JSON object. Detect that and
// aggregate the deltas into one completion so the rest of the code can keep
// treating the response as a regular chat completion.
interface SSEAccumulator {
  aggregated: string;
  lastFull: string;
}

function applySSEPayload(acc: SSEAccumulator, payload: string): void {
  try {
    const chunk = JSON.parse(payload) as ChatCompletionResponse;
    const choice = chunk.choices?.[0];
    const delta = (choice?.delta && choice.delta.content) || (choice?.message && choice.message.content) || "";
    if (!delta) return;
    if (choice?.delta && choice.delta.content !== undefined) {
      acc.aggregated += delta;
    } else if (choice?.message?.content) {
      acc.lastFull = choice.message.content;
    }
  } catch (e) {
    logMsg("SSE: skipping non-JSON chunk: " + errorMessage(e));
  }
}

function aggregateSSEChunks(responseText: string): SSEAccumulator {
  const acc: SSEAccumulator = { aggregated: "", lastFull: "" };
  for (const rawLine of responseText.split("\n")) {
    const line = rawLine.replace(/\r$/, "").trim();
    if (!line.startsWith("data:")) continue;
    const payload = line.replace(/^data:\s*/, "");
    if (payload !== "[DONE]" && payload !== "") applySSEPayload(acc, payload);
  }
  return acc;
}

function parseApiResponse(
  responseText: string,
  contentType: string,
): { json: ChatCompletionResponse; fromStream: boolean } {
  const looksLikeSSE = contentType.includes("event-stream") || /^data:\s/m.test(responseText);

  if (looksLikeSSE) {
    logMsg("Detected SSE stream response; aggregating chunks");
    const acc = aggregateSSEChunks(responseText);
    const finalContent = acc.aggregated || acc.lastFull || "";
    if (!finalContent) {
      logMsg("SSE: no content aggregated. Response (first 300): " + responseText.substring(0, 300));
    }
    return { json: { choices: [{ message: { content: finalContent } }] }, fromStream: true };
  }

  const cleanResponseText = responseText.replace(/data:\s*\[DONE\].*$/s, "").trim();
  if (cleanResponseText !== responseText.trim()) {
    logMsg("Stripped trailing SSE data from response");
  }

  try {
    return { json: JSON.parse(cleanResponseText) as ChatCompletionResponse, fromStream: false };
  } catch (parseErr) {
    logMsg("JSON.parse failed: " + errorMessage(parseErr));
    logMsg("Response text (first 300): " + responseText.substring(0, 300));
    throw new Error("Failed to parse API response as JSON: " + errorMessage(parseErr), { cause: parseErr });
  }
}

export async function callAPI(config: ExtensionConfig, prompt: string): Promise<string> {
  const url = config.apiEndpoint + "/chat/completions";
  logMsg("Calling API: " + url + ", model: " + config.model);

  const response = await postChatCompletion(url, config, prompt);
  await assertOkResponse(response);

  const responseText = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const { json, fromStream } = parseApiResponse(responseText, contentType);

  const content = json.choices?.[0]?.message?.content;

  if (!content) {
    logMsg("No content in API response. Keys: " + Object.keys(json).join(", "));
    throw new Error("No content in API response");
  }

  logMsg("API content length: " + String(content.length) + (fromStream ? " (from stream)" : ""));
  return content.trim();
}
