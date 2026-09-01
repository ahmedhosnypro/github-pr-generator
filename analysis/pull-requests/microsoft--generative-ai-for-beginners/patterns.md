# PR Patterns: microsoft/generative-ai-for-beginners

## Corpus
- PRs analyzed: 5 (numbers: #1282, #1283, #1285, #1286, #1287)
- Caveat: this sample is 100% machine-authored — 4 of 5 PRs are by `dependabot` (#1282, #1285, #1286, #1287) and 1 is by the `localizeflow` localization bot (#1283). Zero PRs are by human maintainers or community contributors, so this reflects the repo's **automation-heavy merge stream**, not human PR-writing conventions at all. No repo-wide conclusions about contributor-authored descriptions can be drawn.

## Titles
All 5 titles follow strict Conventional Commits `chore(<scope>):` format, lowercase, no emoji, no trailing period:
- `chore(deps): bump ws` (#1282)
- `chore(i18n): sync translations with latest source changes` (#1283)
- `chore(deps): bump openai from 6.45.0 to 6.47.0` (#1286)
- `chore(deps): bump actions/setup-node from 6 to 7` (#1287)
- `chore(deps): bump @azure/core-auth from 1.10.1 to 1.11.0` (#1285)

The Dependabot titles (4 of 5) use the exact formula `bump <pkg> from <old> to <new>` (#1282 abbreviates to just `bump ws` because it bumps two `ws` lines at once, noted in the body: "These dependencies needed to be updated together"). Scopes observed: `deps` (4×), `i18n` (1×). Lengths ~25–60 chars. The titles are machine-generated and 100% consistent — no human style signal.

## Description structure
Two rigid, bot-specific structures, neither of which is a human-authored narrative:

**Dependabot PRs (#1282, #1285, #1286, #1287)** — canonical Dependabot skeleton, in this exact order:
1. One-line opener: `Bumps [<name>](<url>) from <old> to <new>.` (#1286, #1287, #1285) — #1282 varies: "Bumps and [ws](https://github.com/websockets/ws)."
2. `<details><summary>Release notes</summary>` block (or `Changelog` for #1285), containing quoted upstream release notes inside `<blockquote>` with `<h2>`/`<h3>`/`<ul>` HTML.
3. `<details><summary>Commits</summary>` block — HTML `<ul>` of short-SHA commit links.
4. `<br />` separator, then for 2 of 4 (#1286, #1287) a Dependabot compatibility-score badge image.
5. Fixed footer: "Dependabot will resolve any conflicts with this PR as long as you don't alter it yourself. You can also trigger a rebase manually by commenting `@dependabot rebase`."
6. `[//]: # (dependabot-automerge-start/end)` comment markers, `---`, then `<details><summary>Dependabot commands and options</summary>` listing `@dependabot rebase/recreate/ignore` commands.

**Localizeflow PR (#1283)** — a status-dashboard body, not a description: `<!-- localizeflow-progress:start -->` marker, `**Status:** Completed`, a text progress bar (`████████████████████`), key/value stats ("Languages: 55 / 55", "Jobs: 19 / 19 completed", "Queue: 0 running · 0 queued · 0 failed"), a `<details><summary>Language details</summary>` table of 55 languages with `Completed` status each, and a footer `*[View full status ↗](…) · Powered by Localizeflow*`, closed by `<!-- localizeflow-progress:end -->`.

No Markdown heading headings in any human-authored sense; structure comes entirely from HTML `<details>`/<`summary`> and bold key/value pairs.

## Template usage
No evidence of a repo-owned PR template: no `- [ ]` checklists, no "How Has This Been Tested"-style scaffolds, no unfilled template prompts anywhere in the 5 bodies. What exists instead is bot boilerplate pasted verbatim every time — the Dependabot footer and "commands and options" block are byte-identical across #1282, #1286, and #1287 (#1285 shares them too; its tail shares the same skeleton). Conclusion: **freeform human template absent; bot-generated boilerplate is the only repeated structure**. Reviewers merge against bot output as-is.

## Length & density
Apparent length is high but derivative:
- #1282: ~450 words, nearly all upstream release notes and the duplicated 7.5.10→7.5.11 / 6.2.3→6.2.4 bump blocks.
- #1283: ~350 words, dominated by the 55-row language table.
- #1285: ~300 words, mostly quoted changelog.
- #1286: ~600 words (longest — two full release-note versions, release notes *and* changelog both embedded nearly verbatim).
- #1287: ~450 words (truncated in corpus mid-way through release notes).

Human-written novel content per PR is a single sentence (the "Bumps …" opener) or zero (pure status dashboard for #1283). Density ratio is extreme: >95% of body text is pasted changelogs, commit lists, or status tables.

## Voice & tone
Fully impersonal, zero first person across all 5 PRs. The Dependabot voice is declarative/imperative-documentation ("Bumps…", "You can trigger Dependabot actions by commenting on this PR"); the localizeflow voice is telemetry-style key/value prose ("Status: Completed", "Completed in 2651 minutes"). No formality variance possible — there are no humans in the sample.

## Content habits
- **Linked issues**: none in any of the 5 PRs (`Linked issues: none` ×5). These maintenance PRs are not driven by tracked issues.
- **Test plans**: none — no "Validation"/"Testing" sections; verification is implicit (CI + Dependabot compatibility-score badges on #1286/#1287).
- **Screenshots/images**: none, except the Dependabot compatibility-score badge image embeds (#1286, #1287). #1283's enormous diff (+381,614 / −362,885 across 2,614 files) is merged with only a status table as justification.
- **Breaking-change callouts / reviewer ask-outs**: none. Merges are fast (e.g. #1286 and #1287 merged ~5.5 hours after creation; #1282 same-day), consistent with batch maintenance merging.
- **Labels**: remarkably uniform — every PR carries `needs-review`; Dependabot PRs add `dependencies` plus an ecosystem label (`javascript` ×3, `github_actions` ×1).

## Bot-generated content
The entire sample is bot-generated content — this is the defining characteristic:
- **Dependabot** (#1282, #1285, #1286, #1287): full standard Dependabot description including quoted upstream release notes and commit lists in `<details>` collapsibles, compatibility-score badges, and the fixed "Dependabot commands and options" footer. Maintainers keep this structure untouched — no edits to add rationale beyond the bot's output.
- **Localizeflow** (#1283): a live-updating progress widget embedded in the PR body between `<!-- localizeflow-progress:start/end -->` markers, with a `████████████████████` progress bar and "Powered by Localizeflow" attribution. Merged as-is with 2 comments.

There is no CodeRabbit or Copilot description/summary content in the sample (a Copilot mention appears only inside upstream release notes quoted by Dependabot in #1287, i.e., "by `@Copilot` in actions/setup-node#1525" — not a description of *this* PR). For a PR-description generator, the competitive insight here is that dependency/translation PRs are already fully automated end-to-end; AI descriptions would target human-authored feature/docs PRs, which this sample doesn't contain.

## Notable exemplars
Hard to name human-quality exemplars since no PR was human-written. On their own bot terms:
- **PR #1286** — https://github.com/microsoft/generative-ai-for-beginners/pull/1286 — the most complete Dependabot specimen: opener, full release notes for two versions, changelog, commit list, and compatibility-score badge; a self-contained audit of exactly what changed upstream.
- **PR #1283** — https://github.com/microsoft/generative-ai-for-beginners/pull/1283 — notable for audacity rather than craft: a 2,614-file translation sync merged with only a generated status table as the "description," showing how thin the evidence floor can be for automated maintenance PRs in this repo.
