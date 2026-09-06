// Unit tests for the background service-worker side of the port streaming
// channel: src/background/stream.ts registerStreamListener — port-name gating,
// keepalive pings, unknown requests, and the disconnect-mid-generation abort
// (the fix this file exists to pin down): when the tab goes away, the
// in-flight LLM job is aborted and NO error is posted to the dead port.
// The content-script half lives in port-stream.ts.
//
// Only the port wiring is under test, so the generation handlers are mocked
// (Bun's mock.module works in plain scripts): each "generate" call parks on a
// promise this test resolves/rejects by hand, exposing the exact AbortSignal
// the listener handed the job — that signal IS the disconnect-fix contract.
import { mock } from "bun:test";
import { expectMatch, getFailures } from "./expect-helpers";
import { countLogs, FakePort, settleTicks } from "./port-stream-shared";

const connectListeners: Array<(port: FakePort) => void> = [];

function installBackgroundChrome(): void {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      onConnect: {
        addListener: (fn: (port: FakePort) => void): void => {
          connectListeners.push(fn);
        },
      },
    },
  };
}

interface RecordedGenerateCall {
  data: unknown;
  onChunk: (delta: string) => void;
  signal: AbortSignal | undefined;
  resolve: (result: unknown) => void;
  reject: (err: unknown) => void;
}

// Calls parked until the test finishes them, in arrival order. Each entry is
// one in-flight generation as far as registerStreamListener is concerned.
const generateCalls: RecordedGenerateCall[] = [];

function connectListener(): (port: FakePort) => void {
  const listener = connectListeners.at(-1);
  if (!listener) throw new Error("test bug: no onConnect listener registered");
  return listener;
}

function parkedCall(index: number): RecordedGenerateCall {
  const call = generateCalls[index];
  if (!call) throw new Error("test bug: expected a parked generate call");
  return call;
}

function mockGenerationHandlers(): void {
  const fakeHandleGenerate = (
    data: unknown,
    onChunk: (delta: string) => void,
    signal?: AbortSignal,
  ): Promise<unknown> =>
    new Promise((resolve, reject) => {
      generateCalls.push({ data, onChunk, signal, resolve, reject });
    });
  void mock.module("../src/background/handlers/generate", () => ({ handleGenerate: fakeHandleGenerate }));
  void mock.module("../src/background/handlers/merge", () => ({
    handleGenerateMergeTitle: fakeHandleGenerate,
    handleGenerateMergeDescription: fakeHandleGenerate,
  }));
}

async function testBackgroundPortNameGating(registerStreamListener: () => void): Promise<void> {
  registerStreamListener();
  expectMatch("onConnect listener registered once", connectListeners.length, 1);
  const connect = connectListener();

  // Ports with any other name (devtools, popup, other features) get no
  // listeners and no job — the guard returns before wiring anything.
  const other = new FakePort("devtools");
  connect(other);
  expectMatch("foreign port gets no message listener", other.messageListenerCount, 0);
  other.emitMessage({ type: "generate", data: {} });
  other.emitDisconnect();
  expectMatch("foreign port posts nothing", other.posted.length, 0);
}

async function testBackgroundKeepalive(): Promise<void> {
  const connect = connectListener();
  const port = new FakePort();
  connect(port);
  port.emitMessage({ type: "__keepalive_ping__" });
  port.emitMessage({ type: "__keepalive_ping__" });
  await settleTicks();
  expectMatch("keepalive pings produce no posts", port.posted.length, 0);
  expectMatch("keepalive pings never start a job", generateCalls.length, 0);
}

async function testBackgroundUnknownRequest(): Promise<void> {
  const connect = connectListener();
  const port = new FakePort();
  connect(port);
  port.emitMessage({ type: "definitely-not-a-real-type" });
  await settleTicks();
  expectMatch("unknown request type answered with error", port.errorPosts().length, 1);
  expectMatch("unknown request error text", port.errorPosts()[0]?.error, "Unknown stream request type");
}

async function testBackgroundCompletes(): Promise<void> {
  const connect = connectListener();
  const port = new FakePort();
  connect(port);
  const callsBefore = generateCalls.length;

  port.emitMessage({ type: "generate", data: { commits: [] } });
  await settleTicks();
  expectMatch("generate request starts a job", generateCalls.length, callsBefore + 1);
  const call = parkedCall(callsBefore);

  // Handler streams deltas; each becomes one "chunk" post on the port.
  call.onChunk("fix: ");
  call.onChunk("add thing");
  call.resolve({ title: "fix: add thing", description: "body" });
  await settleTicks();
  const chunkTexts = port.posted
    .filter((m): m is { kind: "chunk"; text: string } => (m as { kind?: string }).kind === "chunk")
    .map((m) => m.text);
  expectMatch("chunks forwarded to the port in order", chunkTexts.join(""), "fix: add thing");
  const done = port.posted.filter((m) => (m as { kind?: string }).kind === "done");
  expectMatch("one done message posted", done.length, 1);
  expectMatch(
    "done carries the parsed result",
    JSON.stringify((done[0] as { result?: unknown }).result),
    JSON.stringify({ title: "fix: add thing", description: "body" }),
  );

  // Post-completion disconnect: jobInFlight cleared by finally, so no abort.
  port.emitDisconnect();
  expectMatch("handler signal was never aborted for a completed job", call.signal?.aborted ?? false, false);
}

async function testBackgroundDisconnectAbortsMidGeneration(): Promise<void> {
  const connect = connectListener();
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]): void => {
    logs.push(args.map(String).join(" "));
  };
  try {
    const port = new FakePort();
    connect(port);
    const callsBefore = generateCalls.length;
    port.emitMessage({ type: "generate", data: {} });
    await settleTicks();
    expectMatch("job started before disconnect", generateCalls.length, callsBefore + 1);
    const call = parkedCall(callsBefore);
    expectMatch("job received an abort signal", call.signal !== undefined, true);

    // Tab navigated away mid-generation: disconnect must abort the job.
    port.emitDisconnect();
    expectMatch(
      "mid-generation disconnect logged as abort",
      countLogs(logs, "stream port disconnected mid-generation"),
      1,
    );
    expectMatch("handler's signal aborted on disconnect", call.signal?.aborted, true);
    expectMatch(
      "abort reason names the cause",
      call.signal?.reason instanceof Error && call.signal.reason.message === "Generation aborted: user navigated away",
      true,
    );
    expectMatch("nothing posted once the receiver is gone", port.posted.length, 0);

    // The aborted job now settles (e.g. its fetch threw): the rejection lands
    // in the aborted branch — a log line, never an error post to the dead port.
    call.reject(new Error("The operation was aborted"));
    await settleTicks();
    expectMatch(
      "aborted rejection logged as intentional cancel",
      countLogs(logs, "stream request aborted (generate)"),
      1,
    );
    expectMatch("no error post after abort", port.errorPosts().length, 0);

    // A duplicate disconnect callback is a no-op: the aborted signal short-circuits it.
    port.emitDisconnect();
    await settleTicks();
    expectMatch(
      "second disconnect does not double-abort",
      countLogs(logs, "stream port disconnected mid-generation"),
      1,
    );
  } finally {
    console.log = originalLog;
  }
}

async function testBackgroundDisconnectWithoutJob(): Promise<void> {
  const connect = connectListener();
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]): void => {
    logs.push(args.map(String).join(" "));
  };
  try {
    // Disconnect with no request ever sent: no in-flight job, nothing to abort.
    const idle = new FakePort();
    connect(idle);
    idle.emitDisconnect();
    await settleTicks();
    expectMatch("idle disconnect never aborts", countLogs(logs, "stream port disconnected mid-generation"), 0);

    // Disconnect arriving right after the job settled (error already posted):
    // the jobInFlight flag is cleared by finally, so no stale abort fires.
    const finished = new FakePort();
    connect(finished);
    finished.emitMessage({ type: "definitely-not-a-real-type" });
    await settleTicks();
    expectMatch("job posted its error before disconnect", finished.errorPosts().length, 1);
    finished.emitDisconnect();
    await settleTicks();
    expectMatch(
      "post-completion disconnect is not an abort",
      countLogs(logs, "stream port disconnected mid-generation"),
      0,
    );
  } finally {
    console.log = originalLog;
  }
}

async function testBackgroundReconnectFreshController(): Promise<void> {
  const connect = connectListener();
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]): void => {
    logs.push(args.map(String).join(" "));
  };
  try {
    // Connection 1: abort its in-flight job (same flow as the abort test).
    const first = new FakePort();
    connect(first);
    const callsBefore1 = generateCalls.length;
    first.emitMessage({ type: "generate", data: {} });
    await settleTicks();
    const firstCall = parkedCall(callsBefore1);
    first.emitDisconnect();
    firstCall.reject(new Error("aborted"));
    await settleTicks();
    expectMatch("first connection aborted", firstCall.signal?.aborted, true);
    expectMatch("first abort logged once", countLogs(logs, "stream request aborted (generate)"), 1);

    // Connection 2: the listener must hand out a FRESH AbortController — the
    // previous abort must not poison the next generation. Let this job fail
    // without a disconnect: because its signal is NOT aborted, the rejection
    // surfaces as a real error post to the (live) port.
    const second = new FakePort();
    connect(second);
    const callsBefore2 = generateCalls.length;
    second.emitMessage({ type: "generate", data: {} });
    await settleTicks();
    const secondCall = parkedCall(callsBefore2);
    expectMatch("reconnected job gets a fresh, unaborted signal", secondCall.signal?.aborted ?? true, false);
    secondCall.reject(new Error("API error 500: boom"));
    await settleTicks();
    expectMatch("reconnected failure posted as a real error", second.errorPosts()[0]?.error, "API error 500: boom");
    expectMatch("reconnected failure logged as a real error", countLogs(logs, "stream request error (generate)"), 1);
    expectMatch("reconnect itself does not abort", countLogs(logs, "stream port disconnected mid-generation"), 1);
  } finally {
    console.log = originalLog;
  }
}

console.log("=== Port Stream Tests (background side) ===\n");

installBackgroundChrome();
mockGenerationHandlers();
// Variable specifier (query suffix, same trick as config-resolve.ts): a
// literal path with a query string makes tsc fail module resolution.
const streamModuleSpecifier = "../src/background/stream.ts?port-stream";
const { registerStreamListener } = (await import(streamModuleSpecifier)) as {
  registerStreamListener: () => void;
};
await testBackgroundPortNameGating(registerStreamListener);
await testBackgroundKeepalive();
await testBackgroundUnknownRequest();
await testBackgroundCompletes();
await testBackgroundDisconnectAbortsMidGeneration();
await testBackgroundDisconnectWithoutJob();
await testBackgroundReconnectFreshController();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All port stream background-side tests passed");
