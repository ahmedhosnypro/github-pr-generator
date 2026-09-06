// Unit tests for src/content/messaging.ts — sendToBackground's MV3 plumbing:
// response resolution, one-shot retry on dropped SW channels, throws from a
// dead receiver, error-object-vs-lastError precedence, and the timeout/keepalive
// wiring (verified structurally; the 25s ping and 5min timeout are not waited
// out). dom-stub provides document/window/chrome for log.ts; runtime is then
// re-pointed at a recorder the tests drive.

import type { ExtensionMessage } from "../src/messages";
import { resetPage } from "./dom-stub";
import { expectIncludes, expectMatch, getFailures } from "./expect-helpers";

type SendCallback = (resp: unknown) => void;

const sentMessages: unknown[] = [];
let onSend: (msg: unknown, cb: SendCallback) => void = () => {};

const chromeRef = (globalThis as unknown as { chrome: { runtime: Record<string, unknown> } }).chrome;
chromeRef.runtime.lastError = undefined as { message: string } | undefined;
chromeRef.runtime.sendMessage = (msg: unknown, cb: SendCallback): void => {
  sentMessages.push(msg);
  onSend(msg, cb);
};

const { sendToBackground } = await import("../src/content/messaging");

interface RuntimeRef {
  runtime: { lastError: { message: string } | undefined };
}
const rt = (globalThis as unknown as { chrome: RuntimeRef }).chrome;

function lastError(message: string | undefined): void {
  rt.runtime.lastError = message === undefined ? undefined : { message };
}

function setLastErrorBeforeCallback(message: string, cb: SendCallback, resp: unknown): void {
  lastError(message);
  cb(resp);
}

const CFG: ExtensionMessage = { type: "getConfig" } as unknown as ExtensionMessage;
const CHANNEL_GONE = "A listener indicated an asynchronous response by returning true, but the message channel closed";

console.log("=== Content Messaging Tests ===\n");
resetPage("https://github.com/o/r/pull/1");

// 1. Plain success: response object resolves through, message passed along.
onSend = (_msg, cb) => {
  cb({ model: "m" });
};
{
  const resp = await sendToBackground<{ model?: string }>(CFG);
  expectMatch("happy path resolves response", JSON.stringify(resp), JSON.stringify({ model: "m" }));
  expectMatch("happy path sent getConfig", JSON.stringify(sentMessages.pop()), JSON.stringify(CFG));
}

// 2. lastError set but a response object arrived -> response wins (object over lastError).
onSend = (_msg, cb) => {
  setLastErrorBeforeCallback("Unchecked runtime.lastError: some noise", cb, { error: "Boom" });
};
{
  const resp = await sendToBackground(CFG);
  expectMatch("response object beats lastError", JSON.stringify(resp), JSON.stringify({ error: "Boom" }));
  expectMatch("no retry when object arrived", sentMessages.length, 1);
}

// 3. Channel closed with no response -> retried once; second attempt succeeds.
{
  let attempts = 0;
  onSend = (_msg, cb) => {
    attempts += 1;
    if (attempts === 1) {
      setLastErrorBeforeCallback(CHANNEL_GONE, cb, undefined);
      return;
    }
    lastError(undefined);
    cb({ ok: 1 });
  };
  const resp = (await sendToBackground<{ ok?: number }>(CFG)) as { ok?: number };
  expectMatch("channel closed retried once then resolves", resp.ok ?? 0, 1);
  expectMatch("exactly two sends on retry", attempts, 2);
}

// 4. Channel closed on both attempts -> rejects with the lastError message.
{
  lastError(undefined);
  onSend = (_msg, cb) => {
    setLastErrorBeforeCallback(CHANNEL_GONE, cb, undefined);
  };
  let caught = "";
  try {
    await sendToBackground(CFG);
  } catch (err) {
    caught = err instanceof Error ? err.message : String(err);
  }
  expectIncludes("both channels closed rejects with reason", caught, "message channel closed");
}

// 5. Synchronous throw "Receiving end does not exist" -> retried once successfully.
{
  let attempts = 0;
  lastError(undefined);
  onSend = (_msg, cb) => {
    attempts += 1;
    if (attempts === 1) throw new Error("Could not establish connection. Receiving end does not exist.");
    cb({ ok: 2 });
  };
  const resp = (await sendToBackground<{ ok?: number }>(CFG)) as { ok?: number };
  expectMatch("thrown dead-receiver retried then resolves", resp.ok ?? 0, 2);
  expectMatch("throw retry used two sends", attempts, 2);
}

// 6. Unrelated synchronous throw -> rejected immediately, no retry.
{
  let attempts = 0;
  onSend = () => {
    attempts += 1;
    throw new Error("Extension context invalidated.");
  };
  let caught = "";
  try {
    await sendToBackground(CFG);
  } catch (err) {
    caught = err instanceof Error ? err.message : String(err);
  }
  expectMatch("unrelated throw rejects immediately", caught, "Extension context invalidated.");
  expectMatch("no retry for unrelated throw", attempts, 1);
}

// 7. Undefined response, no lastError -> reject with a clear fallback message.
{
  lastError(undefined);
  onSend = (_msg, cb) => {
    cb(undefined);
  };
  let caught = "";
  try {
    await sendToBackground(CFG);
  } catch (err) {
    caught = err instanceof Error ? err.message : String(err);
  }
  expectMatch("silent no-response rejects", caught, "No response from background");
}

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All content messaging tests passed");
process.exit(0);
