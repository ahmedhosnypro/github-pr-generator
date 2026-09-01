# PR Patterns: 996icu/996.ICU

## Corpus
- PRs analyzed: 5 (numbers: #25770, #25759, #25744, #26142, #26151)
- Caveat: this repo is a political/cultural awareness repository (the 996.ICU anti-overwork campaign), not a conventional software project — PRs are overwhelmingly content edits (markdown docs, blacklist/whitelist lists), so PR-writing norms differ sharply from code repos. The sample also spans two eras: 3 PRs from April 2019 (the repo's viral peak) and 2 from 2025, a ~6-year gap. 5 distinct authors, 5 distinct PRs; no author is repeated. 4 of 5 descriptions are completely empty, so most sections below describe the title conventions more than the bodies.

## Titles
No consistent convention across the 5 titles:

- `Update news_EN.md` (#25770) — GitHub web-editor default style: "Update <filename>"
- `添加一枚自己的开源项目yasio，支持一下` (#25759) — freeform Chinese sentence ("adding my own open-source project yasio, in support"), no type prefix
- `Update ANTI-996 DAY.MD` (#25744) — same "Update <filename>" default style as #25770
- `feat(add blacklist): 彩讯股份` (#26142) — the only conventional-commit-style title: `feat(<scope>): <subject>`, with a Chinese scope and subject
- `docs: replaced the link 996.ОD which was faulty` (#26151) — conventional-commit `docs:` prefix, but mixes past-tense verb ("replaced") with an explanatory clause

Pattern: 2 of 5 use the implicit "Update <file>" convention, 2 of 5 use a conventional-commit type prefix (`feat`, `docs`), 1 is a freeform sentence. Languages mix: 3 English (or mostly-English), 2 Chinese-dominant. Lengths range from ~17 to ~50 characters. No emoji, no trailing periods, no PR-number suffixes.

## Description structure
There is effectively no description structure to analyze. 4 of 5 PRs (#25770, #25759, #25744, #26151) have entirely empty bodies — no headers, no lists, no prose. The single non-empty description (#26142) is one inline-code-formatted line: `` `黑名单增加杭州彩讯股份` `` ("blacklist: add Hangzhou Caixun shares"), which merely restates the title in prose form. No `##`/`###` headers, no bullet lists, no paragraphs appear anywhere in the corpus.

## Template usage
No evidence of a PR template in any direction: no repeated boilerplate, no checklists (`- [ ]`), no "How Has This Been Tested"-style scaffold, and no unfilled template prompts left in the bodies. The 4 empty bodies suggest the repo has no PR template configured at all (a template would typically leave residual scaffold text). Conclusion: **template-free / freeform**, and in practice contributors simply omit the description.

## Length & density
- #25770: 0 words (empty)
- #25759: 0 words (empty)
- #25744: 0 words (empty)
- #26142: ~6 words (`` `黑名单增加杭州彩讯股份` ``)
- #26151: 0 words (empty)

Median description length is zero words. This is the extreme-terse end of the spectrum — the title alone carries the entire explanation. This matches the change sizes: every PR is a 1-line or few-line edit (+1/-0 three times, +1/-1 twice; 1–4 files).

## Voice & tone
With only one non-empty body, voice analysis rests mostly on titles. Titles are mixed-register: descriptive English in `docs: replaced the link 996.ОD which was faulty` (#26151, past tense, explanatory), and casual/imperative Chinese in #25759 (the phrase `支持一下`, "show some support", is colloquial and personal). #26142's body is terse and factual. No first-person English; the Chinese titles carry an implicit first-person/casual tone. Overall: informal, minimal, no engineering-register polish.

## Content habits
- **Linked issues**: none — zero "Fixes #N" or issue references across all 5 PRs.
- **Test plans**: none — no validation commands or testing notes (unsurprising for markdown content edits).
- **Screenshots/images**: none.
- **Breaking-change callouts / reviewer ask-outs**: none.
- **Labels**: none on any PR; the repo appears not to use PR labels.
- **Review activity**: minimal — 0–1 reviews per PR and at most 3 comments (#26151, the faulty-link fix, is the only PR with any comments). Most PRs were merged with no discussion at all; #25759 was merged 7 minutes after creation. Notably, #26142 sat open from 2025-01-09 to 2025-08-22 (~7.5 months) before merge despite being a 1-line change, indicating sporadic maintainer attention in the repo's later era.

## Bot-generated content
No bot-generated content observed — no CodeRabbit summaries, no Copilot descriptions, no automated dependency-update boilerplate (e.g. Dependabot) in any of the 5 PRs. The empty bodies confirm these are hand-created human PRs submitted through the GitHub UI or CLI with no AI-assist signature. (The 2025 PRs predate/none exhibit the now-common AI-summary blocks found in more active repos.)

## Notable exemplars
- **PR #26142** — https://github.com/996icu/996.ICU/pull/26142 — the closest thing to an exemplar in this corpus: the only PR with both a conventional-commit title (`feat(add blacklist): 彩讯股份`) and a description, even if the description is a single restating line.
- **PR #26151** — https://github.com/996icu/996.ICU/pull/26151 — the most informative title (`docs: replaced the link 996.ОD which was faulty` explains both what and why), and the only PR that generated any review discussion (3 comments), despite having an empty body.

**Overall verdict**: this repo is a strong counterexample to good PR-description practice — 80% of merged PRs ship with an empty description and titles carry the full burden of explanation. It demonstrates that for trivial, single-line content edits in a low-governance community project, maintainers merge on title alone.
