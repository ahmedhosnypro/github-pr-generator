# PR Patterns: jlevy/the-art-of-command-line

## Corpus
- PRs analyzed: 5 (numbers: #476, #469, #409, #543, #682)
- Caveat: this is a documentation/curated-guide repo (a single README-style document plus translations), not a code product, so PR conventions reflect doc-editing workflows. The sample spans 2016–2020 and mixes authors: 2 PRs by the maintainer (jlevy: #476, #543) and 3 by external contributors (#469, #409, #682) — heterogeneous in author and in change size (+1 -1 typo fix up to +641 -17 translation). 5 samples over 4 years is sparse; treat conclusions as indicative only.

## Titles
No conventional-commit usage, no scope prefixes, no emoji. Titles are short freeform phrases, mostly sentence-like:
- `Update authors.` (#476 — trailing period, terse)
- `Add missing backticks around a parameter` (#469 — imperative, no period)
- `uk: Stylistic changes.` (#409 — the only scoped title, using a language-code prefix `uk:` for the Ukrainian translation)
- `Another couple uconv examples I find useful.` (#543 — first-person, conversational)
- `complete, most up-to-date translation into Polish language` (#682 — descriptive phrase, no verb, odd capitalization)

Pattern: no enforced convention at all. Lengths ~25–60 characters. Casing varies (sentence case dominant; #682 lowercase throughout). Verb-first titles appear in 2 of 5 (#476, #469).

## Description structure
No section headers anywhere — no `##`/`###` markdown headings, no "Changes"/"Testing" scaffolds. Structure per PR:

- PR #476: `(empty)` — no description at all
- PR #469: `(empty)` — no description at all
- PR #409: single one-line sentence: "Fix smaller Ukrainian misspelling and incorrect translations."
- PR #543: single one-line justification: "Always hard to remember and look up, so worth listing here."
- PR #682: the only multi-part body — opens with `Fixes #631`, then a short greeting ("Hello,"), context ("the previous attempt of translating this into Polish seems to be stalled since over 6 months ago"), a readiness statement ("This one is ready to be merged."), and an invitation for review ("any additional hints, typo-fixes, style corrections, etc. are welcome").

Order in the only structured PR (#682): linked-issue line → greeting/context → status → reviewer invitation. Lists: none observed; everything is prose or empty.

## Template usage
No evidence of any PR template: no checklists (`- [ ]`), no boilerplate scaffold, no unfilled template prompts, and 2 of 5 PRs have completely empty descriptions — which a template would normally prevent. Conclusion: **freeform, no template** (not even an informal repeated structure — the two non-empty single-line descriptions share no format).

## Length & density
Extremely terse:
- #476: 0 words
- #469: 0 words
- #409: 8 words
- #543: 12 words
- #682: ~60 words (by far the longest)

Median non-empty body is a single sentence. The pattern holds even for a large change: #682 touches 18 files (+641 -17) yet uses ~60 words, while #476 (+24 -18) and #469 (+1 -1) justify themselves by title alone. Density matches the repo's doc-fix nature: small diffs are considered self-explanatory.

## Voice & tone
Mixed, informal, and personal — the opposite of a house style:
- Imperative in the shortest body: "Fix smaller Ukrainian misspelling…" (#409).
- First person in 2 of 3 non-empty bodies: "Another couple uconv examples I find useful" (#543, title) and #682's "let me try with my version :)", "I did my best to get rid of any mistakes".
- Emoticon use: `:)` in #682.
- #682 is explicitly polite/community-oriented ("Hello,", "any additional hints… are welcome"), reflecting an external contributor addressing the maintainer; the maintainer's own PRs (#476, #543) are bare or offhand.

## Content habits
- **Linked issues**: 1 of 5 — #682 opens with "Fixes #631". The other 4 link nothing.
- **Test plans / validation**: none in any PR (unsurprising for prose documentation changes; no CI-oriented verification is mentioned).
- **Screenshots/images**: none.
- **Breaking-change callouts**: none.
- **Reviewer ask-outs**: #682's "any additional hints, typo-fixes, style corrections, etc. are welcome" is the only explicit review invitation.
- **Labels**: none on any of the 5 PRs.
- Review activity is minimal (0 reviews on 4 of 5 PRs; #682, the large translation, drew 3 reviews and 4 comments), and descriptions are not used to solicit or structure review, except #682.

## Bot-generated content
None. Sample predates CodeRabbit/Copilot-era tooling, and no bot summaries, AI-disclaimer footers, or generated structure appear in any of the 5 PRs — including the 2020 PR (#682). All bodies read as plainly human-written.

## Notable exemplars
- **PR #682** — https://github.com/jlevy/the-art-of-command-line/pull/682 — the strongest by default and the only complete one: links its issue (`Fixes #631`), explains why a duplicate translation attempt exists (prior attempt "stalled since over 6 months ago"), states readiness, and invites corrections. For a 641-line addition, though, it omits any summary of what the translation covers or how it was checked.
- **PR #543** — https://github.com/jlevy/the-art-of-command-line/pull/543 — a model of minimal-but-sufficient for a tiny addition: one sentence ("Always hard to remember and look up, so worth listing here.") conveys both motivation and fit for the document; nothing more was needed.

Overall this repo is a **counterexample** to structured PR writing: 2 of 5 sampled PRs ship with empty descriptions and none use any template, headers, or validation notes — viable here only because changes are doc edits whose diffs are self-reviewing.
