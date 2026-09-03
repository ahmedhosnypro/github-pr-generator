// Unit tests for linkify — bare [[N]] refs must not leak into the final
// description after (diffhunk://…) resolution. Covered by run 42 detection;
// stripped here (run 50).
import { resolveDiffLinks } from "../src/background/linkify";
import { expectMatch, getFailures } from "./expect-helpers";

const target = { owner: "react", repo: "react", kind: "pull" as const, prNumber: "37481" };
const HASH = "a".repeat(64);

console.log("=== Linkify Tests ===\n");

const text =
  "- **Auth** — refresh [[1]](diffhunk://#diff-" +
  HASH +
  "_L10-R20)\n- **Bare** — no link [[2]]\n- **AlsoBare** — [[3]] tail";
const out = resolveDiffLinks(text, target);
expectMatch(
  "linked anchor survives as GitHub URL",
  out.includes("https://github.com/react/react/pull/37481/files#diff-" + HASH + "R10-R20"),
  true,
);
expectMatch("bare [[2]] is stripped", out.includes("[[2]]"), false);
expectMatch("bare [[3]] is stripped", out.includes("[[3]]"), false);
expectMatch("rest of line kept", out.includes("**AlsoBare**"), true);

// Pure bare-ref description produces no orphan brackets at all
const plain = resolveDiffLinks("x [[1]] y [[2]]", target);
expectMatch("all bare refs removed", /\[\[\d+\]\]/.test(plain), false);

// No-op when there's nothing to change
const noop = "plain text without markers";
expectMatch("no markers → identity", resolveDiffLinks(noop, target), noop);

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All linkify tests passed");
