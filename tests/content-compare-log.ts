// Unit tests for src/content/log.ts: the version-prefixed log prefix and the
// storage write chain surviving a chrome.runtime.lastError. The src/content/*
// modules must evaluate only AFTER dom-stub has installed the globals (done
// via content-compare-shared), so they are imported dynamically.

import { COMPARE_URL } from "./content-compare-shared";
import { expectMatch, getFailures } from "./expect-helpers";

const { resetPage } = await import("./dom-stub");
const { log } = await import("../src/content/log");

async function testLogStorageChain(): Promise<void> {
  console.log("--- log.ts prefix + storage write chain ---");
  resetPage(COMPARE_URL);

  const runtime = chrome.runtime as unknown as {
    getManifest?: () => { version: string };
    lastError?: { message: string };
  };
  const storage = chrome.storage.local as unknown as {
    set: (items: Record<string, unknown>, cb?: () => void) => void;
  };
  const originalSet = storage.set;
  const originalWarn = console.warn;

  // 19f: prefix tracks the manifest version via getManifest.
  runtime.getManifest = () => ({ version: "1.7.1" });
  const logged: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]): void => {
    logged.push(args.map(String).join(" "));
  };
  log("info", "prefix probe");
  console.log = originalLog;
  expectMatch("log prefix uses manifest version", logged[0], "[PR Generator v1.7.1] prefix probe");
  delete runtime.getManifest;
  console.log = (...args: unknown[]): void => {
    logged.push(args.map(String).join(" "));
  };
  log("info", "prefix probe without manifest");
  console.log = originalLog;
  expectMatch("log prefix without manifest falls back", logged[1], "[PR Generator] prefix probe without manifest");

  // 19b: a lastError on the storage read must not wedge the write chain.
  // Entries are persisted as {at, line} objects and only warn/error lines
  // reach storage, so assert against the serialized payload.
  const writes: string[] = [];
  const warnings: string[] = [];
  storage.set = (items: Record<string, unknown>, cb?: () => void): void => {
    writes.push(JSON.stringify(items));
    originalSet(items, cb);
  };
  console.warn = (...args: unknown[]): void => {
    warnings.push(args.map(String).join(" "));
  };
  try {
    runtime.lastError = { message: "QUOTA_BYTES quota exceeded" };
    log("warn", "entry during outage");
    await new Promise((resolve) => setTimeout(resolve, 2100));
    expectMatch(
      "failed flush reported without re-entering log()",
      warnings.some((w) => w.includes("log storage write dropped")),
      true,
    );

    runtime.lastError = undefined;
    log("warn", "entry after recovery");
    await new Promise((resolve) => setTimeout(resolve, 2100));
    expectMatch(
      "chain still writes after a failed flush",
      writes.some((payload) => payload.includes("entry after recovery")),
      true,
    );
  } finally {
    runtime.lastError = undefined;
    storage.set = originalSet;
    console.warn = originalWarn;
  }
}

console.log("=== Content Script (log + storage chain) Tests ===\n");
await testLogStorageChain();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All content log tests passed");
process.exit(0);
