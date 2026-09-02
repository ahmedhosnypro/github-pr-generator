// Unit tests for src/content/stream.ts's pure helpers — the streaming-render
// approximation the content script shows while generation is in flight.
import { cleanStreamedTitle, splitStreamedCombined } from "../src/content/stream";
import { expectMatch, getFailures } from "./expect-helpers";

console.log("=== Streaming-Render Tests ===\n");

// cleanStreamedTitle: strips fences/opening wrappers progressively
expectMatch("plain title unchanged", cleanStreamedTitle("fix: the bug"), "fix: the bug");
expectMatch("leading markdown stripped", cleanStreamedTitle("## fix: x"), "fix: x");
expectMatch("Title: prefix stripped", cleanStreamedTitle("Title: fix x"), "fix x");
expectMatch("Title prefix case-insensitive", cleanStreamedTitle("TITLE: fix"), "fix");
expectMatch("leading quote chars stripped", cleanStreamedTitle('"fix: x'), "fix: x");
expectMatch("leading backtick stripped", cleanStreamedTitle("`fix: x"), "fix: x");

// splitStreamedCombined: title + blank line + description
const both = splitStreamedCombined("fix: x\n\ndescription body");
expectMatch("title + desc split", both.title, "fix: x");
expectMatch("description extracted", both.description, "description body");

// Single newline only — title and description approximate from the first line
const single = splitStreamedCombined("fix: x\npartial desc");
expectMatch("single newline still splits", single.title, "fix: x");
expectMatch("desc from rest after first newline", single.description, "partial desc");

// No newline — just a title
const titleOnly = splitStreamedCombined("fix: x");
expectMatch("title-only splits to zero desc", titleOnly.description, "");
expectMatch("title-only kept as title", titleOnly.title, "fix: x");

// Leading fence marker on the combined stream is dropped.
const fenced = splitStreamedCombined("```markdown\nfix: fenced\n\the body");
expectMatch("leading fence dropped", fenced.title, "fix: fenced");

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All streaming-render tests passed");
