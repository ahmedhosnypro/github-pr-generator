# PR Patterns: DietrichGebert/ponytail

## Corpus
- PRs analyzed: 5 (numbers: #601, #579, #661, #483, #703)
- The 5 PRs come from 5 distinct authors (prayag0one4, krishrathi1, p-clements, gglucass, DietrichGebert — the repo owner), so the sample spans maintainer and outside-contributor styles. Still, n=5 of a highly active repo (PR numbers already in the 700s) is a thin slice; trends below should be read as indicative, not proven conventions.

## Titles
4 of 5 titles use Conventional Commits prefixes with scopes folded into the description rather than a `(<scope>)` field:
- `fix: drop commandWindows from hooks.json for Claude.ai marketplace validation (#593)` (#601)
- `fix: detect VS Code Copilot via CLAUDE_PLUGIN_ROOT fallback (#528)` (#579)
- `feat: add Grok Build native skills adapter (revive #561)` (#661)
- `chore: release v4.9.0` (#703, owner-authored release PR)

Outlier: #483 `Emit statusline setup nudge at most once per user` — capitalized imperative, no prefix. Pattern: optional `type:` prefix, lowercase imperative verb after the colon, referenced issues/PRs parenthesized at the end (`(#593)`, `(#528)`, `(revive #561)`). Lengths run ~45–70 characters, single line, no emoji, no trailing period.

## Description structure
Two distinct camps, both header-based or header-free prose — no single required skeleton:

- **Structured with `##` headers**: #601 uses `## Problem` → `## Root Cause` → `## Fix` → `## Verification`, ending with a bare `Closes #593` line. #661 uses `## Summary` → `## Important behavior note` → `### Resulting Grok behavior` (a nested H3 — the only third-level heading in the sample) → `## Packaging` → `## Validation`.
- **Pure prose, no headers**: #579 is a single dense paragraph (~70 words). #483 is three short paragraphs plus a generation footer. #703 is one sentence ("53 commits since v4.8.4. Minor bump: new features plus roughly 30 fixes.") followed by 5 flat bullets with no heading.

Where headers exist, the section names vary between authors (`Problem/Root Cause/Fix/Verification` vs `Summary/Packaging/Validation`) — but a validation/verification section appears in both structured PRs, and #601 and #661 both use bulleted lists inside sections while #703 uses a bare bullet list.

## Template usage
No evidence of an enforced repo template: no `- [ ]` checklists, no "How Has This Been Tested"-style scaffold, no boilerplate instructions, no unfilled prompts. The repeated Problem→Fix→Verification skeleton in #601 and the Summary→Validation skeleton in #661 look like compliant *individual* habits for a fix/feat respectively, but the three other PRs share none of that structure. Conclusion: **freeform**, with contributors converging voluntarily on a verify-your-work section.

## Length & density
- #601: ~150 words (structured, includes an inline error-message code block)
- #579: ~70 words (one paragraph)
- #661: ~330 words (longest; 5 sections, 2 outbound links to xAI docs)
- #483: ~110 words
- #703: ~60 words

Median is short; even the longest (#661) stays under one page and pays for its length with structure. #579 shows the floor: a self-contained single paragraph that still names the root cause (`COPILOT_PLUGIN_DATA` unset), the symptom, and the secondary effect on `stateDir`.

## Voice & tone
- Neutral/descriptive third person dominates; imperative appears mainly in the `## Fix`-style statements ("Remove all three `commandWindows` fields…", #601).
- No first person ("I"/"we") anywhere in the 5 descriptions; the closest is the impersonal "This PR therefore uses…" (#661).
- Technical-precise register with frequent inline code formatting for identifiers (`commandWindows`, `CLAUDE_PLUGIN_ROOT`, `plugin.json`) and exact test commands.
- #661 is notably hedged and honest about limitations: "This does **not** claim hook-based always-on injection, persistent hook-managed mode state, or subagent context injection." #483 gives distribution context ("ponytail is distributed to Headroom Desktop users, so this recurring nudge currently lands in every one of their sessions").

## Content habits
- **Linked issues**: 2 of 5 link an issue — #601 declares `Closes #593` both in metadata and as the final body line. #579 references (#528) in its *title* but links no issue in the body/metadata. #661 cross-references the PR it resurrects (`rebased from #561`).
- **Test plans / validation**: strong habit — 3 of 5 state verification explicitly. #601: "All 6 hooks-windows tests pass, including the new marketplace validation check." #661 lists exact commands: `node --test tests/grok-plugin.test.js …`, `grok plugin validate .`, and an isolated-install check ("6 skills, 0 hooks"). #703 implicitly relies on the release diff.
- **Screenshots/images**: none in any PR (consistent with a CLI/plugin-config codebase, no UI surfaces).
- **Breaking-change callouts / negative claims**: #661 includes an explicit scope-limit disclaimer (the "does **not** claim" bullet); no `BREAKING CHANGE:` footers anywhere.
- **Reviewer ask-outs**: none.
- **Labels & process**: zero labels on all 5 PRs, 0 discussion comments on all 5, and 3 of 5 merged with 0 reviews — merge decisions appear to happen on description quality alone, which likely explains the care put into wording. All 5 merged on one of two days (2026-08-07 and 2026-07-10), suggesting batched review/maintainer sweeps.

## Bot-generated content
No CodeRabbit "Summary by CodeRabbit" blocks and no Copilot-generated PR summaries. The one AI signature is a footer in #483: `🤖 Generated with [Claude Code](https://claude.com/claude-code)` — a code-authorship attribution, not a generated description; the prose above it reads as terse hand-edited explanation. Given that ponytail is itself a Claude-Code-adjacent plugin, the near-absence of AI-generated *descriptions* is noteworthy: human-written, fact-dense descriptions are the norm here, and zero bot summary scaffolds have been retained by maintainers in this sample.

## Notable exemplars
- **PR #661** — https://github.com/DietrichGebert/ponytail/pull/661 — the most complete sample: it explains *why* the revived approach differs from #561 with cited vendor documentation, enumerates resulting behavior as verifiable bullets, explicitly disclaims what it does not do, and closes with a copy-pasteable validation command list.
- **PR #601** — https://github.com/DietrichGebert/ponytail/pull/601 — the model fix PR: quotes the actual validator error (`Unknown hook field(s) [commandWindows]`), walks Problem → Root Cause → Fix → Verification in ~150 words, and ends with `Closes #593`.
