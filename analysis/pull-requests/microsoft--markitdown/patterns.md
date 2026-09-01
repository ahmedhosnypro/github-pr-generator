# PR Patterns: microsoft/markitdown

## Corpus
- PRs analyzed: 5 (numbers: #2223, #2233, #2257, #2258, #2316)
- Caveat: only 5 PRs merged over a ~1-month window (2026-07-17 → 2026-08-19), spread across 4 distinct authors (chienyuanchang, guoyu-wang, afourney ×2, danfiedler-msft). afourney is the repo author/maintainer; the others are external or cross-team contributors. Sample is small, but more author-diverse than a single-maintainer sample — patterns below reflect a mix of community-contributor and maintainer styles, not one house style.

## Titles
Mixed conventions; no single enforced format:
- Conventional-Commit style with type prefix appears once: `fix: handle PPTX SVG images without a rasterized fallback` (#2233) — lowercase description after the colon.
- Sentence-style titles, capitalized: `Fix typos and formatting in comments, docstrings, and markdown` (#2223), `Fix omml template bugs.` (#2257), `Bump version to 0.1.7` (#2258), `Pin GitHub Actions to full-length commit SHAs` (#2316).
- Pattern when not conventional: `Fix/Verb <specific thing>` with product/component terms spelled out (`PPTX SVG images`, `GitHub Actions`, `omml template`). #2257 carries a trailing period; the others do not. No emoji, no scope parentheses, no ticket prefixes. Lengths ~35–60 characters.

## Description structure
No repo-wide structure. Each of the 5 descriptions uses a different organization:

- PR #2223: one-paragraph scope preamble ("Cleanup pass fixing typos and formatting issues in comments, docstrings, and markdown files. **No functional/API code was changed**"), then H2 sections in order: `## Fixes by file` (with H3 subsections `### Comments & docstrings`, `### Test files`, `### Markdown formatting`, each a per-file bullet list of before→after pairs), `## Deliberately not changed`, `## Verification`.
- PR #2233: no headings at all — two prose paragraphs: one explaining the root cause ("When a picture has no raster fallback, the <a:blip> has no r:embed, so python-pptx's shape.image raises ValueError"), one describing the fix and tests ("Resolve the SVG part directly from the svgBlip extension via a new _get_image_info helper… Add unit tests plus a small synthetic PPTX fixture").
- PR #2257: a single H2 heading `## Fix fallback handling for unrecognized OMML attribute values` followed by four indented prose paragraphs explaining the bug, the fix, and affected handlers (`do_acc`, `do_bar`, `do_f`, `do_groupchr`).
- PR #2258: a single sentence, no structure ("Bump version to 0.1.7 for a new release.").
- PR #2316: the most scaffolded — five H2 sections in fixed order: `## Summary`, `## Why?`, `## What changed?`, `## Is this safe to merge?`, `## Additional Information`, mixing prose paragraphs with bolded sub-labels (`**Action pinning:**`, `**Dependabot configuration:**`).

Only commonality: H2 (`##`) is the heading level whenever headings exist; bullets appear only in #2223 (exhaustively) and partially in #2316's prose-with-bold-labels style.

## Template usage
No evidence of a repo-enforced PR template: no `- [ ]` checklists, no "How Has This Been Tested"-type scaffold, no unfilled boilerplate prompts, and no repeated structure between PRs. Each description looks authored from scratch for the change at hand. Conclusion: **freeform**.

## Length & density
Bimodal spread:
- #2223: ~600 words — exhaustive per-file changelog, the longest by far.
- #2233: ~100 words, dense two-paragraph technical narrative.
- #2257: ~200 words, prose-heavy mechanism explanation.
- #2258: 8 words.
- #2316: ~250 words in templated sections.

Norm for substantive changes is 100–600 words of dense technical prose (root cause → fix → affected scope → verification), with release/trivial PRs getting one line. Word count tracks change complexity, not a fixed convention.

## Voice & tone
- Overwhelmingly third-person, neutral, engineering-register. No first person ("I/we") in any of the 5 descriptions; actions are attributed to the change itself ("`get_val()` now falls back to the caller's `default`", "This change mitigates the risk of tag retargeting").
- Precise, mechanism-level vocabulary: identifiers in backticks (`_get_image_info`, `do_groupchr`, `PRIORITY_GENERIC_FILE_FORMAT`), explicit exception names (`ValueError`, `IndexError`, `KeyError`), citations of standards ("matching ECMA-376's U+23DF default").
- Bold used sparingly for emphasis of scope guarantees: "**No functional/API code was changed**" (#2223), bolded sub-labels in #2316.

## Content habits
- **Linked issues**: none observed — 0 of 5 PRs link an issue; no "Fixes #N" patterns.
- **Labels**: none on any PR.
- **Verification/test notes**: present in 3 of 5. #2223 has a dedicated `## Verification` section ("codespell . --skip=… returns exit 0 across the whole repo"); #2233 states "Add unit tests plus a small synthetic PPTX fixture covering the SVG-without-fallback case"; #2257 closes with "Existing tests pass, including `test_docx_equations`".
- **Scope guardrails**: #2223 includes a `## Deliberately not changed` section listing untouched files (Microsoft boilerplate, vendored dwml code, test fixtures) — an explicit non-goals list; #2316 includes a `## Is this safe to merge?` section pre-answering review risk.
- **External references**: #2316 links heavily to Microsoft/GitHub docs and incident write-ups (tj-actions/changed-files, codfish/semantic-release-action).
- **No screenshots/images** in any PR (granted, none are UI changes). **No breaking-change callouts or reviewer ask-outs** observed.

## Bot-generated content
No CodeRabbit, Copilot, or other AI/bot summary blocks observed in any of the 5 descriptions — no "Summary by CodeRabbit" sections, auto-generated walkthroughs, or AI-disclosure footers. PR #2316 reads like it was produced from a Microsoft-internal script or campaign (fixed Q&A headings, aka.ms links, "This work is described in more detail at https://aka.ms/action-pinning"), suggesting mass-produced security-hardening PRs sent to many repos, but it is structured human/tooling boilerplate, not LLM-generated summary content, and the maintainer merged it with its structure intact.

## Notable exemplars
- **PR #2223** — https://github.com/microsoft/markitdown/pull/2223 — a model "boring maintenance" PR: explicit no-behavior-change guarantee up front, per-file before→after audit trail, a "Deliberately not changed" section, and a verification section stating the exact tool and result.
- **PR #2233** — https://github.com/microsoft/markitdown/pull/2233 — best bug-fix description in ~100 words: root cause traced to the library boundary (python-pptx raising ValueError), the fix named precisely, and test coverage stated, all without headings.
