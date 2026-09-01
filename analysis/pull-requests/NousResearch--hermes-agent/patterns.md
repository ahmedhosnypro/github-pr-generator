# PR Patterns: NousResearch/hermes-agent

## Corpus
- PRs analyzed: 5 (numbers: #98546, #98547, #98558, #98099, #98628)
- Caveat: 4 of 5 PRs are by the same author (teknium1), and all 5 were merged on a single day (2026-08-30) with 0 reviews each and only 1–2 comments. The sample reflects essentially one dominant PR style plus one contrasting contributor (kshitijk4poor, #98099); it is too small and homogeneous to establish repo-wide conventions. Notably, several titles carry "salvage #N" — the 4 teknium1 PRs are rebuilt/resolved versions of earlier community PRs (#94036, #97292, #96740, #37317), so they are maintainer-authored consolidations, not typical external submissions.

## Titles
All 5 titles are strict conventional-commit format with a lowercase scope in parentheses and lowercase description text:
- `fix(compaction): native capability survives same-provider /model switches and gateway resume (salvage #94036 + #97292)` (#98546)
- `fix(compression): native-compaction settings hot-apply to open sessions (salvage #96740)` (#98547)
- `fix(approval): unattended webhook/API sessions no longer stall 300s on dangerous-command approval (#37284, salvage #37317)` (#98558)
- `fix(skills): skill_view directory file_path + skill_manage categorized name resolution` (#98099)
- `fix(compression): lean compaction is one auxiliary request again — 7-11 min digest stalls eliminated (#96603)` (#98628)

Pattern: `fix(<area>): <lowercase outcome statement> ([#issue / salvage refs])`. 4 of 5 are `fix`; #98628 is technically a perf change labeled `type/perf` but still titled `fix`. Scopes observed: `compaction`, `compression` (2×), `approval`, `skills`. Titles run long — roughly 80–130 characters — and pack in linkage metadata: parenthesized issue numbers (#37284, #96603) and "salvage" credits. No emoji, no trailing periods. Inline artifact names are not backticked in titles (`/model`, file names written plain).

## Description structure
One dominant structure (all 4 teknium1 PRs) uses `##` (H2) headers in this order: `## Summary` → `## Changes` → `## Validation` → `## Infographic`. #98558 inserts "Root cause" prose inside Summary and `#98099` is the outlier.

- PR #98546: `## Summary` (2 prose paragraphs, second explains the salvage merge strategy), `## Changes` (3 bullets crediting source PRs and commits), `## Validation` (4-row Before/After markdown table + "204 targeted tests pass; ruff clean"), `## Infographic`.
- PR #98547: same four sections; Changes bullets carry per-file diffs ("`tui_gateway/server.py` (+24): …"); a one-line safety note ("Cache-safe: routing-only attribute updates…") sits between Changes and Validation.
- PR #98558: Summary includes an explicit "Root cause:" paragraph and a live-observation anecdote ("Observed live Aug 30: a memory-watchdog webhook run sat the full 300s…"); Changes has 5 per-file bullets; Validation uses a 4-row Scenario/Before/After table plus a `**Live repro:**` bolded confirmation.
- PR #98628: Summary leads with the quantified win ("7-11 minute stalls"); Changes mixes per-file bullets with eval-harness citations (`evals/compaction/results/SCORECARD-2026-08-15.md`); Validation table; then an extra unnumbered prose section `## Live large-session A/B (real 500K historical transcript…)` with a second comparison table.
- PR #98099 (different author, different scaffold): `## Real-world impact` → `## What changed` (numbered change blocks, each with fenced `python` before/after diffs) → `## Test plan` (3 nested `- [x]` checklist items) → `## Follow-up (review feedback)` (references commit `1ba66281a3` and reviewer @kokhlo).

Common traits: `##` heading level throughout, bullets over prose for changes, markdown tables for validation evidence, heavy inline `backticks` for file paths, config keys, and tool names.

## Template usage
No evidence of a repository-enforced PR template: no "How Has This Been Tested" scaffolds, no unfilled prompts, no instructional boilerplate, and no unchecked `- [ ]` items. The only checklist appears in #98099's Test plan and is fully checked (`- [x]`). However, the Summary/Changes/Validation/Infographic quartet repeated verbatim in 4 of 5 descriptions functions as a personal template for the dominant author. Conclusion: **freeform with a strong author-level template** — two distinct personal scaffolds, neither repo-mandated.

## Length & density
Medium-length, information-dense descriptions:
- #98546: ~230 words across 4 sections, plus a 4-row table.
- #98547: ~180 words.
- #98558: ~400 words (longest narrative; includes root-cause and live-repro prose).
- #98099: ~350 words including two code blocks.
- #98628: ~400 words including two comparison tables and an extended A/B section.

Density is high: nearly every sentence carries a file path, config key, PR/issue number, or measurement. Compared to typical "concise-bullets" styles, this repo's descriptions are verbose but structured — prose explains behavior deltas ("capability silently dropped" → "preserved") rather than merely listing edits.

## Voice & tone
- Neutral descriptive voice, present tense, third person: "Native-compaction capability no longer silently drops…", "Enabling `compression.codex_responses_native` … now takes effect…". No first-person "I"/"we" anywhere; the closest is "(ours)" in #98546 referring to the follow-up commit group.
- Engineering-formal but lively: #98628 quotes an internal directive ("Teknium's directive: one chunk, one request.") and #98099 uses a wry framing ("the exact string that recurs 28× across five months of local optimization audit logs").
- Heavy quantitative register: durations (300s, 5+ minutes, 7-11 min, 196.5s vs 39.6s), counts (204 tests, 121/121, 194, 926 occurrences, 28×), and score deltas ("23.3→60.0", "+20-43pts").
- Attribution-forward tone: every salvage PR explicitly credits the original author (@steveonjava, @imsuperseller, @liuhao1024) and states authorship was preserved.

## Content habits
- **Validation tables are the signature habit**: 3 of 5 PRs (#98546, #98558, #98628) include a markdown table with Before/After columns comparing scenarios ("| Same-provider /model switch | capability silently dropped | preserved |").
- **Screenshots/infographics**: all 4 teknium1 PRs end with a `## Infographic` section embedding a generated image hosted on fal.media (e.g. `![Capability preserved](https://v3b.fal.media/files/b/…)`) — a distinctive, non-standard habit. #98099 has none; instead it uses before/after code blocks as its visual evidence.
- **Linked issues / cross-references**: dense. #98558 has "Fixes #37284" plus inline references to #87509 and #71661; every teknium1 PR names the salvaged PRs it replaces; #98628 says "Addresses the lean-pipeline half of #96603".
- **Test plans**: always present but as prose/counts, not commands — "204 targeted tests pass; ruff clean", "121/121 pass", "194 + 6 targeted tests pass (memory-capped)". Exact commands and toolchains (`ruff`) are named but never shown as copy-pasteable blocks. #98099 is the exception with named new test functions and a full-suite count.
- **Live evidence**: unusual habit of reporting production observations — "Observed live Aug 30: a memory-watchdog webhook run sat the full 300s" (#98558) and a real 500K-transcript A/B run (#98628).
- **Docs in the same PR**: #98558 updates `website/docs/user-guide/security.md` and #98628 updates eval docs, listed as ordinary Changes bullets.
- **No breaking-change callouts or reviewer ask-outs** in any of the 5.
- **Labels**: rich taxonomy on every PR — `type/*`, `comp/*`, `tool/*`, `area/*`, priority (`P1`/`P2`), and a repo-specific `sweeper:risk-*` family (e.g. `sweeper:risk-session-state`, `sweeper:risk-security-boundary`) suggesting an automated risk-labeling bot.

## Bot-generated content
No CodeRabbit, Copilot, or other bot summary blocks appear in any of the 5 descriptions — no "Summary by CodeRabbit" headers, walkthrough tables, or AI footers. The strongly uniform Summary/Changes/Validation/Infographic structure (with every PR embedding a fal.media-generated infographic) suggests machine-assisted generation may be part of the maintainer's workflow, but nothing in the text self-identifies as bot output. Adjacent bot traces exist though: the `sweeper:risk-*` labels look automation-driven, and #98547 notes a commit was "re-authored from their coding agent's local identity" — i.e., an upstream contributor used a coding agent, and the maintainer manually repaired attribution. Maintainer-owned, metric-driven, human-attributed style prevails.

## Notable exemplars
- **PR #98558** — https://github.com/NousResearch/hermes-agent/pull/98558 — the strongest sample: a conventional title carrying both issue and salvage links, an explicit root-cause paragraph with a live-observed incident, per-file Changes bullets, a scenario validation table, a verified live repro on both main and the branch, and honest scope framing ("Complementary to #71661 … remains a valid follow-up").
- **PR #98628** — https://github.com/NousResearch/hermes-agent/pull/98628 — best evidence discipline: claims are backed by an eval scorecard file, a scenario table, and a real-transcript A/B comparison (19 → 1 aux calls, 196.5s → 39.6s), with retained components explicitly enumerated so reviewers know what did *not* change.
