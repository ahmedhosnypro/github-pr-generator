# PR Patterns: x1xhlol/system-prompts-and-models-of-ai-tools

## Corpus
- PRs analyzed: 5 (numbers: #476, #478, #466, #461, #439)
- Caveat: 3 of 5 PRs (#478, #461, #439) are by the same author (paulacavero) and are nearly identical in purpose — sponsor/README link tweaks for Latitude. The remaining two (#476, #466) are prompt-file additions by different authors (pasterpo, bradvogel). Small sample skewed toward trivial README edits; conclusions carry limited repo-wide weight.
- Admin context: all 5 PRs have zero labels and zero linked issues; 4 of 5 have 0 reviews. Sponsor-link PRs merged same-day (#478, #461, #439); the content PR #466 sat ~3 weeks (created 2026-06-12, merged 2026-07-03) before merge.

## Titles
Plain, single-sentence imperative/descriptive titles; no Conventional Commits types, no scope prefix, no emoji, no trailing period:
- `Add Claude Sonnet 5 system prompt along with Tools instructions` (#476)
- `Update hero copy to 'Make your AI agents self-healing'` (#478)
- `Add Claude Fable 5 system prompt` (#466)
- `Update Latitude links to point to GitHub repo` (#461)
- `Update Latitude links to new landing page` (#439)

Pattern: `<Imperative verb> <object>` with sentence-case casing (capitalized first word, lowercase thereafter). Verb set is minimal and repetitive: `Add` (2×), `Update` (3×). Lengths ~35–65 characters. #478 uses single quotes around literal copy in the title; #476 uses "along with" for a compound object.

## Description structure
Two distinct styles, split by author:

- **paulacavero sponsor PRs (#461, #439):** a fixed two-section scaffold: `## Summary` (H2) with bullet list, then `## Test plan` (H2) with task-list checkboxes. No prose preamble. #461: one Summary bullet, one checked `- [x]` test item. #439: two Summary bullets, two unchecked `- [ ]` test items.
- **paulacavero #478:** slightly looser — one prose sentence ("Updates the Latitude sponsor hero copy in the README:"), then two bullets in `old → new` form ("Heading: "Issue Tracking for AI Agents" → "Make your AI agents self-healing""), closing prose line ("Links continue to point to the Latitude GitHub repo."). No `##` headers.
- **#476 (pasterpo):** a single prose sentence ("I have added Claude Sonnet 5 raw system prompt along with complete tools instructions.") followed only by the CodeRabbit block.
- **#466 (bradvogel):** prose-and-bullet hybrid without headers: opening sentence ("Adds the system prompt for Claude Fable 5, Anthropic's new flagship chat model…"), then three mid-dot (`•`) bullets covering `File:` (placement convention), `Source:` (attribution URLs), and a verbatim-reproduction note. (The raw file shows literal `\r` carriage returns in this body.)

Canonical order where headers do appear: `## Summary` → `## Test plan` (only in paulacavero's two PRs). Heading level is always `##`. Bullets dominate; prose is at most one or two sentences.

## Template usage
No evidence of a repo-enforced PR template: no repeated boilerplate copied verbatim across unrelated authors, no "How Has This Been Tested"-style scaffold, no leftover instructional comments. However, paulacavero's #461 and #439 share an identical `## Summary` / `## Test plan` skeleton with `- [ ]` checkboxes — a repeated personal template (this shape is characteristic of AI-agent-generated PR bodies, e.g. Copilot/Cursor defaults, though that cannot be proven). Notably, #439 was merged with its test-plan items still unchecked ("Links resolve to the new landing page", "UTMs show up correctly in analytics"), so the checklist is decorative, not gating. Conclusion: **freeform, with one contributor's recurring personal scaffold**; no repo-wide template.

## Length & density
Human-authored content (excluding CodeRabbit blocks) is extremely short:
- #476: ~15 words
- #478: ~45 words
- #466: ~110 words (longest; includes two inline source URLs)
- #461: ~35 words
- #439: ~45 words

All fit on one screen. Density matches change size — the README tweaks are +2/-2 or +3/-3; the prompt-file PRs are +913 and +1580 additions but are near-raw-content dumps needing little prose. #466 is the only description dense with verifiable specifics (file path `Anthropic/Claude Fable 5.txt`, naming-convention rationale, two external source links).

## Voice & tone
Mixed by author. Third-person present tense dominates: "Updates the Latitude sponsor hero copy…" (#478), "Adds the system prompt for Claude Fable 5…" (#466), "Points the three Latitude links…" (#439). #476 is the lone first-person description: "I have added Claude Sonnet 5 raw system prompt…". Tone is neutral and factual throughout; no humor, no apologies, no hedging. #466 is the most careful in register — it explicitly justifies provenance ("leaked and published by @elder_plinius") and verbatim fidelity ("Reproduced verbatim; only the source file's markdown title/--- wrapper was stripped").

## Content habits
- **Linked issues:** none in any of the 5 PRs (no "Fixes #N", no issue references at all).
- **Test plans:** only paulacavero's two `## Test plan` sections (#461 checked, #439 unchecked); these are manual verification notes, not CI commands. The other 3 PRs have no verification section at all.
- **Screenshots/images:** none — #478 makes a visible README hero-copy change but includes no before/after screenshot, relying instead on quoted `old → new` text.
- **Source attribution:** #466 uniquely embeds full provenance links (`https://x.com/elder_plinius/status/…` and the CL4R1T4S mirror on GitHub) — appropriate to this repo's nature as a collection of leaked AI system prompts.
- **Breaking-change callouts / reviewer ask-outs:** none. No "please review", no questions for maintainers in any description.
- **Reviewer engagement:** minimal repo-wide — 4 of 5 PRs got 0 reviews, 1 comment each; #476 got 2 reviews. Fast merges for sponsor edits suggest low scrutiny.

## Bot-generated content
CodeRabbit is active and dominant: 4 of 5 PRs (#476, #478, #461, #439) carry an identical-scaffold `## Summary by CodeRabbit` block wrapped in `<!-- This is an auto-generated comment: release notes by coderabbit.ai -->` markers, formatted as bullets under a bold `**Documentation**` category — e.g. #476: "Added new guidance documents covering Claude Sonnet 5 behavior, tool usage, safety handling, and workflow rules." These blocks are preserved as-is in the merged descriptions and, for #476, constitute essentially the entire substantive description (the human wrote one sentence). #466 (the oldest-created PR) is the only sample without CodeRabbit content. This repo is a strong counterexample for those arguing human-written descriptions matter: maintainers merge descriptions that are 80–100% bot-generated without editing them.

## Notable exemplars
- **PR #466** — https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools/pull/466 — the standout: documents file placement (matching the `Anthropic/Claude Sonnet 4.6.txt` convention), full source provenance with two links, and an explicit verbatimness statement, all in ~110 words with zero boilerplate.
- **PR #478** — https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools/pull/478 — best of the trivial edits: states exactly what copy changed using quoted `old → new` pairs, so the diff rationale is reviewable without opening the diff.
