# PR Patterns: microsoft/vscode

## Corpus
- PRs analyzed: 5 (numbers: #332931, #333050, #333130, #333138, #333398)
- Caveat: all 5 PRs are by the same author (sandy081), merged within a 3-day window (2026-08-27 → 2026-08-30); this reflects one maintainer's PR style, not necessarily repo-wide convention. Sample is too small and homogeneous to generalize across all vscode contributors.

## Titles
All 5 titles follow a scope-prefix convention resembling Conventional Commits but without standard types (no `feat:`/`fix:`):
- `sessions: Show chat status on its owning row` (#332931)
- `agentHost: inherit isolation in created sessions` (`feat:`/no — lowercase verb after colon)
- `sessions: Reveal nested chat twistie on hover` (#333130)
- `sessions: Add spacing between session list rows` (#333138)
- `agentHost: Avoid restarting active session listings` (#333398)

Pattern: `<area>: <imperative verb> <object>`. Only two scope values observed: `sessions` (3×) and `agentHost` (2×). Casing after the colon is inconsistent: capitalized verb in 3 of 5 (`Show`, `Reveal`, `Add`) vs lowercase `inherit` and capitalized `Avoid` — actually 4 of 5 are capitalized; only #333050 (`inherit`) is lowercase. Lengths are ~30–45 characters, single line, no emoji, no trailing period.

## Description structure
Descriptions consistently use `##` (H2) section headers with bulleted lists, light or no prose preamble. Per PR:

- PR #332931: one-line preamble ("Follow-up to #332922."), then "## What changed" (4 bullets), "## Validation" (4 bullets)
- PR #333050: no preamble; "## Summary" (3 lowercase bullets), "## Validation" (7 bullets)
- PR #333130: one-line preamble ("Follow-up to #332931."), "## What changed" (5 bullets), "## Validation" (4 bullets)
- PR #333138: outliers — two prose paragraphs ("Adds a small vertical gap between session and nested chat rows…", "The spacing is owned by the Sessions list instance…"), then a `Tests:` plain-text label (not a markdown header) with 3 bullets. No `##` headings at all.
- PR #333398: "Fixes #333284" line, "## What changed" (3 bullets), "## Why" (one prose paragraph with concrete numbers: "one request traversed 11 computations and remained pending for approximately 396 seconds"), "## Validation" (4 bullets)

Canonical order observed: [optional context line] → What changed/Summary → Validation. "Validation" appears in 4 of 5 PRs; "What changed" in 3 of 5.

## Template usage
No evidence of a formal repo PR template: no checklists (`- [ ]`), no boilerplate instructions, no "How Has This Been Tested"-style scaffold, no leftover template prompts. However, the near-identical "## What changed" / "## Validation" pairing across 4 of 5 PRs functions as an informal template — repeated structure, but authored fresh each time (bullet content and wording vary). Conclusion: **freeform with strong self-imposed structure** (one author's personal template), not a repo-enforced template.

## Length & density
Very short descriptions:
- #332931: ~50 words of body across 2 sections
- #333050: ~50 words
- #333130: ~55 words
- #333138: ~50 words (prose-dense, fewest bullets)
- #333398: ~90 words (longest, includes the "Why" paragraph)

All under ~100 words; none exceed one screen. Pattern: extremely concise — bullets state outcomes ("Add focused regression coverage for status ownership…"), not code-walkthroughs. The change-size stats are modest (+85 to +199 additions), matching the short descriptions.

## Voice & tone
- Imperative/mood-present tense verbs in titles and bullets: "Show", "Add", "Keep", "Remove", "Preserve", "Replace".
- Third-person/neutral voice; no first person ("I", "we") anywhere in the 5 descriptions.
- Formal, terse, engineering-register prose. Occasional precision with numbers: #333398 cites "11 computations… approximately 396 seconds".
- Bold emphasis used once for a UX state: "**Input Needed**" in #332931.

## Content habits
- **Linked issues**: 4 of 5 PRs link no issue. #333398 uses "Fixes #333284" as its opening line. Two PRs instead reference prior PRs as follow-ups (#332931 → #332922; #333130 → #332931) and #333398 cross-references related PRs inline (#331679, #331176).
- **Test plans**: systematic — a "Validation" (or "Tests:") section in every PR enumerates the exact commands run, e.g. `npm run compile`, `npm run hygiene`, `./scripts/test.sh --run src/vs/platform/agentHost/test/node/sessionServerTools.test.ts`, with numerals for test counts ("76 Sessions list tests", "(395 passing)").
- **Screenshots/images**: none in any of the 5 PRs — notable given 3 of 5 are UI/UX changes (hover twisties, row spacing, status icons).
- **Breaking-change callouts / reviewer ask-outs**: none observed.
- **Labels**: `on-testplan` on 4 of 5 PRs (#333398 has no labels), consistent with the test-plan habit.

## Bot-generated content
No bot-generated description content observed — no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot-generated summaries, and no AI-disclaimer footers in any of the 5 PRs. (#333050's validation list mentions a "Copilot prompt snapshot replay (22 tests)" — a test-suite artifact, not generation of the PR description.) These descriptions read as human-written, tightly edited maintainer notes; with only 5 single-author samples, we cannot rule out AI assistance entirely, but there is no structural signature of it.

## Notable exemplars
- **PR #333398** — https://github.com/microsoft/vscode/pull/333398 — the strongest sample: it opens with "Fixes #333284", separates "## What changed" from a quantified "## Why" (11 computations, 396-second hang), and lists verbatim validation commands; a complete audit trail in ~90 words.
- **PR #333050** — https://github.com/microsoft/vscode/pull/333050 — best validation section: 7 concrete commands including targeted test-file invocation and snapshot replay count, making the change easy to verify independently.
