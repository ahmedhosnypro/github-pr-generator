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

function runRequest(port: chrome.runtime.Port, request: StreamRequest, signal: AbortSignal): Promise<void> {
  const onChunk = (delta: string): void => {
    post(port, { kind: "chunk", text: delta });
  };
  let job: Promise<StreamedResult>;
  switch (request.type) {
    case "generate":
      job = handleGenerate(request.data ?? {}, onChunk, signal);
      break;
    case "generateMergeTitle":
      job = handleGenerateMergeTitle((request.data ?? {}) as OpenedPRData, onChunk, signal);
      break;
    case "generateMergeDescription":
      job = handleGenerateMergeDescription((request.data ?? {}) as OpenedPRData, onChunk, signal);
      break;
    default:
      post(port, { kind: "error", error: "Unknown stream request type" });
      return Promise.resolve();
  }
  return job
    .then((result) => {
      post(port, { kind: "done", result });
      return undefined;
    })
    .catch((err: unknown) => {
      if (signal.aborted) {
        // Intentional cancel on disconnect — the receiver is gone, so posting
        // an error back would be pure noise.
        logMsg("stream request aborted (" + request.type + "): " + errorMessage(err));
        return;
      }
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
    // One controller per request: a port can carry several jobs in flight, and
    // a single shared controller would let a disconnect abort the wrong job
    // (or none, if jobInFlight was cleared by an earlier completion).
    const inFlight = new Set<AbortController>();
    port.onDisconnect.addListener(() => {
      if (inFlight.size === 0) return;
      // Tab closed or navigated mid-generation: cancel the LLM work instead
      // of burning tokens on results no one will read.
      logMsg("stream port disconnected mid-generation — aborting " + String(inFlight.size) + " in-flight job(s)");
      for (const controller of inFlight) {
        controller.abort(new Error("Generation aborted: user navigated away"));
      }
      inFlight.clear();
    });
    port.onMessage.addListener((message: unknown) => {
      // Keepalive pings only need to arrive — receiving them on the port
      // resets the MV3 idle timer during long pre-first-token waits.
      if ((message as { type?: string }).type === "__keepalive_ping__") return;
      const controller = new AbortController();
      inFlight.add(controller);
      void runRequest(port, message as StreamRequest, controller.signal).finally(() => {
        inFlight.delete(controller);
      });
    });
  });
}
