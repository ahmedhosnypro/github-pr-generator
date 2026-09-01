# PR Patterns: CyC2018/CS-Notes

## Corpus
- PRs analyzed: 5 (numbers: #1008, #1016, #1015, #1017, #1011)
- Caveat: this is a Chinese-language study-notes repository (CS-Notes), not a shipping software product; PRs are mostly documentation/notes fixes. All 5 PRs were merged within a ~3-week window (2020-11-03 → 2020-11-19) and are small content edits (largest: +49/-0, 1 file). Only two authors appear (qizhengzhong ×2, Xunzhuo ×3). The sample is too small and homogeneous to draw conclusions about the repo's ~300k-star contributor base; treat this as a snapshot of drive-by documentation contributions.

## Titles
Titles are short statements of the content change, mostly in Chinese. No Conventional Commits structure, no scopes, no emoji:
- `增加了方法重载和构造重载的例子` (#1008) — "Added examples of method overloading and constructor overloading"
- `fix markdown  errors` (#1016) — the only English title and the only one with a type-like prefix (`fix`), note the double space in "markdown  errors"
- `补充switch的使用` (#1015) — "Supplement usage of switch"
- `修复ArrayList扩容机制的问题` (#1017) — "Fix the issue with ArrayList's expansion mechanism"
- `文本小错误更改` (#1011) — "Minor text error correction"

Pattern: `<verb><object>` where the verb is the change kind (增加/补充/修复/更改 ≈ add/supplement/fix/correct) and the object is the content topic. Mixed casing and punctuation; no trailing periods; 8–14 Chinese characters plus embedded English technical terms (`switch`, `ArrayList`, `markdown`).

## Description structure
There is effectively no description structure. 4 of 5 PRs have **completely empty descriptions** (#1008, #1016, #1015, #1011). The only non-empty description, #1017, is a single 23-word Chinese sentence with an inline formula and no headers, lists, or sections:

> 对于奇数Old Capacity，右移操作：new Capacity = 1.5*Old Capacity - 0.5

("For odd Old Capacity, the right-shift operation: new Capacity = 1.5*Old Capacity - 0.5")

No markdown headings, no bullet lists, no prose paragraphs anywhere in the corpus.

## Template usage
No evidence of any PR template: no checklists (`- [ ]`), no section scaffolds, no "How Has This Been Tested"-style prompts, no leftover boilerplate. Conclusion: **freeform — and in practice, empty**. The cultural convention observed is that the title alone is expected to carry the entire PR meaning.

## Length & density
Extremely terse:
- #1008: 0 words (empty)
- #1016: 0 words
- #1015: 0 words
- #1011: 0 words
- #1017: ~23 words (the only non-empty body; equals 43% of the PR's +1/-1 diff in expressiveness)

Median description length is 0 words. The merged-PR convention here is title-only; the title's content verb ("增加", "修复") does the work a Description section would do elsewhere.

## Voice & tone
- Imperative/descriptive hybrid in Chinese verb-first form (增加/补充/修复/更改 = add/supplement/fix/correct), no politeness particles, no first or second person anywhere.
- Register is casual-technical: mixing English identifiers into Chinese prose (`修复ArrayList扩容机制的问题`), and informal English in #1016 (`fix markdown  errors`, all-lowercase, double space).
- #1017's single sentence is precise and technical — it states the exact arithmetic the fix corrects — but offers no context or justification.

## Content habits
- **Linked issues**: none in any of the 5 PRs (all "Linked issues: none"). No `Fixes #N` usage.
- **Test plans**: none — unsurprising for a notes repo, but no validation statement of any kind appears.
- **Screenshots/images**: none, despite #1008 being a +49-line content addition where a rendered preview would be reviewable.
- **Breaking-change callouts / reviewer ask-outs**: none.
- **Reviews/comments**: 0 reviews on all 5 PRs; only #1011 has any comments (3). Merges appear to be maintainer-accepted with little or no discussion.
- **Labels**: reasonably used as the classification system in place of descriptions — `add` (#1008, #1015), `typos` (#1016); #1017 and #1011 unlabeled.

## Bot-generated content
None. No CodeRabbit/Copilot summaries, no bot comments, no AI-generated structure in any of the 5 PRs. The corpus predates these tools' common PR usage (PRs are from November 2020).

## Notable exemplars
- **PR #1017** — https://github.com/CyC2018/CS-Notes/pull/1017 — the only PR with any description at all, and it earns it: one sentence stating the exact arithmetic defect being fixed ("new Capacity = 1.5*Old Capacity - 0.5" for odd old capacity). Minimal but information-dense — the strongest (and only) real description in the sample.

This repo is a clear counterexample to good PR-description practice: 80% of merged PRs ship with an empty body, relying on a descriptive title plus labels. It works here only because the changes are small, single-file content edits in a read-only notes repository with no testable behavior.
