# PR Patterns: mattpocock/skills

## Corpus
- PRs analyzed: 5 (numbers: #904, #905, #911, #917, #926)
- Caveat: all 5 PRs are by the repo owner (mattpocock) alone, merged within 3 days (2026-08-19 → 2026-08-21), with 0 reviews and ≤2 comments on every PR. This sample reflects one person's self-merged workflow, not a contributor-wide convention; community-authored PRs may look entirely different.

## Titles
Mixed conventions. Two of 5 use a skill-name scope prefix resembling Conventional Commits but without types (`feat:`/`fix:`) and with lowercase sentence form after the colon:
- `wait-what: follow CONTEXT-MAP.md to the right CONTEXT.md` (#904)
- `grilling: separate questions in a round with an HR` (#917)

The other three are plain imperative sentences with no scope prefix:
- `Fix invalid YAML front matter in six SKILL.md files` (#911)
- `Remove all em-dashes from the repo` (#905)
- `Add implement-spec skill (in-progress) with its bucket docs` (#926)

Casing is inconsistent even within the scoped titles: lowercase `follow` (#904) vs lowercase `separate` (#917) match, but the unscoped titles start capitalized (`Fix`, `Remove`, `Add`). Lengths run ~35–65 characters, single line, no emoji, no trailing period. Inline code and file names appear in titles untagged (#904 uses bare `CONTEXT-MAP.md`). Acronym "HR" in #917 means a markdown horizontal rule, illustrating jargon density.

## Description structure
A rigid two-section scaffold dominates: `## Summary` followed by `## Test plan`, both H2 level, with bulleted content. Per PR:
- #904: `## Summary` (2 bullets + 1 free line: "Kept deliberately tiny — the skill is three lines by design…"), `## Test plan` (1 unchecked checkbox)
- #911: `## Summary` (4 bullets), "Fixes #907" line, `## Test plan` (1 checked, 1 unchecked)
- #905: `## Summary` (6 bullets), `## Test plan` (6 checkboxes)
- #917: `## Summary` (3 bullets), `## Test plan` (2 checkboxes)
- #926: outlier — prose preamble (2 paragraphs), then `## Documentation` (4 bold-led bullets), `## Also` (1 line), `## After merge` (run-command note). No Summary/Test plan at all.

Canonical order in 4 of 5: Summary → Test plan, nothing else. Lists dominate over prose; prose appears mainly in #926 and the stray "Kept deliberately tiny" line in #904.

## Template usage
No repo-committed PR template is evident, but the near-identical "## Summary" / "## Test plan" scaffold plus a consistent `🤖 Generated with [Claude Code](https://claude.com/claude-code)` footer (present in #904, #911, #905, #926) is the Claude Code PR-generation scaffold repeated verbatim — an AI tool template, not a repo-enforced one. Checklists (`- [ ]` / `- [x]`) appear in all 4 scaffolded PRs, always with at least one deliberately unchecked item reserved for human verification (#904's "Re-run `wait-what` in a multi-context repo", #905's "Human read-through for tone/accuracy (99 files touched)"). #917 has the scaffold but no footer. Conclusion: **AI-tool template** (Claude Code scaffold), uniformly adopted; #926 is a partially template-free exception.

## Length & density
Short to medium, scaling with change size:
- #904: ~115 words (3-file tweak)
- #911: ~180 words (7 files)
- #905: ~230 words (100 files — the longest summary, proportionate to blast radius)
- #917: ~60 words (2 files — the shortest)
- #926: ~230 words (5 files — long because it documents scope decisions)

Every description fits easily on one screen; bullets state outcomes and verification, not code walkthroughs. Density is high — nearly every bullet cites a concrete file path in backticks.

## Voice & tone
- Descriptive/present-tense bullets in summaries ("Adds one clause…", "Quotes the `description` front-matter scalar…", "`CHANGELOG.md` is changeset-generated…"); titles use imperative mood.
- No "I" anywhere; rare first-person plural only in interpolated phrases — effectively third-person neutral, consistent with AI-drafted text.
- Semi-formal engineering register with occasional wryness ("the skill fell silent on vocabulary" #904; "No `in-progress` skill appears in the router today, so the skill joins it when it graduates" #926).
- Precise quantification and provenance: "down from 6 failures before the fix" (#911), "99 files touched" (#905), "The invalid colons were introduced by #905's em-dash-to-colon sweep" (#911 attributes the regression to a prior PR).

## Content habits
- **Linked issues**: only 1 of 5 — #911 opens with "Fixes #907" repeated under its Summary. The rest link nothing.
- **Test plans**: universal. Every PR enumerates exact verification commands and their results: `grep -rP`, `node --check`, `bash -n`, PyYAML `safe_load` across "all 35 `SKILL.md` files" (#911), `npx skills add … --yes` (#911). Checkboxes split into what the tool verified (`- [x]`) and what a human must confirm (`- [ ]`).
- **Screenshots/images**: none in any PR — unsurprising, as the repo contains agent skill text files, not UI.
- **Changesets**: a repo-wide convention surfaced inside PRs — #905 adds `.changeset/remove-em-dashes-repo-wide.md`, #917 adds "a changeset (patch bump) per this repo's convention", #926's `## Documentation` lists "**Changeset**: added, so the release notes carry the skill."
- **Scope discipline**: PRs explicitly say what was deliberately *not* changed — #905 leaves `CHANGELOG.md` untouched; #926: "Correctly left alone… no entry in the top-level `README.md`, no entry in `.claude-plugin/plugin.json`… `ask-matt` is **not** updated."
- **Post-merge instructions**: #926 ends with "Run `scripts/link-skills.sh` to symlink the new skill into `~/.claude/skills`".
- **Breaking-change callouts / reviewer ask-outs / labels**: none (labels absent on all 5; consistent with zero-review solo maintenance).

## Bot-generated content
Strong, explicit bot signature: 4 of 5 descriptions close with `🤖 Generated with [Claude Code](https://claude.com/claude-code)` (#904, #905, #911, #926), and the rigid "Summary + bullet Test plan" shape is the Claude Code PR scaffold. The maintainer keeps the footer and structure rather than editing them out, meaning these PR descriptions are effectively AI-drafted and ship as-is. #917 keeps the same scaffold but omits the footer — either stripped manually or written by hand to mimic the template. This repo is therefore a direct case study in AI-generated PR descriptions (a competitor's pipeline in production use); notably, the quality bar remains human-like: cross-PR causal attribution (#911 blaming #905's sweep) suggests meaningful human/review iteration on top of generation.

## Notable exemplars
- **PR #911** — https://github.com/mattpocock/skills/pull/911 — the most complete: links the issue (`Fixes #907`), names the exact six files fixed, attributes the regression to a prior PR's sweep (#905), and validates exhaustively (all 35 SKILL.md files parsed, quoting the exact installer command to re-verify).
- **PR #926** — https://github.com/mattpocock/skills/pull/926 — best structural scope-control: its `## Documentation` section reads like a checklist of bucket requirements and explicitly records what was deliberately omitted and why, making the review trivially verifiable.
