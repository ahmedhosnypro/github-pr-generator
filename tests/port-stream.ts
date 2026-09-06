// Unit tests for the content-script side of the port streaming channel:
// src/content/stream.ts streamFromBackground: a long-lived port promise that
// resolves on "done", rejects on "error"/disconnect, and ignores everything
// after settle (reconnect lag must not corrupt a fresh job). The background
// service-worker half lives in port-stream-background.ts.
// chrome does not exist under Bun, so the client runs against a FakePort plus
// a stubbed global chrome.
import { streamFromBackground } from "../src/content/stream";
import type { GenerateResponse, StreamPortMessage } from "../src/responses";
import { expectMatch, getFailures } from "./expect-helpers";
import { captureRejection, FakePort } from "./port-stream-shared";

let runtimeLastError: string | null = null;
let nextPortBroken = false;
const connectedPorts: FakePort[] = [];

(globalThis as unknown as { chrome: unknown }).chrome = {
  runtime: {
    connect: (_info: { name: string }): FakePort => {
      const port = new FakePort();
      if (nextPortBroken) {
        port.postThrows = true;
        nextPortBroken = false;
      }
      connectedPorts.push(port);
      return port;
    },
    get lastError() {
      return runtimeLastError === null ? undefined : { message: runtimeLastError };
    },
  },
};

function latestPort(): FakePort {
  const port = connectedPorts.at(-1);
  if (!port) throw new Error("test bug: chrome.runtime.connect was never called");
  return port;
}

// The request must go out on the port as soon as the promise is created, so a
// stale/throwing port cannot leave a pending job nobody will ever settle.
async function testContentCompletes(): Promise<void> {
  const chunks: string[] = [];
  const promise = streamFromBackground<GenerateResponse>({ type: "generate" }, (delta) => chunks.push(delta));
  const port = latestPort();
  expectMatch("request posted on connect", port.posted.length, 1);
  expectMatch(
    "request body is the generate request",
    JSON.stringify(port.posted[0]),
    JSON.stringify({ type: "generate" }),
  );

  port.emitMessage({ kind: "chunk", text: "fix: " } satisfies StreamPortMessage);
  port.emitMessage({ kind: "chunk", text: "add thing" } satisfies StreamPortMessage);
  port.emitMessage({
    kind: "done",
    result: { title: "fix: add thing", description: "body" },
  } satisfies StreamPortMessage);

  const result = await promise;
  expectMatch("resolves with the done payload", result.title, "fix: add thing");
  expectMatch("resolves full description", result.description, "body");
  expectMatch("chunks delivered in order", chunks.join(""), "fix: add thing");
  expectMatch("port disconnected on settle", port.disconnectCalls, 1);

  // Settle guards the settle-eligible messages: a second "done"/"error" or a
  // trailing disconnect must not re-fire settle (single disconnect call, result
  // unchanged). In the real protocol the port is disconnected here, so no
  // further messages can even arrive.
  port.emitMessage({ kind: "done", result: { title: "STALE", description: "STALE" } } satisfies StreamPortMessage);
  port.emitMessage({ kind: "error", error: "stale error" } satisfies StreamPortMessage);
  port.emitDisconnect();
  expectMatch("result unchanged by post-settle messages", result.title, "fix: add thing");
  expectMatch("settle is idempotent", port.disconnectCalls, 1);
}

async function testContentErrorMessage(): Promise<void> {
  const promise = streamFromBackground<GenerateResponse>({ type: "generate" }, () => {});
  const port = latestPort();
  port.emitMessage({ kind: "error", error: "API error 500: boom" } satisfies StreamPortMessage);
  const err = await captureRejection(promise);
  expectMatch("error message rejects the promise", err?.message, "API error 500: boom");
  expectMatch("error settle disconnects port", port.disconnectCalls, 1);
}

async function testContentDisconnectMidStream(): Promise<void> {
  const chunks: string[] = [];
  runtimeLastError = null;
  const promise = streamFromBackground<GenerateResponse>({ type: "generate" }, (delta) => chunks.push(delta));
  const port = latestPort();
  port.emitMessage({ kind: "chunk", text: "partial" } satisfies StreamPortMessage);
  port.emitDisconnect();
  const err = await captureRejection(promise);
  expectMatch("mid-stream disconnect rejects", err !== null && err.message === "Background connection lost", true);
  expectMatch("partial chunks kept before disconnect", chunks.join(""), "partial");
  expectMatch("disconnect settles the job once", port.disconnectCalls, 1);

  // With chrome.runtime.lastError set, its message is appended for debugging.
  runtimeLastError = "The message port closed before a response was received.";
  const second = streamFromBackground<GenerateResponse>({ type: "generate" }, () => {});
  const secondPort = latestPort();
  secondPort.emitDisconnect();
  const secondErr = await captureRejection(second);
  expectMatch(
    "lastError appended to disconnect reason",
    secondErr?.message,
    "Background connection lost: The message port closed before a response was received.",
  );
  runtimeLastError = null;
}

async function testContentBrokenPort(): Promise<void> {
  // connect() itself succeeded but the port died before the request post:
  // postMessage throws synchronously and the promise must reject, not hang.
  nextPortBroken = true;
  const promise = streamFromBackground<GenerateResponse>({ type: "generate" }, () => {});
  const err = await captureRejection(promise);
  expectMatch("throwing postMessage rejects", err?.message, "port channel closed");
  const port = latestPort();
  expectMatch("broken port gets cleaned up", port.disconnectCalls, 1);
}

async function testContentReconnectRace(): Promise<void> {
  // A disconnect kills only its own job; the next call gets a brand-new port
  // and completes even while the old port is still emitting stray events.
  const portsBefore = connectedPorts.length;
  const dead = streamFromBackground<GenerateResponse>({ type: "generate" }, () => {});
  const deadPort = latestPort();
  deadPort.emitDisconnect();
  await captureRejection(dead);

  const live = streamFromBackground<GenerateResponse>({ type: "generate" }, () => {});
  const livePort = latestPort();
  expectMatch("reconnect opens a second port", connectedPorts.length - portsBefore, 2);
  expectMatch("new job uses the new port", livePort === deadPort, false);

  deadPort.emitMessage({ kind: "error", error: "stale error from dead port" } satisfies StreamPortMessage);
  deadPort.emitMessage({ kind: "done", result: { title: "STALE", description: "STALE" } } satisfies StreamPortMessage);

  livePort.emitMessage({
    kind: "done",
    result: { title: "fresh", description: "new body" },
  } satisfies StreamPortMessage);
  const result = await live;
  expectMatch("new job unaffected by dead port's messages", result.title, "fresh");
}

console.log("=== Port Stream Tests (content side) ===\n");

await testContentCompletes();
await testContentErrorMessage();
await testContentDisconnectMidStream();
await testContentBrokenPort();
await testContentReconnectRace();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All port stream content-side tests passed");
