import type { GenerateResponse } from "../types";

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
  result = result.replace(/^\*\*|\*\*$/, "");
  result = result.replace(/^Title:\s*/i, "");
  return result.trim();
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

export function parseCombinedResponse(text: string): GenerateResponse {
  const parsed = splitTitleAndDescription(stripFences(text));
  let { title } = parsed;

  title = cleanTitleText(title);

  if (title.length > 100) {
    title = title.substring(0, 100).trim();
  }

  return { title, description: parsed.description };
}

export function parseTitleOnlyResponse(text: string): string {
  let title = cleanTitleText(stripFences(text).trim());
  const newlineIdx = title.indexOf("\n");
  if (newlineIdx !== -1) {
    title = title.substring(0, newlineIdx).trim();
  }
  if (title.length > 100) {
    title = title.substring(0, 100).trim();
  }
  return title;
}

export function parseDescriptionOnlyResponse(text: string): string {
  let description = stripFences(text).trim();
  description = description.replace(/^Title:.*\n?/i, "");
  const firstLine = description.split("\n")[0] || "";
  if (
    /^[^:]{1,50}:/i.test(firstLine) &&
    firstLine.length < 80 &&
    !firstLine.startsWith("#") &&
    !firstLine.startsWith("-") &&
    !firstLine.startsWith("*")
  ) {
    description = description.substring(firstLine.length).trim();
  }
  return description;
}
