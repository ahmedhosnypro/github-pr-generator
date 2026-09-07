import { parseHunkLineRanges, truncateDiff } from "../src/background/github/diff-parse";
import { resolveDiffLinks } from "../src/background/linkify";
import { expectExcludes, expectIncludes, expectMatch, getFailures } from "./expect-helpers";

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

console.log("\n=== Diff Truncation Tests ===\n");

function makeFileDiff(path: string, lineCount: number, marker: string): string {
  const body = [
    `diff --git a/${path} b/${path}`,
    "index 111..222 100644",
    `--- a/${path}`,
    `+++ b/${path}`,
    `@@ -1,${lineCount} +1,${lineCount} @@`,
  ];
  for (let i = 0; i < lineCount; i++) body.push(`+${marker}-${i}`);
  return body.join("\n");
}

// Under-budget diffs pass through untouched.
const tiny = makeFileDiff("src/tiny.ts", 3, "t");
expectMatch("under-budget diff returned unchanged", truncateDiff(tiny, 3000, 100000), tiny);

// A lockfile at the head of the diff no longer starves real files.
const starved = [makeFileDiff("package-lock.json", 2500, "lock"), makeFileDiff("src/app.ts", 20, "app")].join("\n");
const starvedOut = truncateDiff(starved, 1000, 100000);
expectExcludes("lockfile content dropped", starvedOut, "+lock-10");
expectIncludes("lockfile omission noted", starvedOut, "omitted package-lock.json");
expectIncludes("real source survives behind lockfile", starvedOut, "+app-19");
expectExcludes("real source not truncated", starvedOut, "more lines in src/app.ts");

// Minified bundles and snapshots get the same drop.
const bundle = [makeFileDiff("dist/app.min.js", 500, "min"), makeFileDiff("src/real.ts", 10, "real")].join("\n");
const bundleOut = truncateDiff(bundle, 100, 100000);
expectExcludes("minified bundle dropped", bundleOut, "+min-0");
expectIncludes("bundle omission noted", bundleOut, "omitted dist/app.min.js");
expectIncludes("companion source kept", bundleOut, "+real-9");
const snap = [makeFileDiff("tests/x.snap", 500, "snap"), makeFileDiff("src/real.ts", 10, "real")].join("\n");
expectExcludes("snapshot file dropped", truncateDiff(snap, 100, 100000), "+snap-0");

// Two large real files split the budget evenly instead of first-file-wins.
// Each file's 500-line share includes its 5 header lines, so the body of the
// first file holds through +aaa-494, and note lines count against the global
// budget (the second file's note lands past line 1000 and is dropped).
const twoBig = [makeFileDiff("src/aaa.ts", 800, "aaa"), makeFileDiff("src/bbb.ts", 800, "bbb")].join("\n");
const twoBigOut = truncateDiff(twoBig, 1000, 100000);
expectIncludes("first file keeps its share", twoBigOut, "+aaa-494");
expectExcludes("first file capped at its share", twoBigOut, "+aaa-500");
expectIncludes("second file keeps its share", twoBigOut, "+bbb-400");
expectIncludes("per-file truncation noted", twoBigOut, "more lines in src/aaa.ts");

// Budget unused by small files is redistributed to the big one.
const mixed = [makeFileDiff("src/small.ts", 10, "small"), makeFileDiff("src/big.ts", 2000, "big")].join("\n");
const mixedOut = truncateDiff(mixed, 1000, 100000);
expectIncludes("small file kept whole", mixedOut, "+small-9");
expectIncludes("redistributed budget reaches big file", mixedOut, "+big-900");
expectExcludes("redistribution still bounded", mixedOut, "+big-1200");

// Byte cap still applies after per-file budgeting.
const byteCapped = truncateDiff(twoBig, 100000, 8000);
expectExcludes("byte cap bounds second file", byteCapped, "+bbb-700");

// Cyrillic content is 1 UTF-16 code unit but 2 UTF-8 bytes per char, so a diff
// whose .length fits maxBytes can still exceed the byte budget. The fast path
// must budget encoded bytes, not .length, and truncate instead of passing the
// diff through untouched.
const cyrillic = makeFileDiff("src/ru.ts", 40, "строка");
const cyrillicOut = truncateDiff(cyrillic, 1000, cyrillic.length);
expectExcludes("multi-byte diff truncated past byte budget", cyrillicOut, "+строка-39");
const cyrillicOutBytes = new TextEncoder().encode(cyrillicOut).length;
expectMatch("truncated output stays within byte budget", cyrillicOutBytes <= cyrillic.length, true);

// Diffs without file headers fall back to plain head truncation.
const plain = Array.from({ length: 100 }, (_, i) => `line ${i}`).join("\n");
expectIncludes("headerless diff head-truncates", truncateDiff(plain, 10, 100000), "... (truncated, 90 more lines)");

// A noise-only diff collapses to its omission notes.
const noiseOnly = makeFileDiff("yarn.lock", 500, "lock");
const noiseOnlyOut = truncateDiff(noiseOnly, 100, 100000);
expectIncludes("noise-only diff noted", noiseOnlyOut, "omitted yarn.lock");
expectExcludes("noise-only body dropped", noiseOnlyOut, "+lock-0");

// Git C-quotes paths containing spaces or non-ASCII: diff --git "a/p" "b/p".
// The parser must strip the quotes and the b/ prefix alike.
const quotedPathDiff = [
  'diff --git "a/my path" "b/my path"',
  "index 111..222 100644",
  '--- "a/my path"',
  '+++ "b/my path"',
  "@@ -10,4 +12,6 @@",
  " context",
  "+added",
].join("\n");
const quotedResult = parseHunkLineRanges(quotedPathDiff);
expectMatch("quoted path: hunk attributed to unquoted key", quotedResult["my path"]?.length, 1);
expectMatch("quoted path: right start", quotedResult["my path"]?.[0]?.rightStart, 12);
expectMatch("quoted path: right count", quotedResult["my path"]?.[0]?.rightCount, 6);

// Regression: a quoted header must not leak its hunks into the previous file.
const mixedDiff = [
  "diff --git a/first.ts b/first.ts",
  "index 111..222 100644",
  "--- a/first.ts",
  "+++ b/first.ts",
  "@@ -1,2 +1,3 @@",
  " context",
  "+first change",
  'diff --git "a/second path.ts" "b/second path.ts"',
  "index 333..444 100644",
  '--- "a/second path.ts"',
  '+++ "b/second path.ts"',
  "@@ -20,2 +25,4 @@",
  " context",
  "+second change",
].join("\n");
const mixedResult = parseHunkLineRanges(mixedDiff);
expectMatch("mixed diff: unquoted file keeps exactly its hunk", mixedResult["first.ts"]?.length, 1);
expectMatch("mixed diff: quoted file gets its own hunk", mixedResult["second path.ts"]?.length, 1);
expectMatch("mixed diff: quoted hunk uses its own header", mixedResult["second path.ts"]?.[0]?.rightStart, 25);

// Non-ASCII bytes arrive C-quoted as octal escapes; they must be decoded to
// UTF-8. Doubled backslashes keep the literal \303\251 sequences in the string.
const octalDiff = [
  'diff --git "a/r\\303\\251sum\\303\\251.md" "b/r\\303\\251sum\\303\\251.md"',
  "index 111..222 100644",
  '--- "a/r\\303\\251sum\\303\\251.md"',
  '+++ "b/r\\303\\251sum\\303\\251.md"',
  "@@ -1,1 +1,2 @@",
  "+added",
].join("\n");
const octalResult = parseHunkLineRanges(octalDiff);
expectMatch("octal-escaped path: decoded to UTF-8 key", octalResult["résumé.md"]?.length, 1);

// Quoted +++ fallback: compare-interface form where the diff line carries no
// usable path and the quoted +++ line supplies the filename.
const quotedPlusDiff = [
  "diff --quoted name.txt",
  '+++ "b/quoted name.txt"',
  "@@ -3 +4,2 @@",
  " context",
  "+added",
].join("\n");
const quotedPlusResult = parseHunkLineRanges(quotedPlusDiff);
expectMatch("quoted +++ fallback: file detected", quotedPlusResult["quoted name.txt"]?.length, 1);
expectMatch("quoted +++ fallback: right start", quotedPlusResult["quoted name.txt"]?.[0]?.rightStart, 4);

// Named C escapes (\t, \n, ...) must decode to the control character, not the
// literal letter, so the hunk key matches the REST API's real path. Backslash
// doubled in the fixture so the diff text carries a literal \t escape.
const namedEscapeDiff = [
  'diff --git "a/dir/file\\tname.txt" "b/dir/file\\tname.txt"',
  "index 111..222 100644",
  '--- "a/dir/file\\tname.txt"',
  '+++ "b/dir/file\\tname.txt"',
  "@@ -1,1 +1,2 @@",
  "+added",
].join("\n");
const namedEscapeResult = parseHunkLineRanges(namedEscapeDiff);
expectMatch("named escape: tab decoded", namedEscapeResult["dir/file\tname.txt"]?.length, 1);
expectMatch("named escape: no literal 't' key", "dir/filetname.txt" in namedEscapeResult, false);

// Pure-deletion hunks report a zero right count with the start at the line
// preceding the deletion; the emitted range must anchor that line and never
// invert (start > end), which would linkify to a broken GitHub URL.
const deletionDiff = [
  "diff --git a/src/del.ts b/src/del.ts",
  "--- a/src/del.ts",
  "+++ b/src/del.ts",
  "@@ -9,3 +8,0 @@",
  "-gone one",
  "-gone two",
  "-gone three",
].join("\n");
const deletionHunk = parseHunkLineRanges(deletionDiff)["src/del.ts"]?.[0];
expectMatch("pure deletion: starts at preceding line", deletionHunk?.rightStart, 8);
expectMatch("pure deletion: count clamped to one line", deletionHunk?.rightCount, 1);
expectMatch(
  "pure deletion: range not inverted",
  (deletionHunk?.rightStart ?? 0) + (deletionHunk?.rightCount ?? 0) - 1 >= (deletionHunk?.rightStart ?? 1),
  true,
);

// The full chain: parse a pure-deletion hunk, format the marker the way
// summary-anchors does, and confirm linkify emits a valid GitHub URL.
const deletionEnd = (deletionHunk?.rightStart ?? 0) + (deletionHunk?.rightCount ?? 0) - 1;
const deletionAnchor = "a".repeat(64);
const deletionMarker = `[[1]](diffhunk://#diff-${deletionAnchor}_L${String(deletionHunk?.rightStart)}-R${String(deletionEnd)})`;
const deletionLink = resolveDiffLinks(deletionMarker, { owner: "o", repo: "r", kind: "pull", prNumber: "7" });
expectIncludes(
  "pure deletion: linkified URL is valid",
  deletionLink,
  `https://github.com/o/r/pull/7/files#diff-${deletionAnchor}R8-R8`,
);

// Pure-addition hunks have a zero left count; the right side is intact and
// must stay unchanged.
const additionDiff = [
  "diff --git a/src/add.ts b/src/add.ts",
  "--- a/src/add.ts",
  "+++ b/src/add.ts",
  "@@ -8,0 +9,3 @@",
  "+new one",
  "+new two",
  "+new three",
].join("\n");
const additionHunk = parseHunkLineRanges(additionDiff)["src/add.ts"]?.[0];
expectMatch("pure addition: right start", additionHunk?.rightStart, 9);
expectMatch("pure addition: right count", additionHunk?.rightCount, 3);

// Prototype-named files ("__proto__", "constructor", "toString") must behave
// like any other key: on a plain-object map, "constructor" reads back
// Object.prototype.constructor (a function) and the hunk push then crashes
// with a TypeError; "__proto__" assignments silently vanish.
for (const protoFile of ["__proto__", "constructor", "toString"]) {
  const protoDiff = [
    `diff --git a/${protoFile} b/${protoFile}`,
    `--- a/${protoFile}`,
    `+++ b/${protoFile}`,
    "@@ -1,1 +1,2 @@",
    "+added",
  ].join("\n");
  const protoResult = parseHunkLineRanges(protoDiff);
  expectMatch(`${protoFile}: hunk recorded without crash`, protoResult[protoFile]?.length, 1);
  expectMatch(`${protoFile}: right start`, protoResult[protoFile]?.[0]?.rightStart, 1);
}
expectMatch(
  "__proto__ file appears in Object.keys",
  Object.keys(parseHunkLineRanges("diff --git a/__proto__ b/__proto__\n+++ b/__proto__\n@@ -1 +1 @@")).includes(
    "__proto__",
  ),
  true,
);

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All diff-parse tests passed");
