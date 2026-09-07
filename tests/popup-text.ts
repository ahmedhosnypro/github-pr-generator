// Unit tests for the popup URL text helpers.
import { isTimeoutError, parseUrlOrNull } from "../src/popup/messaging";
import { stripTrailingSlashes } from "../src/popup/text";
import { expectMatch, getFailures } from "./expect-helpers";

console.log("=== Popup Text Helpers Tests ===\n");

expectMatch("no-op on clean URL", stripTrailingSlashes("https://x.com/v1"), "https://x.com/v1");
expectMatch("single slash removed", stripTrailingSlashes("https://x.com/v1/"), "https://x.com/v1");
expectMatch("multiple slashes removed", stripTrailingSlashes("https://x.com/v1///"), "https://x.com/v1");
expectMatch("all-slashes string collapses", stripTrailingSlashes("///"), "");
expectMatch("root-only URL keeps the protocol", stripTrailingSlashes("https://x.com"), "https://x.com");
expectMatch("empty string is fine", stripTrailingSlashes(""), "");
// Idempotent: applying twice equals applying once.
const once = stripTrailingSlashes("https://host.invalid/x//");
expectMatch("idempotent after one call", stripTrailingSlashes(once), once);

// parseUrlOrNull: try/catch replacement for URL.parse (Chrome < 126 has no
// URL.parse/URL.canParse static in popup contexts targeted by this extension).
const parsed = parseUrlOrNull("https://api.example.com/v1?x=1");
expectMatch("valid URL parses", parsed !== null, true);
expectMatch("hostname extracted", parsed?.hostname, "api.example.com");
expectMatch("protocol extracted", parsed?.protocol, "https:");
expectMatch("garbage string rejected", parseUrlOrNull("not a url"), null);
expectMatch("empty string rejected", parseUrlOrNull(""), null);
expectMatch("scheme-less rejected", parseUrlOrNull("example.com/v1"), null);
expectMatch("relative path rejected", parseUrlOrNull("/v1/models"), null);
expectMatch("http URL kept as http", parseUrlOrNull("http://localhost:20128/v1")?.protocol, "http:");
// Query-only suffixes stay part of the opaque path, not a parse error.
expectMatch("query URL survives", parseUrlOrNull("https://x.com/v1/?q=%") !== null, true);

// isTimeoutError distinguishes AbortSignal.timeout() rejections.
expectMatch("TimeoutError detected", isTimeoutError(new DOMException("t", "TimeoutError")), true);
expectMatch("AbortError not a timeout", isTimeoutError(new DOMException("a", "AbortError")), false);
expectMatch("plain Error not a timeout", isTimeoutError(new Error("boom")), false);
expectMatch("non-Error not a timeout", isTimeoutError("boom"), false);

// readStorageWithTimeout (src/popup/load.ts): the storage read behind the
// initial load must always settle — a lastError or a callback that never
// fires (extension context invalidated) resolves to {} instead of leaving
// the popup in the loading state. Importing load.ts module-evaluates the
// element lookups and validate.ts's aria setup, so a minimal document stub
// goes in first; any attribute the stub lacks is a no-op call.
function elementStub(): Record<string, unknown> {
  return new Proxy(
    { value: "", textContent: "" },
    {
      get: (target: Record<string, unknown>, prop: string): unknown =>
        prop in target ? target[prop] : () => elementStub(),
    },
  );
}
(globalThis as unknown as { document: unknown }).document = { getElementById: () => elementStub() };
const { readStorageWithTimeout } = await import("../src/popup/load");

const stored = { model: "gpt-x", apiKey: "sk-test" };
const okRead = await readStorageWithTimeout(
  (cb) => {
    cb({ ...stored });
  },
  () => undefined,
  50,
);
expectMatch("storage read resolves payload", JSON.stringify(okRead), JSON.stringify(stored));

const lastErrorRead = await readStorageWithTimeout(
  (cb) => {
    cb({});
  },
  () => ({ message: "Extension context invalidated." }),
  50,
);
expectMatch("lastError resolves empty config", JSON.stringify(lastErrorRead), "{}");

const hungRead = await readStorageWithTimeout(
  () => undefined,
  () => undefined,
  20,
);
expectMatch("stalled read times out to empty config", JSON.stringify(hungRead), "{}");

const throwingRead = await readStorageWithTimeout(
  () => {
    throw new Error("boom");
  },
  () => undefined,
  50,
);
expectMatch("throwing read resolves empty config", JSON.stringify(throwingRead), "{}");

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All popup text tests passed");
// The dynamic load.ts import started validate.ts's open-check interval;
// exit explicitly (as the content tests do) instead of waiting it out.
process.exit(0);
