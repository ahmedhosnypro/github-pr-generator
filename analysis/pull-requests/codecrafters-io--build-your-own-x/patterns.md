# PR Patterns: codecrafters-io/build-your-own-x

## Corpus
- PRs analyzed: 5 (numbers: #1844, #1812, #1398, #1403, #1538)
- Caveat: this repo is a curated link list (README-driven), and all 5 sample PRs are trivially small 1-file changes (stats: `+1 -1`, `+1 -0`, `+0 -1`, `+0 -1`, `+2 -1`). 5 different authors (ARJ544, roiamiel1, NikoPit, RyanB28, Velnbur) with 5 different styles — a heterogeneous but very shallow sample; conclusions apply only to "link-list maintenance" PRs, not to anything more complex.

## Titles
No convention (no Conventional Commits, no scope prefixes). Observed titles, quoted verbatim:
- `Fix incorrect anchor link for "Build your own AI model"` (#1844)
- `add Build Your Own PyTorch` (#1812 — lowercase "add")
- `"Java voxel game" video unavalible  anymore` (#1398 — contains a typo "unavalible" and a double space; merged as-is)
- `Removed broken link` (#1403 — past tense, unlike the others)
- `Fix link to "F#: Building Neural Networks in F#", add both parts` (#1538)

Pattern: short, single-line, lowercase-leaning, verb-led (`Fix`, `add`, `Removed`) or none. Casing and tense are inconsistent across authors (imperative #1844/#1812 vs past tense #1403). No emoji, no trailing periods, no area prefixes. Lengths ~30–70 chars.

## Description structure
No consistent structure. Per PR:
- PR #1844: single H2 `## Summary` followed by 3 short prose paragraphs ("This PR fixes an incorrect anchor link in the README. / The existing link points to `#ai-model`, but the actual GitHub-generated anchor… `#build-your-own-ai-model`.")
- PR #1812: H2 `## Build Your Own PyTorch` (content-named, not a structural header) followed by 2 prose paragraphs describing the linked resource. This is actually marketing copy for the resource being added, not a change description.
- PR #1398: no prose at all — a screenshot image only, followed by a CodeRabbit block.
- PR #1403: empty description except the CodeRabbit block.
- PR #1538: one line only — `Fixes #1537`.

Headings, when present, are H2; only 2 of 5 PRs have any heading at all. Lists appear only inside bot-generated content, never in human prose. 3 of 5 PRs (#1398, #1403, #1538) contain no human-written prose description of the change.

## Template usage
No evidence of a repo PR template: no checklists (`- [ ]`), no "How Has This Been Tested" scaffolds, no repeated boilerplate, no unfilled prompts. Each authored description (#1844, #1812) is freeform. Conclusion: **freeform**; the repo accepts essentially unstructured descriptions.

## Length & density
Extremely short:
- #1844: ~45 words
- #1812: ~90 words (longest human-written body)
- #1398: 0 words of prose (1 image)
- #1403: 0 words (bot block only)
- #1538: 3 words (`Fixes #1537`)

Median human authorship is near zero; even the longest PR fits in under 100 words. Density matches the diffs: every change is a 1-line link addition/removal, so there is nothing to narrate beyond what changed in one sentence.

## Voice & tone
- #1844: neutral third-person descriptive ("This PR fixes an incorrect anchor link…", "This updates the link so it correctly navigates…"), precise and factual.
- #1812: promotional/educational register ("A project-based curriculum that teaches how modern deep learning frameworks work…", "The goal is to develop a deep understanding…"), describing the resource rather than the PR.
- No first person anywhere; no greetings, thanks, or casual chatter in any of the 5 descriptions (informality shows up only in the typo'd title of #1398).

## Content habits
- **Linked issues**: minimal — only #1538 uses `Fixes #1537`; the other 4 link nothing despite 4 of 5 being pure fix/maintenance changes (the fix-for-what link lives in the title instead).
- **Screenshots/images**: 1 of 5 — #1398 embeds a screenshot (`![image](https://github.com/user-attachments/assets/187721f1-…)`) as its entire human-authored content; the image is the bug report (a dead video).
- **Test plans**: none anywhere — no CI/validation notes, expected since changes are Markdown link edits.
- **Breaking-change callouts / reviewer ask-outs**: none.
- **Labels**: none on any of the 5 PRs. Comment counts are 0–2, indicating near-zero review discussion.
- Latency note: #1398 sat ~11 months (created 2025-03-29, merged 2026-02-21) and #1403 ~10 months — the 2026-02-21 batch-merge of three old PRs suggests bulk triage rather than per-PR scrutiny.

## Bot-generated content
CodeRabbit is present in 2 of 5 PRs (#1398, #1403) as the **entire** description body. Observed format, verbatim from #1398:

```
<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

## Summary by CodeRabbit

- **Documentation**
	- Removed an outdated resource link from the "Build your own Voxel Engine" section in the documentation.
```

and #1403: `- **Documentation** / - Updated the blockchain resource list by removing an outdated reference, streamlining the available resources for users.`

Maintainers merge these with the bot block left in place (both PRs were merged as-written on 2026-02-21), i.e. CodeRabbit's "Summary by …" one-bullet block is de-facto accepted as a sufficient PR description for trivial removals. Note the boilerplate is mildly verbose relative to the human norm: "streamlining the available resources for users" adds filler no human wrote elsewhere in this corpus.

## Notable exemplars
- **PR #1844** — https://github.com/codecrafters-io/build-your-own-x/pull/1844 — the only sample with a real problem→cause→fix narrative in three sentences, citing the exact wrong anchor (`#ai-model`) and the correct one (`#build-your-own-ai-model`); ideal shape for a link-list maintenance PR.
- **PR #1538** — https://github.com/codecrafters-io/build-your-own-x/pull/1538 — minimal but correctly completes the reference loop via `Fixes #1537`, which most of the sample fails to do.
