# PR Patterns: huggingface/transformers

## Corpus
- PRs analyzed: 5 (numbers: #14276, #14348, #48388, #48391, #48401)
- Caveat: the sample spans nearly 5 years (2021-11-04 → 2026-08-29), so it mixes two eras of the repo — the "who to tag" boilerplate differs between the 2021 and 2026 template-filled PRs. 4 distinct authors (changwangss ×2, ydshieh, Dovis01, NanoCode012). Small, heterogeneous sample; conclusions are indicative, not repo-wide statistics.

## Titles
No single convention; three distinct styles coexist:
- Conventional-commit type: `fix: flash-attn fallback failing on torch2.13` (#48388) — lowercase type, lowercase after colon.
- Bracketed scope: `[Docs]: Update GLM 5.3` (#48401).
- Freeform plain sentences: `Avoid print to stdout that fails the job `check_failed_tests` job` (#48391, note the duplicated word "job" — titles are not editorially polished); `enhance rewrite state_dict missing _metadata` (#14348); `improve rewrite state_dict missing _metadata` (#14276) — near-identical titles for a follow-up pair, lowercase, no type/scope.

Lengths ~25–60 chars, single line, no emoji, no trailing period. Casing is inconsistent (lowercase imperative in the 2021 pair, capitalized elsewhere). Notably the template itself pressures title quality: the boilerplate says "your PR is going to appear in the release notes with the title you set, so make sure it's a great title" — yet observed titles are still casual.

## Description structure
Two regimes:
- **Template-filled** (#14276, #14348, #48388): `# What does this PR do?` (H1!) → HTML-comment instruction block (kept verbatim) → `<!-- Remove if not applicable -->` → authored prose → `## Before submitting` (H2, checklist) → `## Who can review?` (H2, mostly boilerplate + one @-mention).
- **Freeform/minimal** (#48391, #48401): no headers at all — one or two short sentences.

Canonical order when the template is used: H1 "What does this PR do?" → prose → "Before submitting" → "Who can review?". Authored prose is short paragraphs; bullets appear only inside the template's own checklist.

## Template usage
Strong evidence of an official repo PR template, present and recognizable across both eras:
- Identical H1 scaffold `# What does this PR do?` in 3 of 5 PRs.
- Identical `## Before submitting` checklist with `- [ ]` / `- [x]` items ("Did you read the contributor guideline…", "Was this discussed/approved via a Github issue…", "Did you write any new necessary tests?") in #14276, #14348, #48388.
- Identical `## Who can review?` section ending in a large HTML-comment "who to tag" directory (@sgugger, @patrickvonplaten in 2021; @ArthurZucker, @Cyrilvallez, @ydshieh in 2026 — the directory was updated between eras but the scaffold is unchanged).
- Authors leave the instruction comments and `<!-- Remove if not applicable -->` placeholder in place; #14276 fills in only `Fixes #14268` between the placeholders.

Conclusion: **template** — an official, enforced-by-convention template that external contributors fill in (sometimes minimally), while core maintainers bypass it entirely for quick fixes (#48391 by maintainer ydshieh has no template at all).

## Length & density
Authored content is extremely short; the template dominates the byte count:
- #48391: ~15 words total ("My bad : introduced the bugs in #48338 and #48374. Fix similar to #47635").
- #48401: ~5 words of prose ("Update GLM 5.3 Model Docs") plus an injected CI badge block.
- #14276: ~4 words of authored content (`Fixes #14268`) — the rest is untouched template boilerplate (~460 words).
- #14348: ~35 words authored, rest is template.
- #48388: ~120 words authored (longest) — a `---` divider, then a real root-cause explanation with a permalink to the offending code lines (`import_utils.py#L1192-L1199`).

Pattern: concise-to-a-fault. 4 of 5 PRs ship descriptions shorter than the template they're wrapped in.

## Voice & tone
- Informal and first-person where authored: "My bad : introduced the bugs" (#48391), "Discussed on internal Slack with Axolotl-HF" (#48388).
- Lowercase, unpunctuated prose in the 2021 pair: "in order to avoid the ignore_key does not exist in the state_dict and cause failed."
- No sustained imperative/descriptive discipline; tone ranges from apologetic-casual (maintainer) to terse (external contributors).
- Credit-giving habit: #48388 includes "**Credit:** A similar fix also exists in … (credit `sywangyi`)".

## Content habits
- **Cross-references over issue links**: only 1 of 5 uses a formal "Fixes #N" line (#14276 → #14268). Others reference related PRs loosely: #48391 → "#48338 and #48374", "Fix similar to #47635"; #14348 → "enhance PR …#14276 which fix issue #14268"; #48388 links PR #48252 and a permanent code permalink. "Linked issues" metadata is empty in 4 of 5.
- **Reviewer ask-outs**: built into the template — authors append one @-mention under "Who can review?" (@sgugger twice in 2021; @IlyasMoutawwakil in 2026), guided by the "Please tag fewer than 3 people" instruction.
- **Test plans**: none. No validation commands, no test output; the template only *asks* ("Did you write any new necessary tests?") and the box is left unchecked `- [ ]` in all 3 template PRs.
- **Screenshots/images**: none (badge images aside).
- **Breaking-change callouts**: none.
- **Labels**: almost unused — only #48388 has one (`for patch`).
- **Checklist honesty**: contributors check the "read the guideline" and "discussed via issue" boxes but leave docs/tests unchecked rather than filling the template dishonestly.

## Bot-generated content
A repo-specific CI bot injects a dashboard badge block at the top of external-contributor PRs, delimited by HTML comments:

```
<!-- ci-dashboard-badge:start -->
[![CPU CI](https://transformers-ci.lor-e.huggingface.cool/badge/pr?pr=48401&event=pr-ci)](…)
<!-- ci-dashboard-badge:end -->
```

Present in #48401 and #48388 (both external, 2026), absent in #48391 (core maintainer) — suggesting the injector targets non-maintainer PRs. It is a status badge, not a prose generator: no CodeRabbit/Copilot-style summaries appear in any of the 5 descriptions. The human-authored text around the badge is unaltered and maintainers merge with the badge in place. As competition for AI-generated descriptions, the interesting signal here is the opposite: descriptions are so short and template-dominated that there is little for a generator to replace except the root-cause paragraph seen in #48388.

## Notable exemplars
- **PR #48388** — https://github.com/huggingface/transformers/pull/48388 — the strongest sample: fills the template, separates context with a `---` divider, gives a real root-cause analysis ("the check using revision `v1` which does not include build for this torch"), cites the exact source lines via permalink, and credits prior work — a complete audit trail in ~120 words.
- **PR #48391** — https://github.com/huggingface/transformers/pull/48391 — exemplar of the maintainer fast path: two sentences ("My bad : introduced the bugs in #48338 and #48374. Fix similar to #47635") that still link every relevant prior PR, showing that brevity works when cross-references carry the context.
