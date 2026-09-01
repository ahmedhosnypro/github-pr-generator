# PR Patterns: Chalarangelo/30-seconds-of-code

## Corpus
- PRs analyzed: 5 (numbers: #2162, #2161, #2170, #2171, #2169)
- Caveat: this sample is extremely homogeneous and **cannot support repo-wide conclusions about human-written PRs**. 4 of 5 PRs are Dependabot dependency bumps (#2162, #2161, #2170, #2171); the only human-authored PR is #2169, a one-line revert by the maintainer (Chalarangelo). All 5 were merged in a narrow window (2026-07-29 and 2026-08-19) with zero review comments on all but one (#2171 has 1 review). There is no sample of a feature, bug-fix, or content PR written by a contributor.

## Titles
Two classes of title, both bot/maintainer-conventional rather than Conventional Commits:
- Dependabot bumps: `Bump brace-expansion from 1.1.11 to 1.1.16` (#2162), `Bump js-yaml from 4.2.0 to 4.3.0` (#2161), `Bump postcss from 8.5.15 to 8.5.24` (#2170), `Bump js-yaml from 4.3.0 to 4.3.1` (#2171). Format is Dependabot's fixed `Bump <package> from <old> to <new>` — no `chore(deps):` prefix, sentence-case, no scope, no emoji, no trailing period.
- Maintainer revert: `Revert "Bump sharp and astro"` (#2169) — GitHub's default auto-generated revert title format, kept unedited.

No `feat:`/`fix:`/`chore:` prefixes appear anywhere in the sample. Title lengths range ~30–55 characters.

## Description structure
For the 4 Dependabot PRs the structure is byte-for-byte Dependabot boilerplate, not repo convention:
1. One-line opener: `Bumps [brace-expansion](...) from 1.1.11 to 1.1.16.`
2. `<details>/<summary>` collapsible "Release notes" or "Changelog" blocks containing the upstream changelog as HTML (`<blockquote>`, `<h2>` per version, `<ul>` items) — headings inside use raw HTML tags, not Markdown.
3. A `<details>` "Commits" block listing short-SHA commit links.
4. A compatibility-score badge image, the "Dependabot will resolve any conflicts…" paragraph, `[//]: # (dependabot-automerge-start)` HTML comments, and a final `<details>` "Dependabot commands and options" block.

#2170 adds one extra block: `<summary>Maintainer changes</summary>` (`This version was pushed to npm by GitHub Actions, a new releaser for postcss…`).

The single human PR (#2169) has a one-line body: `Reverts Chalarangelo/30-seconds-of-code#2166` — GitHub's default revert text, no headers, no lists.

## Template usage
No repo PR template is evident. No checklists (`- [ ]`), no "How Has This Been Tested"-style scaffolds, no unfilled template prompts in any of the 5 PRs. The only human PR (#2169) uses bare GitHub-default revert text with no template filling, which weakly suggests no enforced template exists (had one been auto-inserted, its boilerplate would likely survive in the body). Conclusion: **freeform** (bot-generated boilerplate for 4 of 5 PRs does not count as a template).

## Length & density
Bimodal:
- Dependabot PRs: very long but entirely machine-generated — #2161 runs ~110 lines of body (multiple changelog sections), #2170 ~150 lines (release notes duplicated in both "Release notes" and "Changelog" collapsibles), #2171 ~45 lines, #2162 ~65 lines. Hand-written signal content in each is effectively one line (`Bumps X from a to b.`); everything else is collapsible quoted upstream material.
- Human PR #2169: 1 line, 5 words.

Reviewer-visible prose density is near zero across the board — these PRs are designed to be merged on trust of automation, not read.

## Voice & tone
- Dependabot bodies are impersonal, formulaic second-person instructions ("You can trigger Dependabot actions by commenting on this PR:", "`@dependabot rebase` will rebase this PR").
- #2170's release notes quote upstream contributor attributions (`Fixed custom property losing semicolon before a comment (by @sarathfrancis90)`), but that is quoted upstream content, not repo voice.
- #2169 has no voice at all (default revert text). No first person, no greetings, no emoji anywhere in the sample.

## Content habits
- **Linked issues**: none. All 5 PRs report "Linked issues: none"; #2169 references a prior PR (`Reverts Chalarangelo/30-seconds-of-code#2166`) — the revert loop indicates the maintainer merges Dependabot-style bumps and rolls back when they break.
- **Labels**: highly consistent — every PR carries `dependencies` + `web`; the npm bumps also carry `javascript` (#2162, #2161, #2170, #2171, but not the "sharp and astro" revert #2169).
- **Test plans**: none stated by any author. The Dependabot compatibility-score badge (`[![Dependabot compatibility score](...)]`) is the only merge-confidence signal.
- **Screenshots/images**: none (the badge image is bot boilerplate).
- **Breaking-change callouts / reviewer ask-outs**: none. All merges happened with 0 reviews/0 comments (1 review on #2171), i.e. effectively maintainer-solo, auto-merge-adjacent workflow.

## Bot-generated content
Bot content dominates the corpus: 4 of 5 PRs are authored by **Dependabot** with its full standard payload — collapsible release notes/changelog/commits, compatibility-score badge, and the "Dependabot commands and options" footer (e.g. "`@dependabot ignore this dependency` will close this PR and stop Dependabot creating any more for this dependency"). The maintainer merges these verbatim with no human-written addition, and leaves the automerge markers (`[//]: # (dependabot-automerge-start)`) in place. No CodeRabbit or Copilot PR-summary blocks appear. As a competitor baseline: in this repo the machine already writes the PRs the maintainer merges; any AI PR-description tool would be competing with zero human description-writing effort, not augmenting it.

## Notable exemplars
No exemplars of good human PR writing exist in this sample. The closest to instructive:
- **PR #2169** — https://github.com/Chalarangelo/30-seconds-of-code/pull/2169 — a revert merged 51 seconds after creation with just `Reverts Chalarangelo/30-seconds-of-code#2166`; functional as an audit trail (the reference preserves the causal chain after a bad bump) but a minimal-effort description by any standard.
- **PR #2171** — https://github.com/Chalarangelo/30-seconds-of-code/pull/2171 — the only PR with a review (1); its Dependabot body is compact (~45 lines) and the security context is visible in the quoted changelog ("[backport] Remove quadratic complexity from `!!omap` duplicate key detection"), making it the most readable of the bot PRs.

Overall this repo's sample is a **counterexample** for PR-writing study: it documents a fully automated dependency-maintenance pipeline with near-zero human prose, not a culture of authored descriptions.
