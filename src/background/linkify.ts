/**
 * Converts the model-facing `[[N]](diffhunk://...)` markers into real GitHub
 * URLs before the body is written to the PR. `diffhunk://` is a prompt-time
 * protocol only — GitHub would drop the unknown scheme and render dead text.
 *
 * Targets:
 * - opened PR:  /owner/repo/pull/<N>/files#diff-<hash>R<s>-R<end>
 * - creation:   /owner/repo/compare/<base>...<head>#diff-<hash>R<s>-R<end>
 * Hashless markers (diffhunk://L5-R25, no anchor list entry) degrade to plain
 * `N` text — visible, but no dead href.
 */

interface DiffLinkTarget {
  owner: string;
  repo: string;
  kind: "pull" | "compare";
  prNumber?: string;
  baseBranch?: string;
  headBranch?: string;
}

function diffBaseUrl(target: DiffLinkTarget): string {
  const prefix = "https://github.com/" + target.owner + "/" + target.repo;
  if (target.kind === "pull" && target.prNumber) {
    return prefix + "/pull/" + target.prNumber + "/files";
  }
  const base = encodeURIComponent(target.baseBranch ?? "");
  const head = encodeURIComponent(target.headBranch ?? "");
  return prefix + "/compare/" + base + "..." + head;
}

// [[N]](diffhunk://[#]diff-HASH_Ls-Re) or hashless [[N]](diffhunk://Ls-Re)
const DIFFHUNK_LINK = /\[\[(\d+)\]\]\(diffhunk:\/\/(#?diff-[a-zA-Z0-9_-]+)?_?L(\d+)-R(\d+)\)/g;

export function resolveDiffLinks(body: string, target: DiffLinkTarget): string {
  const base = diffBaseUrl(target);
  return body.replace(DIFFHUNK_LINK, (_match, num: string, anchor: string | undefined, start: string, end: string) => {
    if (!anchor) return num;
    const hash = anchor.replace(/^#/, "");
    const lines = start && end ? "R" + start + "-R" + end : "";
    return "[" + num + "](" + base + "#" + hash + lines + ")";
  });
}
