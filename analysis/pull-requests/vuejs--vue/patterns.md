# PR Patterns: vuejs/vue

## Corpus
- PRs analyzed: 5 (numbers: #1165, #5645, #13187, #13192, #13216)
- Caveat: the sample spans nearly a decade (2015-08 to 2024-10) with 5 different authors (Jinjiang, javoski, serious-angel, xiaoxianBoy, Moriango) — good author diversity but no two PRs from the same era beyond 2024. 4 of 5 PRs are one-line diffs (+1 −1); only #5645 is substantial (+39 −5). This is a sample of drive-by documentation/spelling fixes to a repo in maintenance mode (Vue 2 EOL), not a representative slice of active feature development. No labels on any PR; 4 of 5 have zero review comments.

## Titles
Titles are informal and only loosely conventional:
- `Update README.md (browser compatibility reference)` (#13187) — descriptive, imperative, capitalized
- `chore: fix link broken` (#13192) — only Conventional-Commits-style title in the sample; grammatically rough
- `mini change: removed unnecessary spaces` (#1165) — ad-hoc scope prefix, lowercase, past tense
- `make vm.$watch api consistent with watch option(#5604)` (#5645) — lowercase imperative, issue number embedded in the title per the repo's own guideline ("it's referenced in the PR's title (e.g. `fix #xxx[,#xxx]`)")
- `fixed spelling mistakes` (#13216) — lowercase, past tense

Pattern: no enforced convention. 3 of 5 are lowercase, 4 of 5 start with a verb; lengths ~25–50 chars, no emoji, no trailing periods. Only #5645 demonstrates the repo's documented title-with-issue-number practice.

## Description structure
4 of 5 descriptions consist of the repo's PR template with checkboxes ticked, plus a short free-text line. No `##` markdown headings anywhere — the template uses bold-label prompts (`**What kind of change does this PR introduce?**`) instead of headers. Per PR:

- #13187: one-line free-text preamble ("Updated Browser Compatibility reference. The previous currently returns HTTP 404.") → template → `**Other information:**` filled in with a repeat of the preamble ("Updated browser compatibility reference for ES5. The previous currently returns HTTP 404.")
- #13192: template only; the `Other, please describe:` checkbox line carries the entire explanation ("fix link broken"); `**Other information:**` left empty
- #1165 (2015, pre-template-era): single free-text sentence, no template at all ("before comment of `resolveDynamicComponent` in `src/directives/repeat.js`" — a continuation of the title)
- #5645: one-line issue reference "#5604" → template, all four requirement boxes ticked, `**Other information:**` section absent
- #13216: template only; zero free text anywhere — even `Other, please describe:` left unfilled

Canonical template order (identical in all 4 template PRs): guidelines HTML comment → "What kind of change" checklist (6 options) → "Does this PR introduce a breaking change?" (Yes/No) → migration-path prompt → "The PR fulfills these requirements" checklist (4 items) → new-feature justification checklist → `**Other information:**`.

## Template usage
Strong evidence of an enforced PR template: 4 of 5 PRs contain character-identical boilerplate — the HTML comment `<!-- PULL REQUEST TEMPLATE -->` with `(Update "[ ]" to "[x]" to check a box)`, the checkbox scaffolds, and the "If yes, please describe the impact and migration path for existing applications:" prompt. The template changed slightly over time: #5645 (2017) requires submission "to the `dev` branch for v2.x … _not_ the `master` branch", while the 2024 PRs say "submitted to the `main` branch for v2.x". Conclusion: **template — but minimally filled**. Template fidelity is poor: #13216 fills nothing, #13192 answers only one prompt, and breaking-change sections always tick "No" with the migration prompt ignored. No "How Has This Been Tested"-style sections.

## Length & density
Extremely thin unique content once boilerplate is excluded:
- #13187: ~20 unique words (preamble + repeated "Other information")
- #13192: ~5 unique words ("fix link broken")
- #1165: ~9 words
- #5645: ~4 unique words ("#5604") across a +39 −5 feature change
- #13216: 0 unique words

Pattern: maximum boilerplate-to-content ratio. Even the most substantial diff (#5645, a feature adding API consistency plus tests) explains itself only via the linked issue number. Concise by default, verging on under-documented — the checkboxes carry the intent.

## Voice & tone
- Titles mix imperative ("make", "Update", "fix") and past tense ("removed", "fixed") with no consistent rule.
- The little prose that exists is terse and neutral; no first person ("I"/"we") in any description.
- Tone is informal and telegraphic ("mini change", "fix link broken") — matching the drive-by nature of the contributions. No reviewer greetings, thanks, or discussion.

## Content habits
- **Linked issues**: only #5645 links an issue, via a bare `#5604` line and the issue number in the title; the template explicitly instructs referencing issues "in the PR's title (e.g. `fix #xxx[,#xxx]`)" — the one PR with a real change is also the one that follows it.
- **Test plans**: the template's "All tests are passing" / "New/updated tests are included" checkboxes are the only test signal. #5645 ticks both (consistent with its `test/unit/specs` additions in +39/-5); #13187 and #13216 tick "tests are passing" but not "tests included"; #13192 ticks neither.
- **Breaking-change callouts**: every template PR ticks "No" to breaking change; the migration-path prompt is left blank in all of them.
- **Screenshots/images**: none in any PR.
- **Reviewer ask-outs**: none. Engagement is minimal — 0 comments on 4 of 5 PRs; the exception is #1165 from 2015 with 17 comments, a relic of the repo's more active era.

## Bot-generated content
No bot-generated content observed — no CodeRabbit summaries, no Copilot descriptions, no AI-disclosure footers in any of the 5 PRs. The uniformity here comes entirely from the repo's human-designed HTML-comment template, not from AI tooling (unsurprising: 3 PRs predate such tools, and the 2024 ones are trivial link/spelling fixes).

## Notable exemplars
- **PR #5645** — https://github.com/vuejs/vue/pull/5645 — the strongest sample: the only PR with a real code change, and the only one that fully completes the template — all four requirement boxes ticked, the issue referenced both in the title (`watch option(#5604)`) and in the body — showing the repo's intended workflow end-to-end.
- **PR #13187** — https://github.com/vuejs/vue/pull/13187 — the best free-text usage: states the problem (dead link, "currently returns HTTP 404") before the template and repeats it as a filled-in `**Other information:**`, the only PR that uses that field.
