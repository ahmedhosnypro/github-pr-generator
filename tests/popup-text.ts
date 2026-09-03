// Unit tests for the popup URL text helpers.
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

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All popup text tests passed");
