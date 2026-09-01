# PR Patterns: jwasham/coding-interview-university

## Corpus
- PRs analyzed: 5 (numbers: #1552, #1550, #1558, #11, #1347)
- Caveat: the sample spans 2016–2024 and 5 different authors (sjtushi, wiirios, ru44, Carmezim, bahriddeen), all making tiny documentation/translation edits (+4/-4 to +12/-13, always exactly 1 file). This repo is primarily a Markdown study guide, so the sample reflects drive-by contributor PRs to a content repo — not code PRs, and not maintainer PR style. Conclusions apply to external-contributor doc edits only.

## Titles
No Conventional Commits, no scope prefixes, no emoji. Short plain English:
- `Add free linux commands tutorials and DevOps section` (#1552)
- `Fix PT-BR translations errors` (#1550)
- `Update README-ar.md` (#1558)
- `Fixing typos.` (#11)
- `Update README-uz.md` (#1347)

Patterns: imperative or gerund verb ("Add/Fix/Update/Fixing") + object, ~30–55 characters, sentence-case. Two titles name the exact file being changed (`README-ar.md`, `README-uz.md`). Casing is sloppy in places ("linux", trailing period on #11).

## Description structure
No section headers at all in any of the 5 PRs. Three formats appear:
- Prose paragraph(s): #1552 (two paragraphs — self-promotion pitch + polite close), #1558 (one sentence explaining credentials/motivation: "As a native Arabic speaker from Saudi Arabia, I identified some Arabic typos…"), #1347 (two short paragraphs: what + why).
- Bullet list: #1550 — a plain `- ` list of 3 edits, one bullet quoting the literal line text being fixed (`"Como a troca de contexto…"` add link).
- One-word minimum: #11 — the entire description is `Oops.`

## Template usage
No template evidence whatsoever: no `- [ ]` checklists, no boilerplate, no "How Has This Been Tested"-style scaffold, no unfilled prompts. Every description is freeform prose or a bare bullet list. Conclusion: **freeform** — this repo has no enforced PR template for these contributions.

## Length & density
Extremely short — the corpus is dominated by micro-descriptions:
- #1552: ~65 words (the longest, and it is mostly an advertisement for the author's platform)
- #1558: ~22 words
- #1347: ~22 words
- #1550: ~30 words across 3 bullets
- #11: 1 word (`Oops.`)

Median is ~20–30 words. Density tracks the diff size (≤13 changed lines); nothing here justifies more, but #11 carries no information at all beyond the title.

## Voice & tone
Informal, first-person, personal-pitch voice — the opposite of terse maintainer register:
- First person in 3 of 5: "I work at LabEx…" (#1552), "As a native Arabic speaker from Saudi Arabia, I identified…" (#1558), and #1550's bullets are author notes.
- Polite but casual closings: "Please let me know if any changes are needed." (#1552).
- Lowest register: "Oops." (#11).
No imperative-address to reviewers, no formal specification tone anywhere.

## Content habits
- **Linked issues**: none — 0 of 5 PRs use "Fixes #N" or link any issue.
- **Test plans / validation**: none — expected for Markdown-only edits, but even #1550 (which removed a dead video link) gives no verification beyond quoting the line.
- **Screenshots/images**: none.
- **Breaking-change callouts / reviewer ask-outs**: none substantive; #1552's "Please let me know if any changes are needed" is the only reviewer-directed sentence.
- **Labels**: none on any PR, ever.
- **Reviews/comments**: 4 of 5 PRs were merged with 0 comments and 0 reviews — review is cursory; maintainer merges small doc fixes quickly (all 2024 PRs were batch-merged on 2024-12-05).
- Distinctive habit for translation PRs: contributors justify fixes with native-speaker authority ("native Arabic speaker", #1558) rather than with sources.

## Bot-generated content
None. No CodeRabbit/Copilot summaries, no AI-disclosure footers, no auto-generated release notes in any of the 5 descriptions. All text reads as hand-written by individual contributors; only #11 could not even be characterized either way (one word).

## Notable exemplars
- **PR #1550** — https://github.com/jwasham/coding-interview-university/pull/1550 — the clearest sample: three bullets enumerate each edit, one quoting the exact translated line affected, making a doc-only change reviewable at a glance.
- **PR #1558** — https://github.com/jwasham/coding-interview-university/pull/1558 — best justification-in-one-sentence: states qualification (native speaker) and defect class (typos, word-for-word mistranslations) in 22 words.

Note: #11 is the counterexample in this corpus — a merged PR whose entire description is "Oops.", indicating zero description standards are enforced for trivial typo fixes.
