# PR Patterns: Shubhamsaboo/awesome-llm-apps

## Corpus
- PRs analyzed: 5 (numbers: #1122, #1097, #1126, #1106, #1059)
- Unlike many samples in this corpus, the 5 PRs come from 5 different authors (MagMueller, labrikg, Shyboy0499, GTCC777, Aryan-Pardeshi) — good author diversity for a small sample. Caveat remains: 5 PRs merged in a single day (all merged 2026-08-30) is a thin slice of an awesome-list repo that mostly ingests community-submitted example agents.

## Titles
Mixed conventions — no single enforced title style:
- Conventional Commits (2 of 5): `fix: update Browser Use meme agent` (#1122), `fix(advisor-orchestrator-worker): specify high effort for Gemini workers` (#1097, with parenthetical scope). Both lowercase after the colon.
- "Add …" marketing-style titles for new example apps (2 of 5): `Add AI x402 Paying Agent — pays a local seller you run yourself (testnet, vendor-free rework of #1028)` (#1106), `Add AI Codebase Migration Agent (LangGraph HITL + parallel Send() fan-out)` (#1059). Both carry a parenthetical or em-dash subtitle naming the technique (LangGraph HITL, x402, testnet) — the title doubles as a catalog entry, fitting an awesome-list repo.
- Freeform capitalized (1 of 5): `Fix renamed/transferred repo URLs across template docs` (#1126).

No emoji, no trailing periods. Length ranges widely: ~30 chars (#1122) to ~95 chars (#1106).

## Description structure
Markdown section headers are used in 4 of 5 PRs, but heading *level* varies:
- #1122: H2s in fix-report order — `## What changed` (4 bullets) → `## Why` (1 prose sentence) → `## Tests` (7 bullets)
- #1097: H2s — `## Summary` → `## Problem` (with fenced error-output block) → `## Fix` (with command block) → `## Validation`
- #1126: single `## Summary` + a markdown table of old→new URLs
- #1106: prose preamble ("Reworked resubmission of #1028…"), then **bold pseudo-headers** instead of real headings: `**What changed from #1028**`, `**Unchanged**`, `**Tested end to end before submitting**`
- #1059: prose preamble, then H3s — `### What this adds` (with ASCII flow diagram), `### Why this domain`, `### Verification`, `### Notes`, `### Run it` (bash block)

Convergent skeleton across authors: [context/preamble] → what changed/summary → why/problem → validation/tests. The "why" section is treated as first-class, not optional (present in 4 of 5 under names `Why`, `Problem`, `Why this domain`). Lists dominate over prose for the "what" sections; prose dominates the "why" sections.

## Template usage
No repo template evidence: no `- [ ]` checklists, no "How Has This Been Tested" scaffold, no boilerplate instructions, no unfilled prompts. Each description is authored fresh — wording and header levels differ per PR (#1059 uses H3s, #1097 uses H2s, #1106 uses bold spans). However, the recurring "what → why → validation" triad across 5 different authors suggests a strong community norm (possibly modeled on previously merged PRs) rather than enforcement. Conclusion: **freeform with strong convergent structure**.

## Length & density
Bimodal by PR type:
- Fix/maintenance PRs are compact: #1126 ~55 words, #1122 ~120 words, #1097 ~130 words (including error/command blocks).
- New-submission PRs are substantial: #1106 ~230 words, #1059 ~360 words (the longest, with diagram, 5 sections, and run instructions).

Density is high throughout — bullets carry specific facts ("replace the nonexistent `gemini-3.6-flash` model name with `gemini-3-flash-preview`", #1122), not filler. No PR has low-information boilerplate.

## Voice & tone
- Bullets are imperative/descriptive ("update `browser-use` from 0.1.26 to 0.13.8", #1122); explanatory prose is present-tense declarative ("In a research agent, approving a plan is a UX nicety. Here it's a safety property", #1059).
- Almost no first person. The exception is the resubmission courtesy in #1106: "following your guidance there exactly. Thanks for the clear steer" — addressed directly to the maintainer.
- Register is technical but readable; authors argue design rationale pedagogically (#1059 explains *why* `interrupt()` approval matters in this domain), matching the repo's teaching purpose.
- Precise quantities recur: "6 workers fanned out in parallel, 6/6 succeeded" (#1059), "3/3 dispatches failed / 3/3 passed" (#1097), "1000 atomic units = $0.001 testnet USDC" (#1106).

## Content habits
- **Linked issues**: none — all 5 PRs have "Linked issues: none". Cross-references go sideways to prior PRs instead: #1106 → "rework of #1028", #1059 → "Follow-up to #1056". Feedback loops across closed PRs are the norm for this repo (resubmission culture).
- **Test plans**: 4 of 5 PRs include explicit verification sections (#1122 `## Tests` with 7 checks from `uv lock --check` to "exact-diff secret scan"; #1097 with before/after dispatch counts; #1059 `### Verification` including a stubbed no-API-key graph test; #1106 with end-to-end on-chain settlement). Even the docs-only URL fix #1126 states its verification ("confirmed as the canonical `nameWithOwner` via the GitHub API").
- **Screenshots/images**: none in any PR. #1059 substitutes an ASCII architecture diagram in a fenced block.
- **Labels**: none on any PR (Labels: none ×5) — repo does not use label taxonomy on these.
- **Breaking-change callouts / reviewer ask-outs**: no explicit callouts; #1106's "No vendor links anywhere" reads as preemptively addressing maintainer feedback from #1028.
- **Runnable instructions**: new-app PRs end with copy-paste run commands (`pip install -r requirements.txt && streamlit run app.py`, #1059) — fitting a examples-catalog repo.

## Bot-generated content
One explicit disclosure: #1106 ends with the Claude Code footer "🤖 Generated with [Claude Code](https://claude.com/claude-code)". This is the strongest direct signal in the sample that AI-assisted description writing is accepted here — the footer was kept by the author and the PR was merged with it intact. Beyond that, the structural polish across all 5 PRs (uniform section triads, quantified validation, em-dash subtitled titles) is consistent with AI-assisted drafting, but no other PR carries an explicit signature — no CodeRabbit summary blocks, no Copilot descriptions. Notably, the one admitted AI-generated description (#1106) is also a resubmission that was merged, suggesting AI-generated descriptions are not stigmatized in this repo as long as the technical content verifies.

## Notable exemplars
- **PR #1059** — https://github.com/Shubhamsaboo/awesome-llm-apps/pull/1059 — the strongest sample: explains why the submission differs from a rejected predecessor (#1056), teaches the LangGraph primitives it demonstrates, quantifies its end-to-end verification (6/6 workers, 29k-char report), notes sandboxing of LLM-generated chart code, and ends with runnable commands.
- **PR #1097** — https://github.com/Shubhamsaboo/awesome-llm-apps/pull/1097 — a model small-fix PR: reproduces the exact error text in a fenced block, shows the corrected command, and gives a falsifiable before/after ("Without the flag: 3/3 dispatches failed… With --effort high: 3/3 dispatches passed") for a +3/-2 diff.
