// Unit tests for the background service-worker side of the port streaming
// channel: src/background/stream.ts registerStreamListener — port-name gating,
// keepalive pings, unknown requests, disconnect-mid-generation abort (the tab
// goes away → the in-flight job is aborted, no error posted to the dead port),
// and two-port isolation. The content-script half lives in port-stream.ts.
//
// Only the port wiring is under test, so the generation handlers are mocked
// (Bun's mock.module works in plain scripts): each "generate" call parks on a
// promise this test resolves/rejects by hand, exposing the exact AbortSignal
// the listener handed the job — that signal IS the disconnect-fix contract.
import { mock } from "bun:test";
import { expectMatch, getFailures } from "./expect-helpers";
import { chunksOn, countLogs, doneTitles, FakePort, settleTicks } from "./port-stream-shared";

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

// Start a generation on a port and wait for it to park, returning the parked
// call — the standard "job started" preamble of the disconnect tests.
async function startParkedJob(port: FakePort, data: unknown): Promise<RecordedGenerateCall> {
  const callsBefore = generateCalls.length;
  port.emitMessage({ type: "generate", data });
  await settleTicks();
  expectMatch("job started before disconnect", generateCalls.length, callsBefore + 1);
  return parkedCall(callsBefore);
}

// Log capture + port connect preamble shared by the disconnect tests: swaps
// console.log for a recording array, connects one FakePort, and hands back a
// restore function for the finally block.
function setupLoggedPort(connect: (port: FakePort) => void): {
  port: FakePort;
  logs: string[];
  restoreLogs: () => void;
} {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]): void => {
    logs.push(args.map(String).join(" "));
  };
  const port = new FakePort();
  connect(port);
  return {
    port,
    logs,
    restoreLogs: (): void => {
      console.log = originalLog;
    },
  };
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
  expectMatch("chunks forwarded to the port in order", chunksOn(port), "fix: add thing");
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
  const { port, logs, restoreLogs } = setupLoggedPort(connectListener());
  try {
    const call = await startParkedJob(port, {});
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
    restoreLogs();
  }
}

async function testBackgroundDisconnectAbortsAllInFlightJobs(): Promise<void> {
  const { port, logs, restoreLogs } = setupLoggedPort(connectListener());
  try {
    // One port, three concurrent generation jobs. The listener tracks each in
    // its own AbortController (a Set per port), so ONE disconnect must abort
    // every job still in flight — a shared controller or last-job bookkeeping
    // would strand jobs 2 and 3 streaming into the void.
    const callsBefore = generateCalls.length;
    port.emitMessage({ type: "generate", data: {} });
    port.emitMessage({ type: "generate", data: {} });
    port.emitMessage({ type: "generate", data: {} });
    await settleTicks();
    expectMatch("all three jobs started on the one port", generateCalls.length, callsBefore + 3);
    const [first, second, third] = [parkedCall(callsBefore), parkedCall(callsBefore + 1), parkedCall(callsBefore + 2)];
    expectMatch("each job got its own signal", second.signal !== first.signal && third.signal !== first.signal, true);

    // A job that already completed left the in-flight set, so it is NOT aborted.
    first.resolve({ title: "done early", description: "" });
    await settleTicks();

    port.emitDisconnect();
    expectMatch("completed job's signal untouched by disconnect", first.signal?.aborted ?? false, false);
    expectMatch("second job aborted by the single disconnect", second.signal?.aborted, true);
    expectMatch("third job aborted by the single disconnect", third.signal?.aborted, true);
    expectMatch("abort log counts the remaining in-flight jobs", countLogs(logs, "aborting 2 in-flight job(s)"), 1);

    // Both aborted jobs settle with abort-style rejections: logged as
    // intentional cancels, never posted to the dead port.
    second.reject(new Error("The operation was aborted"));
    third.reject(new Error("The operation was aborted"));
    await settleTicks();
    expectMatch("both aborted rejections logged", countLogs(logs, "stream request aborted (generate)"), 2);
    expectMatch("no error posts for any aborted job", port.errorPosts().length, 0);
  } finally {
    restoreLogs();
  }
}

async function testBackgroundDisconnectWithoutJob(): Promise<void> {
  const { logs, restoreLogs } = setupLoggedPort(connectListener());
  try {
    // Disconnect with no request ever sent: no in-flight job, nothing to abort.
    const idle = new FakePort();
    connectListener()(idle);
    idle.emitDisconnect();
    await settleTicks();
    expectMatch("idle disconnect never aborts", countLogs(logs, "stream port disconnected mid-generation"), 0);

    // Disconnect arriving right after the job settled (error already posted):
    // the jobInFlight flag is cleared by finally, so no stale abort fires.
    const finished = new FakePort();
    connectListener()(finished);
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
    restoreLogs();
  }
}

async function testBackgroundReconnectFreshController(): Promise<void> {
  const { logs, restoreLogs } = setupLoggedPort(connectListener());
  try {
    // Connection 1: abort its in-flight job (same flow as the abort test).
    const first = new FakePort();
    connectListener()(first);
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
    connectListener()(second);
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
    restoreLogs();
  }
}

async function testBackgroundTwoPortsInterleaved(): Promise<void> {
  const connect = connectListener();
  // Two tabs = two ports: each port must receive only its own job's chunks
  // and its own done payload — a routing mixup would stream one tab's
  // generation into the other.
  const portA = new FakePort();
  const portB = new FakePort();
  connect(portA);
  connect(portB);
  const callsBefore = generateCalls.length;
  portA.emitMessage({ type: "generate", data: {} });
  portB.emitMessage({ type: "generate", data: {} });
  await settleTicks();
  expectMatch("both ports started a job", generateCalls.length, callsBefore + 2);
  const [callA, callB] = [parkedCall(callsBefore), parkedCall(callsBefore + 1)];

  callA.onChunk("A1 ");
  callB.onChunk("B1 ");
  callA.onChunk("A2 ");
  callB.onChunk("B2 ");
  callA.resolve({ title: "A title", description: "" });
  await settleTicks();
  callB.resolve({ title: "B title", description: "" });
  await settleTicks();

  expectMatch("port A received only A's chunks", chunksOn(portA), "A1 A2 ");
  expectMatch("port B received only B's chunks", chunksOn(portB), "B1 B2 ");
  expectMatch("port A got its own done payload", doneTitles(portA), "A title");
  expectMatch("port B got its own done payload", doneTitles(portB), "B title");

  // A post-settle ping on A must start no new job and never touch B's state.
  portA.emitMessage({ type: "__keepalive_ping__" });
  await settleTicks();
  expectMatch("post-settle ping starts no new job", generateCalls.length, callsBefore + 2);
  expectMatch("port B received nothing from A's messages", chunksOn(portB), "B1 B2 ");
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
await testBackgroundDisconnectAbortsAllInFlightJobs();
await testBackgroundDisconnectWithoutJob();
await testBackgroundReconnectFreshController();
await testBackgroundTwoPortsInterleaved();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All port stream background-side tests passed");
