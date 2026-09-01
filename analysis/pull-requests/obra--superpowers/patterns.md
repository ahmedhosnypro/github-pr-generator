# PR Patterns: obra/superpowers

## Corpus
- PRs analyzed: 5 (numbers: #1995, #2109, #2125, #2122, #1)
- Caveat: the repo is a skills/prompts marketplace for AI coding agents, and its PR process is explicitly built around that: the dominant template demands disclosure of the *submitting AI agent* (model, harness, human reviewer). Two samples (#2125, #1) are by the maintainer obra, one (#2122) is a docs-only one-liner, and #1 predates the current template by ~10 months, so the sample spans two eras of repo convention. Representative, but 5 PRs still limits generality.

## Titles
No single convention; three distinct styles observed:
- Conventional-commit style, lowercase type + scope: `feat: add Devin CLI support` (#1995), `docs: streamline README getting-started navigation` (#2109) — both lowercase after the colon, no emoji, no trailing period, ~40 chars.
- Release-train style: `Release v6.3.0: Devin CLI and Hermes Agent support, brainstorming three-path router, SDD/Codex efficiency fixes` (#2125) — long (~110 chars), colon after version, comma-separated feature list.
- Plain imperative / sentence: `Add problem-solving skills from amplifier patterns` (#1); `Update to Prime Radiant Community Code of Conduct.` (#2122) — #2122 even ends with a period.

Conclusion: conventional-commit prefixes appear on contributor PRs; maintainer/docs PRs use freer forms. No enforced title lint is evident.

## Description structure
Strongly template-driven H2 sections in the two recent contributor PRs, nearly identical header sequences. Exact headers per PR:

- **#1995** (in order): `## Who is submitting this PR? (required)` (metadata table: model, harness, plugins, human reviewer), `## What problem are you trying to solve?`, `## What does this PR change?`, `## Is this change appropriate for the core library?`, `## What alternatives did you consider?`, `## Does this PR contain multiple unrelated changes?`, `## Existing PRs` (checklist + prior-art search), `## Environment tested` (table), `## New harness support (required if this PR adds a new harness)` (with a `<details>`-collapsed acceptance transcript), `## Evaluation`, `## Rigor` (checklist), `## Human review` (checklist).
- **#2109**: same headers in the same order, same two tables, same checklists — verbatim template reuse.
- **#2125** (maintainer release PR): light preamble, then abbreviated template — `## Who is submitting this PR?` (no `(required)` suffix), then bespoke `## What's in the release` (bulleted feature list cross-referencing ~15 merged PRs) and `## Verification` (checklist-style bullets of suites run, plus the honest admission "Live-LLM batteries (tests/claude-code) not run for this release").
- **#2122**: one sentence, zero headers: "Updates the current code of conduct to the Prime Radiant Community Code of Conduct."
- **#1** (pre-template era): `## Summary`, `## What Changed` with per-category H3 subsections (`### Problem-Solving Skills (New)`, etc.), `## Testing`, `## Attribution`, plus a CodeRabbit block.

Structural habits: all headers are H2 (`##`); all H3 use is inside one PR (#1). Bulleted lists dominate; prose paragraphs are short and argumentative (problem → fix → alternatives). Markdown tables appear in 2 PRs, always for the same two purposes (submitter metadata, environment tested).

## Template usage
Clear evidence of a repo-enforced PR template in the current era: #1995 and #2109 share **identical** section headers, including the telltale scaffold text `## Who is submitting this PR? (required)` and `## New harness support (required if this PR adds a new harness)` — section names no two authors would invent independently. Both fill in the same checklists:
- `- [x] I have reviewed all open AND closed PRs for duplicates or prior art`
- `- [ ] If this is a skills change: I used superpowers:writing-skills and completed adversarial pressure testing…` (left unchecked with an inline "**N/A**/**not applicable**" annotation instead of deletion — in both PRs)
- `- [x] A human has reviewed the COMPLETE proposed diff before submission`

The maintainer's own release PR (#2125) uses a trimmed subset of the same scaffold, implying the full template is for skill/harness contributions. #1 (2025-10) shows the pre-template era, and #2122 bypasses the template entirely for a trivial docs change.

Conclusion: **template** — a sophisticated, agent-aware PR template, filled out diligently rather than left as unfilled prompts.

## Length & density
Bimodal:
- #1995: ~700 words of prose + ~60-line acceptance transcript in a `<details>` block — by far the longest; density is high (every section argues something; no filler).
- #2109: ~550 words.
- #2122: 16 words.
- #2125: ~180 words (dense release digest; delegates detail to `RELEASE-NOTES.md` via "Full notes: `RELEASE-NOTES.md` v6.3.0 section").
- #1: ~350 words.

Pattern: contributor PRs are verbose and exhaustive (the template compels it); maintainer/release and trivial-docs PRs are terse.

## Voice & tone
- Declarative, evidence-first register; frequent first-person singular/plural inside checklists ("I have reviewed…") because the template's checklist items are literally phrased in first person — otherwise bodies are neutral/engineering voice.
- Tone is argumentative and defensive-in-a-good-way: sections justify the change against repo rules, e.g. #1995: "Yes — it's new harness support, the one carve-out the contributor rules allow"; #2109: "The lists had already drifted: Hermes Agent was present in Quickstart… That concrete mismatch demonstrated the maintenance problem rather than merely suggesting a theoretical one."
- Unusual meta-quality: several descriptions were evidently co-written with the AI agent doing the work, and say so openly (the submitter field "Your model + version | Claude Fable 5 (XHigh thinking)" in #1995; "GPT-5.6 Sol (`gpt-5.6-sol`)" in #2109). Given this repo *is* an AI-agent-skills project, this is on-brand, not noise.

## Content habits
- **Prior-art / duplicate search is mandatory**: both contributor PRs name searched terms and nearest PRs (#1995: 'searched "devin", "devin CLI", "cognition"' and cites closed #741; #2109 cites #1293, #2090, #2108 with a sentence each).
- **Linked issues**: none of the 5 PRs uses `Fixes #N`; cross-references are to other PRs, not issues.
- **Test/verification plans**: systematic but bespoke per change type — a clean-environment acceptance transcript in #1995; structural link-verification for a README change in #2109 ("Validation was structural because this is a README-only change: `git diff --check` passed…"); named test suites in #2125. Explicitly notes when agent-behavior evals are *not* applicable (#2109: "agent-behavior evals would not measure this change").
- **Human-review attestation**: a first-class checklist item in the template (`A human has reviewed the COMPLETE proposed diff`), checked in 3 of 5 PRs; #2109 even adds who: "Drew reviewed and explicitly approved the complete final diff".
- **Labels**: none on any PR. **Screenshots**: none (terminal transcripts in `<details>` blocks serve the role instead). **Breaking-change callouts / reviewer ask-outs**: none observed.
- **Attribution**: #1 includes a dedicated `## Attribution` section crediting the upstream project (microsoft/amplifier) with commit pin (`commit 2adb63f`).

## Bot-generated content
One instance only: #1 ends with an embedded CodeRabbit auto-release-notes block (`<!-- This is an auto-generated comment: release notes by coderabbit.ai -->` … `## Summary by CodeRabbit` … `- New Features … - Improvements … - Documentation`), left intact in the merged description. It mirrors the human-written `## Summary` above it rather than replacing it — i.e. the bot summary is treated as an appendix, not the description. None of the four newer PRs contain CodeRabbit/Copilot summary blocks. Ironically for a repo about AI agents, the human-authored/template-driven bodies are more thorough than the bot output, and the repo's disclosure-table convention (declaring model + harness + human reviewer) functions as a deliberate, structured alternative to opaque AI-generated descriptions.

## Notable exemplars
- **PR #1995** — https://github.com/obra/superpowers/pull/1995 — the strongest sample: every template section filled with real argumentation, a reproduced error message, considered-and-rejected alternatives, a collapsed clean-room acceptance transcript as proof, and an explicit human-review attestation — a full audit trail for an AI-produced diff.
- **PR #2125** — https://github.com/obra/superpowers/pull/2125 — best release-train format: one line of context, a categorized bulleted digest cross-referencing ~15 merged PRs, and a verification section that candidly states what was *not* run.
