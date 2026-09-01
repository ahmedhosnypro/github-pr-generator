import { createSSEParser } from "../src/background/sse";
import { cleanStreamedTitle, splitStreamedCombined } from "../src/content/stream";
import { expectMatch, getFailures } from "./expect-helpers";

function sseLine(content: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n`;
}

function testDeltasAcrossChunks(): void {
  const parser = createSSEParser();
  // Split mid-line and mid-JSON: deltas must survive chunk boundaries.
  const first = 'data: {"choices":[{"delta":{"content":"Hel';
  const second = 'lo"}}]}\n' + sseLine(" world") + "data: [DONE]\n";
  const deltas = [...parser.push(first), ...parser.push(second), ...parser.flush()];
  expectMatch("deltas across chunk boundaries", deltas.join(""), "Hello world");
}

function testMessageSnapshotFallback(): void {
  const parser = createSSEParser();
  // Server emits one full message.content instead of deltas (NVIDIA NIM style).
  const line = `data: ${JSON.stringify({ choices: [{ message: { content: "Full answer" } }] })}\n`;
  const deltas = parser.push(line);
  expectMatch("no deltas from message.content", deltas.join(""), "");
  expectMatch("snapshot captured", parser.getSnapshot(), "Full answer");
}

function testNonDataLinesIgnored(): void {
  const parser = createSSEParser();
  const deltas = parser.push(": comment\n\n" + sseLine("x") + "data: not-json\n");
  expectMatch("comment/blank/invalid lines skipped", deltas.join(""), "x");
}

function testCarriageReturnsAndNoTrailingNewline(): void {
  const parser = createSSEParser();
  parser.push(sseLine("a").replace("\n", "\r\n"));
  parser.push(sseLine("b").replace("\n", "")); // no trailing newline until flush
  const deltas = parser.flush();
  expectMatch("CRLF tolerated + flush drains tail", "a".concat(...deltas), "ab");
}

function testSplitProgressivePrefixes(): void {
  expectMatch("title only, early", splitStreamedCombined("fix: add str").description, "");
  expectMatch("title cleaned early", splitStreamedCombined("fix: add str").title, "fix: add str");
  expectMatch("title prefix stripped", splitStreamedCombined("Title: fix bug\ndes").title, "fix bug");
  expectMatch("single-newline split", splitStreamedCombined("fix bug\ndesc body").description, "desc body");
  const split = splitStreamedCombined("**fix bug**\n\n## Summary\nbody");
  expectMatch("blank-line split title", split.title, "**fix bug**");
  expectMatch("blank-line split description", split.description, "## Summary\nbody");
}

function testSplitFenceStripping(): void {
  const out = splitStreamedCombined("```\nfix thing\n\nbody text");
  expectMatch("leading fence stripped", out.title, "fix thing");
  expectMatch("body after fence", out.description, "body text");
}

function testCleanStreamedTitle(): void {
  expectMatch("leading quote stripped", cleanStreamedTitle('"fix it'), "fix it");
  expectMatch("heading marker stripped", cleanStreamedTitle("# fix it"), "fix it");
  expectMatch("trailing quote kept mid-stream", cleanStreamedTitle('feat: "auth'), 'feat: "auth');
}

console.log("=== Streaming Parser / Progressive Split Tests ===\n");
testDeltasAcrossChunks();
testMessageSnapshotFallback();
testNonDataLinesIgnored();
testCarriageReturnsAndNoTrailingNewline();
testSplitProgressivePrefixes();
testSplitFenceStripping();
testCleanStreamedTitle();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All stream tests passed");
