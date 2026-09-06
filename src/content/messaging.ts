import type { ExtensionMessage, KeepalivePingMessage } from "../messages";
import type { KeepaliveResponse, MessageErrorResponse } from "../responses";
import { errorMessage } from "./errors";
import { log } from "./log";

// Wraps chrome.runtime.sendMessage with three safeguards for MV3
// service workers:
//   1. Keepalive pings: Chrome terminates an idle service worker (~30s).
//      A long-running API call (large PR, streaming aggregation) can exceed
//      that window, killing the message port and surfacing "A listener
//      indicated an asynchronous response by returning true, but the message
//      channel closed before a response was received". Pinging the SW every
//      25s resets its idle timer and keeps the channel open.
//   2. One retry: if the channel still drops (SW was already gone), the call
//      is retried once — the second attempt wakes a fresh SW.
//   3. Overall timeout (SEND_TIMEOUT_MS): if the response is simply lost, the
//      promise rejects instead of leaving the UI pending forever.

// Keepalive resets the SW idle timer but cannot help a genuinely lost call
// (SW crash, wedged channel): without an overall cap the UI would wait
// forever, so reject outright once the window is exhausted. Generous because
// non-streamed calls can span a slow LLM response.
const SEND_TIMEOUT_MS = 5 * 60 * 1000;

interface PendingCall<R> {
  message: ExtensionMessage;
  resolve: (value: R | MessageErrorResponse) => void;
  reject: (reason: Error) => void;
  done: boolean;
  pingTimer: ReturnType<typeof setInterval> | null;
  timeoutTimer: ReturnType<typeof setTimeout> | null;
}

export function sendToBackground<R>(message: ExtensionMessage): Promise<R | MessageErrorResponse> {
  return new Promise((resolve, reject) => {
    const call: PendingCall<R> = { message, resolve, reject, done: false, pingTimer: null, timeoutTimer: null };
    // Ping every 25s while outstanding to reset the SW idle timer.
    call.pingTimer = startKeepalive(call);
    call.timeoutTimer = setTimeout(() => {
      if (call.done) return;
      clearTimers(call);
      call.done = true;
      log("error", "sendToBackground timed out after " + String(SEND_TIMEOUT_MS / 1000) + "s (" + message.type + ")");
      call.reject(new Error("No response from background within " + String(SEND_TIMEOUT_MS / 1000) + "s"));
    }, SEND_TIMEOUT_MS);
    attemptSend(call, 1);
  });
}

function clearTimers<R>(call: PendingCall<R>): void {
  if (call.pingTimer) {
    clearInterval(call.pingTimer);
    call.pingTimer = null;
  }
  if (call.timeoutTimer) {
    clearTimeout(call.timeoutTimer);
    call.timeoutTimer = null;
  }
}

function attemptSend<R>(call: PendingCall<R>, remaining: number): void {
  if (call.done) return;
  try {
    chrome.runtime.sendMessage<ExtensionMessage, unknown>(call.message, (resp: unknown) => {
      handleResponse(call, remaining, resp);
    });
  } catch (err) {
    handleSendError(call, remaining, err);
  }
}

function handleSendError<R>(call: PendingCall<R>, remaining: number, err: unknown): void {
  if (call.done) return;
  const msgText = errorMessage(err);
  if (/Receiving end does not exist|message channel closed/i.test(msgText) && remaining > 0) {
    log("warn", "sendToBackground threw (" + msgText + "); retrying once");
    // Keep the keepalive running across the retry — the retried call is the
    // long one that most needs SW idle protection.
    setTimeout(() => {
      attemptSend(call, remaining - 1);
    }, 250);
    return;
  }
  clearTimers(call);
  call.done = true;
  call.reject(err instanceof Error ? err : new Error(msgText));
}

function handleResponse<R>(call: PendingCall<R>, remaining: number, resp: unknown): void {
  if (call.done) return;
  const err = chrome.runtime.lastError;
  const errMsg = err?.message ?? "";
  const channelClosed = errMsg.length > 0 && /message channel closed|Receiving end does not exist/i.test(errMsg);
  // chrome.runtime.lastError may be set even when the SW actually responded with
  // { error: ... } (background rejected). Distinguish by checking resp: if we have
  // an object, the messaging succeeded and lastError is just informational.
  if (resp !== undefined && resp !== null) {
    clearTimers(call);
    call.done = true;
    call.resolve(resp as R | MessageErrorResponse);
    return;
  }
  if (channelClosed && remaining > 0) {
    log("warn", "sendToBackground channel closed; retrying once (" + call.message.type + ")");
    // Keep the keepalive running across the retry (see handleSendError).
    setTimeout(() => {
      attemptSend(call, remaining - 1);
    }, 250);
    return;
  }
  clearTimers(call);
  call.done = true;
  call.reject(err ? new Error(errMsg) : new Error("No response from background"));
}

function startKeepalive<R>(call: PendingCall<R>): ReturnType<typeof setInterval> {
  return setInterval(() => {
    if (call.done) {
      clearTimers(call);
      return;
    }
    sendPing();
  }, 25000);
}

function sendPing(): void {
  const ping: KeepalivePingMessage = { type: "__keepalive_ping__" };
  try {
    chrome.runtime.sendMessage<KeepalivePingMessage, KeepaliveResponse>(ping, () => {
      // Swallow ping errors; the real call's callback handles failures.
      if (chrome.runtime.lastError) return;
    });
  } catch {
    /* ignore */
  }
}
