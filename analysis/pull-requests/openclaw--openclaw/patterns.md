# PR Patterns: openclaw/openclaw

## Corpus
- PRs analyzed: 5 (numbers: #120900, #130993, #128995, #128223, #123535)
- Authors: jesse-merhi (×2: #120900, #123535), VACInc (#130993), roboclaw-bot (#128995 — a bot-named account), 8exgh (#128223). Four distinct identities across 5 PRs — reasonably diverse authorship, but the sample is still small and 3 of 5 PRs use an identical section scaffold, so conventions observed may reflect one enforced pipeline rather than organic variety.
- Merge window: 2026-08-15 → 2026-08-30. Two PRs carry `rating:` labels with mollusk emoji (`🐚 platinum hermit`, `🦐 gold shrimp`, `🦪 silver shellfish`) and `proof:`, `merge-risk:`, `status:` labels — evidence of a heavily label-instrumented review pipeline.

## Titles
All 5 titles are strict Conventional Commits, lowercase after the colon, no trailing period, no emoji:
- `feat(ui): review install policy warnings` (#120900)
- `fix: Responses sessions compact before reaching context limit` (#130993)
- `feat: make full session actions available from chat header` (#128995)
- `fix(cli): resolve alias targets from the write snapshot` (#128223)
- `fix(ui): avoid session catalog refresh storms` (#123535)

Pattern: `<type>(<scope>)?: <lowercase imperative clause>`. Types observed: only `fix` (3×) and `feat` (2×). Scope present in 3 of 5 (`ui` 2×, `cli` 1×); unscoped titles start with a capitalized subsystem noun instead (`Responses`, `make full session...` — only #130993 capitalizes the subject as a proper-noun product surface). Lengths ~33–62 characters.

## Description structure
Two distinct structural regimes, both using `##`(H2) top-level headers:

**Regime A — canonical four-section scaffold** (3 of 5 PRs, by three different authors — #128995, #128223, #123535), exact headers in exact order:
1. `## What Problem This Solves`
2. `## Why This Change Was Made`
3. `## User Impact`
4. `## Evidence`

Content inside is mixed: short prose paragraphs in sections 1–2, bulleted lists in "User Impact" and "Evidence". #128223 appends a fifth section, `## Repair Closeout` (root cause, owner file, canonical fix, LOC), and wraps the core fix command in real-linebreaks. #128995 nests `### Desktop` / `### Mobile` H3 subsections under Evidence for screenshots.

**Regime B — bespoke audit-trail reports** (2 of 5, both by jesse-merhi or VACInc on larger features):
- #120900: `## New behavior` → `## Security-owner decision` → `## Stack context` → `## How it works` → `## Visual proof` → `## How to verify` → `## Scope`. Each "Visual proof" asset gets a bolded `**What this shows:**` caption and a `**State:**` line.
- #130993: `## Summary` → `### High-level TLDR` → `## Root cause and fix` with lettered H3 subsections `### A. False Responses context pressure` through `### G. Bound delegated native setup and post-processing`, plus `## Why previous fixes did not fix these failures`, `## Diagnostic handoff (redacted)`, `## Evidence map`, `## Real-behavior and regression proof`, `## User impact`, `## LOC and risk`, `## What was not tested`, `## Known follow-ups (not blocking)`, `## Follow-up invariant fixes`, `## Worked on by`.

Common denominators across both regimes: exact-head commit SHAs cited occasionally (`Exact head: 6c7a452d3eff...`), and LOC accounting by category ("Production LOC: +927/-717 (net +210). Tests/support: +479/-29").

## Template usage
Strong evidence of an enforced template or template-like gate, not a loose convention:
- The identical four-header sequence "What Problem This Solves / Why This Change Was Made / User Impact / Evidence" across 3 PRs by 3 different authors is statistically unlikely to be coincidence; the Title-Case-Wording is character-identical.
- #128223 contains injected bot/tooling boilerplate: a `<details><summary>Additional instructions</summary>` block reading "**MUST:** Keep **Allow edits from maintainers** enabled for this PR so maintainers can help update the branch when needed." — classic automation-inserted scaffold.
- #128223 also embeds a mandatory-disclosure line: "AI-assisted (Claude Code and Codex); I have read and understand the change."
- No `- [ ]` checklists, no "How Has This Been Tested"-style scaffold, no unfilled prompts anywhere.
Conclusion: **template — enforced** (a structured pipeline with required sections, AI-use disclosure, and gate-note conventions), with senior authors permitted to graduate to a free-form audit-report format (#120900, #130993) when the four-section shape doesn't fit.

## Length & density
Word counts (approximate, body only):
- #123535: ~230 words (shortest)
- #128995: ~450 words
- #128223: ~510 words
- #120900: ~750 words
- #130993: ~3,280 words (extreme outlier — a multi-fix epic with A–G root-cause subsections)

Median ~510 words; every description is dense, quantified prose — no filler. Descriptions routinely state what was *not* done: #130993 has `## What was not tested` ("The original large session was not re-run wall-clock end to end..."), #128223 says "No shared resolver, config shape, CLI flag, migration, fallback, or docs change is included.", #123535: "This PR is now standalone on `main`; it no longer depends on #123482." Bimodal pattern: compact 400–800-word structured reports, or multi-thousand-word forensic dossiers.

## Voice & tone
- Third-person descriptive present tense dominates: "The catalog lifecycle now distinguishes passive focus from real visibility/native-presence changes" (#123535); "The fix separates those two policies" (#130993).
- First person appears exactly once, and only inside the mandated AI disclosure: "I have read and understand the change" (#128223).
- Highly formal, precise, audit-register prose with specific numbers everywhere: "compaction failed at about 178.852 seconds" (#130993), "152 tests passed" (#128995), "311/311 passing" (#123535).
- No humor, no exclamation marks, no emoji inside the body text (emoji live only in labels).

## Content habits
- **Linked issues**: minimal — only #128223 links one ("Closes #127618", as its opening line). 4 of 5 PRs link no issue at all; cross-PR references substitute instead (#120900 → "#116489 is merged... The superseded server-token PR #120899 is closed"; #130993 → "The older identifier-retention repair (#129423)... #130620 fixed four earlier... failures").
- **Test plans / evidence**: universal and rigorous. Every PR has an Evidence-equivalent section with exact commands and exact counts, e.g. #130993: "Tests 451 passed (451)"; #128223 runs "scripts/pr review-tests 128223 ..." across six files and records a "Red-before on current main" failing test ("Result: 1 failed, 17 passed"). Live-deployment proof appears too: "7 automatic compactions, 7 successes, 0 failures" on a maintainer gateway (#130993), and a remote "Blacksmith Testbox lease" reproducing the race on real CLI I/O (#128223).
- **Screenshots/images**: present in the 2 UI-heavy PRs — #120900 embeds 6 assets (video link + 5 images) each with a `**What this shows:**` caption; #128995 embeds desktop and mobile screenshots. The 2 backend/CLI PRs and #123535 (also UI, but behavioral) use none.
- **Breaking-change callouts**: none use an explicit "BREAKING CHANGE" marker, but #130993 flags a semantic config change inline: "`agents.defaults.compaction.timeoutSeconds` keeps its key, default, and schema, but its meaning... is intentionally changed from an operation-wide cap to a per-model-request window".
- **Reviewer ask-outs**: none directed at humans; instead there are status notes like "Exact-head CI run ... completed successfully" and gate-mode attestations (`gates_mode=hosted_exact_or_recent_parent`, #128223).
- **Security sign-off**: #120900 includes a formal `## Security-owner decision` block: "Approved by Jesse Merhi, OpenClaw secops, on 2026-08-14."

## Bot-generated content
This repo is an extreme case of AI-integrated PR authorship — the descriptions are partly machine-generated or machine-shaped, and the labels (`rating: 🐚 platinum hermit`, `proof: sufficient`, `status: ⏳ waiting on author`) are bot-managed:
- **PR #128995 is authored by `roboclaw-bot` outright**, yet carries the full human-quality four-section template. This is the closest thing to a "bot summary" in the corpus — and note maintainers merged it, so the structure is accepted, not stripped.
- **AI-assistance disclosure is mandated**: #128223 states "AI-assisted (Claude Code and Codex); I have read and understand the change."
- **Automated review is cited as evidence inside descriptions**: #130993 references "ClawSweeper exact-head review of `4aca82299c0` identified a logical P1", "isolated structured Autoreview reports no P0 finding", and "Final full-branch autoreview: clean, 0.99 correctness" (#128995). #128223: "Fresh branch autoreview with Codex `gpt-5.6-sol` at high reasoning reported no accepted or actionable findings; overall correctness confidence was 0.99."
- No CodeRabbit/Copilot "Summary by..." blocks observed; the bot presence is infrastructure-level (authorship, review, labels) rather than pasted summary blocks.

Implication for AI-generated descriptions: this repo explicitly legitimizes them — a competitor tool's output would be judged against the four-section template, quantified Evidence sections, and AI-assistance disclosure norms, not rejected on principle.

## Notable exemplars
- **PR #130993** — https://github.com/openclaw/openclaw/pull/130993 — a 3,280-word forensic masterpiece: lettered root-cause subsections (A–G), a "Why previous fixes did not fix these failures" section that names prior PRs, sanitized diagnostic evidence with exact timestamps, red before/after regression output, live-deployment proof (7/7 compactions), and an explicit "What was not tested" + "Known follow-ups" honesty contract.
- **PR #128223** — https://github.com/openclaw/openclaw/pull/128223 — only +60/-4 across 2 files, yet it runs the full canonical template, includes a "Red-before on current main" failing-test proof, remote testbox reproduction with real concurrent-writer output, and a `## Repair Closeout` summarizing root cause/owner/canonical fix — proof the template scales down gracefully.
