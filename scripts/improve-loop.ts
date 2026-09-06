#!/usr/bin/env bun

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT_DIR = join(import.meta.dir, "..");
const STATE_FILE = join(ROOT_DIR, "scratch", "improve-loop-state.json");
const CONFIG_FILE = join(ROOT_DIR, "config.local.json");

const RUNS_TO_ANALYZE = 5;
const MAX_HISTORY = 50;
const MAX_IMPROVEMENTS = 100;
const SPIKE_THRESHOLD_MS = 2000;

interface EndpointResult {
  name: string;
  url: string;
  latencyMs: number; // -1 when the request failed
}

interface LatencySample {
  iteration: number;
  timestamp: string;
  duration_ms: number;
  endpoints: EndpointResult[];
}

interface ImprovementState {
  iterations: number;
  latency_history: LatencySample[];
  improvements: Record<string, string>;
  last_updated: string;
}

interface LocalConfig {
  apiEndpoint?: string;
  apiKey?: string;
  model?: string;
  githubToken?: string;
}

function emptyState(): ImprovementState {
  return {
    iterations: 0,
    latency_history: [],
    improvements: {},
    last_updated: new Date().toISOString(),
  };
}

function loadState(): ImprovementState {
  try {
    const parsed = JSON.parse(readFileSync(STATE_FILE, "utf-8")) as Partial<ImprovementState> & {
      iteration_count?: number;
    };
    return {
      iterations: parsed.iterations ?? parsed.iteration_count ?? 0,
      latency_history: Array.isArray(parsed.latency_history) ? parsed.latency_history : [],
      improvements: parsed.improvements ?? {},
      last_updated: parsed.last_updated ?? new Date().toISOString(),
    };
  } catch {
    return emptyState();
  }
}

function saveState(state: ImprovementState): void {
  mkdirSync(join(ROOT_DIR, "scratch"), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadConfig(): LocalConfig {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8")) as LocalConfig;
  } catch {
    return {};
  }
}

// FIFO-evicts the oldest entries (insertion order) so the improvements map in
// the state file stays bounded across long-running loops.
export function pruneImprovements(improvements: Record<string, string>, max = MAX_IMPROVEMENTS): void {
  const keys = Object.keys(improvements);
  const excess = keys.length - max;
  if (excess <= 0) return;
  for (const key of keys.slice(0, excess)) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete improvements[key];
  }
}

async function measureGitHub(token: string | undefined): Promise<EndpointResult> {
  const url = "https://api.github.com/rate_limit";
  const name = "GitHub API";
  const start = performance.now();
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "github-pr-generator-improve-loop",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
    return { name, url, latencyMs: response.ok ? Math.round(performance.now() - start) : -1 };
  } catch {
    return { name, url, latencyMs: -1 };
  }
}

async function measureLlm(config: LocalConfig): Promise<EndpointResult> {
  const name = `LLM (${config.model || "unconfigured"})`;
  if (!config.apiEndpoint || !config.model) {
    return { name, url: config.apiEndpoint || "(not configured)", latencyMs: -1 };
  }
  const url = `${config.apiEndpoint.replace(/\/+$/, "")}/chat/completions`;
  const start = performance.now();
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
        stream: false,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    return { name, url, latencyMs: response.ok ? Math.round(performance.now() - start) : -1 };
  } catch {
    return { name, url, latencyMs: -1 };
  }
}

async function runCycle(): Promise<EndpointResult[]> {
  const config = loadConfig();
  const startedAt = Date.now();
  const endpoints = await Promise.all([measureGitHub(config.githubToken), measureLlm(config)]);
  const duration = Date.now() - startedAt;

  const state = loadState();
  state.iterations += 1;
  state.latency_history.push({
    iteration: state.iterations,
    timestamp: new Date().toISOString(),
    duration_ms: duration,
    endpoints,
  });
  if (state.latency_history.length > MAX_HISTORY) {
    state.latency_history = state.latency_history.slice(-MAX_HISTORY);
  }

  if (state.latency_history.length >= RUNS_TO_ANALYZE) {
    const recent = state.latency_history.slice(-RUNS_TO_ANALYZE);
    const avgLatency = recent.reduce((sum, run) => sum + run.duration_ms, 0) / recent.length;
    if (avgLatency > SPIKE_THRESHOLD_MS) {
      state.improvements[`run_${state.iterations}`] =
        `Latencies spiked to ${Math.round(avgLatency)}ms — optimization needed`;
    }
  }
  pruneImprovements(state.improvements);

  state.last_updated = new Date().toISOString();
  saveState(state);

  console.log(`[Improve Loop] Iteration ${state.iterations} completed in ${duration}ms`);
  console.table(endpoints.map((e) => ({ Endpoint: e.name, URL: e.url, Latency: `${e.latencyMs}ms` })));

  return endpoints;
}

async function main(): Promise<void> {
  const endpoints = await runCycle();
  const failed = endpoints.filter((e) => e.latencyMs < 0);
  if (failed.length === endpoints.length) {
    console.error(`[Improve Loop] All ${endpoints.length} endpoints unreachable`);
    process.exitCode = 1;
    return;
  }
  if (failed.length > 0) {
    console.warn(`[Improve Loop] Unreachable: ${failed.map((e) => e.name).join(", ")}`);
  }
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
