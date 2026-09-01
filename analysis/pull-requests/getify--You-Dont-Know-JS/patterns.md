# PR Patterns: getify/You-Dont-Know-JS

## Corpus
- PRs analyzed: 5 (numbers: #1859, #1862, #1864, #1927, #1928)
- Caveat: 5 PRs by 4 distinct authors (liunnn1994 authored 2), spanning June 2024 → Feb 2026. This is a content/book repo (markdown prose, not code), so merges are mostly typo fixes and translations. Sample is too small and too homogeneous (4 of 5 are typo/translation drive-bys; all have 0 labels, 0–2 reviews, ≤1 comment) to draw strong repo-wide conclusions, but the sample is representative of what gets merged here.

## Titles
No consistent convention — 5 PRs show 4 different formats:
- `chore: fix typos` (#1862) — the only Conventional-Commits-style title
- `Typo Corrected` (#1864) — title case, declarative
- `Update ch2.md` (#1859) — auto-generated GitHub web-edit style title
- `2ed zh cn` (#1927) — opaque shorthand (2nd edition, zh-CN translation)
- `fix some typos` (#1928) — lowercase imperative-ish

Pattern: short (7–16 chars), no scope, no issue references, no emoji, no trailing period. 2 of 5 are literally "fix(some) typos" variants. Only #1862 attempts a type prefix. No maintainer normalization of titles is evident.

## Description structure
There is effectively no structure — no PR uses any markdown section header in its body. Per PR:
- #1862: single line — `fix some typos`
- #1864: three plain lines, no formatting — "This is my Second Contribution", "Changed Point2 to Point2d", "Issue(#1839) got Resolved"
- #1859: a partially filled copy of the repo's PR/issue template (see Template usage) — bold labels (`**Edition:**`, `**Book Title:**`, `**Chapter:**`, `**Section Title:**`, `**Topic:**) all left blank, a quoted block of the contributing guidelines, and a `----` horizontal rule
- #1927: single line — "Add **Objects & Classes** and **Types & Grammar** Simplified Chinese translation." (bold used for book titles)
- #1928: single line — `fix some typos`

Dominant pattern: one-line summaries with zero scaffolding. No bullets, no lists (except inside the quoted template in #1859), no headings.

## Template usage
There IS a repo template, visible only via #1859, which pasted it (partially) into the description:
- "**Yes, I promise I've read the [Contributions Guidelines](…)** (please feel free to remove this line)."
- "**Please type "I already searched for this issue":**"
- Blank labeled fields: `**Edition:**`, `**Book Title:**`, `**Chapter:**`, `**Section Title:**`, `**Topic:**`
- A quoted block of the contributing guidelines typos policy.

Crucially, #1859 left every template field blank and ignored the "I already searched" prompt — the template was carried in but not filled. The other 4 PRs don't show the template at all (possibly web-edit/single-file PRs that bypass it, or contributors deleting it). Conclusion: **template exists but is not enforced and routinely skipped/unfilled**; merged PRs are effectively freeform.

## Length & density
Extremely terse descriptions:
- #1862: 3 words
- #1864: 13 words
- #1859: ~120 "words" but nearly all of it is unfilled template boilerplate; actual authored content ≈ 0 words
- #1927: 10 words (for a +3869/−2806, 28-file translation — radically under-described)
- #1928: 3 words

Median is ~3–13 words. Ratio of description length to change size is extreme: the largest PR (#1927, thousands of lines) has a one-sentence description. Verbosity is effectively zero; nothing approaches even a short paragraph.

## Voice & tone
- Mixed voice, mostly descriptive/informal rather than imperative: "Changed Point2 to Point2d" (past tense), "Add … Simplified Chinese translation" (imperative), "fix some typos" (lowercase imperative).
- First person appears in 1 of 5: "This is my Second Contribution" (#1864) — a personal, chatty note. Otherwise no "I/we".
- Formality is low throughout: casual casing, no punctuation discipline, minimal context. Tone reads as drive-by external-contributor submissions rather than one curated maintainer voice.

## Content habits
- **Linked issues**: none in the corpus metadata; #1864 mentions "Issue(#1839) got Resolved" in free text (non-standard — not a "Fixes #1839" auto-close keyword and no link formatting). No PR uses `Fixes #N`/`Closes #N`.
- **Test plans**: none. No commands, no verification steps in any PR — appropriate for typo/markdown content, but even the large translation PR (#1927) has no review checklist.
- **Screenshots/images**: none.
- **Breaking-change callouts**: none (unsurprising for a text repo).
- **Reviewer ask-outs**: none.
- **Labels/milestones**: zero across all 5 PRs. Review activity is minimal: 3 PRs have 0 comments; worst case (#1862) has 1 comment + 2 reviews; #1859 sat open Feb 2024 → Mar 2025 before merge.
- Distinctive habit: the maintainer (getify) merges low-effort typo PRs despite the CONTRIBUTING.md text quoted in #1859 discouraging typo-only PRs ("just don't even worry about them for now").

## Bot-generated content
None. No CodeRabbit/Copilot summaries, no AI footers, no bot authors in the 5-PR sample. Descriptions are exclusively short human-written lines (or an unfilled human template). Given the near-empty descriptions, AI-description generators would find little human-written structure here to displace.

## Notable exemplars
- **PR #1927** — https://github.com/getify/You-Dont-Know-JS/pull/1927 — the strongest description of the sample, though only one sentence: it at least names both books covered ("**Objects & Classes** and **Types & Grammar**") and states the deliverable (Simplified Chinese translation) for a 6,675-line change; bold-facing the book titles is the one formatting flourish in the corpus.
- No second exemplar: the remaining 4 PRs are three-word typo stubs or an unfilled template. This repo is a **counterexample** of descriptive PR practice — merges are accepted on title alone.
