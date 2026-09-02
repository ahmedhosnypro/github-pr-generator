// Single source of truth for "is a commit represented in a description".
// Used by both the extension refinement loop (refinement-checks.ts) and the
// test harness (tests/testkit.ts) so scoring never drifts.
//
// Semantics: a commit is covered when any >3-char word of its HEADLINE (first
// line) appears verbatim (case-insensitively) in the description text.

export function commitHeadline(commitMessage: string): string {
  return (commitMessage.split("\n")[0] ?? "").toLowerCase();
}

export function commitHeadlineWords(commitMessage: string): string[] {
  return commitHeadline(commitMessage)
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

export function countCoveredCommits(commitMessages: string[], text: string): number {
  const lowered = text.toLowerCase();
  return commitMessages.filter((commit) => commitHeadlineWords(commit).some((w) => lowered.includes(w))).length;
}

/**
 * Required coverage fraction, scaled by commit count. ≤20 commits: 90% (the
 * corpus' "cover every commit" bar is achievable there). Beyond that the bar
 * declines linearly to a 60% floor — release PRs with 100+ commits are merged
 * as curated summaries, not exhaustive lists.
 */
export function coverageThreshold(totalCommits: number): number {
  if (totalCommits <= 20) return 0.9;
  // Rounded to 2dp to avoid binary float drift (0.9 - n*0.005 accumulates error).
  return Math.max(0.6, Math.round((0.9 - (totalCommits - 20) * 0.005) * 100) / 100);
}
