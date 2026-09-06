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

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All popup text tests passed");
