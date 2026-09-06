// Unit tests for pruneImprovements (scripts/improve-loop.ts): the FIFO cap
// that keeps the improvements map in the improve-loop state file from growing
// unboundedly. Keys are `run_<n>` strings, so Object.keys yields insertion
// order and eviction must drop the oldest entries first. improve-loop.ts
// guards its main() behind import.meta.main, so importing it is side-effect
// free.
import { pruneImprovements } from "../scripts/improve-loop";
import { expectMatch, getFailures } from "./expect-helpers";

console.log("=== Improve Loop Tests ===\n");

// --- Below the cap: nothing is evicted.
{
  const improvements: Record<string, string> = { run_1: "a", run_2: "b" };
  pruneImprovements(improvements, 5);
  expectMatch("below cap keeps all entries", Object.keys(improvements).length, 2);
  expectMatch("below cap keeps run_1", improvements.run_1, "a");
  expectMatch("below cap keeps run_2", improvements.run_2, "b");
}

// --- Exactly at the cap: nothing is evicted.
{
  const improvements: Record<string, string> = {};
  for (let i = 1; i <= 5; i++) improvements[`run_${String(i)}`] = `note ${String(i)}`;
  pruneImprovements(improvements, 5);
  expectMatch("at cap keeps all entries", Object.keys(improvements).length, 5);
  expectMatch("at cap keeps run_1", improvements.run_1, "note 1");
}

// --- Over the cap: the oldest entries are evicted, newest survive, and the
// --- remaining insertion order is preserved.
{
  const improvements: Record<string, string> = {};
  for (let i = 1; i <= 8; i++) improvements[`run_${String(i)}`] = `note ${String(i)}`;
  pruneImprovements(improvements, 5);
  expectMatch("over cap trims down to cap", Object.keys(improvements).length, 5);
  expectMatch("oldest entry run_1 evicted", improvements.run_1, undefined);
  expectMatch("oldest entry run_3 evicted", improvements.run_3, undefined);
  expectMatch("newest entry run_8 kept", improvements.run_8, "note 8");
  expectMatch("remaining order preserved", Object.keys(improvements).join(","), "run_4,run_5,run_6,run_7,run_8");
}

// --- Default cap (no explicit max) evicts beyond 100 entries, matching the
// --- MAX_IMPROVEMENTS bound used by runCycle.
{
  const improvements: Record<string, string> = {};
  for (let i = 1; i <= 105; i++) improvements[`run_${String(i)}`] = `note ${String(i)}`;
  pruneImprovements(improvements);
  expectMatch("default cap trims to 100", Object.keys(improvements).length, 100);
  expectMatch("default cap evicts run_5", improvements.run_5, undefined);
  expectMatch("default cap keeps run_6", improvements.run_6, "note 6");
  expectMatch("default cap keeps run_105", improvements.run_105, "note 105");
}

// --- Keys loaded from a JSON state file (JSON.parse preserves property
// --- order for non-integer-like keys) prune the same way.
{
  const parsed = JSON.parse('{"run_1":"old","run_2":"mid","run_3":"new"}') as Record<string, string>;
  pruneImprovements(parsed, 2);
  expectMatch("parsed state trims to cap", Object.keys(parsed).length, 2);
  expectMatch("parsed state evicts oldest", parsed.run_1, undefined);
  expectMatch("parsed state keeps order", Object.keys(parsed).join(","), "run_2,run_3");
}

// --- Empty map and zero-ish caps stay safe.
{
  const improvements: Record<string, string> = {};
  pruneImprovements(improvements, 0);
  expectMatch("empty map with cap 0 stays empty", Object.keys(improvements).length, 0);

  const gone: Record<string, string> = { run_1: "a" };
  pruneImprovements(gone, 0);
  expectMatch("cap 0 evicts everything", Object.keys(gone).length, 0);
}

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All improve-loop tests passed");
