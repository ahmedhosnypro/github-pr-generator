# PR Patterns: sindresorhus/awesome

## Corpus
- PRs analyzed: 5 (numbers: #2051, #4278, #4283, #4390, #4393)
- Caveat: small and skewed sample. 3 of 5 PRs (#4278, #4390, and partially #2051) are the same kind of change — removing archived/dead awesome lists — and 2 of 5 are by one author (subbareddypalagiri: #4278, #4283). The sample spans 2021–2026, so it mixes eras of the repo's conventions. This is a curation repo whose dominant PR type ("Add <List>") is not represented at all in the sample, so conclusions apply to housekeeping/fix PRs only, not to the repo's main contribution flow.

## Titles
Imperative-verb titles, no Conventional Commits types, no emoji, no trailing period:
- `Housekeeping: Remove 17 archived awesome lists` (#4278)
- `Remove macOS Command Line` (#2051)
- `Remove 8 archived awesome lists` (#4390)
- `Fix invalid space character in Java section` (#4393)
- `Fix: Prevent repo linter from crashing on deletion-only PRs` (#4283)

Pattern: `<imperative verb> <object>`; 2 of 5 add a prefix tag with a colon (`Housekeeping:`, `Fix:`), but the tag is free-text, not a conventional type. Both prefix usages come from the same author (subbareddypalagiri). Casing is inconsistent — sentence case in 4 of 5, title-case-ish in #2051. Lengths ~30–55 chars. Note: the repo's official PR template (visible in #2051) mandates the title format `Add Name of List` with explicit ✅/❌ examples (`Add Swift` vs `add Swift`, `Added Swift`), but that mandate applies only to list submissions; none of these housekeeping/fix PRs follow it, and none were blocked for it.

## Description structure
No consistent section structure across the sample; each PR is shaped differently:
- #4278: three short prose paragraphs, no headers — greeting to `@sindresorhus`, method ("automated scan across all `github.com/...` links ... using the GitHub API"), and justification referencing the contribution guidelines.
- #2051: one link + one sentence of authored prose embedded in the entire verbatim PR template, which contains the headers `### By submitting this pull request I confirm I've read and complied with the below requirements 🖖`, `## Requirements for your pull request`, `## Requirements for your Awesome list`.
- #4390: one prose lead-in ("Removed 8 entries that point to archived repositories:"), then a markdown table (Repository | Stars | Last Push | Archived), then one closing verification sentence. No headers.
- #4393: mini-scaffold with two `###` (H3) headers — `### Description` (one line) and `### Checklist` (two checked boxes) — plus the word `unicorn` on its own line.
- #4283: three-part structure — prose preamble, `### The Issue` (with a fenced `bash` code block quoting the affected script path `.github/workflows/repo_linter.sh`), `### The Fix`, and a signed sign-off ("Best regards, Subba Reddy Palagiri").

Heading levels, when present, are `###` (H3) for authored sections (#4393, #4283); the repo template itself uses `##`/`###` mixed. Bullet lists are rare in authored content (#4393's checklist only); tables appear where the change is list-shaped.

## Template usage
Strong evidence of an official repo PR template: #2051 reproduces it verbatim and essentially unfilled — the author pasted the link and one sentence ("It has been taken off github, so I believe it no longer qualifies as being awesome") and left the full multi-hundred-word requirements scaffold (including "Don't waste my time", the title-format rules, and the easter-egg instruction "please comment on your pull request with just the word `unicorn`") intact. #4393 shows a reduced, personal adaptation of a template: a Description/Checklist scaffold with `- [x]` checked items ("I have read and complied with the requirements.", "Tested with `awesome-lint`.") and the literal word `unicorn` — direct compliance with the template's verification trick. The remaining 3 PRs (#4278, #4283, #4390) are fully freeform prose/tables with no template residue. Conclusion: **repo-enforced template for list-submission PRs; freeform for housekeeping/fix PRs**, with occasional personal mini-templates.

## Length & density
- #2051: ~35 authored words, but ~1,100 words total body because the unfilled template is included — extreme bloat-to-signal ratio.
- #4278: ~80 words, all signal.
- #4283: ~180 words, the longest authored description, including a code excerpt.
- #4390: ~30 words of prose plus an 8-row evidence table.
- #4393: ~30 words.

Pattern: tiny diffs (+3 −19 to +0 −8, 1–2 files) matched by tiny descriptions — one to three short paragraphs is the norm. Only #4283 approaches "full" PR-discussion depth, proportionate to it being the sole logic change touching CI shell behavior.

## Voice & tone
- Imperative/matter-of-fact in titles; first-person singular is common in bodies: "I ran an automated scan" (#4278), "I noticed that the CI workflow ... fails" (#4283), "I have tested this fix locally" (#4283), "I have read and complied" (#4393).
- Informal-polite register aimed at a single maintainer: both of subbareddypalagiri's PRs open with a personal greeting ("Hi @sindresorhus!" / "Hi @sindresorhus,") and #4283 ends with a formal sign-off ("Best regards, Subba Reddy Palagiri") — letter-like etiquette unusual in large OSS repos with many maintainers, but fitting a one-BDFL project.
- #4390 is the outlier: pure neutral report voice, no first person, no greeting.

## Content habits
- **Reviewer/maintainer ping**: @sindresorhus addressed by name in 2 of 5 PRs (#4278, #4283).
- **Evidence tables**: #4390 lists every removed repo with Stars / Last Push / Archived columns — data-first justification for a deletion.
- **Verification statements** instead of test plans: "All repositories have been verified as archived via the GitHub API" (#4390), "Tested with `awesome-lint`" (#4393), "I have tested this fix locally" (#4283). No CI/test-matrix enumerations.
- **Linked issues**: none in any of the 5 PRs — no "Fixes #N" usage at all.
- **References to repo policy as justification**: #4278 cites the contribution guidelines ("awesome lists must be actively maintained"), #4393 invokes the template's `unicorn` check. Authors argue compliance with house rules rather than abstract merit.
- **Screenshots/images**: none. **Breaking-change callouts**: none. **Labels**: none on any PR.
- **Accuracy slip worth noting**: #4278's title says 17 lists removed while its body says "removes **22** awesome lists" — the imprecision was not called out in the recorded metadata and the PR was still merged.

## Bot-generated content
No AI/bot-generated PR description content observed — no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot autogenerated sections, no AI-disclaimer footers. Two PRs are *tool-assisted but human-written*: #4278 ("I ran an automated scan ... using the GitHub API") and #4390 (an API-verified table) both describe human-run scripts whose results were pasted into prose/table form. The repo's dominant quality gate is its own linter (`awesome-lint`), referenced in the template and in #4393 — a CI check, not a description generator. For an AI-PR-description product, these descriptions are competitor-free zone: short, personal, and policy-referencing — the bar to beat is low on structure but high on demonstrating rule compliance.

## Notable exemplars
- **PR #4390** — https://github.com/sindresorhus/awesome/pull/4390 — the strongest: 30 words plus a complete evidence table (repo, stars, last push, archived status, verification claim); a deletion PR whose justification is fully checkable at a glance.
- **PR #4283** — https://github.com/sindresorhus/awesome/pull/4283 — best-structured prose: symptom → root cause (`set -eo pipefail` + `grep ^+` exiting 1) with the affected code quoted → minimal fix (`(grep ^+ || true)`) → local test statement; a complete debugging narrative in ~180 words.
- Counter-example: **PR #2051** — merged despite shipping the entire unfilled PR template as its description, showing the maintainer tolerates boilerplate as long as the one-sentence rationale is present.
