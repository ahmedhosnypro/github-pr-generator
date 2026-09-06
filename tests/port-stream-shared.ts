// Shared fakes for the port-based streaming channel tests
// (port-stream.ts and port-stream-background.ts).

import { STREAM_PORT_NAME } from "../src/messages";

// ---------------------------------------------------------------------------
// Shared fake port: records posts, exposes listener registries for manual
// emit, counts disconnect() calls.
// ---------------------------------------------------------------------------

export class FakePort {
  readonly name: string;
  readonly posted: unknown[] = [];
  disconnectCalls = 0;
  postThrows = false;
  private readonly messageListeners: Array<(message: unknown) => void> = [];
  private readonly disconnectListeners: Array<() => void> = [];

  constructor(name: string = STREAM_PORT_NAME) {
    this.name = name;
  }

  readonly onMessage = {
    addListener: (fn: (message: unknown) => void): void => {
      this.messageListeners.push(fn);
    },
  };

  readonly onDisconnect = {
    addListener: (fn: () => void): void => {
      this.disconnectListeners.push(fn);
    },
  };

  postMessage(message: unknown): void {
    if (this.postThrows) throw new Error("port channel closed");
    this.posted.push(message);
  }

  disconnect(): void {
    this.disconnectCalls++;
  }

  get messageListenerCount(): number {
    return this.messageListeners.length;
  }

  emitMessage(message: unknown): void {
    for (const listener of this.messageListeners) listener(message);
  }

  emitDisconnect(): void {
    for (const listener of this.disconnectListeners) listener();
  }

  errorPosts(): Array<{ kind: string; error: string }> {
    return this.posted.filter(
      (m): m is { kind: string; error: string } =>
        typeof m === "object" && m !== null && (m as { kind?: string }).kind === "error",
    );
  }
}

export async function captureRejection(promise: Promise<unknown>): Promise<Error | null> {
  try {
    await promise;
    return null;
  } catch (e) {
    return e instanceof Error ? e : new Error(String(e));
  }
}

export function settleTicks(times = 10): Promise<void> {
  let chain = Promise.resolve();
  for (let i = 0; i < times; i++) {
    chain = chain.then(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  }
  return chain;
}

export function countLogs(logs: string[], needle: string): number {
  return logs.filter((line) => line.includes(needle)).length;
}
