import type { GitHubHunkRange, GitHubHunksByFile } from "../github-types";
import type { FileChange } from "../types";
import { logMsg } from "./log";

interface EmitResult {
  text: string;
  refNum: number;
}

function formatHunkSuffix(hunk: GitHubHunkRange): string {
  const rightEnd = hunk.rightStart + hunk.rightCount - 1;
  return (
    "L" +
    String(hunk.rightStart) +
    "-R" +
    String(rightEnd) +
    ") — lines " +
    String(hunk.rightStart) +
    (hunk.rightCount > 1 ? "-" + String(rightEnd) : "") +
    "\n"
  );
}

function hunkLine(refNum: number, anchor: string, hunk: GitHubHunkRange): string {
  return "    : [[" + String(refNum) + "]](diffhunk://" + anchor + "_" + formatHunkSuffix(hunk);
}

function unanchoredHunkLine(refNum: number, filePath: string, hunk: GitHubHunkRange): string {
  return (
    "- " + String(refNum) + ". `" + filePath + "`: [[" + String(refNum) + "]](diffhunk://" + formatHunkSuffix(hunk)
  );
}

function emitAnchoredFile(
  fc: FileChange,
  hunkRanges: GitHubHunksByFile | null,
  seenFiles: Record<string, boolean>,
  startRefNum: number,
): EmitResult {
  let refNum = startRefNum;
  seenFiles[fc.path] = true;
  const anchor = fc.diffAnchor.replace(/^#/, "");
  // Enforce GitHub diff hash format: alphanumeric + hyphen exactly 40+ chars
  if (!/^[a-zA-Z0-9_-]{40,}$/.test(anchor)) {
    logMsg("buildChangesSummary - invalid diff anchor skipped: " + fc.diffAnchor);
    return { text: "", refNum };
  }
  let text = "- " + String(refNum) + ". [`" + fc.path + "`](diffhunk://" + anchor + ")\n";
  const fileHunks = hunkRanges ? hunkRanges[fc.path] : undefined;
  if (fileHunks) {
    for (const hunk of fileHunks) {
      text += hunkLine(refNum, anchor, hunk);
      refNum++;
    }
  }
  // Skip file-only link emission — GitHub only supports hunk-scoped links
  refNum++;
  return { text, refNum };
}

// Add hunk ranges with diff anchors from DOM scraping
function emitAnchoredFiles(
  fileChanges: FileChange[],
  hunkRanges: GitHubHunksByFile | null,
  seenFiles: Record<string, boolean>,
  startRefNum: number,
): EmitResult {
  let text = "";
  let refNum = startRefNum;
  for (const fc of fileChanges) {
    if (!fc.diffAnchor || fc.diffAnchor.length <= 5 || seenFiles[fc.path]) continue;
    const emitted = emitAnchoredFile(fc, hunkRanges, seenFiles, refNum);
    text += emitted.text;
    refNum = emitted.refNum;
  }
  return { text, refNum };
}

function emitUnanchoredHunksCapped(
  hunkRanges: GitHubHunksByFile | null,
  seenFiles: Record<string, boolean>,
  startRefNum: number,
  cap: number,
): EmitResult {
  let text = "";
  let refNum = startRefNum;
  if (!hunkRanges || Object.keys(hunkRanges).length === 0) return { text, refNum };
  let emitted = 0;
  for (const filePath of Object.keys(hunkRanges)) {
    if (emitted >= cap) break;
    const fileHunks = hunkRanges[filePath];
    if (seenFiles[filePath] || !fileHunks) continue;
    for (const hunk of fileHunks) {
      text += unanchoredHunkLine(refNum, filePath, hunk);
      refNum++;
      emitted++;
      if (emitted >= cap) break;
    }
  }
  return { text, refNum };
}

export function buildAnchorsSection(fileChanges: FileChange[], hunkRanges: GitHubHunksByFile | null): string {
  // Cap anchors section for huge diffs — the prompt can only usefully reference
  // the first N files. We still log all available anchors for observability.
  const MAX_ANCHOR_FILES = 50;

  let summary = "## File Anchors and Hunk Line Ranges\n\n";
  summary +=
    "Use these attachment points to create clickable diff links. Format: `[[N]](diffhunk://#diff-HASH_Lstart-Rend)` where N is a sequential reference number. Only the files listed above have anchors — never invent `[[N]]` links for other files.\n\n";

  const seenFiles: Record<string, boolean> = {};
  const anchored = emitAnchoredFiles(fileChanges, hunkRanges, seenFiles, 1);

  summary += anchored.text;

  // Only emit unanchored hunks up to the cap to keep prompt size bounded
  const cap = Math.max(0, MAX_ANCHOR_FILES - Object.keys(seenFiles).length);
  if (cap > 0) {
    const capped = emitUnanchoredHunksCapped(hunkRanges, seenFiles, anchored.refNum, cap);
    summary += capped.text;
  }

  summary += "\n**Diff Link Examples**\n";
  summary +=
    "- Changes to `src/auth.ts`: `frontend/src/auth.ts` — Added token validation. [[1]](diffhunk://#diff-4a5d3f2_L5-R25)\n";
  summary +=
    "- Multiple hunks: `frontend/app/globals.css` — Updated theme variables. [[2]](diffhunk://#diff-b688a52_L10-R30), [[3]](diffhunk://#diff-b688a52_L40-R80)\n";
  return summary;
}
