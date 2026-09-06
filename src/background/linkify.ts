/**
 * Converts the model-facing `[[N]](diffhunk://...)` markers into real GitHub
 * URLs before the body is written to the PR. `diffhunk://` is a prompt-time
 * protocol only — GitHub would drop the unknown scheme and render dead text.
 *
 * Targets:
 * - opened PR:  /owner/repo/pull/<N>/files#diff-<hash>R<s>-R<end>
 * - creation:   /owner/repo/compare/<base>...<head>#diff-<hash>R<s>-R<end>
 * The hash may arrive as `#diff-HASH`, `diff-HASH` (old Anchors-section
 * spelling), or a bare hash — all resolve. Hashless markers
 * (diffhunk://L5-R25, no anchor list entry) and any marker that fails to
 * parse degrade to plain `N` text — visible, but no dead href.
 */

interface DiffLinkTarget {
  owner: string;
  repo: string;
  kind: "pull" | "compare";
  prNumber?: string;
  baseBranch?: string;
  headBranch?: string;
}

// GitHub compare refs keep their structure separators readable: `feature/x`
// and `fork-owner:branch` both work, so only the segments between `/` and `:`
// are URI-encoded (spaces, '#', '?' etc.).
function encodeCompareRef(ref: string): string {
  return ref
    .split(/([/:])/)
    .map((segment) => (segment === "/" || segment === ":" ? segment : encodeURIComponent(segment)))
    .join("");
}

// Null when there is not enough target data to build a URL the browser would
// resolve (compare kind without both branches) — callers degrade every marker
// to its plain reference number instead of linking to an empty compare page.
function diffBaseUrl(target: DiffLinkTarget): string | null {
  const prefix = "https://github.com/" + target.owner + "/" + target.repo;
  if (target.kind === "pull" && target.prNumber) {
    return prefix + "/pull/" + target.prNumber + "/files";
  }
  if (!target.baseBranch || !target.headBranch) return null;
  return prefix + "/compare/" + encodeCompareRef(target.baseBranch) + "..." + encodeCompareRef(target.headBranch);
}

// [[N]](diffhunk://[#]diff-HASH_Ls-Re) — # and diff- optional so the bare-hash
// form (diffhunk://HASH_Ls-Re) resolves too — or hashless [[N]](diffhunk://Ls-Re)
const DIFFHUNK_LINK = /\[\[(\d+)\]\]\(diffhunk:\/\/(#?(?:diff-)?[a-zA-Z0-9_-]+)?_?L(\d+)-R(\d+)\)/g;

// A diffhunk marker that survives the pass above is unparseable; degrade it to
// the plain reference number (same as the hashless form) instead of leaving
// raw dead-text markup in the PR body.
const UNRESOLVED_DIFFHUNK = /\[\[(\d+)\]\]\(diffhunk:\/\/[^)]*\)/g;

// Bare [[N]] refs with no URL — rendered as ordinary text on GitHub, but the
// numbering is meaningless without a link target.
const BARE_REF = /\[\[(\d+)\]\](?!\()/g;

export function resolveDiffLinks(body: string, target: DiffLinkTarget): string {
  const base = diffBaseUrl(target);
  if (!base) {
    return body.replace(UNRESOLVED_DIFFHUNK, "$1").replace(BARE_REF, "");
  }
  const linked = body.replace(
    DIFFHUNK_LINK,
    (_match, num: string, anchor: string | undefined, start: string, end: string) => {
      if (!anchor) return num;
      // The hash char class includes '-', so `#diff-abc…_L10` ends up with the
      // trailing separator absorbed into the hash; strip it for a clean URL.
      // The regex also accepts a bare hash, so re-attach the diff- prefix.
      let hash = anchor.replace(/^#/, "").replace(/_+$/, "");
      if (!hash.startsWith("diff-")) hash = "diff-" + hash;
      // Degenerate marker with an empty hash (diffhunk://#_L5-R25): no target.
      if (hash === "diff-") return num;
      const lines = start && end ? "R" + start + "-R" + end : "";
      return "[" + num + "](" + base + "#" + hash + lines + ")";
    },
  );
  return linked.replace(UNRESOLVED_DIFFHUNK, "$1").replace(BARE_REF, "");
}
