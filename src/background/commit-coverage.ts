// Single source of truth for "is a commit represented in a description".
// Used by both the extension refinement loop (refinement-checks.ts) and the
// test harness (tests/testkit.ts) so scoring never drifts.

// How many commits the generation prompt lists (summary.ts). Coverage is
// scored against this listed subset only: past it the coverage bar becomes
// mathematically unreachable (the model cannot mention commits it never saw).
export const MAX_LISTED_COMMITS = 150;

// The listed subset of commit messages — what the prompt showed the model and
// therefore the universe the coverage check may judge.
export function listedCommits(commitMessages: string[]): string[] {
  return commitMessages.slice(0, MAX_LISTED_COMMITS);
}
//
// Semantics: a commit is covered when any >3-char word of its HEADLINE (first
// line) appears in the description text. Matching tolerates the two paraphrase
// shapes descriptions produce legitimately:
//   1. Punctuation is tokenized away — "docs(dev1-006):" splits into "docs" and
//      "dev1", so a description quoting `dev1-006` counts even though it never
//      reproduces the headline's exact bracketed scope.
//   2. A trailing "s" is stemmed — a commit titled "plans" is covered by the
//      phrase "planning artifacts" (observed on kottaby/kottaby#56: four such
//      commits sank coverage to 12/17 despite being correctly described).

export function commitHeadline(commitMessage: string): string {
  return (commitMessage.split("\n")[0] ?? "").toLowerCase();
}

export function commitHeadlineWords(commitMessage: string): string[] {
  // Unicode-aware: punctuation ( brackets, colons, hyphens) splits tokens, but
  // non-Latin letters stay intact so RTL/CJK headlines keep their words.
  return commitHeadline(commitMessage)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 3);
}

// A >3-char word counts as present when it or its singular stem (trailing "s"
// stripped, still >3 chars) appears in the text as a substring.
function wordAppears(word: string, loweredText: string): boolean {
  if (loweredText.includes(word)) return true;
  const stem = word.endsWith("s") ? word.slice(0, -1) : "";
  return stem.length > 3 && loweredText.includes(stem);
}

// A headline with no >3-char word at all (emoji-only, "a b c") can never match
// on words, so it falls back to a full-headline substring match — otherwise
// such commits are mathematically uncoverable and silently sink the ratio.
function isCommitCovered(commitMessage: string, loweredText: string): boolean {
  const words = commitHeadlineWords(commitMessage);
  if (words.length > 0) return words.some((w) => wordAppears(w, loweredText));
  const headline = commitHeadline(commitMessage).trim();
  return headline !== "" && loweredText.includes(headline);
}

export function countCoveredCommits(commitMessages: string[], text: string): number {
  const lowered = text.toLowerCase();
  return commitMessages.filter((commit) => isCommitCovered(commit, lowered)).length;
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
