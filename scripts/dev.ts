import { spawn } from "node:child_process";
import { watch } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

const WATCHED_ROOT_FILES = new Set(["manifest.json", "styles.css", "config.local.json", "config.local.example.json"]);
const WATCHED_DIRS = ["src", "popup", "icons"];

async function collectDirs(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const subdirs = entries.filter((entry) => entry.isDirectory()).map((entry) => join(dir, entry.name));
  const nested = await Promise.all(subdirs.map(collectDirs));
  return [dir, ...nested.flat()];
}

let building = false;
let pendingReason: string | undefined;

async function rebuild(reason: string) {
  if (building) {
    pendingReason = reason;
    return;
  }
  building = true;
  console.log(`\n[dev] ${reason} changed — rebuilding`);
  const proc = spawn(process.execPath, ["run", join(root, "scripts/build.ts")], { stdio: "inherit" });
  await new Promise<void>((resolve) =>
    proc.on("close", () => {
      resolve();
    }),
  );
  building = false;
  const next = pendingReason;
  pendingReason = undefined;
  if (next) await rebuild(next);
}

let debounce: Timer | undefined;
const queue: string[] = [];
function onChange(file: string) {
  queue.push(file);
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    const files = [...new Set(queue)];
    queue.length = 0;
    void rebuild(files.join(", "));
  }, 100);
}

watch(root, (_event, filename) => {
  if (filename && WATCHED_ROOT_FILES.has(filename)) onChange(filename);
});

for (const dir of WATCHED_DIRS) {
  for (const watched of await collectDirs(join(root, dir))) {
    watch(watched, (_event, filename) => {
      if (filename) onChange(`${dir}/${filename}`);
    });
  }
}

console.log("[dev] watching src/, popup/, icons/, manifest.json, styles.css, config.local.json");
console.log("[dev] initial build");
await rebuild("startup");
