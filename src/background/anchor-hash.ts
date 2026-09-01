import type { FileChange } from "../types";

/**
 * GitHub's per-file diff anchor is `diff-` + lowercase sha256 hex of the file
 * path. The PR-creation page scrapes the real thing from the DOM, but the
 * opened-PR / lab flows get files over REST with no anchor — compute it so
 * every file can be linked.
 */
async function githubDiffAnchorForPath(path: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(path));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return "diff-" + hex;
}

const VALID_DIFF_ANCHOR = /^#?diff-[a-zA-Z0-9_-]{40,}$/;

/** Fill in missing diff anchors in place (parallel SHA-256 over file paths). */
export async function hydrateMissingDiffAnchors(fileChanges: FileChange[]): Promise<void> {
  await Promise.all(
    fileChanges.map(async (fc) => {
      if (VALID_DIFF_ANCHOR.test(fc.diffAnchor)) return;
      fc.diffAnchor = await githubDiffAnchorForPath(fc.path);
    }),
  );
}
