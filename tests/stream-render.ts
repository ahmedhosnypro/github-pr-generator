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

// Only the first blank line splits title from description; later blank lines
// stay inside the description body.
const multiBreak = splitStreamedCombined("feat: x\n\npara one\n\npara two");
expectMatch("first blank line splits", multiBreak.title, "feat: x");
expectMatch("later blank lines stay in description", multiBreak.description, "para one\n\npara two");

// Fence with a language tag and a full title+body payload.
const fencedFull = splitStreamedCombined("```md\nfeat: fenced title\n\nfenced body");
expectMatch("fenced full title", fencedFull.title, "feat: fenced title");
expectMatch("fenced full description", fencedFull.description, "fenced body");

// A mid-stream partial where the title itself is still wrapped in quotes.
const partialQuoted = splitStreamedCombined('"feat: partial');
expectMatch("partial quoted title cleaned", partialQuoted.title, "feat: partial");

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All streaming-render tests passed");
