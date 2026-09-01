# PR Patterns: n8n-io/n8n

## Corpus
- PRs analyzed: 5 (numbers: #37304, #36808, #37347, #37345, #37357)
- Caveat: 3 of the 5 PRs are machine-authored — `n8n-assistant` (#37347, #37357, identical fully-automated descriptions) and `n8n-cat-bot` (#37345, authored by the repo's AI PR agent). Only #37304 (alexgrozav) and #36808 (Cadiac) are human-engineer PRs, and both declare AI assistance in the description body. This sample therefore characterizes a heavily AI-assisted PR pipeline as much as human writing style, and cannot represent external community contributors, who appear nowhere in the sample.

## Titles
All 5 titles follow strict Conventional Commits with an n8n-specific flavor — lowercase type, optional scope, capitalized imperative subject:
- `refactor(editor): Extract the frontend test helpers into \`@n8n/frontend-test-utils\` (no-changelog)` (#37304)
- `fix(editor): Keep AI Assistant step narration inside thinking blocks` (#36808)
- `chore: Update e2e impact map` (#37347 and #37357 — identical)
- `test: Add axe accessibility fixture for Playwright journeys` (#37345)

Convention details: types observed are `refactor`, `fix`, `chore`, `test`; the only scope used is `editor` (2 of 5). The repo enforces this — #36808's checklist links `.github/pull_request_title_conventions.md`, and #37345's checklist annotates its own title: "(scopeless `test:` — `playwright` is not in the allowed scope list; `(no-changelog)` as this is test infrastructure)". The `(no-changelog)` trailer (#37304) is a repo-specific release-note escape hatch. No emoji, no trailing periods; lengths range from 29 to ~90 characters.

## Description structure
The three substantive PRs share an identical H2 skeleton, which is the repo's PR template:

1. `## Summary` (prose, possibly with bolded sub-labels or a nested `###`)
2. `## How to test`
3. `## Related Linear tickets, Github issues, and Community forum posts`
4. `## Review / Merge checklist`

Per PR:
- #37304: `## Summary` → `### What went in` → `### How the renderer splits` → `### Boundary` → `## How to test` → `## Related Linear tickets, Github issues, and Community forum posts` → `## Review / Merge checklist`. Extra H3 sub-sections layered under Summary.
- #36808: `## Summary` (pure prose with one embedded image) → `## How to test` (5 numbered steps) → `## Related Linear tickets…` → `## Review / Merge checklist`.
- #37345: opens with a bare `Fixes DEVP-909` line, then `## Summary` (with a `### Assumptions` H3) → `## How to test` → `## Verification` (extra section, results table) → `## Not verified` (extra section) → `## Related Linear tickets…` → `## Review / Merge checklist`.
- #37347 / #37357: no headers at all — three short paragraphs of plain prose.

Structure within Summary is specification-dense: Markdown tables (#37304's test-results table; #37345's Bucket/Scope and Verification tables), fenced code blocks (bash test commands, a `defineRenderer` TypeScript snippet in #37304, a usage example in #37345), inline file paths in backticks. Lists mix bullets with numbered steps only for sequential test instructions.

## Template usage
Strong evidence of a formal repo PR template. Three independent PRs (#37304, #36808, #37345 — two humans, one bot) reproduce the exact same four H2 headers verbatim, including the awkwardly worded `## Related Linear tickets, Github issues, and Community forum posts` header, and the same five-item `## Review / Merge checklist`:
- `- [x] I have seen this code, I have run this code, and I take responsibility for this code.`
- `- [x] PR title and summary are descriptive.` (with a link to `.github/pull_request_title_conventions.md`)
- `- [ ] [Docs updated](https://github.com/n8n-io/n8n-docs) or follow-up ticket created.`
- `- [x] Tests included.`
- `- [ ] PR Labeled with \`Backport to Beta\`, \`Backport to Stable\`, or \`Backport to v1\``

Notably, authors genuinely fill the checklist rather than leaving it blank, and sometimes annotate items inline (#37345 adds a parenthetical justification to its docs and title items). The bot-authored PRs (#37345) follow the template too — it is enforced on automation, not just humans. Conclusion: **template, actively used**.

## Length & density
Bimodal distribution:
- #37304: ~650 words of body — the longest, dense architecture rationale.
- #37345: ~600 words — dependency list, fixture semantics, assumptions, verification table, unverified-path disclosure.
- #36808: ~330 words — bug narrative plus 5-step reproduction.
- #37347 / #37357: ~55 words each — terse automated boilerplate.

The human/AI-assisted PRs are long-form but high-density: little filler, sentences carry technical content ("`mockedStore` (200+ importers here, 0 in modules) and the `defaultSettings` fixture had one each"), and length comes from completeness of rationale/verification rather than padding. The automated PRs are minimal because the change is a 1-line generated diff (+1 -1).

## Voice & tone
- Mixed imperative and present-tense descriptive. Summaries lead with imperative-ish statements ("Adds `@n8n/frontend-test-utils`…", #37304) then shift to explanatory present tense describing the system ("The timeline groups text into a thinking block when trace content follows it", #36808).
- Occasional first person even from bots: "I tested this locally and this felt okay" (#36808); "I have seen this code, I have run this code" (checklist, all template PRs).
- Bolded mini-headings inside prose are a signature habit: "**Why now.**", "**Why not `@n8n/vitest-config`.**" (#37304), "**Wiring.**", "**Testability.**" (#37345) — short labeled paragraphs instead of deeper nested headers.
- Precise, confident engineering register; trade-offs are explicitly named ("The trade-off is that a missing bucket reads as 'no violations'", #37345; "Deliberately left in editor-ui: …", #37304).

## Content habits
- **Linked issues**: zero GitHub issue links in all 5 PRs ("Linked issues: none" throughout). Traceability goes through Linear instead — `https://linear.app/n8n/issue/INS-1238` (#36808), `DEVP-909` (#37345, also as `Fixes DEVP-909`), or follow-up PR references (#37304 → "the insights module package (#37030)"). The dedicated template header makes review tracking external-tool-first.
- **Test plans**: universal and concrete. Every substantive PR gives runnable commands (`pnpm turbo run test --filter=@n8n/frontend-test-utils …`, #37304) plus pass counts in tables ("1143 files, 16,287 tests pass"). #36808 gives manual reproduction steps instead; #37345 goes furthest with a `## Verification` table of 7 commands and a `## Not verified` section explicitly disclosing the unexecuted browser path ("No Playwright browser binaries are present in this environment").
- **Screenshots/images**: one — #36808 embeds a user-attachments screenshot showing the streaming bug.
- **Breaking-change callouts**: none observed; design decisions are framed as "Boundary" / "Assumptions" sections instead.
- **Reviewer ask-outs**: none; the merge checklist itself is the sign-off mechanism.
- **Labels**: `cla-signed` on all 5; `n8n team` on the human PRs; `automation:scheduled-update` on the two bot PRs; `Reviewers auto-assigned` on the cat-bot PR.

## Bot-generated content
Pervasive — this repo has multiple overlapping AI/automation layers:

1. **cubic review badge in every PR description (5/5)**: the block `<!-- This is an auto-generated description by cubic. -->` followed by a "Review in cubic" image link appears verbatim in all five PRs, appended after the human/template content. Maintainers leave it in place — it is tolerated appendage, not integrated into the description structure.
2. **AI-authorship disclosures in human PRs**: #37304 ends `🤖 Generated with [Claude Code](https://claude.com/claude-code)`; #36808 ends `🤖 PR Summary generated by AI`. The summaries themselves are high-quality and personalized, suggesting AI drafting with heavy human curation rather than raw dumps.
3. **Fully bot-authored PRs that are merged**: #37347/#37357 (n8n-assistant, "Generated by the E2E coverage nightly") and #37345 (n8n-cat-bot, "🐱 Opened by [cat-bot]… Review the changes; close if the approach is wrong."). Notably the cat-bot PR (#37345) is one of the most thorough descriptions in the sample — it fills the full template, documents assumptions, and includes a "Not verified" section.

These are direct evidence of production AI-generated PR descriptions being merged as-is; the template structure is what keeps them coherent.

## Notable exemplars
- **PR #37304** — https://github.com/n8n-io/n8n/pull/37304 — the strongest: an architecture-decision record disguised as a PR description, with "Why now"/"Why not" counters, an explicit boundary section, and a quantified results table; everything a reviewer needs without opening the diff.
- **PR #37345** — https://github.com/n8n-io/n8n/pull/37345 — proof that an AI-authored PR can clear a high bar: full template, `### Assumptions` section naming what the ticket left unspecified, and an honest `## Not verified` section distinguishing what was checked from what was assumed.
