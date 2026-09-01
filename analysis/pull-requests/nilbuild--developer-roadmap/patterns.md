# PR Patterns: nilbuild/developer-roadmap

## Corpus
- PRs analyzed: 5 (numbers: #10239, #10241, #10242, #10243, #10244)
- Major caveat: 4 of 5 PRs (#10241, #10242, #10243, #10244) are authored by `github-actions` (bot) and are byte-identical "Sync Content to Repo" boilerplate; only 1 PR (#10239, by Roshan3300) is human-authored, and it has an **empty description**. This sample is too small and too bot-dominated to characterize human PR-writing conventions in this repo — the only supported conclusions are about the automated sync workflow and title style.
- Window: 2026-08-17 → 2026-08-21. Every PR has 0 reviews and 0 comments, and all were merged within minutes-to-days of creation.

## Titles
All 5 titles follow Conventional Commits with a `type:` prefix, lowercase throughout, no scope, no emoji, no trailing period:
- `docs: add insertion sort explanation` (#10239 — human)
- `chore: sync content to repository - api-design` (#10242)
- `chore: sync content to repository - network-engineer` (#10241)
- `chore: sync content to repository - r` (#10243)
- `chore: sync content to repository - r` (#10244, verbatim duplicate title of #10243)

Pattern: `<type>: <lowercase description>`. The bot titles append `- <roadmap-name>` after the description, effectively using the suffix as a scope. Duplicate identical titles (#10243/#10244, two consecutive "r" syncs) indicate titles are generated from a template, not hand-written.

## Description structure
Two distinct structures, one per authorship class:
- Human PR #10239: empty body — no headers, no list, no prose.
- Bot PRs (#10241–#10244, all identical modulo the roadmap name and commit hash): one `##` H2 header `## Sync Content to Repo`, then a GitHub `[!IMPORTANT]` alert blockquote containing the roadmap name, the triggering `Commit:` SHA, and the `Workflow Path:` (`.github/workflows/sync-content-to-repo.yml@refs/heads/master`), closing with a bold single-line instruction: `**Please Review the Changes and Merge the PR if everything is fine.**`

Canonical bot order: H2 title → IMPORTANT callout with machine metadata (commit, workflow) → bolded human-action request. No lists, no bullet points anywhere in the corpus.

## Template usage
The 4 bot PRs are a literal, fully-filled template — identical text except three interpolated values (roadmap name, commit SHA, and by extension file stats). This is a **workflow-generated template**, not a repo PR template a contributor would fill in; there is no evidence (from this sample) of a contributor-facing template with `- [ ]` checklists or "How Has This Been Tested" prompts. The lone human PR (#10239) shows an empty description, i.e., no template is enforced for human contributors. Conclusion: **bot-template dominates; human contributions are template-free.**

## Length & density
- #10239: 0 words (empty)
- #10241–#10244: ~45 words each, ~90% of which is fixed boilerplate; the variable payload is a single roadmap name.

Extremely low information density: the sync PRs change real content (#10243: +387 across 129 files; #10244: +415/-170 across 128 files) while describing nothing about the content itself. The human PR ships +7 lines of docs with zero description.

## Voice & tone
- Human content: none to analyze (empty description; title is imperative-ish "add insertion sort explanation", lowercase, terse).
- Bot text: second-person imperative addressed to a reviewer ("Please Review the Changes and Merge the PR if everything is fine."), sentence-case with idiosyncratic capitalization ("Syncs the Content to the Repo"), polite but formulaic. No first person.

## Content habits
- Linked issues: none in any of the 5 PRs; no "Fixes #N" usage observed.
- Labels: bot PRs carry `automated pr` (4 of 5); the human PR has no labels — labels function as automation routing, not triage metadata.
- Screenshots/images: none (unsurprising for content-sync/docs changes).
- Test plans, breaking-change callouts, reviewer ask-outs: none, beyond the bot's generic "Please Review… Merge… if everything is fine" line, which is a standing ask, not PR-specific.
- Review culture signal (sample-limited): 0 reviews / 0 comments on all 5 PRs suggests merges happen without recorded discussion on GitHub for this class of change.

## Bot-generated content
The corpus is 80% bot-authored, but it is a **repo-owned `github-actions` workflow** ("Sync Content to Repo"), not a third-party AI summarizer — no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot summaries, no AI-generated change descriptions. Notably, despite touching up to 129 files in one PR, the bot never summarizes what content changed: it emits only provenance metadata (commit SHA, workflow path). This is a gap an AI-generated per-diff description would fill. The boilerplate is kept verbatim by the maintainer workflow across all 4 instances:

> This PR Syncs the Content to the Repo for the Roadmap: api-design

## Notable exemplars
None qualify as strong human PR-writing examples. The closest to "complete" is the bot template itself — #10244 (https://github.com/nilbuild/developer-roadmap/pull/10244) — which at least supplies provenance (commit SHA, workflow path) and a clear call to action, but no content summary. #10239 (https://github.com/nilbuild/developer-roadmap/pull/10239) is a counterexample: a conventional-commit title doing all the communicative work with an empty body; acceptable only because the change is 7 lines.
