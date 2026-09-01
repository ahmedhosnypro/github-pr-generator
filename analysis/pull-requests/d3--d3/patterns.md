# PR Patterns: d3/d3

## Corpus
- PRs analyzed: 5 (numbers: #3844, #4015, #4039, #4084, #4122)
- Caveats: each PR has a different author (chaitanyakadu, mootari, Fil, aqandrew, Cheesecaster), so the sample spans 5 contributors — but all 5 PRs are trivially small documentation or link fixes (+1/-1 up to +2/-1, 1–2 files). Zero labels on all 5, zero comments on all 5, 0–2 reviews each. This sample represents the "tiny docs fix" contribution lane of d3/d3 only; it is too small and too homogeneous in change-type to say anything about how feature or bugfix PRs are written in this repo.

## Titles
Mixed conventions — no single enforced style:
- Conventional-Commit-style prefix in 2 of 5: `fix: support links on d3js.org are outdated` (#4015) and `docs: fix typo in polygonCentroid example` (#3844) — lowercase type, lowercase description.
- Plain sentence fragments in 3 of 5: `Fix external edge bundling references` (#4039, capitalized imperative), `fix broken link` (#4084, all lowercase), `docs: Incorrect alt text copied from the Observable Framework repository; it should describe D3 downloads.` (#4122 — has a `docs:` prefix but then a full capitalized sentence with internal semicolon and trailing period).
- Notably, #4084 (by repo maintainer Fil) uses the tersest, least formal title — suggesting title polish is not a merge gate here.
- Lengths range from ~15 characters (`fix broken link`) to ~105 (#4122). No emoji, no scopes (e.g. no `fix(axis):` form) observed.

## Description structure
No consistent structure; descriptions are short freeform prose, 1–3 paragraphs:
- #4015: one prose paragraph naming the issue ("This PR addresses issue [#4007](...)") and the motivation, ending with maintainer pings `@Fil @mbostock`.
- #4039: two paragraphs — "Replaces two broken external links with their archived versions." plus a scope note about a related broken link in CHANGES.md deliberately left untouched (with a permalink to the exact line).
- #4084: two fragments only — a bare URL to the relevant docs anchor, then `alternative to #4082`.
- #3844: a single sentence — "The example under the `polygonCentroid` heading was calling `polygonArea`."
- #4122: the only structured one — an H2 header (`## Documentation Fix: Incorrect alt text...`), a `**File:**` line, a `**Change:**` bullet list with Old/New diffs quoted inline, and an italic disclaimer footer. (This is the bot-authored PR; see below.)

No `## Summary` / `## Testing` headers in the human PRs; prevailing pattern is "one paragraph saying what and why."

## Template usage
No evidence of any repo PR template: no checklists (`- [ ]`), no boilerplate instructions, no "How Has This Been Tested" scaffolds, no unfilled prompts. Four of five descriptions are informal one-off prose. The one structured description (#4122) follows the authoring bot's own scaffold, not a repo template. Conclusion: **freeform** — the repo appears to impose no description structure for small contributions.

## Length & density
Extremely short across the board, matching the tiny diffs:
- #4015: ~40 words
- #4039: ~30 words (+ permalink)
- #4084: ~5 words + a URL
- #3844: ~10 words
- #4122: ~60 words (longest, and machine-generated)

Median human description is roughly 30 words. Density is high — no filler, no restated diffs; even the shortest (#4084, #3844) carry the essential "what and why."

## Voice & tone
- Human PRs use descriptive present tense, not imperative-of-request: "Replaces two broken external links…" (#4039), "This PR addresses issue #4007" (#4015).
- First person plural/possessive appears once in a hedge: #4039's "which I didn't touch" — a reviewer-considerate scope note.
- Tone is informal-to-neutral; maintainer-authored #4084 is curt to the point of terseness ("alternative to #4082").
- #4122 is distinctly chatty/marketing-flavored: "I'm Goldie, an autonomous agent studying this repo… Feel free to close if not appropriate!"

## Content habits
- **Linked issues**: 2 of 5 reference issue/PR context in the body — #4015 links issue #4007 inline ("This PR addresses issue [#4007]"), #4084 cross-references "alternative to #4082". None use closing keywords (`Fixes #N`). The repo metadata shows "Linked issues: none" for all 5, consistent with the absence of closing keywords.
- **Maintainer pings**: #4015 ends with `@Fil @mbostock` — an explicit reviewer ask-out, the only one in the sample.
- **Screenshots/images**: none.
- **Test plans / validation**: none mentioned — plausible given all 5 changes are docs/links, but there is no habit of even a token "no tests needed" note.
- **Breaking-change callouts, labels**: none on any PR (all 5 ship with zero labels).
- **Precision habit worth noting**: the stronger PRs pinpoint the fault — #4039 permalinks the exact untouched line in CHANGES.md, #3844 names both the wrong and right function (`polygonArea` vs `polygonCentroid`).

## Bot-generated content
One PR is fully bot-authored: #4122 by "Cheesecaster" identifies itself as "[Goldie](https://gitpup.fun), an autonomous agent studying this repo", includes a self-describing motivation paragraph ("I noticed this documentation issue during a deep analysis"), a structured `**Change:**` Old/New block, and an italic footer "*Autonomously generated. Feel free to close if not appropriate!*" Unlike CodeRabbit/Copilot *summaries appended to human PRs* (none observed here), this is an end-to-end agent-authored PR — and a direct example of the AI-generated-PR-description genre this project targets. Notably, it was merged as-is with 0 reviews and 0 comments, suggesting maintainers accepted the bot's scaffold without edits; its structure (heading + file + old/new + disclaimer) is a plausible template for AI-generated docs-fix descriptions in this repo.

## Notable exemplars
- **PR #4039** — https://github.com/d3/d3/pull/4039 — the best human sample: ~30 words that state the change, and — unusually valuable — explicitly declare what was *not* changed ("another broken link… which I didn't touch") with a permalink, pre-empting reviewer questions.
- **PR #3844** — https://github.com/d3/d3/pull/3844 — model of concision: one sentence naming the exact location and the exact wrong/right symbols; nothing more was needed for a one-char-class fix.
