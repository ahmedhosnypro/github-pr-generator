import type { GenerateResponse } from "../types";
import { stripBotArtifacts } from "./bot-artifacts";

export function countDiffAnchors(text: string): number {
  return (text.match(/diffhunk:\/\//g) ?? []).length;
}

export interface ParseOptions {
  /** True when the prompt carried an Anchors section — a zero-anchor answer is suspicious then. */
  expectAnchors?: boolean;
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
function stripBotSignatures(text: string): string {
  return stripBotArtifacts(text)
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

export function parseCombinedResponse(text: string, _options?: ParseOptions): GenerateResponse {
  const cleaned = stripBotSignatures(text);
  const parsed = splitTitleAndDescription(stripFences(cleaned));
  let { title } = parsed;

  title = cleanTitleText(title);

  if (title.length > 100) {
    title = title.substring(0, 100).trim();
  }

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
  if (title.length > 100) {
    title = title.substring(0, 100).trim();
  }
  return title;
}

export function parseDescriptionOnlyResponse(text: string, _options?: ParseOptions): string {
  const cleaned = stripBotSignatures(text);
  let description = stripFences(cleaned).trim();
  description = description.replace(/^Title:.*\n?/i, "");
  const firstLine = description.split("\n")[0] || "";
  if (
    /^[^:]{1,50}:/i.test(firstLine) &&
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
