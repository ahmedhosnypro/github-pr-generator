/**
 * Incremental SSE parser for OpenAI-compatible chat-completion streams.
 * Buffers partial lines across pushes; extracts `choices[0].delta.content`
 * increments, and keeps the last full `message.content` as a fallback for
 * servers that answer with a single non-delta payload (e.g. NVIDIA NIM).
 */

interface SSEChunk {
  choices?: {
    delta?: { content?: string };
    message?: { content?: string };
  }[];
}

interface ParsedLine {
  delta?: string;
  snapshot?: string;
}

export interface SSEParser {
  /** Feed raw text from the stream; returns completed `delta.content` strings. */
  push(text: string): string[];
  /** Process any trailing partial line at end-of-stream. */
  flush(): string[];
  /** Last full `message.content` seen (empty when the server only sent deltas). */
  getSnapshot(): string;
}

function parseLine(line: string): ParsedLine | null {
  const trimmed = line.replace(/\r$/, "").trim();
  if (!trimmed.startsWith("data:")) return null;
  const payload = trimmed.replace(/^data:\s*/, "");
  if (payload === "[DONE]" || payload === "") return null;
  try {
    const choice = (JSON.parse(payload) as SSEChunk).choices?.[0];
    return { delta: choice?.delta?.content, snapshot: choice?.message?.content };
  } catch {
    return null; // non-JSON keepalive/comment line
  }
}

export function createSSEParser(): SSEParser {
  let buffer = "";
  let snapshot = "";

  function drainLines(lines: string[]): string[] {
    const deltas: string[] = [];
    for (const line of lines) {
      const parsed = parseLine(line);
      if (!parsed) continue;
      if (parsed.snapshot) snapshot = parsed.snapshot;
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
  };
}
