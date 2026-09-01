# PR Patterns: labuladong/fucking-algorithm

## Corpus
- PRs analyzed: 5 (numbers: #1610, #2610, #2611, #2612, #2602)
- Caveat: 3 of 5 PRs (#2610, #2611, #2612) are by the same author (joshribakoff), all created and merged within minutes of each other on 2026-01-19, all addressing feedback from issue #2609. The remaining two PRs are single isolated samples from other authors (vijethkash123, IcyDesert) writing in different languages. With 5 PRs from 3 authors spanning 2024–2026, this is too small and homogeneous to establish repo-wide conventions.

## Titles
No consistent convention — three distinct styles observed:
- Plain descriptive sentence: `Update misplaced bold marker ** and added missing words at some places` (#1610 — past tense, informal, slightly awkward grammar)
- Imperative, concise: `Reframe CLRS recommendation constructively` (#2610), `Clarify hash table collision strategies with complexity` (#2611)
- Title-case-inflected imperative: `Add sorting complexity note and hash map intuition for Two Sum` (#2612)
- One Conventional Commit: `feat: detail the index difference between strings and DP table` (#2602 — lowercase verb after `feat:`, the only scope/type prefix in the sample)

Lengths ~35–75 characters, no emoji, no trailing periods, no labels on any PR.

## Description structure
Two dominant shapes, neither using `##` headers:
- **joshribakoff's before/after format** (3 PRs): one-line issue link (`Addresses feedback from #2609.`), one prose motivation sentence, then exactly `**Before:**` + blockquote of the old text, `**After:**` + blockquote of the new text. #2611 additionally embeds a bolded bullet list inside the prose (`- **Chaining:** O(1) insertion, O(n) worst-case lookup…`).
- **One-liner** (#2602): a single Chinese sentence (`添加一段细节说明，即字符串的索引会和 dp 数组索引有偏差，并利用定义加以解释。`) with no sections.
- #1610 has no real structure — it is the unfilled repo template (see below), punctuated by stray `\r` carriage returns.

## Template usage
The repo **has a PR template** (in Chinese, aimed at solution-code fixes), visible verbatim and *completely unfilled* in #1610:

> `如果你是在修复刷题插件的解法代码，请遵循正确的格式…`
> `<!-- 如果你的 PR 能够关闭某个 issue，那么在 Fixes 关键词后面输入该 issue 的链接 -->`
> `Fixes <!-- issue 链接 -->`
> `我修改的是如下题目的 xx 解法：` / `<!-- 这里放对应题目的链接，方便验证代码 -->`
> `通过截图如下：` / `<!-- 把解法代码通过所有测试用例的截图粘贴在这里… -->`

The template asks for: an issue link after `Fixes`, the problem link being modified, and a screenshot of passed test cases. #1610 left every placeholder untouched (and was still merged for a 6-line formatting fix). The other 4 PRs bypass the template entirely — no `Fixes <!-- -->` scaffold, no screenshot prompts, no checklists (`- [ ]`) anywhere. Conclusion: **a template exists but is effectively optional/ignored**; description style is freeform per author.

## Length & density
Very short bodies across the board:
- #1610: ~0 meaningful words (template boilerplate only)
- #2610: ~70 words
- #2611: ~110 words (longest, due to the bullet list and longer before/after quotes)
- #2612: ~75 words
- #2602: ~15 words (one Chinese sentence)

Every change is tiny (+1 to +9 additions, 1 file each — this is a documentation/content repo), and description length tracks change size closely. All descriptions fit in a fraction of a screen.

## Voice & tone
- English PRs (#2610–#2612) use imperative/descriptive present, no first person, restrained and editor-like: "Rewrote with clear bullet points explaining:", "The hash table explanation was confusing and used vague language…".
- #1610's title is past-tense and informal ("…and added missing words at some places").
- #2602 is a single matter-of-fact Chinese sentence, no salutations or thanks anywhere in the sample.

## Content habits
- **Linked issues**: 4 of 5 PRs carry "Linked issues: none" metadata, but #2610/#2611/#2612 all open with `Addresses feedback from #2609.` — referencing an issue manually rather than with a `Fixes #N` keyword (fitting the template's optional `Fixes` slot being unused).
- **Before/after blockquotes** are the signature habit (3 PRs) — appropriate for a prose/docs repo where the diff is textual content.
- **Screenshots**: requested by the template for solution-code fixes, but none present in the sample (none of these PRs touch solution code).
- **Test plans / breaking-change callouts / reviewer ask-outs**: none in any PR. No labels applied to any of the 5 PRs. Review activity is minimal (0–1 reviews, 0 comments; #1610 sat open ~14 months, the joshribakoff PRs merged within ~6 hours).
- Stray `\r` line endings in #1610's body — a cosmetic artifact of the template's raw state.

## Bot-generated content
None observed. No CodeRabbit/Copilot summary blocks, no AI-disclaimer footers, no "Generated with" lines in any of the 5 descriptions. #1610's body is machine-*adjacent* only in that it is untouched template boilerplate. The joshribakoff before/after descriptions read as human-edited review responses (they cite a specific human review thread, #2609).

## Notable exemplars
- **PR #2611** — https://github.com/labuladong/fucking-algorithm/pull/2611 — the strongest: opens with the motivating review link, states the problem ("confusing… vague language"), and the `**Before:**`/`**After:**` blockquotes make the improvement verifiable without opening the diff.
- **PR #2602** — https://github.com/labuladong/fucking-algorithm/pull/2602 — best minimal sample: a `feat:`-prefixed title plus a one-sentence Chinese description that explains both what was added and why (index-offset clarification between strings and the DP table).
