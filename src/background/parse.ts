import type { GenerateResponse } from "../types";
import { stripBotArtifacts } from "./bot-artifacts";

export function countDiffAnchors(text: string): number {
  return (text.match(/diffhunk:\/\//g) ?? []).length;
}

export interface ParseOptions {
  /** True when the prompt carried an Anchors section — a zero-anchor answer is suspicious then. */
  expectAnchors?: boolean;
  /** True when the repo's PR template mandates an AI-assistance disclosure (repo-style.ts). */
  preserveAiDisclosure?: boolean;
}

function stripFences(text: string): string {
  return text.replace(/^```\w*\n?/, "").replace(/\n?```\s*$/, "");
}

function stripEdge(title: string, chars: string[]): string {
  let result = title;
  while (result.length > 0 && chars.includes(result[0] ?? "")) {
    result = result.substring(1);
  }
  while (result.length > 0 && chars.includes(result[result.length - 1] ?? "")) {
    result = result.substring(0, result.length - 1);
  }
  return result;
}

function truncateTitle(title: string): string {
  if (title.length <= 100) return title;
  // Slice by code point, not UTF-16 unit, so an astral char at the cap
  // is kept whole instead of leaving a lone surrogate behind.
  return Array.from(title).slice(0, 100).join("").trim();
}

function cleanTitleText(title: string): string {
  let result = stripEdge(title, ['"', "'", "`"]);
  result = result.replace(/^#+\s*/, "");
  while (result.startsWith("**")) result = result.slice(2);
  while (result.endsWith("**")) result = result.slice(0, -2);
  result = result.replace(/^Title:\s*/i, "");
  return result.trim();
}

// "Overview: ..." is a pseudo-title only when it leads the response. After a
// heading, after real prose, or inside a fence it is authored content and must
// survive — a fenced example wrapping the whole body still shields the line
// because fences are only stripped after this pass (parseDescriptionOnlyResponse).
function stripLeadingOverviewLine(text: string): string {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.trim() === "") continue;
    if (/^#{1,6}\s/.test(line) || line.trimStart().startsWith("```")) return text;
    if (!/^overview\s*:/i.test(line)) return text;
    lines.splice(i, 1);
    return lines.join("\n");
  }
  return text;
}

// Bot/LLM signature stripping lives in bot-artifacts.ts (line classifiers,
// template-safe). This wrapper only adds the parse-specific removal of a
// leading "Overview:"-style pseudo-title line.
// ParseOptions.preserveAiDisclosure is forwarded so a template-mandated
// disclosure answer is not deleted before the description ships.
function stripBotSignatures(text: string, options?: ParseOptions): string {
  return stripLeadingOverviewLine(
    stripBotArtifacts(text, { preserveAiDisclosure: options?.preserveAiDisclosure }),
  ).trim();
}

function splitTitleAndDescription(cleaned: string): GenerateResponse {
  const doubleNewlineIdx = cleaned.indexOf("\n\n");
  if (doubleNewlineIdx !== -1) {
    return {
      title: cleaned.substring(0, doubleNewlineIdx).trim(),
      description: cleaned.substring(doubleNewlineIdx + 2).trim(),
    };
  }
  const firstNewlineIdx = cleaned.indexOf("\n");
  if (firstNewlineIdx !== -1) {
    return {
      title: cleaned.substring(0, firstNewlineIdx).trim(),
      description: cleaned.substring(firstNewlineIdx + 1).trim(),
    };
  }
  return { title: cleaned.trim(), description: "" };
}

// Models sometimes answer the combined prompt with the description body alone
// ("## Summary\n..."). A leading known-section heading is description content,
// never a title — returning an empty title lets the caller keep the user's
// existing title instead of filling "Summary" into the title field. Exported:
// the streaming splitter (src/content/stream.ts) uses the same predicate so a
// heading-leading stream never flashes a section name in the title field.
// The line must be EXACTLY the section heading: "## Summary of my work" is a
// real title (content on the same line) and stays surveyable.
const KNOWN_SECTION_HEADING = /^#{1,6}\s*(?:summary|changes|testing|walkthrough|description)\s*$/i;
const KNOWN_SECTION_WORDS = ["summary", "changes", "testing", "walkthrough", "description"];

// Streams arrive token-split, so a heading word can land half-written
// ("## Wal" on its way to "## Walkthrough"). If that fragment were shown as a
// title, completing the word later only clears the guard's decision — the
// already-written fragment in the title field is never reverted. Hold the
// title for any still-unterminated single-token heading line that is a prefix
// of a known section word. Only unterminated lines, and only single tokens:
// "## Summary of my work" (a real title) still streams.
function isSectionHeadingPrefix(line: string): boolean {
  const match = /^#{1,6}\s*(\S+)$/.exec(line);
  if (!match) return false;
  const word = (match[1] ?? "").toLowerCase();
  return KNOWN_SECTION_WORDS.some((known) => known.startsWith(word));
}

export function startsWithKnownSection(text: string): boolean {
  const lines = text.split("\n");
  const firstIndex = lines.findIndex((line) => line.trim() !== "");
  if (firstIndex === -1) return false;
  const first = lines[firstIndex] ?? "";
  if (KNOWN_SECTION_HEADING.test(first)) return true;
  // The prefix rule applies only while no newline has terminated the line.
  return firstIndex === lines.length - 1 && isSectionHeadingPrefix(first);
}

export function parseCombinedResponse(text: string, options?: ParseOptions): GenerateResponse {
  const cleaned = stripFences(stripBotSignatures(text, options));
  if (startsWithKnownSection(cleaned)) return { title: "", description: cleaned.trim() };
  const parsed = splitTitleAndDescription(cleaned);
  let { title } = parsed;

  title = cleanTitleText(title);
  title = truncateTitle(title);

  let description = parsed.description;
  description = description.replace(/^Title:.*\n?/i, "");
  return { title, description };
}

export function parseTitleOnlyResponse(text: string): string {
  const cleaned = stripBotSignatures(text);
  let title = cleanTitleText(stripFences(cleaned).trim());
  const newlineIdx = title.indexOf("\n");
  if (newlineIdx !== -1) {
    title = title.substring(0, newlineIdx).trim();
  }
  return truncateTitle(title);
}

export function parseDescriptionOnlyResponse(text: string, options?: ParseOptions): string {
  const cleaned = stripBotSignatures(text, options);
  let description = stripFences(cleaned).trim();
  description = description.replace(/^Title:.*\n?/i, "");
  const firstLine = description.split("\n")[0] || "";
  // Only known wrapper labels (Title/Description/PR Description) are dropped;
  // a real opener like "Note: ..." must survive.
  if (
    /^(?:title|description|pr description)\s*:/i.test(firstLine) &&
    firstLine.length < 80 &&
    !firstLine.startsWith("#") &&
    !firstLine.startsWith("-") &&
    !firstLine.startsWith("*") &&
    !firstLine.includes("diffhunk://") &&
    !firstLine.includes("](")
  ) {
    description = description.substring(firstLine.length).trim();
  }
  return description;
}
