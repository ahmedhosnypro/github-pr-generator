import type { GitHubHunkRange, GitHubHunksByFile } from "../../github-types";

function getFileHunks(hunksByFile: GitHubHunksByFile, file: string): GitHubHunkRange[] {
  const existing = hunksByFile[file];
  if (existing) return existing;
  const created: GitHubHunkRange[] = [];
  hunksByFile[file] = created;
  return created;
}

// Git C-quotes a path token when the name needs it (spaces or non-ASCII
// bytes): the whole "a/..." / "b/..." token is wrapped in double quotes and
// special characters become \", \\ or an octal byte escape \ooo. Each token
// may independently be bare or quoted.
const DIFF_HEADER_RE = /^diff --git (?:a\/(.+?)|"a\/((?:[^"\\]|\\.)*)") (?:b\/(.+)|"b\/((?:[^"\\]|\\.)*)")$/;
const PLUS_HEADER_RE = /^\+\+\+ (?:b\/(.+)|"b\/((?:[^"\\]|\\.)*)")$/;

// Git's named C escapes inside a quoted path. Anything not listed here (and
// not an octal escape) keeps its literal character.
const NAMED_ESCAPES: Record<string, number> = { a: 7, b: 8, t: 9, n: 10, v: 11, f: 12, r: 13, '"': 34, "\\": 92 };

// Decode the inside of a C-quoted path token: named escapes (\t, \n, \"...)
// plus \ooo octal byte escapes, with the resulting bytes read as UTF-8 (git
// emits non-ASCII names as octal escapes by default).
function unquoteGitPath(quoted: string): string {
  const bytes: number[] = [];
  const encoder = new TextEncoder();
  let pos = 0;

  while (pos < quoted.length) {
    const char = quoted[pos] ?? "";
    if (char !== "\\") {
      for (const byte of encoder.encode(char)) bytes.push(byte);
      pos++;
      continue;
    }

    const next = quoted[pos + 1] ?? "";
    let advance = 2;
    if (next >= "0" && next <= "7") {
      let octal = "";
      let digitPos = pos + 1;
      while (digitPos < quoted.length && octal.length < 3) {
        const digit = quoted[digitPos] ?? "";
        if (digit < "0" || digit > "7") break;
        octal += digit;
        digitPos++;
      }
      bytes.push(Number.parseInt(octal, 8));
      advance = digitPos - pos;
    } else if (next !== "") {
      bytes.push(NAMED_ESCAPES[next] ?? encoder.encode(next)[0] ?? next.charCodeAt(0));
    }
    pos += advance;
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Pick the b/-side path from a header regex match, unquoting it when git
// wrapped the token in quotes.
function headerPath(barePath: string | undefined, quotedPath: string | undefined): string {
  if (quotedPath !== undefined) return unquoteGitPath(quotedPath);
  return barePath ?? "";
}

function parseHunkHeader(line: string, currentFile: string | null, hunksByFile: GitHubHunksByFile): void {
  // Match hunk header: @@ -leftStart,leftCount +rightStart,rightCount @@
  const hunkMatch = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
  if (hunkMatch && currentFile) {
    const rightStart = Number.parseInt(hunkMatch[3] ?? "0", 10);
    const rightCount = hunkMatch[4] ? Number.parseInt(hunkMatch[4], 10) : 1;
    // Zero-count right side = pure deletion, whose start is pegged at the
    // line preceding the deletion. Anchor that single line so the emitted
    // range never inverts (start..start-1).
    getFileHunks(hunksByFile, currentFile).push({ rightStart, rightCount: Math.max(rightCount, 1) });
  }
}

// Extract the filename from a "diff --<path>" header in the PR compare
// interface (the next line holds the "+++ b/path" separator).
function matchCompareFile(lines: string[], index: number): string | null {
  const nextLine = lines[index + 1] || "";
  const fileFromPR = PLUS_HEADER_RE.exec(nextLine);
  return fileFromPR ? headerPath(fileFromPR[1], fileFromPR[2]) : null;
}

export function parseHunkLineRanges(diffText: string): GitHubHunksByFile {
  // Null-prototype map: a file named "__proto__" or "constructor" must key
  // like any other instead of resolving to an Object.prototype member (which
  // getFileHunks would then treat as an existing hunk array and crash on).
  const hunksByFile: GitHubHunksByFile = Object.create(null) as GitHubHunksByFile;
  let currentFile: string | null = null;
  const lines = diffText.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    // Match diff file header:
    // diff --git a/path b/path, --- a/path, +++ b/path, or rename/path
    const fileMatch = DIFF_HEADER_RE.exec(line);
    if (fileMatch) {
      currentFile = headerPath(fileMatch[3], fileMatch[4]); // Use b/ path for git diff
      getFileHunks(hunksByFile, currentFile);
      continue;
    }

    // Match new file header: might show in a new file diff without diff --git
    const newFileMatch = PLUS_HEADER_RE.exec(line);
    if (newFileMatch) {
      if (currentFile === null) {
        currentFile = headerPath(newFileMatch[1], newFileMatch[2]);
        getFileHunks(hunksByFile, currentFile);
      }
      continue;
    }

    // Match single file diff header in PR compare interface
    const prFileMatch = /^diff --(\S+)/.exec(line);
    if (prFileMatch && currentFile === null) {
      const compareFile = matchCompareFile(lines, i);
      if (compareFile !== null) {
        currentFile = compareFile;
        getFileHunks(hunksByFile, currentFile);
      }
      continue;
    }

    parseHunkHeader(line, currentFile, hunksByFile);
  }

  return hunksByFile;
}

// Generated artifacts (lockfiles, minified bundles, test snapshots) span
// thousands of lines but carry no reviewable signal. They are dropped before
// budgeting so they cannot consume the prompt's diff line budget.
const NOISE_FILE_PATTERNS: RegExp[] = [
  /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|composer\.lock|Gemfile\.lock|Cargo\.lock|poetry\.lock|Pipfile\.lock|go\.sum)$/,
  /\.min\.(js|css)$/,
  /\.snap$/,
];

export function isNoiseFile(path: string): boolean {
  return NOISE_FILE_PATTERNS.some((pattern) => pattern.test(path));
}

interface DiffSection {
  file: string;
  lines: string[];
}

// Split a diff into a header preamble plus one section per file, keyed by the
// "diff --git a/x b/y" header (or the PR-compare "diff --path" header).
function splitDiffSections(lines: string[]): { preamble: string[]; sections: DiffSection[] } {
  const preamble: string[] = [];
  const sections: DiffSection[] = [];
  let current: DiffSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const gitMatch = DIFF_HEADER_RE.exec(line);
    if (gitMatch) {
      current = { file: headerPath(gitMatch[3], gitMatch[4]), lines: [line] };
      sections.push(current);
      continue;
    }
    if (/^diff --\S+/.test(line)) {
      current = { file: matchCompareFile(lines, i) ?? "", lines: [line] };
      sections.push(current);
      continue;
    }
    if (current) current.lines.push(line);
    else preamble.push(line);
  }

  return { preamble, sections };
}

// Fair-share per-file line allowances: an even slice of the global budget so
// no single file starves the rest, then a pass that hands any unused lines
// (from small files) back to truncated files in diff order.
function allocatePerFile(sections: DiffSection[], maxLines: number): Map<DiffSection, number> {
  const share = Math.max(1, Math.floor(maxLines / sections.length));
  const allowances = new Map<DiffSection, number>();
  let used = 0;
  for (const section of sections) {
    const allowance = Math.min(section.lines.length, share);
    allowances.set(section, allowance);
    used += allowance;
  }
  let leftover = maxLines - used;
  for (const section of sections) {
    if (leftover <= 0) break;
    const allowance = allowances.get(section) ?? 0;
    const extra = Math.min(section.lines.length - allowance, leftover);
    allowances.set(section, allowance + extra);
    leftover -= extra;
  }
  return allowances;
}

// Head truncation for diffs without recognizable file headers.
function headTruncate(lines: string[], maxLines: number, maxBytes: number): string {
  const result: string[] = [];
  let byteCount = 0;
  const encoder = new TextEncoder();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const lineBytes = encoder.encode(line).length + 1;

    if (result.length >= maxLines || byteCount + lineBytes > maxBytes) {
      const remaining = lines.length - i;
      result.push("... (truncated, " + String(remaining) + " more lines)");
      break;
    }

    result.push(line);
    byteCount += lineBytes;
  }

  return result.join("\n");
}

export function truncateDiff(diffText: string, maxLines: number, maxBytes: number): string {
  const lines = diffText.split("\n");
  const encoder = new TextEncoder();

  // .length counts UTF-16 code units, but the budget is UTF-8 bytes. Encoded
  // bytes are never fewer than code units, so only encode when .length passes.
  if (diffText.length <= maxBytes && encoder.encode(diffText).length <= maxBytes && lines.length <= maxLines) {
    return diffText;
  }

  const { preamble, sections } = splitDiffSections(lines);
  if (sections.length === 0) {
    return headTruncate(lines, maxLines, maxBytes);
  }

  const kept = sections.filter((section) => !isNoiseFile(section.file));
  const allowances = kept.length > 0 ? allocatePerFile(kept, maxLines) : new Map<DiffSection, number>();

  const result: string[] = [];
  let byteCount = 0;
  let exhausted = false;

  function push(line: string): boolean {
    const lineBytes = encoder.encode(line).length + 1;
    if (result.length >= maxLines || byteCount + lineBytes > maxBytes) return false;
    result.push(line);
    byteCount += lineBytes;
    return true;
  }

  for (const line of preamble) {
    if (!push(line)) {
      exhausted = true;
      break;
    }
  }

  for (const section of sections) {
    if (exhausted) break;

    if (isNoiseFile(section.file)) {
      if (!push(section.lines[0] ?? "")) {
        exhausted = true;
        break;
      }
      push("... (omitted " + section.file + ": generated file, " + String(section.lines.length) + " lines)");
      continue;
    }

    const allowance = allowances.get(section) ?? section.lines.length;
    const shown = Math.min(allowance, section.lines.length);
    for (let i = 0; i < shown; i++) {
      if (!push(section.lines[i] ?? "")) {
        exhausted = true;
        break;
      }
    }
    if (shown < section.lines.length) {
      push("... (truncated, " + String(section.lines.length - shown) + " more lines in " + section.file + ")");
    }
  }

  if (exhausted) {
    push("... (truncated: global diff budget reached)");
  }

  return result.join("\n");
}
