// Unit tests for the incremental SSE parser (src/background/sse.ts):
// partial lines across pushes, start-of-line buffering, delta vs snapshot
// paths, [DONE] termination, and non-JSON keepalive lines.
import { createSSEParser } from "../src/background/sse";
import { expectMatch, getFailures } from "./expect-helpers";

function deltaJson(content: string): string {
  return JSON.stringify({ choices: [{ delta: { content } }] });
}

function messageJson(content: string): string {
  return JSON.stringify({ choices: [{ message: { content } }] });
}

console.log("=== SSE Parser Tests ===\n");

// Basic delta streaming.
{
  const p = createSSEParser();
  const out = p.push(`data: ${deltaJson("foo")}\n\ndata: ${deltaJson("bar")}\n\n`);
  expectMatch("two deltas stream", out.join("|"), "foo|bar");
  expectMatch("no snapshot from delta-only stream", p.getSnapshot(), "");
}

// Split mid-line — the parser must buffer and reassemble.
{
  const p = createSSEParser();
  const part1 = `data: ${deltaJson("split-part")}`.slice(0, 10);
  p.push(part1);
  const out = p.push(`data: ${deltaJson("split-part")}`.slice(10) + "\n\n");
  expectMatch("split line reassembled", out.join("|"), "split-part");
}

// flush() drains the trailing partial line.
{
  const p = createSSEParser();
  p.push(`data: ${deltaJson("tail")}`); // no trailing newline
  const flushed = p.flush();
  expectMatch("flush drains partial line", flushed.join("|"), "tail");
}

// Snapshot fallback: full message content with no delta.
{
  const p = createSSEParser();
  p.push(`data: ${messageJson("whole answer")}\n\n`);
  expectMatch("snapshot captured when no deltas", p.getSnapshot(), "whole answer");
}

// "[DONE]" and comments are ignored.
{
  const p = createSSEParser();
  const out = p.push(`data: ${deltaJson("x")}\n\ndata: [DONE]\n\n`);
  expectMatch("[DONE] terminates cleanly", out.join("|"), "x");
  const commentOut = p.push(": keep-alive comment\n\n");
  expectMatch("keepalive comments yield nothing", commentOut.length, 0);
}

// Non-JSON data lines never throw.
{
  const p = createSSEParser();
  const out = p.push("data: {not json}\n\ndata: plain\n\n");
  expectMatch("malformed JSON lines skipped silently", out.length, 0);
}

// CRLF line endings handled.
{
  const p = createSSEParser();
  const out = p.push(`data: ${deltaJson("crlf")}\r\n\r\n`);
  expectMatch("CRLF delimiters parse", out.join("|"), "crlf");
}

// Empty payload between markers.
{
  const p = createSSEParser();
  const out = p.push("data:\n\ndata: \n\n");
  expectMatch("empty payloads skipped", out.length, 0);
}

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All SSE parser tests passed");
