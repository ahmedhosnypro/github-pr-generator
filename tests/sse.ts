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

// Non-string content (arrays/objects/numbers — OpenAI vision-style parts or a
// malformed payload) must not propagate: forwarding it would corrupt the
// joined aggregate for both the delta and the snapshot paths.
{
  const p = createSSEParser();
  const arrDelta = JSON.stringify({ choices: [{ delta: { content: [{ text: "x" }] } }] });
  const numDelta = JSON.stringify({ choices: [{ delta: { content: 42 } }] });
  const out = p.push(`data: ${arrDelta}\n\ndata: ${numDelta}\n\ndata: ${deltaJson("real")}\n\n`);
  expectMatch("non-string deltas dropped, strings kept", out.join("|"), "real");
}
{
  const p = createSSEParser();
  const arrSnapshot = JSON.stringify({ choices: [{ message: { content: [{ text: "x" }] } }] });
  p.push(`data: ${arrSnapshot}\n\n`);
  expectMatch("non-string snapshot never stored", p.getSnapshot(), "");
  p.push(`data: ${messageJson("string snapshot")}\n\n`);
  expectMatch("string snapshot still captured", p.getSnapshot(), "string snapshot");
}

// Reasoning (thinking-model) streams: reasoning_content is captured separately
// and must never leak into the answer deltas.
{
  const p = createSSEParser();
  const reasoningDelta = JSON.stringify({ choices: [{ delta: { reasoning_content: "let me think" } }] });
  const out = p.push(`data: ${reasoningDelta}\n\ndata: ${deltaJson("answer")}\n\n`);
  expectMatch("reasoning deltas stay out of the answer stream", out.join("|"), "answer");
  expectMatch("reasoning captured separately", p.getReasoning(), "let me think");
}

// A chunk can carry both reasoning_content and content (omniroute/Gemini 3
// emits the first answer token in the same frame as the tail of the thinking).
{
  const p = createSSEParser();
  const both = JSON.stringify({ choices: [{ delta: { content: "answer", reasoning_content: "tail of thought" } }] });
  const out = p.push(`data: ${both}\n\n`);
  expectMatch("mixed frame still delivers content", out.join("|"), "answer");
  expectMatch("mixed frame still captures reasoning", p.getReasoning(), "tail of thought");
}

// Message-level reasoning snapshots (non-delta servers) are tracked too, and
// non-string reasoning payloads are dropped like non-string content.
{
  const p = createSSEParser();
  const arrReasoning = JSON.stringify({ choices: [{ delta: { reasoning_content: ["not", "a", "string"] } }] });
  const msgReasoning = JSON.stringify({ choices: [{ message: { reasoning_content: "whole thought" } }] });
  p.push(`data: ${arrReasoning}\n\ndata: ${msgReasoning}\n\n`);
  expectMatch("non-string reasoning dropped, message reasoning kept", p.getReasoning(), "whole thought");
}

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All SSE parser tests passed");
