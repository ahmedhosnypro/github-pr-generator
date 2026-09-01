# PR Patterns: nextlevelbuilder/ui-ux-pro-max-skill

## Corpus
- PRs analyzed: 5 (numbers: #447, #452, #458, #461, #464)
- All 5 PRs are by *different* authors (tuananh31j, Fermilus-coder, djatadougbewilfried-star, loulanyue, binyangzhu000-sudo), all merged 2026-08-24 → 2026-08-27 with exactly 1 review and 0 comments each. This is a contributor-driven repo (not maintainer-authored PRs), so the sample reflects what external contributors submit against an apparent repo template — but 5 PRs is still a small sample for repo-wide claims.

## Titles
All 5 titles are strict Conventional Commits with a lowercase type and a scoped, lowercase description:
- `docs: add Vietnamese README` (#452)
- `test(cli): add droid to script-path rendering coverage` (#458)
- `test(brand): decode subprocess output as UTF-8 so the suite can pass on Windows` (#461)
- `fix(cli): detect .claude-plugin directory for Claude Code in detectAIType` (#464)
- `feat(design): add optional Atlas Cloud logo provider` (#447)

Pattern: `<type>(<scope>): <lowercase imperative>`. Types seen: `docs`, `test` (2×), `fix`, `feat`. 4 of 5 carry a parenthesized scope (`cli` 2×, `brand`, `design`); only the docs PR is unscoped. Lengths 26–77 characters, no emoji, no trailing period, everything after the colon lowercase. The checklist in #452 explicitly cites the convention: "Commit messages follow [[Conventional Commits]…] (`docs: add Vietnamese README`)".

## Description structure
Two distinct skeletons appear, both built from `##` (H2) headers:

Skeleton A — "What/Why/Checklist" (3 PRs, #452, #461, #447):
- `## What does this PR change?` → 1–2 prose sentences
- `## Why?` → 1–2 prose sentences
- (optionally a middle section: #461 inserts `## What the new test covers`, #447 inserts `## Validation`)
- `## Checklist` → 4–5 checked `- [x]` items

Skeleton B — "Summary/Tests" (2 PRs, #458, #464):
- `## Summary` → bulleted list (3 bullets in #458, 2 in #464)
- `## Test plan` (#458) or `## Tests` (#464) → checklist / command bullets

Exact headers quoted: #452 uses `## What does this PR change?`, `## Why?`, `## Checklist`; #458 uses `## Summary`, `## Test plan`; #461 uses `## What does this PR change?`, `## Why?`, `## What the new test covers`, `## Checklist`; #464 uses `## Summary`, `## Tests`; #447 uses `## What does this PR change?`, `## Why?`, `## Validation`, `## Checklist`. Within each skeleton the ordering is identical every time. Content mixes short prose paragraphs in What/Why with bullet lists elsewhere.

## Template usage
Strong evidence of a real PR template with (at least) a checklist scaffold. The `## Checklist` items recur near-verbatim across three different authors:
- #452: "- [x] Commit messages follow [[Conventional Commits]…]" and "- [ ] This PR targets a feature branch, not pushed directly to `main`"
- #461: "- [x] Commit message follows Conventional Commits." / "- [x] Targets a feature branch." and "- [x] Ran `npm run sync:assets && npm run check:assets` in `cli/`"
- #447: "- [x] Ran `npm run sync:assets && npm run check:assets` in `cli/`" / "- [x] Commit message follows Conventional Commits" / "- [x] This PR targets a feature branch, not `main`"

#461 even quotes the template's own wording while explaining a deviation: "The template's `src/ui-ux-pro-max/` wording does not apply: `brand` has no `src/` copy." Checklists are conscientiously filled — items not applicable are marked "N/A —" with a reason (#452: "N/A — This is a documentation-only change…") rather than deleted. One template-prompt slip: #452 left "- [ ] This PR targets a feature branch" unchecked despite apparently satisfying it. Conclusion: **template** — a repo-enforced scaffold (What/Why/Checklist), with a lighter Summary/Test-plan variant used for small changes.

## Length & density
Highly variable but skewing substantive:
- #464: ~40 words (tersest; Summary + Tests for a 1-line fix)
- #452: ~70 words (docs-only)
- #447: ~150 words (largest change, +968/-232, 8 files)
- #458: ~180 words for a 1-line test addition
- #461: ~450 words — by far the longest, with a byte-level table, a pasted reproduction log, and a mojibake walkthrough

Pattern: description length tracks *explanation need*, not diff size — #458 (+1 line) and #461 (+70 lines) get long rationales because the bug/risk is subtle, while #447's large feature gets a proportionally shorter one. Density is high: little filler, sentences carry specifics (file paths, byte values, command names).

## Voice & tone
- Descriptive present tense in headers/bodies ("Adds", "Ensures", "Pins"); imperative mainly in titles and checklist phrasing.
- Essentially third-person/impersonal — no "I"; "we" appears only in quoted error output. #458 addresses the reviewer obliquely: "please let CI confirm."
- Register is informal-engineering: precise but conversational, e.g. #461: "the test's own `assert …` then fails with — of all things — a `TypeError`" and "**The existing test survives today only by luck**".
- #461 uses a markdown table (Line/Message/Byte) and fenced code blocks for the Python snippet and the reproduction log; other PRs stick to bullets and inline code.

## Content habits
- **Linked issues / cross-PR references**: no "Fixes #N" or linked issues anywhere (all 5 show "Linked issues: none"). Cross-PR references do appear: #461 calls itself "the follow-up promised in #460" and closes with "Independent of #460 — either can merge first".
- **Test plans / verification**: universal — every PR states what was run. #464: "`npm run verify:data` (153 python tests, 35 CSV validations, agent guide checks passed)"; #447 lists 7 verification steps including "Live Atlas generation reached `completed`"; #458 honestly flags a gap: "[ ] Could not run the Playwright suite locally (no Node/npm/bun available in this environment) — please let CI confirm."
- **Assets-sync ritual**: the two PRs touching `.claude/skills/` (#461, #447) both attest "Ran `npm run sync:assets && npm run check:assets` in `cli/`" — a repo-specific two-copies discipline.
- **File-path precision**: descriptions name exact paths constantly (`cli/src/utils/detect.ts`, `sync-brand-to-tokens.cjs:132`), often with line numbers.
- **Screenshots/images**: none. **Breaking-change callouts / reviewer ask-outs**: none beyond the implicit CI ask in #458. **Labels**: none on any of the 5 PRs.

## Bot-generated content
No bot-generated description content: no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot summaries, no AI-disclaimer footers in any of the 5 PRs. The prose quirks (e.g. #461's em-dash asides and byte-table reasoning) and the hand-annotated "N/A —" checklist items read as human-authored. The repeated What/Why/Checklist skeleton stems from the repo template, not from a generation bot.

## Notable exemplars
- **PR #461** — https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/pull/461 — exemplary root-cause write-up: a byte-level table of the three failing emoji, a pasted reproduction log with mojibake output, an explanation of why the old test "survives today only by luck", and explicit proof the new test is a real regression test ("with the `encoding="utf-8"` line removed it fails"), all wrapped around the standard template checklist.
- **PR #458** — https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/pull/458 — shows how to justify a 1-line test addition: explains the naming-mismatch hazard ("`.factory` doesn't match its platform identifier (`droid`)") and transparently marks the one verification step it could not perform, deferring to CI.
