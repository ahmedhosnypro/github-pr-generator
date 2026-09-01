# PR Patterns: yt-dlp/yt-dlp

## Corpus
- PRs analyzed: 5 (numbers: #17324, #17311, #17567, #16683, #16934)
- Caveat: sample skews toward one author — 3 of 5 PRs are by doe1080 (#17324, #17311, #16934); the other two are by tcely (#17567) and FraFraFra-LongD (#16683). All 5 merged within a 2-day window (2026-08-29 → 2026-08-30), though creation dates span months (#16683 created 2026-05-10). Also, all 5 are small diffs (+1/+146 lines at most); this sample contains no large feature PRs, so conventions for big changes are not observable here.

## Titles
All 5 titles use yt-dlp's bracketed scope-prefix convention (not standard Conventional Commits — square brackets and no `feat`/`fix` types):
- `[docs] Fix \`Namespace\` documentation` (#17324)
- `[utils] \`subs_list_to_dict\`: Fix empty value handling` (#17311)
- `[ie/applepodcasts] Fix token caching` (#17567)
- `[ie] Do not warn on intentional generic results` (#16683)
- `[utils] \`devalue\`: Improve binary type parsing` (#16934)

Pattern: `[<area>]` or `[<area>] \`symbol\`:` followed by an imperative verb phrase. Scope values observed: `docs`, `utils` (2×), `ie`, `ie/<site>` — matching yt-dlp's directory layout (`yt_dlp/utils`, `yt_dlp/extractor`). When the change targets one function, the function name is backtick-quoted between the scope and a second colon (2 of 5). Verbs are imperative and capitalized (`Fix` 2×, `Do not warn`, `Improve`). Lengths ~25–45 chars, no emoji, no trailing period.

## Description structure
Every description has exactly two zones:

1. An optional free-text preamble directly under the fixed heading `### Description of your *pull request* and other information` (H3).
2. A mandatory collapsible template block, `<details open><summary>Template</summary>`, containing H3 checklist sections.

Order of template sections is identical in all 5: submission attestations → licensing (Unlicense) → purpose checkboxes. The preamble content varies by author:
- #17324: no free text at all — only the template.
- #17311: one sentence ("Fix fallback behavior for empty subtitle `id` and `ext` values").
- #17567: two short prose paragraphs, one referencing commit `aaf7405ba3a45b32c59f160426efc9b561af035a`.
- #16683: two prose paragraphs of problem statement, then a numbered 3-item list keyed by file ("1. **`extractor/common.py`**: …", "2. **`extractor/thisvid.py`**: …"), then a closing scoping paragraph ("No changes were made to extractors that use `GenericIE` as a genuine last-resort fallback…").
- #16934: a 5-column markdown table (`| Typecode | C type | Python min bytes | … |`) plus three bare reference URLs (docs.python.org, learn.microsoft.com, docs.oracle.com).

## Template usage
Strong, enforced template. All 5 PRs retain the full boilerplate, including the hidden HTML comment warning: "**IMPORTANT**: PRs without the template will be CLOSED", "PLEASE AVOID FORCE-PUSHING", "PLEASE MAKE SURE TO ENABLE EDITS BY MAINTAINERS!". All checklists are filled with `- [x]`; unchecked leftovers are rare (#16683 leaves one legitimate alternate option unchecked: "I am not the original author of the code…"). Note the deliberate `<details open>` — the template even comments "OPEN is intentional", i.e. the checklist is meant to stay visible to reviewers.

Two template generations are visible in the sample:
- Newer wording (#17324, #17311, #17567): "Before submitting a *pull request* you must attest to the following:" including a dedicated `NO AI / NO LLM POLICY` checkbox, plus threats in the hidden comment ("If any of your answers are dishonest, you will be permanently blocked from this repository").
- Older wording (#16683, #16934): "Before submitting a *pull request* make sure you have:", with the AI-policy checkbox folded into the licensing section ("I have read the [policy against AI/LLM contributions]…").

Conclusion: **template, mandatory and near-verbatim** — authored free text is confined to a short preamble above the checklist.

## Length & density
Free-text (author-written) word counts, excluding template boilerplate:
- #17324: ~0 words (template only) for a +1/-2 docs fix
- #17311: ~10 words for +14/-2
- #17567: ~40 words for +1/-1
- #16683: ~230 words for +3/-0 — by far the densest, and it is all structured rationale, not filler
- #16934: ~50 words of prose-equivalent (mostly a data table + URLs) for the largest diff (+146/-20)

Pattern: extremely terse. Description length does not scale with diff size (the biggest diff, #16934, communicates via a reference table rather than prose). Total rendered description length is dominated by the boilerplate template in 4 of 5 PRs.

## Voice & tone
- Titles: imperative mood, capitalized verb (`Fix`, `Improve`, `Do not warn`).
- Preambles: mixed. #17567 is informal, first-person-adjacent and conversational: "It looks like this line was missing the rest needed to return the cached value. Ahh. After reviewing aaf7405…". #16683 is formal, technical, third-person/impersonal. #17311 is a bare imperative fragment.
- Overall register is engineer-to-engineer, with heavy inline code formatting (`GenericIE._real_extract`, `url_result(..., ie='Generic', ...)`, `{'to_generic': True}` in #16683).

## Content habits
- **Linked issues**: none. 0 of 5 use "Fixes #N" or list linked issues; none of the preamble text references an issue number. PRs stand alone without issue linkage in this sample.
- **Commit references**: #17567 cites a specific commit hash (`aaf7405ba3a45b32c59f160426efc9b561af035a`) to explain the regression's origin.
- **Test plans**: no explicit test-plan sections; the template's purpose checkbox carries the testing burden instead ("Fix or improvement to an extractor (Make sure to add/update tests)" is checked in #17567 and #16683).
- **Evidence style**: instead of screenshots (none observed, sensible for a CLI tool), evidence is reference material — #16934 cites three external documentation URLs; #16683 names the exact internal mechanism and affected extractors (`ThisVidIE`, `AtScaleConfIE`).
- **Breaking-change callouts / reviewer ask-outs**: none observed. Reviewer-facing structure is delegated to the mandatory checklist.
- **Labels** are consistently applied and map to the purpose checkbox: `bug` (#17311), `site-bug` (#17567), `docs/meta/cleanup` (#17324), `enhancement, pending-fixes, core:extractor` (#16683).

## Bot-generated content
None — and that is policy, not coincidence. yt-dlp has an explicit **NO AI / NO LLM POLICY**, and all 5 PRs contain a checked attestation such as "This pull request complies with yt-dlp's **NO AI / NO LLM POLICY**" (newer template) or "I have read the [policy against AI/LLM contributions] and understand I may be blocked from the repository if it is violated" (older template). The template even warns that dishonest answers lead to a permanent block. No CodeRabbit/Copilot/AI-summary blocks appear anywhere. This repo is a hard counterexample to AI-generated PR descriptions: the checklist itself is a gatescreen against them.

## Notable exemplars
- **PR #16683** — https://github.com/yt-dlp/yt-dlp/pull/16683 — the strongest sample: opens with a two-paragraph problem statement (what warning fires, why, and which extractors are affected), then a per-file numbered change list (`common.py`, `thisvid.py`, `atscaleconf.py`), and closes by explicitly bounding the blast radius ("No changes were made to extractors that use `GenericIE` as a genuine last-resort fallback…") — a complete review brief in ~230 words for a 3-line diff.
- **PR #17567** — https://github.com/yt-dlp/yt-dlp/pull/17567 — best terse example: 40 conversational words that still identify the root cause by commit hash, appropriate for a 1-line fix.
