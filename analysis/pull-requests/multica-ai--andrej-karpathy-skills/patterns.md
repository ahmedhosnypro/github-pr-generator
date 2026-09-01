# PR Patterns: multica-ai/andrej-karpathy-skills

## Corpus
- PRs analyzed: 5 (numbers: #51, #7, #93, #92, #95)
- Caveat: small sample from a small documentation-style repo (Karpathy prompt-guidelines skills). All 5 PRs are additive-only (stats like `+2 -0`, `+522 -0`, `+169 -0`, `+102 -0`, `+4 -0`), touch 1–3 files, carry no labels, and have 0 reviews (0–3 comments each). Four distinct authors (forrestchang, josepha-mayo, herobrine19 ×2, azakharko), so authorship is reasonably diverse, but every PR is a docs/config README-class change — no code-fix or feature PRs exist in the sample, so conclusions apply to doc changes only.

## Titles
- 4 of 5 titles are bare imperative sentences starting with "Add": `Add Multica link at the top of README` (#51), `Add examples of common mistakes on each principles` (#7 — note the grammatical slip, kept unedited), `Add Chinese translation for README` (#93), `Add Cursor project rule and CURSOR.md setup guide` (#92).
- 1 of 5 uses a Conventional-Commits-style prefix: `docs: Sync Chinese README with English version (add Cursor section)` (#95). No `feat:`/`fix:` types observed; `docs:` appears once.
- No emoji, no trailing periods, sentence-case everywhere. Lengths ~35–66 characters. #95 uses parenthetical scope/qualifier `(add Cursor section)` — the only qualifying suffix in the sample.

## Description structure
Structures vary widely; no consistent skeleton:
- #51: `## Summary` (1 bullet: "Add a prominent link to [Multica]… for discoverability and traffic.") then `## Changes` (one short prose sentence). H2 headers.
- #7: no markdown headers at all. Opens with a first line restating the title ("Add examples of common mistakes for each principle"), then a prose paragraph plus two nested bullet groups ("Each example includes: - Real code patterns (not toy examples)…"), ending with a justification paragraph referencing the README's "real-world examples" section.
- #93: two bare bullets, no headers: "- Add README.zh.md with full Chinese translation / - Add language switcher link in original README.md".
- #92: `## Summary` (one prose paragraph), `## Changes` (file-by-file list naming `.cursor/rules/karpathy-guidelines.mdc`, `CURSOR.md`, `README.md`), `## Notes` (scope clarifications: "No change to .claude-plugin/ … Claude users are unaffected.").
- #95: a single line identical to the title ("Sync Chinese README with English version (add Cursor section)").

Where headers exist they are H2 (`##`). Mixed prose-plus-bullets in #7 and #92; pure bullets in #51 and #93.

## Template usage
No evidence of a repo PR template: zero checklists (`- [ ]`), no boilerplate scaffold ("How Has This Been Tested", "Screenshots", etc.), no leftover template prompts. The `## Summary` / `## Changes` pairing in #51 and #92 recurs across two different authors, suggesting a loose community convention (or AI-assist default), but #7, #93, and #95 ignore it entirely. Conclusion: **freeform**, with a light emergent Summary/Changes habit in a minority of PRs.

## Length & density
- #51: ~25 words
- #7: ~130 words (longest; matches its size, +522 lines of examples content)
- #93: ~15 words
- #92: ~115 words
- #95: ~9 words (description duplicates the title)

Median is a handful of words. For trivial diffs (#51: +2 lines; #95: +4 lines) the one-liner descriptions are proportionate; only #7 and #92 invest in explanation, and both are the two largest diffs. Density scales with diff size — no over-explained tiny changes and no under-explained large ones in this sample.

## Voice & tone
- Imperative / present-tense descriptive verbs throughout: "Add a prominent link…", "Adds EXAMPLES.md…", "Adds first-class support for Cursor…".
- No first person ("I"/"we") in any of the 5 PRs; neutral third-person register.
- Informal-to-neutral engineering tone; #7 reads like a commit-message body expanded into paragraphs (line-wrapped, mentions "LLMs commonly do"). No humor, no marketing language except #51's candid motivation "for discoverability and traffic".

## Content habits
- **Linked issues**: none of the 5 PRs link or close any issue — no "Fixes #N" anywhere. #7 instead hand-references the README ("Addresses the need for tangible examples mentioned in README's 'real-world examples' section").
- **Test plans / validation**: absent in all 5, consistent with docs-only changes. "Claude users are unaffected" (#92, Notes) is the closest thing to a regression statement.
- **Screenshots / images**: none, even for the README changes (#51, #93) where a visual would fit (“top of the README” link, language switcher).
- **Breaking-change callouts / reviewer ask-outs**: none. #92's `## Notes` section ("No change to .claude-plugin/…; Cursor does not read CLAUDE.md by default") functions as a pre-emptive scope clarification, the closest analog.
- **Labels**: none on any PR. **Reviews**: 0 across the board; merges appear to be quick maintainer self- or drive-by merges (e.g. #51 merged 4 minutes after creation; #93 and #92 merged minutes apart on the same day).

## Bot-generated content
No bot-generated description content observed — no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot summaries, no AI-disclaimer footers. Body comments, where they exist (0–3 per PR), are not included in the corpus, so bot review activity cannot be ruled out, but the descriptions themselves carry no AI-generation signature and read as human-written (including the unedited grammar slip in #7's title).

## Notable exemplars
- **PR #92** — https://github.com/multica-ai/andrej-karpathy-skills/pull/92 — the strongest sample: `## Summary` / `## Changes` / `## Notes` with a file-by-file breakdown and explicit out-of-scope statement ("Claude users are unaffected"), giving a reviewer everything needed without reading the diff.
- **PR #7** — https://github.com/multica-ai/andrej-karpathy-skills/pull/7 — most substantive description: explains what each of the four principle examples demonstrates, lists what every example contains, and ties the PR to a stated gap in the README in lieu of an issue link.
