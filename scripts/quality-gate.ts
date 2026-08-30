/**
 * QUALITY GATE — ported from ~/Projects/siraj/scripts/quality-gate.ts, trimmed for this project.
 *
 * Runs all static checks stage by stage and persists progress to
 * `.quality-gate-state.json`, so a rerun resumes at the first failing stage.
 * Use `--fresh` to clear the state and start from the top.
 */

import { spawn } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const STATE_FILE = join(import.meta.dir, "..", ".quality-gate-state.json");
const STAGES = ["BASIC_CHECKS", "UNUSED", "DUPLICATES"] as const;
type Stage = (typeof STAGES)[number];

interface QualityState {
  stage: Stage;
  lastRun: string;
}

const COMMANDS: Record<Stage, Array<{ command: string; args: string[] }>> = {
  BASIC_CHECKS: [
    { command: "bun", args: ["run", "typecheck"] },
    { command: "bun", args: ["run", "oxlint"] },
    { command: "bun", args: ["run", "biome:check"] },
    { command: "bun", args: ["run", "eslint"] },
  ],
  UNUSED: [{ command: "bun", args: ["run", "check:unused"] }],
  DUPLICATES: [{ command: "bun", args: ["run", "check:duplicates"] }],
};

function runCommand(command: string, args: string[]): Promise<boolean> {
  console.log(`\n> Running: ${command} ${args.join(" ")}`);
  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: false, stdio: ["inherit", "inherit", "inherit"] });
    child.on("close", (code) => {
      resolve(code === 0);
    });
    child.on("error", (err) => {
      console.error(err.message);
      resolve(false);
    });
  });
}

function getState(): QualityState {
  if (existsSync(STATE_FILE)) {
    try {
      const parsed: unknown = JSON.parse(readFileSync(STATE_FILE, "utf8"));
      if (typeof parsed === "object" && parsed !== null && "stage" in parsed) {
        const stage = (parsed as { stage: Stage }).stage;
        if ((STAGES as readonly string[]).includes(stage)) return { stage, lastRun: new Date().toISOString() };
      }
    } catch {
      // fall through to a fresh state
    }
  }
  return { stage: "BASIC_CHECKS", lastRun: new Date().toISOString() };
}

function saveState(stage: Stage): void {
  writeFileSync(STATE_FILE, JSON.stringify({ stage, lastRun: new Date().toISOString() }, null, 2));
}

async function runStage(stage: Stage): Promise<boolean> {
  saveState(stage);
  for (const { command, args } of COMMANDS[stage]) {
    // oxlint-disable-next-line no-await-in-loop -- stages' commands must run sequentially and stop at the first failure
    if (!(await runCommand(command, args))) {
      console.error(`\n❌ Stage ${stage} failed. Fix the issues and rerun.`);
      return false;
    }
  }
  return true;
}

async function main(): Promise<void> {
  if (process.argv.includes("--fresh") && existsSync(STATE_FILE)) {
    console.log("🧹 Fresh start requested. Clearing state...");
    unlinkSync(STATE_FILE);
  }

  const state = getState();
  console.log(`🚀 Quality Gate: resuming at stage ${state.stage}`);

  for (let index = STAGES.indexOf(state.stage); index < STAGES.length; index++) {
    const stage = STAGES[index];
    if (stage === undefined) throw new Error("Invalid stage index");
    // oxlint-disable-next-line no-await-in-loop -- stages must run in order and stop at the first failure
    if (!(await runStage(stage))) process.exit(1);
  }

  if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);
  console.log("\n✨✨ ALL QUALITY GATES PASSED! ✨✨");
}

await main();
