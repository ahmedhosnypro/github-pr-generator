# PR Patterns: airbnb/javascript

## Corpus
- PRs analyzed: 5 (numbers: #3153, #2389, #2620, #3229, #17)
- Caveat: 5 PRs by 5 different authors (prateekbisht23, gabrielslach, bertho-zero, eduardbar, ryun), spanning 2012–2026. All are tiny changes (largest: +19 -0 across 2 files; three are single-line edits to the style-guide README). The sample is highly heterogeneous across time and authors, so per-author habits vary wildly; the only safe generalization is about what *kind* of change gets merged here (small editorial/rule-doc fixes), not about a uniform house style.

## Titles
Mixed conventions — no single enforced format:
- `docs: add note about ESLint --ext for .jsx files (see eslint/eslint#1402)` (#3153) — Conventional Commits type `docs:`, lowercase after colon, cross-repo issue reference in parentheses
- `Update ARIA roles link` (#2389) — plain imperative, capitalized, no prefix
- `fix: allow block comments with multiple *` (#2620) — Conventional Commits type `fix:`, lowercase
- `fix: use single quotes in nested ternary bad example (section 15.6)` (#3229) — Conventional Commits with a precise locator `(section 15.6)` in parentheses
- `stray character 'i'` (#17) — 2012-era: just the problem stated, all lowercase, no verb

Pattern: 3 of 5 use Conventional Commits (`docs:`, `fix:` ×2); these are also the 3 most recent. Types observed are only `docs` and `fix` — consistent with the label taxonomy (`editorial` on #3153/#2389/#3229; `semver-patch: loosen/fix/document rules` on #2620). No emoji, no trailing periods, lengths ~25–65 chars.

## Description structure
No consistent structure; formality scales with author and era:
- #3153: 3 short prose paragraphs, no headings; ends with `Fixes #1402`
- #2389: one line — `deprecated link` (the entire description)
- #2620: one sentence plus a fenced ```js code block showing the comment style to allow
- #3229: fully sectioned with `##` (H2) headers, in order: `## Summary` (starts `Related to #3152`), `## Change` (contains a ```diff block), `## Why` (3 bullets), `## Scope` (one sentence: "This is a two-line documentation fix. No logic changes, no new content.")
- #17: empty description

Canonical order in the one structured sample: Summary → Change → Why → Scope. Lists are used (#3229's "Why" bullets) alongside prose; code and diff fences are the dominant visual device (in #2620 and #3229).

## Template usage
No evidence of a repo PR template: no checklists (`- [ ]`), no "How Has This Been Tested"-style scaffolds, no repeated boilerplate across PRs, no unfilled template prompts. The sectioned layout of #3229 is a single contributor's self-imposed structure, absent from every other sample. Conclusion: **freeform**.

## Length & density
Skews extremely short; 4 of 5 descriptions are under 60 words:
- #3153: ~55 words
- #2389: 2 words
- #2620: ~6 words plus a 4-line code block
- #3229: ~150 words — the clear outlier, roughly 3× the next longest
- #17: 0 words

Pattern: terse descriptions matched to tiny diffs (three PRs are single-line changes). Verbosity is the exception, and even the verbose PR is still scannable and mostly code.

## Voice & tone
- Descriptive/imperative third person dominates; prose states what the change does ("This PR updates the README(s)", #3153; "This fixes the `// bad` example to match", #3229).
- First person appears once and softly: #3229's "While investigating … I found a separate but related inconsistency".
- Tone ranges from bare-minimum casual (#2389: "deprecated link") to careful and justificatory (#3229 quotes the rule it enforces: `'Use single quotes '' for strings.' eslint: quotes`). No humor, no emoji, no exclamation.

## Content habits
- **Linked issues**: referenced in 3 of 5 — #3153 uses `Fixes #1402` as its closing line; #3229 opens with `Related to #3152`; #3153's title also cites the upstream `eslint/eslint#1402`. Notably, the corpus header says #3153 fixes #1402, which is an issue in this repo whose number also matches the upstream eslint issue — the description links it once, plainly.
- **Code/diff blocks**: the defining habit — fenced ```js (#2620) and ```diff (#3229) blocks do the explanatory work that prose would elsewhere.
- **Screenshots/images**: none (all changes are text/config, so none warranted).
- **Test plans**: none — no testing sections at all; #3229 instead disclaims scope ("No logic changes, no new content"), which is this sample's nearest equivalent.
- **Breaking-change callouts / reviewer ask-outs**: none observed.
- Review engagement is low: 0–3 reviews and 0–1 comments per PR, consistent with trivially reviewable editorial diffs.

## Bot-generated content
No bot-authored content in any of the 5 PRs — no CodeRabbit summary blocks, no Copilot markers, no release-note automation. Even the most structured description (#3229) has a hand-authored, issue-specific narrative ("While investigating the semicolon consistency reported in issue #3152, I found…") with no bot signature. Caveat: with 5 disparate samples this rules out only these five, not repo-wide bot usage.

## Notable exemplars
- **PR #3229** — https://github.com/airbnb/javascript/pull/3229 — the strongest sample: Summary → Change → Why → Scope, a quoted rule as ground truth, a minimal ```diff, and an explicit scope disclaimer; complete justification for a 2-line change in ~150 words.
- **PR #2620** — https://github.com/airbnb/javascript/pull/2620 — the best minimal sample: one sentence plus a 4-line code block communicates the entire intent; a model of proportionality for a 1-line rule fix.
