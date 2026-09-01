# PR Patterns: msitarzewski/agency-agents

## Corpus
- PRs analyzed: 5 (numbers: #777, #778, #779, #806, #807)
- Caveat: only two authors — 3 PRs by Mr-Neutr0n (#777, #778, #779, all created 2026-08-12) and 2 by the repo owner msitarzewski (#806, #807, created/merged within ~1 minute on 2026-08-26). The two styles are distinct per-author, so this sample reflects two individuals' habits, not necessarily repo-wide convention. No labels, no review approvals, at most 1 comment per PR — a low-review-friction repo.

## Titles
Mixed conventions split by author. The contributor (Mr-Neutr0n) uses strict Conventional Commits with scopes:
- `fix(install): reject unknown agent selections` (#779)
- `fix(convert): quote generated YAML frontmatter` (#778)
- `fix(installer): deduplicate repeated tool selections` (#777)

The owner uses looser prefixes: `feat: add Knowledge Graph Engineer + Master Plan Architect agents` (#806, conventional type but lowercase free-form subject) and `Add Research division + Research Synthesist (consolidated #770)` (#807, no type prefix at all, references the superseded PR inline). All titles: single line, ~40–65 chars, lowercase after the colon, no emoji, no trailing period, `+` used to signal multi-part additions (#806, #807).

## Description structure
Two distinct, consistent per-author structures, both headed by `##` (H2) headers:

- Mr-Neutr0n (#777, #778, #779) — identical scaffold each time: `## Summary` (exactly 2 prose paragraphs: first states the buggy behavior, second states the fix), then `## Verification` (bulleted list of commands run). Example from #777: "`When \`--tool\` receives a comma-separated list, repeated values were retained… This change validates each requested tool as before, then keeps the first occurrence while preserving the user's order.`"
- msitarzewski (#806, #807) — prose preamble, then content sections. #806 has **no markdown headers**: preamble ("Two gated single-agent contributions — both clean-PASS on the automated gate…"), a markdown table of the two PRs being landed (`| PR | Agent | Div | Author |`), bold-led bullets for each agent, then `Closes #…` ×3 and a "Co-authored with @chen-jiying and @augustoheiss." footer. #807 uses headers: preamble, `## What` (2 bullets), `## Diligence` (4 bullets), `Closes #770`, co-author footer.

Canonical shapes: [preamble] → Summary/What → Verification/Diligence → Closes lines → co-author credit. Lists dominate; prose appears only in preamble/Summary paragraphs.

## Template usage
No evidence of a repo PR template: no checklists (`- [ ]`), no boilerplate, no "How Has This Been Tested"-style prompts. However, Mr-Neutr0n's three PRs are near-identical skeletons — `## Summary` + `## Verification` with the same paragraph shape — functioning as a personal reusable template. A hint of repo-level convention appears in the verification bullets, which repeatedly cite the same guard scripts (`scripts/check-divisions.sh`, `scripts/check-tools.sh`, `scripts/check-runbooks.sh`, `scripts/lint-agents.sh`) and the phrase "repository division, tool, runbook, … checks" (#778), suggesting a documented contribution checklist contributors follow manually. Conclusion: **freeform with strong self-imposed structure per author**; no enforced repo template.

## Length & density
Short, dense descriptions across both authors:
- #777: ~80 words (2 short paragraphs + 7 verification bullets)
- #778: ~85 words
- #779: ~80 words
- #806: ~120 words (table + bullets; longest in sample)
- #807: ~110 words

All under ~150 words, single-screen. Density is high: Mr-Neutr0n's bullets are verbatim commands (`bash -n scripts/install.sh scripts/test-agent-selection.sh`), and msitarzewski packs metrics inline ("Hermes generated count 270 → 272", "lint 0/0, low originality"). No filler, no motivational prose.

## Voice & tone
- Explanatory-descriptive, not imperative-first: fixes are framed as "This change validates each requested tool as before, then keeps the first occurrence…" (#777), "This change uses a small single-quote helper…" (#778).
- Bug descriptions use past-tense narrative: "`--agent` and `--agents-file` previously accepted unknown names. The installer then exited successfully…" (#779).
- Strictly third-person; no first person ("I", "we") anywhere in the 5 descriptions.
- Professional, compact engineering register; occasional en-dash emphasis ("— both clean-PASS on the automated gate", #806). Bold used to lead bullets with agent names (e.g., "**Knowledge Graph Engineer** —", #806).

## Content habits
- **Linked issues**: owner PRs close multiple and single issues respectively — `Closes #782 / Closes #804 / Closes #776` (#806, one per line) and `Closes #770` (#807). Mr-Neutr0n's 3 PRs link no issues despite #806 later closing the issues they originated from.
- **Test plans / verification**: systematic — every PR enumerates exact commands run. #777 even includes a repro command with result: "Parallel dry-run/install with `--tool claude-code,claude-code --jobs 2` installed 270 agents once and reported one tool." #778 adds an external-environment check: "macOS Ruby YAML parsing of generated Gemini CLI and OpenCode frontmatter".
- **Cross-referencing prior PRs**: heavy — #806 is itself a landing-PR table for #782/#804, and #807 explicitly says it "Lands #770… so it composes cleanly with the recently-merged install/convert fixes (#777/#778/#779) instead of reverting them".
- **Credit/co-authorship**: owner PRs end with "Co-authored with @chen-jiying and @augustoheiss." (#806) and "Co-authored with @prashantrajbista." (#807) — a deliberate attributing-consolidation pattern.
- **Quantified guardrails**: repeated "gate" metrics — "lint 0/0" (#806, #807), "originality 0.0%, 136L/9§" (#807), Hermes agent-count deltas (#806, #807).
- **Screenshots/images**: none (expected; the repo is shell scripts and agent definitions).
- **Breaking-change callouts / reviewer ask-outs**: none. Labels: none on any PR.

## Bot-generated content
No bot-authored PR descriptions observed — no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot-generated summaries, no AI-disclaimer footers in any of the 5 PRs. However, the repo's workflow is heavily automation-flavored: descriptions reference an "automated gate (lint 0/0, low originality, canonical structure, no dupes)" (#806) and an "Agent gate: lint 0/0, originality 0.0%" (#807) — the repo runs automated quality gates on agent contributions and the PR text reports those machine scores verbatim. That is bot-*measured* rather than bot-*written* content; the descriptions themselves read as tightly edited human notes.

## Notable exemplars
- **PR #777** — https://github.com/msitarzewski/agency-agents/pull/777 — the cleanest minimal fix: names the bug and trigger in two sentences, states the fix in one, and closes with a copy-pasteable repro command plus result in the verification list.
- **PR #807** — https://github.com/msitarzewski/agency-agents/pull/807 — a model consolidation PR: explains *why* it exists (preserve #777/#778/#779 instead of reverting), what lands, and the diligence performed (3-way merge verified, gate metrics, guard suite), ending with proper co-authoring credit.
