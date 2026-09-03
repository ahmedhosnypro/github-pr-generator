// Deterministic description normalization. Model drafts frequently emit a whole
// paragraph as one long line, tripping the 400-char prose-line check, or end
// without a closing artifact — each used to cost an entire LLM refinement
// iteration for what is a mechanical fix. Hard-wrapping prose at sentence
// boundaries is render-neutral (markdown joins the lines back into the same
// paragraph) and never touches fences, headings, tables, bullets, numbered
// steps, or HTML comments. Runs before scoring so these fixes are free.

import type { PRStats } from "../types";
import { ARTIFACT_ENDING_RE } from "./refinement-checks";

const PROSE_LINE_TARGET = 390; // headroom under the 400-char render check
const SENTENCE_BREAK = /(?<=[.!?]) (?=[A-Z`("[])/;

function backtickCount(text: string): number {
  return (text.match(/`/g) ?? []).length;
}

function wrapLine(line: string): string[] {
  const sentences = line.split(SENTENCE_BREAK);
  if (sentences.length < 2) return [line];
  const lines: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const next = current === "" ? sentence : current + " " + sentence;
    // Only break where code spans are closed — an odd backtick count means a
    // `code span` is still open, and a newline inside it would change rendering.
    if (next.length > PROSE_LINE_TARGET && current !== "" && backtickCount(current) % 2 === 0) {
      lines.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }
  lines.push(current);
  return lines;
}

function isWrappableProse(line: string): boolean {
  if (line.length <= PROSE_LINE_TARGET) return false;
  return !/^\s*(#{1,6}\s|[-*>|]|\d+\.\s|<|```)/.test(line);
}

/** Hard-wrap prose paragraphs longer than the render-check limit. */
export function wrapLongProseLines(markdown: string): string {
  const out: string[] = [];
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (!inFence && isWrappableProse(line)) {
      out.push(...wrapLine(line));
    } else {
      out.push(line);
    }
  }
  return out.join("\n");
}

/**
 * Append a scope-accounting line when the draft lacks any accepted closing
 * artifact. Scope accounting is an honest, rubric-accepted ending; no-op when
 * stats are unavailable or the draft already ends on a verdict line, issue
 * link, or "Not verified" note.
 */
export function ensureArtifactEnding(description: string, stats: PRStats | null): string {
  if (!stats || stats.files <= 0) return description;
  const tail = description
    .split("\n")
    .filter((l) => l.trim())
    .slice(-3)
    .join(" ");
  if (ARTIFACT_ENDING_RE.test(tail)) return description;
  return (
    description.trimEnd() +
    `\n\nScope: ${String(stats.files)} files, +${String(stats.additions)}/-${String(stats.deletions)}.\n`
  );
}
