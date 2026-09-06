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

// Bot/LLM signature stripping lives in bot-artifacts.ts (line classifiers,
// template-safe). This wrapper only adds the parse-specific removal of
// "Overview:"-style pseudo-title lines, which can appear anywhere in output.
// ParseOptions.preserveAiDisclosure is forwarded so a template-mandated
// disclosure answer is not deleted before the description ships.
function stripBotSignatures(text: string, options?: ParseOptions): string {
  return stripBotArtifacts(text, { preserveAiDisclosure: options?.preserveAiDisclosure })
    .replace(/^Overview:\s*.*$/gim, "")
    .trim();
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

export function parseCombinedResponse(text: string, options?: ParseOptions): GenerateResponse {
  const cleaned = stripBotSignatures(text, options);
  const parsed = splitTitleAndDescription(stripFences(cleaned));
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
