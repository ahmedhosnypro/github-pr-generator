import type { GitHubHunkRange, GitHubHunksByFile } from "../github-types";
import type { FileChange } from "../types";
import { isNoiseFile } from "./github/diff-parse";
import { logMsg } from "./log";

// Cap anchors section for huge diffs — the prompt can only usefully reference
// the largest N files. Files beyond the cap stay in the changes summary, just
// without diff links. Exported so the refinement anchor check can scale its
// demand to the actual (capped) anchor supply.
export const MAX_ANCHOR_FILES = 50;

// Per-file hunk cap: past this many entries the extra hunks only burn prompt
// budget — the remainder folds into a "+N more hunks" note.
export const MAX_HUNKS_PER_FILE = 10;

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
  return "    : [[" + String(refNum) + "]](diffhunk://#" + anchor + "_" + formatHunkSuffix(hunk);
}

function unanchoredHunkLine(refNum: number, filePath: string, hunk: GitHubHunkRange): string {
  return (
    "- " + String(refNum) + ". `" + filePath + "`: [[" + String(refNum) + "]](diffhunk://" + formatHunkSuffix(hunk)
  );
}

function moreHunksNote(extra: number): string {
  return "(+" + String(extra) + " more hunks in this file — only the first " + String(MAX_HUNKS_PER_FILE) + " are listed)\n";
}

// File-level diff links are degenerate: GitHub only resolves hunk-scoped
// anchors (#diff-<hash>_L..-R..) and the model can only emit what the Anchors
// section lists. A file without parsed hunks therefore contributes nothing.
function emitAnchoredFile(
  fc: FileChange,
  hunkRanges: GitHubHunksByFile | null,
  seenFiles: Record<string, boolean>,
  startRefNum: number,
): EmitResult {
  let refNum = startRefNum;
  const anchor = fc.diffAnchor.replace(/^#/, "");
  // Enforce GitHub diff hash format: alphanumeric + hyphen exactly 40+ chars
  if (!/^[a-zA-Z0-9_-]{40,}$/.test(anchor)) {
    logMsg("buildChangesSummary - invalid diff anchor skipped: " + fc.diffAnchor);
    return { text: "", refNum };
  }
  const fileHunks = hunkRanges ? hunkRanges[fc.path] : undefined;
  const first = fileHunks && fileHunks.length > 0 ? fileHunks[0] : undefined;
  if (!fileHunks || !first) return { text: "", refNum };
  seenFiles[fc.path] = true;
  const firstEnd = first.rightStart + first.rightCount - 1;
  let text =
    "- " +
    String(refNum) +
    ". [`" +
    fc.path +
    "`](diffhunk://#" +
    anchor +
    "_L" +
    String(first.rightStart) +
    "-R" +
    String(firstEnd) +
    ")\n";
  for (const hunk of fileHunks.slice(0, MAX_HUNKS_PER_FILE)) {
    text += hunkLine(refNum, anchor, hunk);
    refNum++;
  }
  if (fileHunks.length > MAX_HUNKS_PER_FILE) {
    text += "    : " + moreHunksNote(fileHunks.length - MAX_HUNKS_PER_FILE);
  }
  return { text, refNum };
}

// Add hunk ranges with diff anchors from DOM scraping. Anchoring is capped:
// every file gets an anchor after REST hydration, so without a cap the
// section balloons for large diffs. Rank by churn (additions + deletions) —
// noise files (lockfiles, minified bundles, snapshots) are filtered out
// before ranking so generated churn cannot displace reviewable files.
function emitAnchoredFiles(
  fileChanges: FileChange[],
  hunkRanges: GitHubHunksByFile | null,
  seenFiles: Record<string, boolean>,
  startRefNum: number,
): EmitResult {
  let text = "";
  let refNum = startRefNum;
  const ranked = fileChanges
    .filter((fc) => fc.diffAnchor && fc.diffAnchor.length > 5 && !isNoiseFile(fc.path))
    .toSorted((a, b) => b.additions + b.deletions - (a.additions + a.deletions))
    .slice(0, MAX_ANCHOR_FILES);
  for (const fc of ranked) {
    if (seenFiles[fc.path]) continue;
    const emitted = emitAnchoredFile(fc, hunkRanges, seenFiles, refNum);
    text += emitted.text;
    refNum = emitted.refNum;
  }
  return { text, refNum };
}

// The cap counts FILES (mirroring MAX_ANCHOR_FILES for the anchored path), not
// hunks — and each listed file obeys the same per-file hunk cap. Noise files
// stay out here as well.
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
    if (seenFiles[filePath] || isNoiseFile(filePath)) continue;
    const fileHunks = hunkRanges[filePath];
    if (!fileHunks || fileHunks.length === 0) continue;
    for (const hunk of fileHunks.slice(0, MAX_HUNKS_PER_FILE)) {
      text += unanchoredHunkLine(refNum, filePath, hunk);
      refNum++;
    }
    if (fileHunks.length > MAX_HUNKS_PER_FILE) {
      text += "- " + moreHunksNote(fileHunks.length - MAX_HUNKS_PER_FILE);
    }
    emitted++;
  }
  return { text, refNum };
}

export function buildAnchorsSection(fileChanges: FileChange[], hunkRanges: GitHubHunksByFile | null): string {
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
