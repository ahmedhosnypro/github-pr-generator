// Unit tests for buildStorageUpdate — the popup → SW config write path.
// Key invariant (run 28): cleared numeric fields ("") must NOT persist NaN.
import { buildStorageUpdate } from "../src/background/config-save";
import { expectMatch, getFailures } from "./expect-helpers";

console.log("=== Config Save Tests ===\n");

// Partial updates preserve unspecified fields.
const partial = buildStorageUpdate({ apiEndpoint: "https://probe.invalid/v1" });
expectMatch(
  "partial update only touches given keys",
  JSON.stringify(partial),
  JSON.stringify({ apiEndpoint: "https://probe.invalid/v1" }),
);
expectMatch("partial update preserves nothing else", "apiKey" in partial, false);

// Whitespace is trimmed on string fields.
const padded = buildStorageUpdate({ model: "  gpt-x  " });
expectMatch("string fields are trimmed", padded.model, "gpt-x");

// Booleans pass through unchanged.
const flag = buildStorageUpdate({ diffEnabled: false });
expectMatch("boolean passes through", flag.diffEnabled, false);

// Cleared numeric fields must NOT be stored as NaN.
const cleared = buildStorageUpdate({ diffMaxLines: "", diffMaxBytes: "" });
expectMatch("cleared diffMaxLines dropped, not NaN", "diffMaxLines" in cleared, false);
expectMatch("cleared diffMaxBytes dropped, not NaN", "diffMaxBytes" in cleared, false);
const withNaN = buildStorageUpdate({ diffMaxLines: Number.NaN });
expectMatch("explicit NaN dropped too", "diffMaxLines" in withNaN, false);
const good = buildStorageUpdate({ diffMaxLines: 5000 });
expectMatch("valid number kept", good.diffMaxLines, 5000);

// Empty payload is a no-op update.
expectMatch("empty payload is empty update", Object.keys(buildStorageUpdate({})).length, 0);
// Whitespace-only numerals are still NaN → dropped.
const ws = buildStorageUpdate({ diffMaxLines: "   " });
expectMatch("whitespace-only numeric dropped", "diffMaxLines" in ws, false);

// Out-of-range limits are clamped at write time with the shared clamp
// (src/background/config-save.ts), matching what the read side applies.
const tooLow = buildStorageUpdate({ diffMaxLines: 5, diffMaxBytes: -1 });
expectMatch("diffMaxLines below min clamps to 100", tooLow.diffMaxLines, 100);
expectMatch("negative diffMaxBytes clamps to 10000", tooLow.diffMaxBytes, 10000);
const tooHigh = buildStorageUpdate({ diffMaxLines: 999999, diffMaxBytes: 99999999 });
expectMatch("diffMaxLines above max clamps to 10000", tooHigh.diffMaxLines, 10_000);
expectMatch("diffMaxBytes above max clamps to 500000", tooHigh.diffMaxBytes, 500_000);
const fractional = buildStorageUpdate({ diffMaxLines: 1234.9, diffMaxBytes: "42000.7" });
expectMatch("fractional diffMaxLines truncates", fractional.diffMaxLines, 1234);
expectMatch("fractional string diffMaxBytes parses and truncates", fractional.diffMaxBytes, 42000);
const inRange = buildStorageUpdate({ diffMaxLines: 500, diffMaxBytes: 250000 });
expectMatch("in-range diffMaxLines kept", inRange.diffMaxLines, 500);
expectMatch("in-range diffMaxBytes kept", inRange.diffMaxBytes, 250000);

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All config-save tests passed");
