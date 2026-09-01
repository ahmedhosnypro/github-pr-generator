import { STREAM_PORT_NAME, type StreamRequest } from "../messages";
import type { StreamedResult, StreamPortMessage } from "../responses";
import type { OpenedPRData } from "../types";
import { handleGenerate } from "./handlers/generate";
import { handleGenerateMergeDescription, handleGenerateMergeTitle } from "./handlers/merge";
import { errorMessage, logMsg } from "./log";

function post(port: chrome.runtime.Port, message: StreamPortMessage): void {
  try {
    port.postMessage(message);
  } catch (e) {
    logMsg("stream port post failed: " + errorMessage(e));
  }
}

function runRequest(port: chrome.runtime.Port, request: StreamRequest): void {
  const onChunk = (delta: string): void => {
    post(port, { kind: "chunk", text: delta });
  };
  let job: Promise<StreamedResult>;
  switch (request.type) {
    case "generate":
      job = handleGenerate(request.data ?? {}, onChunk);
      break;
    case "generateMergeTitle":
      job = handleGenerateMergeTitle((request.data ?? {}) as OpenedPRData, onChunk);
      break;
    case "generateMergeDescription":
      job = handleGenerateMergeDescription((request.data ?? {}) as OpenedPRData, onChunk);
      break;
    default:
      post(port, { kind: "error", error: "Unknown stream request type" });
      return;
  }
  job
    .then((result) => {
      post(port, { kind: "done", result });
      return undefined;
    })
    .catch((err: unknown) => {
      logMsg("stream request error (" + request.type + "): " + errorMessage(err));
      post(port, { kind: "error", error: errorMessage(err) });
    });
}

/**
 * Long-lived port between a content script and the service worker: the
 * background posts streamed tokens as they arrive, then a final "done" with
 * the fully parsed result. chrome.runtime.sendMessage cannot push, so
 * generation flows that render into the page go through this port.
 */
export function registerStreamListener(): void {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== STREAM_PORT_NAME) return;
    port.onMessage.addListener((message: unknown) => {
      // Keepalive pings only need to arrive — receiving them on the port
      // resets the MV3 idle timer during long pre-first-token waits.
      if ((message as { type?: string }).type === "__keepalive_ping__") return;
      runRequest(port, message as StreamRequest);
    });
  });
}
