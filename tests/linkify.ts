// Unit tests for linkify — every anchor spelling the Anchors section / prompt
// examples can produce must resolve to a GitHub URL, and any marker that fails
// to parse must degrade instead of leaking dead text into the description.
// Bare-[[N]] stripping (run 42 detection, run 50 fix) covered by the first cases.
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

// Every hash spelling the prompt can produce must resolve to the same URL:
// `#diff-HASH` (documented), `diff-HASH` (old Anchors-section spelling), bare
// `HASH` (unprefixed). A verbatim copy of any Anchors list entry must never
// leak a dead `diffhunk://` marker into the PR body.
const expectedUrl = "https://github.com/react/react/pull/37481/files#diff-" + HASH + "R10-R20";
for (const [label, marker] of [
  ["#diff-HASH", "[[1]](diffhunk://#diff-" + HASH + "_L10-R20)"],
  ["diff-HASH", "[[2]](diffhunk://diff-" + HASH + "_L10-R20)"],
  ["bare HASH", "[[3]](diffhunk://" + HASH + "_L10-R20)"],
] as const) {
  const resolved = resolveDiffLinks("x " + marker + " y", target);
  expectMatch(label + " resolves to GitHub URL", resolved.includes(expectedUrl), true);
  expectMatch(label + " leaves no diffhunk text", resolved.includes("diffhunk://"), false);
}

// Unparseable diffhunk markers (e.g. anchors without line ranges) degrade to
// the plain reference number instead of leaking raw dead-text markup.
const broken = resolveDiffLinks("a [[4]](diffhunk://#diff-" + HASH + ") b [[5]](diffhunk://not-a-hash) c", target);
expectMatch("unparseable markers degrade", broken, "a 4 b 5 c");

// Pure bare-ref description produces no orphan brackets at all
const plain = resolveDiffLinks("x [[1]] y [[2]]", target);
expectMatch("all bare refs removed", /\[\[\d+\]\]/.test(plain), false);

// No-op when there's nothing to change
const noop = "plain text without markers";
expectMatch("no markers → identity", resolveDiffLinks(noop, target), noop);

// Compare kind: branch separators survive encoding — `feature/x` keeps its
// slash and `fork-owner:branch` keeps its colon — while segment contents with
// URL-special characters are percent-encoded.
const compareTarget = {
  owner: "o",
  repo: "r",
  kind: "compare" as const,
  baseBranch: "feature/cool stuff",
  headBranch: "someone:fix/thing",
};
const compareOut = resolveDiffLinks("x [[1]](diffhunk://#diff-" + HASH + "_L10-R20) y", compareTarget);
expectMatch(
  "compare refs encoded per-segment",
  compareOut.includes(
    "https://github.com/o/r/compare/feature/cool%20stuff...someone:fix/thing#diff-" + HASH + "R10-R20",
  ),
  true,
);
expectMatch("compare marker leaves no diffhunk text", compareOut.includes("diffhunk://"), false);

// Compare kind without both branches cannot produce a resolvable URL — every
// marker degrades to its plain reference number instead of a dead link.
const noBranches = resolveDiffLinks("x [[1]](diffhunk://#diff-" + HASH + "_L10-R20) y [[2]] z", {
  owner: "o",
  repo: "r",
  kind: "compare" as const,
});
expectMatch("missing branches degrade to plain refs", noBranches, "x 1 y  z");

// Degenerate hash after stripping (diffhunk://#_L5-R25) degrades rather than
// emitting an empty #diff- fragment.
expectMatch("empty hash degrades", resolveDiffLinks("a [[7]](diffhunk://#_L5-R25) b", target), "a 7 b");

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All linkify tests passed");
