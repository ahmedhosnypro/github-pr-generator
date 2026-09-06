// Mock harness shared by tests/handlers.ts and tests/routing.ts. Must be
// installed BEFORE any ../src/background/* module is imported: config.ts
// fetches chrome.runtime.getURL("config.local.json") at module-evaluation
// time, so chrome.* and fetch must be stubs by then. The chrome stub covers
// storage.local (callback style), storage.session (promise style, repo-style
// cache always misses), runtime.getURL/lastError, and the onMessage/onConnect
// listener registries. Every outbound HTTP call (GitHub REST + the LLM
// chat/completions endpoint) is recorded and routed to the per-scenario
// FetchHandler; unmatched URLs answer 404.
import type { StoredConfig } from "../src/types";

export interface FetchCall {
  url: string;
  method: string;
  body: string;
}

/** Returns a Response for the URLs it owns, undefined to fall through. */
export type FetchHandler = (url: string, init: RequestInit) => Response | undefined;

export type MessageListener = (message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => boolean;

export interface HarnessState {
  stored: StoredConfig;
  storageSets: StoredConfig[];
  fetchCalls: FetchCall[];
  fetchHandler: FetchHandler | null;
  messageListeners: MessageListener[];
  connectListeners: Array<(port: unknown) => void>;
}

export const VALID_STORED: StoredConfig = {
  apiEndpoint: "https://llm.invalid/v1",
  apiKey: "test-api-key",
  model: "test-model",
  githubToken: "test-gh-token",
  diffEnabled: true,
  diffMaxLines: 3000,
  diffMaxBytes: 100000,
  thinkingEffort: "default",
};

function urlString(url: string | URL | Request): string {
  if (typeof url === "string") return url;
  return url instanceof URL ? url.href : url.url;
}

export function installBackgroundHarness(): HarnessState {
  const state: HarnessState = {
    stored: { ...VALID_STORED },
    storageSets: [],
    fetchCalls: [],
    fetchHandler: null,
    messageListeners: [],
    connectListeners: [],
  };

  globalThis.chrome = {
    runtime: {
      getURL: (path: string) => `mock-extension:///${path}`,
      get lastError() {
        return undefined;
      },
      onMessage: {
        addListener: (listener: MessageListener) => {
          state.messageListeners.push(listener);
        },
      },
      onConnect: {
        addListener: (listener: (port: unknown) => void) => {
          state.connectListeners.push(listener);
        },
      },
    },
    storage: {
      local: {
        get: (_keys: unknown, callback: (items: StoredConfig) => void) => {
          callback({ ...state.stored });
        },
        set: (items: StoredConfig, callback?: () => void) => {
          state.storageSets.push({ ...items });
          Object.assign(state.stored, items);
          callback?.();
        },
      },
      session: {
        get: (_key: string) => Promise.resolve({}),
        set: (_items: Record<string, unknown>) => Promise.resolve(),
      },
    },
  } as unknown as typeof chrome;

  globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
    const u = urlString(url);
    const method = (init?.method ?? "GET").toUpperCase();
    const body = typeof init?.body === "string" ? init.body : "";
    state.fetchCalls.push({ url: u, method, body });
    const handler = state.fetchHandler;
    if (handler) {
      const routed = handler(u, init ?? {});
      if (routed) return Promise.resolve(routed);
    }
    return Promise.resolve(new Response("not found", { status: 404 }));
  }) as typeof fetch;

  return state;
}

/** Point-in-time reset between scenarios so tests never leak state. */
export function resetHarness(state: HarnessState, stored: StoredConfig, handler: FetchHandler | null): void {
  state.stored = { ...VALID_STORED, ...stored };
  state.storageSets = [];
  state.fetchCalls = [];
  state.fetchHandler = handler;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function chainHandlers(...handlers: FetchHandler[]): FetchHandler {
  return (url, init) => {
    for (const handler of handlers) {
      const routed = handler(url, init);
      if (routed) return routed;
    }
    return undefined;
  };
}

/**
 * Canned OpenAI-compatible chat/completions endpoint: serves `answers` in
 * order (last one repeats, so the refinement loop keeps working) and records
 * each request's user prompt for assertions.
 */
export function llmResponder(answers: string[], prompts: string[] = []): FetchHandler {
  let served = 0;
  return (url, init) => {
    if (!url.endsWith("/chat/completions")) return undefined;
    try {
      const payload = JSON.parse(typeof init.body === "string" ? init.body : "{}") as {
        messages?: Array<{ role?: string; content?: string }>;
      };
      const user = payload.messages?.find((m) => m.role === "user");
      prompts.push(user?.content ?? "");
    } catch {
      prompts.push("");
    }
    const content = answers[Math.min(served, answers.length - 1)] ?? "";
    served++;
    return jsonResponse({ choices: [{ message: { content } }] });
  };
}

export const SAMPLE_DIFF =
  "diff --git a/src/widget.ts b/src/widget.ts\n" +
  "--- a/src/widget.ts\n" +
  "+++ b/src/widget.ts\n" +
  "@@ -0,0 +1,2 @@\n" +
  "+export const widget = 1;\n" +
  "+export default widget;\n";

export interface PrMockSpec {
  prNumber?: string;
  prDetailsStatus?: number;
  prDetails?: Record<string, unknown>;
  commitsStatus?: number;
  commits?: unknown[];
  filesStatus?: number;
  files?: unknown[];
  compareStatus?: number;
  compareText?: string;
  patchStatus?: number;
  patchBody?: Record<string, unknown>;
}

export const DEFAULT_PR_DETAILS: Record<string, unknown> = {
  title: "Original PR Title",
  body: "",
  base: { ref: "main" },
  head: { ref: "feature", label: "octo:feature" },
  additions: 12,
  deletions: 3,
  changed_files: 1,
};

export const DEFAULT_COMMITS: unknown[] = [{ commit: { message: "Fix widget crash, fixes #42" } }];

export const DEFAULT_FILES: unknown[] = [
  { filename: "src/widget.ts", status: "modified", additions: 10, deletions: 2 },
];

/**
 * Canned GitHub REST surface for one opened PR: details, commits/files lists,
 * the compare diff, the PATCH update endpoint, plus the discovery probes
 * (contents dirs → 404 via fallthrough, merged-PR list → empty).
 */
export function githubPrHandler(spec: PrMockSpec = {}): FetchHandler {
  const prNumber = spec.prNumber ?? "123";
  const pullsPath = "/pulls/" + prNumber;
  return (url, init) => {
    const method = (init.method ?? "GET").toUpperCase();
    if (url.includes("/pulls?state=closed")) return jsonResponse([]);
    if (url.includes(pullsPath + "/commits?")) {
      const status = spec.commitsStatus ?? 200;
      return status === 200
        ? jsonResponse(spec.commits ?? DEFAULT_COMMITS)
        : jsonResponse({ message: "commits boom" }, status);
    }
    if (url.includes(pullsPath + "/files?")) {
      const status = spec.filesStatus ?? 200;
      return status === 200
        ? jsonResponse(spec.files ?? DEFAULT_FILES)
        : jsonResponse({ message: "files boom" }, status);
    }
    if (method === "PATCH" && url.endsWith(pullsPath)) {
      const status = spec.patchStatus ?? 200;
      return status === 200
        ? jsonResponse(spec.patchBody ?? { title: "updated", body: "updated" })
        : jsonResponse(spec.patchBody ?? { message: "Validation Failed" }, status);
    }
    if (url.endsWith(pullsPath)) {
      const status = spec.prDetailsStatus ?? 200;
      return status === 200
        ? jsonResponse(spec.prDetails ?? DEFAULT_PR_DETAILS)
        : jsonResponse({ message: "Not Found" }, status);
    }
    if (url.includes("/compare/")) {
      const status = spec.compareStatus ?? 200;
      return status === 200
        ? new Response(spec.compareText ?? SAMPLE_DIFF, { status: 200 })
        : new Response("compare boom", { status });
    }
    return undefined;
  };
}

/** Count requests the mock routed to the LLM chat/completions endpoint. */
export function llmCallCount(state: HarnessState): number {
  return state.fetchCalls.filter((c) => c.url.endsWith("/chat/completions")).length;
}

/** The PATCH(es) against the PR update endpoint, with parsed JSON bodies. */
export function patchCalls(state: HarnessState): Array<{ url: string; body: Record<string, unknown> }> {
  return state.fetchCalls
    .filter((c) => c.method === "PATCH")
    .map((c) => ({ url: c.url, body: JSON.parse(c.body) as Record<string, unknown> }));
}

/** Await fn and return the rejection message, or null when it resolved. */
export async function captureRejection(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}
