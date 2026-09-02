import type { GitHubHunkRange, GitHubHunksByFile } from "../../github-types";

function getFileHunks(hunksByFile: GitHubHunksByFile, file: string): GitHubHunkRange[] {
  const existing = hunksByFile[file];
  if (existing) return existing;
  const created: GitHubHunkRange[] = [];
  hunksByFile[file] = created;
  return created;
}

function parseHunkHeader(line: string, currentFile: string | null, hunksByFile: GitHubHunksByFile): void {
  // Match hunk header: @@ -leftStart,leftCount +rightStart,rightCount @@
  const hunkMatch = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
  if (hunkMatch && currentFile) {
    const rightStart = Number.parseInt(hunkMatch[3] ?? "0", 10);
    const rightCount = hunkMatch[4] ? Number.parseInt(hunkMatch[4], 10) : 1;
    getFileHunks(hunksByFile, currentFile).push({ rightStart, rightCount });
  }
}

// Extract the filename from a "diff --<path>" header in the PR compare
// interface (the next line holds the "+++ b/path" separator).
function matchCompareFile(lines: string[], index: number): string | null {
  const nextLine = lines[index + 1] || "";
  const fileFromPR = /^\+\+\+ b\/(.+)$/.exec(nextLine);
  return fileFromPR ? (fileFromPR[1] ?? null) : null;
}

export function parseHunkLineRanges(diffText: string): GitHubHunksByFile {
  const hunksByFile: GitHubHunksByFile = {};
  let currentFile: string | null = null;
  const lines = diffText.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    // Match diff file header:
    // diff --git a/path b/path, --- a/path, +++ b/path, or rename/path
    const fileMatch = /^diff --git a\/(.+?) b\/(.+)$/.exec(line);
    if (fileMatch) {
      currentFile = fileMatch[2] ?? ""; // Use b/ path for git diff
      getFileHunks(hunksByFile, currentFile);
      continue;
    }

    // Match new file header: might show in a new file diff without diff --git
    const newFileMatch = /^\+\+\+ b\/(.+)$/.exec(line);
    if (newFileMatch) {
      if (currentFile === null) {
        currentFile = newFileMatch[1] ?? "";
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

export function truncateDiff(diffText: string, maxLines: number, maxBytes: number): string {
  const lines = diffText.split("\n");
  const totalLines = lines.length;

  if (diffText.length <= maxBytes && totalLines <= maxLines) {
    return diffText;
  }

  const result: string[] = [];
  let byteCount = 0;
  const encoder = new TextEncoder();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const lineBytes = encoder.encode(line).length + 1;

    if (result.length >= maxLines || byteCount + lineBytes > maxBytes) {
      const remaining = totalLines - i;
      result.push("... (truncated, " + String(remaining) + " more lines)");
      break;
    }

    result.push(line);
    byteCount += lineBytes;
  }

  return result.join("\n");
}
