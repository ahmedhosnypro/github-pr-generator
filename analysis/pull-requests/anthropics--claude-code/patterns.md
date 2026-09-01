# PR Patterns: anthropics/claude-code

## Corpus
- PRs analyzed: 5 (numbers: #72363, #1, #72451, #79898, #69226)
- Heavy caveats: only 5 PRs, by 4 different authors (roy-ant ×2, bcherny, gmli-eu, williamqian12), spanning 2025-02-24 → 2026-08-17, and PR #1 has an empty body. Subject matter skews to the public `examples/` tree (gateway GCP/AWS examples, a firewall script, a plugin skill). Sample is too small, heterogeneous, and docs/examples-weighted to support repo-wide conclusions; at best it reflects a few individual contributors' styles.

## Titles
No single convention; three distinct styles coexist:
- Scope-colon, non-conventional: `Gateway GCP example: Agent Platform rebrand and README cleanup` (#72363)
- Conventional Commit: `fix: remove statsig.anthropic.com from init-firewall.sh` (#72451) — the only one with a standard type prefix
- Plain imperative, no scope: `Add Claude apps gateway on AWS example deployment assets` (#79898), `Update frontend-design skill` (#69226)
- GitHub default / minimal: `Create SECURITY.md` (#1)

Length ranges ~25–70 chars; sentence case throughout; no emoji, no trailing periods, no ticket prefixes. The one near-pattern (2 PRs authored by roy-ant) is a descriptive scope phrase, but with only one conventional-commit sample there is no enforceable convention visible.

## Description structure
Three of four non-empty descriptions use `##` (H2) headers; the fourth is a bare sentence:

- PR #72363: `## Summary` (short lead-in + 2 bolded bullet groups), `## Test plan` (2 checked `- [x]` items)
- PR #72451: `## Summary` (1 sentence) → `## Why` (failure narrative with a fenced ```text error block) → `## Changes` (1 bullet) → `## Testing` (3 bullets)
- PR #79898: `## Summary` (context sentence + 4 component bullets + 1 caveat line), `## Test plan` (3 checked `- [x]` items)
- PR #69226: no headers at all — one sentence: "Some improvements to the frontend-design skill. Bumps the plugin version to 1.1.0 so installed copies pick up the update."
- PR #1: empty body.

Where headers exist, the order is always Summary first and testing last. "Summary" is the dominant opener (3 of 3 header-using PRs); the testing section is named either `## Test plan` (2×) or `## Testing` (1×). Bullets are preferred over prose inside sections; #72451 alone uses multi-paragraph prose for its `## Why` narrative.

## Template usage
Strong signal of the classic `## Summary` / `## Test plan` scaffold in both roy-ant PRs (#72363, #79898): identical header names, identical `- [x]` checked checklists under the test plan. That pairing is the well-known GitHub PR-template shape (and the shape Anthropic's own tooling emits), but with only one repeated author we cannot distinguish repo template from personal/assistant habit. #72451 uses a different scaffold (`Summary / Why / Changes / Testing`), and #69226/#1 ignore any structure. No unfilled template prompts or instructional boilerplate survive in any body. Conclusion: **partial** — no enforced repo template, but a recurring two-section scaffold for the most polished PRs.

## Length & density
- #72363: ~150 words (2 sections)
- #1: 0 words
- #72451: ~110 words (4 sections)
- #79898: ~230 words (longest; matches its +2240-line diff)
- #69226: ~25 words (smallest diff, +41/-28)

The two well-structured PRs run 110–230 words — compact but complete. Description length tracks change size: the tiny skill bump gets one sentence, the 13-file AWS example gets the longest write-up. No padding or boilerplate observed anywhere.

## Voice & tone
- Neutral/descriptive register dominates: "Prose-only updates to …", "Remove `statsig.anthropic.com` from the firewall initialisation allowlist." No first-person "I/we" in any description.
- Bullets are declarative statements of what exists or was done, written for a future reader ("Idempotent and safe to re-run; every default is env-overridable.").
- #69226 is slightly more casual ("Some improvements to…") but still third-person.
- Precise, engineering-register tone; #72363 even explains a deliberate non-change: renaming the Terraform label "would needlessly recreate the IAM binding for existing deployments".

## Content habits
- **Linked issues**: none — zero "Fixes #N"/issue references in all 5 PRs; no labels on any PR either. This repo appears to accept PRs without tracking-issue linkage.
- **Test plans**: the strongest habit. When a test section exists it lists concrete, rerunnable checks: `` `bash -n setup.sh` passes `` (#72363), "`setup.sh` exercised end to end with `aws`/`docker` stubbed on `PATH`", "`bash -n` and shellcheck clean", "Doc link slugs verified against the docs source" (#79898), and #72451's "Rebuilt/reloaded the devcontainer… Verified that the firewall initialisation completes successfully."
- **Code/error blocks**: #72451 embeds the actual failure output in a ```text fence ("ERROR: Failed to resolve statsig.anthropic.com") — effective evidence-driven motivation.
- **External links**: #79898 links the companion docs walkthrough (code.claude.com) and notes it is "(publishing shortly)".
- **Scope guardrails**: both roy-ant PRs state what was deliberately *not* changed — "Functional identifiers are deliberately unchanged" (#72363), "Provided as a working example to adapt, not a supported production deployment" (#79898).
- **Screenshots/images, breaking-change callouts, reviewer ask-outs**: none in any PR (consistent with the docs/examples-heavy sample).

## Bot-generated content
No bot-branded content observed — no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot summaries, no "Generated with Claude Code" footer. However, the two roy-ant PRs carry an unmistakable AI-generation signature in style if not attribution: the exact `## Summary` / `## Test plan` + `- [x]` scaffold Claude Code itself emits, hyper-thorough checklists ("sha256 verification and checksum-mismatch quarantine (`claude.bad`)"), and exhaustive scope-justification prose. Given this is Anthropic's own repo, these read as AI-assisted descriptions that a human reviewed and kept — i.e. the maintainer treats the generated structure as good enough to merge as-is.

## Notable exemplars
- **PR #79898** — https://github.com/anthropics/claude-code/pull/79898 — +2240 lines across 13 files compressed into ~230 words: a per-component bullet map, an explicit non-support disclaimer, and a 3-item test plan whose checks (stubbed CLI dry-run, checksum-mismatch quarantine, doc-slug verification) are independently rerunnable.
- **PR #72451** — https://github.com/anthropics/claude-code/pull/72451 — best motivational writing: a one-line `## Summary`, a `## Why` that reproduces the exact error output in a code fence, and a verification checklist tied to the user-visible symptom (devcontainer startup).
