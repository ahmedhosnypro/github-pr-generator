/**
 * Incremental SSE parser for OpenAI-compatible chat-completion streams.
 * Buffers partial lines across pushes; extracts `choices[0].delta.content`
 * increments, and keeps the last full `message.content` as a fallback for
 * servers that answer with a single non-delta payload (e.g. NVIDIA NIM).
 * Thinking/reasoning models (Gemini 3, DeepSeek-R1, …) stream their reasoning
 * in `reasoning_content`, kept separately from the answer: it proves the model
 * is producing output (stream progress) and explains reasoning-only responses,
 * but it must never leak into the aggregated answer.
 */

interface SSEChunk {
  choices?: {
    // Typed as unknown at the boundary: a malformed server payload can carry
    // non-string content (arrays, numbers), which would corrupt the aggregate
    // — the parser forwards string deltas only.
    delta?: { content?: unknown; reasoning_content?: unknown };
    message?: { content?: unknown; reasoning_content?: unknown };
  }[];
}

interface ParsedLine {
  delta?: string;
  snapshot?: string;
  reasoningDelta?: string;
  reasoningSnapshot?: string;
}

export interface SSEParser {
  /** Feed raw text from the stream; returns completed `delta.content` strings. */
  push(text: string): string[];
  /** Process any trailing partial line at end-of-stream. */
  flush(): string[];
  /** Last full `message.content` seen (empty when the server only sent deltas). */
  getSnapshot(): string;
  /** Reasoning seen so far: appended deltas, else the last message-level snapshot. */
  getReasoning(): string;
}

function parseLine(line: string): ParsedLine | null {
  const trimmed = line.replace(/\r$/, "").trim();
  if (!trimmed.startsWith("data:")) return null;
  const payload = trimmed.replace(/^data:\s*/, "");
  if (payload === "[DONE]" || payload === "") return null;
  try {
    const choice = (JSON.parse(payload) as SSEChunk).choices?.[0];
    return {
      delta: stringOrUndefined(choice?.delta?.content),
      snapshot: stringOrUndefined(choice?.message?.content),
      reasoningDelta: stringOrUndefined(choice?.delta?.reasoning_content),
      reasoningSnapshot: stringOrUndefined(choice?.message?.reasoning_content),
    };
  } catch {
    return null; // non-JSON keepalive/comment line
  }
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function createSSEParser(): SSEParser {
  let buffer = "";
  let snapshot = "";
  let reasoning = "";
  let reasoningSnapshot = "";

  function drainLines(lines: string[]): string[] {
    const deltas: string[] = [];
    for (const line of lines) {
      const parsed = parseLine(line);
      if (!parsed) continue;
      if (parsed.snapshot) snapshot = parsed.snapshot;
      if (parsed.reasoningSnapshot) reasoningSnapshot = parsed.reasoningSnapshot;
      if (parsed.reasoningDelta) reasoning += parsed.reasoningDelta;
      if (parsed.delta) deltas.push(parsed.delta);
    }
    return deltas;
  }

  return {
    push(text: string): string[] {
      buffer += text;
      const parts = buffer.split("\n");
      // The last element is an incomplete line (or "") — keep it buffered.
      buffer = parts.pop() ?? "";
      return drainLines(parts);
    },
    flush(): string[] {
      const rest = buffer;
      buffer = "";
      return rest ? drainLines([rest]) : [];
    },
    getSnapshot(): string {
      return snapshot;
    },
    getReasoning(): string {
      return reasoning || reasoningSnapshot;
    },
  };
}
