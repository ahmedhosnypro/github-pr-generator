import { parseHunkLineRanges } from "../src/background/github/diff-parse";
import { expectMatch, getFailures } from "./expect-helpers";

console.log("=== Diff Hunk Parsing Tests ===\n");

// Standard unified git diff format.
const gitDiff = [
  "diff --git a/src/a.ts b/src/a.ts",
  "index 111..222 100644",
  "--- a/src/a.ts",
  "+++ b/src/a.ts",
  "@@ -10,4 +12,6 @@ function x() {",
  " context",
  "+added",
].join("\n");
const gitResult = parseHunkLineRanges(gitDiff);
expectMatch("git diff: hunk attributed to b/ path", gitResult["src/a.ts"]?.length, 1);
expectMatch("git diff: right start", gitResult["src/a.ts"]?.[0]?.rightStart, 12);
expectMatch("git diff: right count", gitResult["src/a.ts"]?.[0]?.rightCount, 6);

// PR compare-interface format: "diff --path" header, next line is +++ b/path.
const compareDiff = [
  "diff --pkg/util.go",
  "+++ b/pkg/util.go",
  "@@ -5 +7,3 @@", // left without count defaults to 1; right has 3
  " context",
].join("\n");
const compareResult = parseHunkLineRanges(compareDiff);
expectMatch("compare format: file detected", compareResult["pkg/util.go"]?.length, 1);
expectMatch("compare format: right start", compareResult["pkg/util.go"]?.[0]?.rightStart, 7);
expectMatch("compare format: right count", compareResult["pkg/util.go"]?.[0]?.rightCount, 3);

// Hunk header without explicit counts defaults to 1 line.
const singleLine = ["diff --git a/x b/x", "+++ b/x", "@@ -9 +9 @@"].join("\n");
expectMatch("countless hunk defaults to 1", parseHunkLineRanges(singleLine).x?.[0]?.rightCount, 1);

// A compare header without a following +++ line contributes nothing.
const orphaned = "diff --stray\nnot-a-plus-line\n@@ -1 +2 @@";
expectMatch("compare header without +++ drops hunks", Object.keys(parseHunkLineRanges(orphaned)).length, 0);

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All diff-parse tests passed");
