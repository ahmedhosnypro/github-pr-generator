# PR Patterns: Comfy-Org/ComfyUI

## Corpus
- PRs analyzed: 5 (numbers: #15908, #15955, #15945, #15977, #9926)
- Caveat: the sample is heterogeneous rather than homogeneous — 4 distinct authors (kijai, comfyanonymous ×2, bigcat88, 0xDELUXA) — but it spans an unusual time range (#9926 is from 2025-09-18; the rest are from 2026-08-26 → 2026-08-30), and 2 of the 4 non-empty PRs come from the project owner. Two descriptions are entirely empty, so only 3 PRs carry any analyzable body. Too small and skewed to support repo-wide conclusions.

## Titles
No single convention; at least three coexisting styles observed:
- Conventional-commit-ish with bracketed scope prefix: `[Partner Nodes] fix(HeyGen): update Avatar Video price badge` (#15945) — the only one with a `type(scope):` shape.
- Name-prefixed feature title: `MiniMax-H3: Support PDD LoRA` (#15908) — model name as pseudo-scope, capitalized verb after colon.
- Plain imperative sentences, no prefix: `Add section about user input tolerance to AGENTS.md` (#15955), `Enable fp8 ops by default on gfx1200` (#9926), `Improve some warning messages.` (#15977 — note the trailing period, which breaks the usual no-period convention).

Length ~30–65 characters, single line, no emoji. Casing after any colon is capitalized; plain-sentence titles start capitalized too. The repo tolerates all of these equally — no enforcement is evident.

## Description structure
Only 3 of 5 PRs have any description; structures diverge completely:

- PR #15908: freeform technical write-up — H2 header `## Support MiniMax H3 PDD acceleration LoRAs` restating the title, then a prose paragraph explaining the mechanism, a "Converted LoRAs here temporarily for testing:" line with a HuggingFace link, then H3 `### Changes` with 2 bullets, each leading with a bolded backticked file path (**`comfy/lora.py`**, **`comfy/ldm/minimax/model.py`**), then a closing prose paragraph explaining why no new node is needed.
- PR #15945: pure checklist template, no prose at all (see Template usage). H2 `## API Node PR Checklist` with H3 subsections (`### Scope`, `### Pricing & Billing`, `### QA`, `### Comms`).
- PR #9926: exactly one line of prose — `A PR like https://github.com/comfyanonymous/ComfyUI/pull/8464, enables fp8 ops by default on gfx1200 too.` — just an analogy to a prior PR; nothing else for a 1-line config change.
- PRs #15955 and #15977: description body is literally empty (both by maintainer comfyanonymous, both tiny diffs merging fast: #15977 merged 1 minute after creation).

No shared ordering or header vocabulary across PRs; each author invents their own structure or skips it.

## Template usage
Clear evidence of a **scoped template for API-node pricing changes only**: #15945 opens with an HTML marker `<!-- API_NODE_PR_CHECKLIST: do not remove -->` and presents a checkbox scaffold — `### Scope` (`- [x] Is API Node Change`), `### Pricing & Billing` (`- [x] Need pricing update` / `- [ ] No pricing update`, with conditional sub-items "Metronome rate cards updated", "Auto-billing tests updated and passing"), `### QA`, `### Comms` (`- [ ] Informed **Kosinkadink**` — left unchecked). The author filled the template in properly rather than leaving prompts untouched.

The other 3 non-empty PRs show no template markers, no `- [ ]` scaffolds, no boilerplate. Conclusion: **partial** — a workflow-specific template exists for partner/API-node PRs; everything else is freeform (or empty).

## Length & density
Bimodal — either a full technical explanation or essentially nothing:
- #15908: ~200 words across 4 blocks; the densest sample, and information-dense throughout (mechanism, file-level rationale, why stock machinery suffices).
- #15945: ~40 words, all template checkbox labels; zero original prose.
- #9926: ~15 words, one sentence.
- #15955, #15977: 0 words.

Median description length is effectively near zero. The pattern correlates with change size and author: a 33-line feature gets 200 words (kijai); 1–2 line tweaks by the owner get none.

## Voice & tone
- PR #15908 is expository technical prose, present tense, mostly imperative-free descriptive voice: "Comfy had no way to load the bank", "`FinalLayer` reads an `[N*out, in]` head as a PDD bank". No first person. Precise, uses exact numbers ("8 NFE", "32-interval bank", "shifts 12/3").
- #9926 is casual first-context prose ("A PR like …, enables fp8 ops by default … too").
- #15945's only "voice" is the template's own phrasing.
- Formality is author-dependent; there is no house style. Empty descriptions from the owner (#15955, #15977) signal that trivial changes are expected to be self-explanatory from the title alone.

## Content habits
- **Linked issues**: zero across all 5 PRs — no "Fixes #N" of any kind. The only cross-reference observed is PR-to-PR: #9926 points to comfyanonymous/ComfyUI#8464 as the analogous change.
- **External links**: #15908 links HuggingFace model repos (the alibaba-pai LoRAs and a converted test copy); consistent with a model-support PR.
- **Test plans**: only implicit — #15945's template checkbox "Auto-billing tests updated and passing" is checked, but no commands or test output are quoted anywhere in the sample.
- **Screenshots/images**: none in any PR.
- **Breaking-change callouts / reviewer ask-outs**: none; the closest is the template's `Informed **Kosinkadink**` comms checkbox in #15945.
- **Labels**: none on any of the 5 PRs.
- **File-anchored bullets**: #15908's habit of opening each change bullet with a bolded backticked path (**`comfy/lora.py`**: …) is a distinctive, reviewer-friendly pattern worth emulating.

## Bot-generated content
No bot-generated description content observed in any of the 5 PRs — no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot-generated summaries, no AI-disclosure footers. The only automation artifact is the `<!-- API_NODE_PR_CHECKLIST: do not remove -->` marker in #15945, which is a template injector (likely an Actions workflow) rather than a summarizer; the human author filled it in. Notably, #15955's title references AGENTS.md ("Add section about user input tolerance to AGENTS.md"), indicating the repo actively documents how AI agents should behave in it, but the PR bodies themselves carry no AI-generation signature.

## Notable exemplars
- **PR #15908** — https://github.com/Comfy-Org/ComfyUI/pull/15908 — the strongest sample by a wide margin: explains the underlying mechanism (PDD, 32-interval head bank), anchors every change to a specific file in bold-backtick bullets, links test assets, and closes by explaining why no new node or schedule is needed — a complete technical case in ~200 words.
- **PR #15945** — https://github.com/Comfy-Org/ComfyUI/pull/15945 — not elegant prose, but the best example of disciplined template use: every applicable checkbox resolved, untouched branches left explicit (`- [ ] QA done` / `- [x] QA not required`) rather than deleted, making review state machine-checkable.
