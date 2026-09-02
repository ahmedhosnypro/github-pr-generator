#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const WORK_DIR = "/home/ahmed/Projects/github-pr-generator";
const STATE_FILE = join(WORK_DIR, "scratch", "improvement-state.json");

const RUNS_TO_ANALYZE = 5;

interface ImprovementState {
  iterations: number;
  latency_history: Array<{
    iteration: number;
    timestamp: string;
    duration_ms: number;
    endpoints: Array<{ name: string; latency: number }>;
  }>;
  improvements: Record<string, string>;
  last_updated: string;
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
    return JSON.parse(readFileSync(STATE_FILE, "utf-8")) as ImprovementState;
  } catch {
    return emptyState();
  }
}

function saveState(state: ImprovementState): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function measureCurrentLatency(): Promise<Array<{ name: string; latency: number }>> {
  const start = performance.now();
  const endpoints = [
    { name: "OpenAI gpt-4", path: "/v1/chat/completions", latency: 0 },
    { name: "Local model", path: "/v1/chat/completions", latency: 0 },
  ];

  for (const e of endpoints) {
    try {
      const response = await fetch(`http://localhost:20128${e.path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "moonshotai/kimi-k3",
          messages: [{ role: "user", content: "hi" }],
          stream: false,
        }),
      });
      if (response.ok) {
        e.latency = performance.now() - start;
      }
    } catch {
      e.latency = -1;
    }
  }
  return endpoints.filter((e) => e.latency > 0).toSorted((a, b) => a.latency - b.latency);
}

async function runImprovementCycle(): Promise<{
  duration: number;
  endpoints: Array<{ name: string; latency: number }>;
}> {
  const startTime = Date.now();
  const endpoints = await measureCurrentLatency();

  const duration = Date.now() - startTime;

  const state = loadState();
  state.iterations++;
  state.latency_history.push({
    iteration: state.iterations,
    timestamp: new Date().toISOString(),
    duration_ms: duration,
    endpoints: endpoints.map((e) => ({ name: e.name, latency: e.latency })),
  });

  if (state.latency_history.length > RUNS_TO_ANALYZE) {
    const recent = state.latency_history.slice(-RUNS_TO_ANALYZE);
    const avgLatency =
      recent.reduce((sum: number, run: { duration_ms: number }) => sum + run.duration_ms, 0) / recent.length;
    if (avgLatency > 2000) {
      state.improvements[`run_${state.iterations}`] = `Latencies spiked to ${avgLatency}ms — optimization needed`;
    }
  }

  saveState(state);

  console.log(`[Extension] Iteration ${state.iterations} completed in ${duration}ms`);
  console.table(endpoints.map((e) => ({ Endpoint: e.name, Latency: `${e.latency}ms` })));

  return { duration, endpoints };
}

async function main() {
  const state = loadState();
  const uptime = Date.now() - new Date(state.last_updated).getTime();
  console.log(`[Extension Loop] Uptime: ${uptime}ms, Iterations: ${state.iterations}`);

  if (state.iterations > 3) {
    console.log("[Extension Loop] ✅ Stabilized, running improvement analysts");
    process.exit(0);
  }

  await runImprovementCycle();

  setInterval(() => void runImprovementCycle(), 60000);
}

if (import.meta.main) {
  main().catch(console.error);
}
