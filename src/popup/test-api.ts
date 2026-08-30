import { apiKeyInput, endpointInput, modelInput, testApiBtn, testApiResult } from "./elements";
import { errorMessage } from "./messaging";
import { stripTrailingSlashes } from "./text";
import { COLOR_ERROR, COLOR_MUTED, COLOR_OK } from "./ui";

interface ChatChunk {
  choices?: {
    delta?: { content?: string };
    message?: { content?: string };
  }[];
}

interface ApiTestResult {
  ok: boolean;
  status?: number;
  body: string;
}

function countSseChunks(text: string): number {
  return text.split("\n").filter((line) => line.trim().startsWith("data:")).length;
}

function aggregateSse(text: string): string {
  let aggregated = "";
  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/\r$/, "").trim();
    if (!line.startsWith("data:")) continue;
    const payload = line.replace(/^data:\s*/, "");
    if (payload === "[DONE]" || payload === "") continue;
    try {
      const chunk = JSON.parse(payload) as ChatChunk;
      const first = chunk.choices?.[0];
      const delta = first?.delta?.content;
      const content = delta ? delta : (first?.message?.content ?? "");
      if (content) aggregated += content;
    } catch {
      // skip bad chunk
    }
  }
  return aggregated;
}

function parseApiResponse(resp: Response, contentType: string, text: string): ApiTestResult {
  if (contentType.includes("event-stream") || /^data:\s/m.test(text)) {
    return { ok: resp.ok, body: aggregateSse(text) || "(stream response)" };
  }
  if (resp.ok) {
    try {
      JSON.parse(text);
    } catch {
      console.log("[popup testAPI] Non-JSON ok response:", text.substring(0, 200));
    }
    return { ok: true, body: text };
  }
  return { ok: false, status: resp.status, body: text };
}

function readApiResponse(resp: Response): Promise<ApiTestResult> {
  console.log("[popup testAPI] response status:", resp.status, "content-type:", resp.headers.get("content-type"));
  const contentType = resp.headers.get("content-type") || "";
  return resp.text().then((text) => {
    console.log("[popup testAPI] SSE detected, chunks:", countSseChunks(text));
    return parseApiResponse(resp, contentType, text);
  });
}

function showApiResult(result: ApiTestResult): void {
  testApiBtn.disabled = false;
  testApiBtn.textContent = "Test API";
  if (result.ok) {
    testApiResult.textContent = "Success! API works.";
    testApiResult.style.color = COLOR_OK;
  } else {
    testApiResult.textContent = "Failed (" + String(result.status) + "): " + result.body.substring(0, 60);
    testApiResult.style.color = COLOR_ERROR;
  }
}

function showApiError(err: unknown): void {
  testApiBtn.disabled = false;
  testApiBtn.textContent = "Test API";
  testApiResult.textContent = "Error: " + errorMessage(err);
  testApiResult.style.color = COLOR_ERROR;
}

export function testApi(): void {
  const endpoint = endpointInput.value.trim();
  const key = apiKeyInput.value.trim();
  const model = modelInput.value.trim();
  if (!endpoint || !key || !model) {
    testApiResult.textContent = "Fill endpoint, key, model";
    testApiResult.style.color = COLOR_ERROR;
    return;
  }
  console.log("[POPUP LOG] testAPI - endpoint:", endpoint, "model:", model, "key len:", key ? key.length : 0);
  testApiBtn.disabled = true;
  testApiBtn.textContent = "Testing...";
  testApiResult.textContent = "Sending...";
  testApiResult.style.color = COLOR_MUTED;
  fetch(stripTrailingSlashes(endpoint) + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + key,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Hello! Respond with exactly: OK" }],
      max_tokens: 10,
      temperature: 0,
      stream: false,
    }),
  })
    .then(readApiResponse)
    .then(showApiResult)
    .catch(showApiError);
}
