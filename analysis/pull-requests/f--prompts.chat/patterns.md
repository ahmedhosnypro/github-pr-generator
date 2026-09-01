# PR Patterns: f/prompts.chat

## Corpus
- PRs analyzed: 5 (numbers: #1198, #1223, #1226, #1227, #1230)
- Caveat: 2 of 5 PRs are by the repo owner (f); the other 3 are first-time-looking contributors (devdynaf, octo-patch, bglglzd). All 5 carry a CodeRabbit auto-generated block, so "description" length must discount bot content. Sample is small; conclusions about contributor behavior (especially the unfilled template in #1230) rest on single instances.

## Titles
No Conventional Commits prefixes (no `feat:`/`fix:`/`docs:`) and no scope tags — plain imperative sentences:
- `Fix VS Code Copilot Chat deep links` (#1198)
- `Add translated Loop Engineering chapter` (#1227)
- `Update wording from 'prompt examples' to 'prompts'` (#1230)
- `Add MiniMax-M3 and MiniMax-M2.7 to model registry` (#1226)
- `Add validation and caps for public /api/prompts pagination` (#1223)

Pattern: capitalized imperative verb (`Fix`, `Add`, `Update`) + object. Length ~35–58 characters, single line, no emoji, no trailing period. `Add` dominates (3 of 5).

## Description structure
No single canonical structure — three distinct styles across 5 PRs:

- PR #1198 (repo-owner, template-based): `## Description` (2 prose paragraphs), `## Type of Change` (checkboxes, `- [x] Bug fix` ticked), `---`, boilerplate `## ⚠️ Want to Add a New Prompt?` section, `---`, `## Additional Notes` (validation commands as bullets).
- PR #1227 (repo-owner, freeform): `## What changed` (5 lowercase bullets), `## Why` (1 prose paragraph), `## Validation` (5 bullets of commands + a trailing plain-text note that `npx tsc --noEmit` "remains blocked by existing unrelated Prisma generated-client and test typing errors").
- PR #1230 (contributor): untouched template — `## Description` with only the `<!-- Briefly describe the changes in this PR -->` placeholder comment, empty `## Type of Change` checkboxes, boilerplate section, `## Additional Notes` with only `<!-- Any additional context or screenshots -->`.
- PR #1226 (contributor): minimal freeform — `## Summary` (2 bullets), `## Testing` (2 command bullets).
- PR #1223 (contributor): one-line prose, no headers at all ("Supersedes #1221 after restoring the source branch. Adds bounded, validated pagination…").

All headers used are `##` (H2). Lists dominate over prose in the structured PRs.

## Template usage
A repo PR template clearly exists and appears verbatim in #1198 and #1230: `## Description` → `## Type of Change` (`- [ ] Bug fix` / `- [ ] Documentation update` / `- [ ] Other (please describe):`) → `---` → a standing warning section `## ⚠️ Want to Add a New Prompt?` ("**Please don't edit `prompts.csv` directly!** Instead, visit **[prompts.chat](https://prompts.chat)** and: 1. **Login with GitHub**…") → `## Additional Notes`. Fill quality varies: #1198 fills Description and ticks a checkbox; #1230 submits the template 100% unfilled (placeholders and empty checkboxes left in, merged anyway). The other 3 PRs bypass the template entirely. Conclusion: **template exists but is optional and weakly enforced** — only 1 of 5 PRs actually fills it.

## Length & density
Human-authored content only (excluding CodeRabbit blocks and template boilerplate):
- #1198: ~90 words + 3 validation command bullets
- #1227: ~130 words across 3 sections (the largest, matching a +7252/-36, 40-file diff)
- #1230: 0 words of original content (pure template skeleton for a +1/-1 diff)
- #1226: ~40 words
- #1223: ~35 words (single sentence)

Pattern: extremely concise — 4 of 5 PRs are under ~100 words of human text, and none walk through the code. Description length does not scale with diff size (#1227's 7k-line localization gets 130 words; #1198's +38/-8 gets the longest structured treatment).

## Voice & tone
- Titles and bullets are imperative/present tense ("Add…", "Fix…", "Update…"); the two prose-heavy sections (#1198's Description, #1227's Why) are descriptive third-person ("This updates both entries to use the GitHub Copilot Chat URI handler…", "The chapter explains how to design bounded AI feedback loops…").
- No first person ("I"/"we") anywhere in the 5 descriptions.
- Neutral, engineering-register tone; no pleasantries, no reviewer-directed asks. Emoji appears only inside the repo's own template boilerplate (`## ⚠️ Want to Add a New Prompt?`), never in authored prose.

## Content habits
- **Linked issues**: none — all 5 PRs show "Linked issues: none". The only cross-reference is PR-to-PR: #1223 opens with "Supersedes #1221".
- **Test plans as command lists**: the strongest shared habit — 4 of 5 PRs enumerate exact validation commands, e.g. #1198 lists `` `npm run lint -- --quiet` ``, `` `npm --prefix packages/prompts.chat run typecheck` ``, and a targeted `vitest run`; #1227 lists `npm run lint:mdx` ("493 MDX files passed") and `node scripts/check-translations.js`; #1226 lists a targeted `npm test -- src/__tests__/lib/works-best-with.test.ts`.
- **Known-failure disclosure**: #1227 explicitly notes a pre-existing check failure kept out of scope ("`npx tsc --noEmit` remains blocked by existing unrelated Prisma generated-client and test typing errors").
- **Screenshots/images**: none in any PR — notable for #1227, which ships an interactive light/dark-mode simulator and claims "browser QA covered dark mode, light mode… RTL output" with no visual evidence attached.
- **Labels**: none on all 5 PRs. **Breaking-change callouts / reviewer ask-outs**: none.
- Fast merges: 4 of 5 merged within ~1–4 days of creation (#1198 merged 2 minutes after creation), with exactly 1 non-bot comment each — descriptions are write-once, not iterated.

## Bot-generated content
Every single PR (5 of 5) carries a CodeRabbit release-notes block delimited by `<!-- This is an auto-generated comment: release notes by coderabbit.ai -->` … `<!-- end of auto-generated comment: release notes by coderabbit.ai -->`, appended after the human description. Structure varies by PR size: #1198 gets a full scaffold (`# Fix VS Code Copilot Chat Deep Links` → `## Overview` → `## Changes Made` with `###` subsections → `## Validation`); #1227, #1230, and #1223 get a `## Summary` bullet list; #1226 gets a prose paragraph plus a `Tests:` list. These blocks are consistently **longer and more structured than the human text** — in #1230 the bot's 2-section summary is the only substantive description the PR has. Maintainers keep the blocks verbatim in the merged body (no editing or removal observed), and review volume is minimal (1–2 reviews, 1 comment each), suggesting the CodeRabbit summary functions as the de facto reader-facing description. This repo is a direct case study for AI-generated PR descriptions already being the norm.

## Notable exemplars
- **PR #1198** — https://github.com/f/prompts.chat/pull/1198 — the strongest sample: fills the repo template, explains the user-facing impact ("prompts open prefilled in VS Code") before the mechanism, names all three affected surfaces (web Run button, CLI builder, Raycast extension), and lists the exact validation commands run.
- **PR #1227** — https://github.com/f/prompts.chat/pull/1227 — best freeform structure: `What changed` / `Why` / `Validation` triage of a 40-file localization, with honest disclosure of a pre-existing `tsc` failure rather than a blanket "all checks pass".
