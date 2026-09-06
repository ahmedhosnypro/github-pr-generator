// Deterministic description normalization. Model drafts frequently emit a whole
// paragraph as one long line, tripping the 400-char prose-line check, or end
// without a closing artifact — each used to cost an entire LLM refinement
// iteration for what is a mechanical fix. Hard-wrapping prose at sentence
// boundaries is render-neutral (markdown joins the lines back into the same
// paragraph) and never touches fences, headings, tables, bullets, numbered
// steps, or HTML comments. Runs before scoring so these fixes are free.

import type { PRStats } from "../types";
import { ARTIFACT_ENDING_RE, PROSE_LINE_TARGET } from "./refinement-checks";

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

const squish = (text: string): string => text.replace(/\s+/g, " ").trim();

/**
 * Preservation guard for preserve-authored refinement: returns the authored
 * paragraphs (blank-line-separated blocks) from `before` that no longer
 * survive — verbatim, up to whitespace re-flow — in `after`. Matching is done
 * on whitespace-collapsed text because the model is explicitly allowed to
 * re-wrap prose lines longer than 400 chars; anything stronger would reject
 * the one legal edit, anything weaker (word-bag) would miss reorderings.
 */
export function missingAuthoredText(before: string, after: string): string[] {
  const haystack = " " + squish(after) + " ";
  const missing: string[] = [];
  for (const block of before.split(/\n\s*\n/)) {
    const needle = squish(block);
    if (needle === "") continue;
    if (!haystack.includes(" " + needle + " ")) {
      missing.push(block);
    }
  }
  return missing;
}

// Only substantial authored sentences are sampled: a dropped 10-word note is
// far less damning than a dropped thesis, and demanding every short sentence
// verbatim would reject legitimate minimal edits.
const AUTHORED_SAMPLE_MIN = 80;

/**
 * The refinement loop's acceptance guard for preserve-authored mode: returns
 * the authored sentences from `before` (those long enough to be a real loss,
 * 80+ chars) that do not survive — verbatim, up to whitespace re-flow — in
 * `after`. Sentence sampling instead of missingAuthoredText's whole-paragraph
 * matching, so a permitted small edit (appending a Testing section, wrapping a
 * long line, splitting a paragraph) never counts as losing the author's words.
 */
export function missingAuthoredSentences(before: string, after: string): string[] {
  const haystack = " " + squish(after) + " ";
  const missing: string[] = [];
  for (const sentence of squish(before).split(/(?<=[.!?]) /)) {
    if (sentence.length < AUTHORED_SAMPLE_MIN) continue;
    if (!haystack.includes(" " + sentence + " ")) {
      missing.push(sentence);
    }
  }
  return missing;
}
