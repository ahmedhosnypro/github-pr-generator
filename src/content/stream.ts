import { STREAM_PORT_NAME, type StreamRequest } from "../messages";
import type { StreamedResult, StreamPortMessage } from "../responses";
import { errorMessage } from "./errors";
import { log } from "./log";

// While waiting for the first token (long prompt, cold model) the MV3
// service worker can go idle; pings over the port reset its idle timer.
const KEEPALIVE_INTERVAL_MS = 25000;

interface StreamJob {
  port: chrome.runtime.Port;
  settled: boolean;
  pingTimer: ReturnType<typeof setInterval>;
}

function startKeepalive(port: chrome.runtime.Port): ReturnType<typeof setInterval> {
  return setInterval(() => {
    try {
      port.postMessage({ type: "__keepalive_ping__" });
    } catch {
      // Port already gone; the disconnect handler reports the failure.
    }
  }, KEEPALIVE_INTERVAL_MS);
}

function settle(job: StreamJob, finish: () => void): void {
  if (job.settled) return;
  job.settled = true;
  clearInterval(job.pingTimer);
  try {
    job.port.disconnect();
  } catch {
    /* already disconnected */
  }
  finish();
}

function wirePortHandlers<Result extends StreamedResult>(
  job: StreamJob,
  onChunk: (delta: string) => void,
  resolve: (result: Result | PromiseLike<Result>) => void,
  reject: (reason: Error) => void,
): void {
  job.port.onMessage.addListener((message: StreamPortMessage) => {
    if (message.kind === "chunk") {
      try {
        onChunk(message.text);
      } catch (e) {
        log("warn", "stream onChunk failed: " + errorMessage(e));
      }
      return;
    }
    if (message.kind === "done") {
      settle(job, () => {
        resolve(message.result as Result);
      });
    } else {
      settle(job, () => {
        reject(new Error(message.error));
      });
    }
  });
  job.port.onDisconnect.addListener(() => {
    const lastError = chrome.runtime.lastError?.message;
    settle(job, () => {
      reject(new Error("Background connection lost" + (lastError ? ": " + lastError : "")));
    });
  });
}

/**
 * Make a background request over a long-lived port, receiving streamed
 * content deltas via onChunk as they arrive. Resolves with the parsed result
 * carried by the final "done" port message; rejects on error/disconnect.
 */
export function streamFromBackground<Result extends StreamedResult>(
  request: StreamRequest,
  onChunk: (delta: string) => void,
): Promise<Result> {
  return new Promise<Result>((resolve, reject) => {
    const port = chrome.runtime.connect({ name: STREAM_PORT_NAME });
    const job: StreamJob = { port, settled: false, pingTimer: startKeepalive(port) };
    wirePortHandlers(job, onChunk, resolve, reject);
    try {
      port.postMessage(request);
    } catch (e) {
      settle(job, () => {
        reject(e instanceof Error ? e : new Error(errorMessage(e)));
      });
    }
  });
}

/**
 * Progressive cleanup for a partial title line: leading fences/quotes and a
 * "Title:" prefix become strippable only once fully received, and recomputing
 * from the accumulated text each chunk makes transients disappear.
 */
export function cleanStreamedTitle(title: string): string {
  let result = title.trim();
  result = result.replace(/^#+\s*/, "");
  result = result.replace(/^Title:\s*/i, "");
  result = result.replace(/^["'`]+/, "");
  return result;
}

/**
 * Split a possibly-incomplete combined stream ("title" blank line "description")
 * into the field values to display right now. The authoritative parse happens
 * in the background on the final text; this is the rendering approximation.
 */
export function splitStreamedCombined(raw: string): { title: string; description: string } {
  const text = raw.replace(/^```\w*\n?/, "");
  const doubleNewlineIdx = text.indexOf("\n\n");
  if (doubleNewlineIdx !== -1) {
    return {
      title: cleanStreamedTitle(text.substring(0, doubleNewlineIdx)),
      description: text.substring(doubleNewlineIdx + 2),
    };
  }
  const firstNewlineIdx = text.indexOf("\n");
  if (firstNewlineIdx !== -1) {
    return {
      title: cleanStreamedTitle(text.substring(0, firstNewlineIdx)),
      description: text.substring(firstNewlineIdx + 1),
    };
  }
  return { title: cleanStreamedTitle(text), description: "" };
}
