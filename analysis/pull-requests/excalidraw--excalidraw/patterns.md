# PR Patterns: excalidraw/excalidraw

## Corpus
- PRs analyzed: 5 (numbers: #11815, #11849, #11862, #11960, #11974)
- Authors: excalibot (bot, #11815), dwelle (2×: #11849, #11960), JayeshRajbhar (#11862), zsviczian (#11974). Merged between 2026-08-07 and 2026-08-26.
- Caveat: the sample is deeply heterogeneous — one bot-generated translation sync, two core-maintainer PRs with **empty** descriptions, and two external-contributor PRs with elaborate structure. Only 5 PRs across 4 distinct authors, so no single "repo voice" can be established; patterns below are split by author type rather than generalized.

## Titles
All 5 titles follow strict Conventional Commits with an explicit scope:
- `chore(editor): Update translations from Crowdin` (#11815)
- `fix(editor): respect boxSelectionMode ('contain' vs 'overlap') in lasso tool` (#11862)
- `feat(editor): bucketfill cursor + eyedropper support` (#11849)
- `feat(app): d2c streaming` (#11960)
- `feat(packages/excalidraw): support rendering into another document` (#11974)

Format: `type(scope): summary`, where type ∈ {`feat`, `fix`, `chore`} and scope is a package/area name (`editor` 3×, `app` 1×, `packages/excalidraw` 1×). Casing after the colon is inconsistent: #11815 and #11862 use lowercase; #11815 title-cases "Update". Lengths ~30–80 chars, no emoji, no trailing period. #11862's title embeds code formatting (`'contain' vs 'overlap'`) and parenthetical detail, making it the most descriptive.

## Description structure
Two distinct universes:
- **Empty (2 of 5)**: #11849 and #11960 (both dwelle, the maintainer) have literally `(empty)` descriptions — title-only PRs.
- **Structured `##` (H2) sections (2 of 5)**:
  - #11862: blockquote warning → `## Problem` → `## Root Cause` → `## Fix` (H3 subsections per file with fenced `ts` code blocks) → `## Demo` → `## Verification` (fenced bash + results) → `## Files Changed` (markdown table). Horizontal rules (`---`) separate every section.
  - #11974: `## Summary` (bullets) → `## Motivation` (prose) → `## Compatibility and risk` (prose) → `## Validation` (bullets). No code blocks, no tables; mixes bullets and short prose paragraphs.
- **Bot table (1 of 5)**: #11815 is one fixed intro sentence, a ~45-row translation-coverage markdown table (`| | Flag | Locale | % |`), and one closing footnote line.

Heading capitalization differs between the two human authored structured PRs: #11862 uses short title case (`## Root Cause`), #11974 uses sentence case (`## Compatibility and risk`).

## Template usage
No evidence of a repo-enforced PR template: no `- [ ]` checklists, no "How Has This Been Tested"-style scaffold, no unfilled placeholder prompts. The two structured PRs use different section sets (#11862's Problem/Root Cause/Fix vs #11974's Summary/Motivation/Compatibility/Validation), confirming they are author-invented rather than template-driven. Conclusion: **freeform** — with a bimodal culture where maintainers write nothing and external contributors write extensively.

## Length & density
Extremely bimodal:
- #11849, #11960: 0 words (empty).
- #11815: ~60 words of prose plus a large generated table (bulk is data, not prose).
- #11862: ~350–400 words plus ~20 lines of code snippets and a files-changed table — the densest description.
- #11974: ~250 words of tight prose/bullets.

For human-written PRs, verbosity correlates with author role: contributors (#11862 at +715/-60, #11974 at +618/-255) document exhaustively; the maintainer documents nothing even for non-trivial changes (#11960: +182/-83).

## Voice & tone
- #11862: explanatory, second-person-free, present-tense with emphatic bolding for key claims ("**zero effect**", "**all points**"); direct imperative only in the verification command. Slightly promotional formatting (`---` dividers, ⚠️ callout) reads like a blog post.
- #11974: neutral, declarative technical prose; no first person; precise quantification ("a roughly 90 MB-class Excalidraw runtime per popout window").
- #11815: bot voice with community-callout tone ("Join us on Crowdin and help us translate your own language").
- Empty PRs carry no voice at all.

## Content habits
- **Linked issues**: 3 of 5 link none. #11862 opens with `Closes #11809` and also cross-references a sibling PR ("please merge **#11861 first**") inside a ⚠️ blockquote — an explicit merge-ordering ask.
- **Test plans**: both structured human PRs include one. #11862 shows a verbatim command plus results block (`yarn test packages/excalidraw/tests/lasso.test.tsx` → `7/7 tests passed`); #11974 lists validation bullets including "full test suite: 123 files, 1862 passed, 47 skipped, 1 todo" and manual Electron-popout validation.
- **Screenshots/video**: exactly one — #11862 embeds a GitHub user-attachments demo video under `## Demo`. The other UI-adjacent PR (#11974) uses none.
- **Breaking-change callouts**: none, though #11974 pre-emptively addresses compatibility ("`ownerDocument` is optional and defaults to the current global `document`").
- **Reviewer ask-outs**: only #11862's merge-order plea; nothing in the maintainer PRs.
- **Code snippets in description**: only #11862 (three `ts` fences showing before/after logic).

## Bot-generated content
#11815 is entirely bot-authored by **excalibot** (a recurring Crowdin translation sync). Its fixed boilerplate — "Each language must be at least **85%** translated in order to appear on Excalidraw. Join us on [Crowdin](…) and help us translate your own language." — plus the locale coverage table and the closing line "*Languages in **bold** are going to appear on production." are kept verbatim by maintainers and merged as-is (1 review, 2 comments). No CodeRabbit/Copilot-style AI summaries appear in any PR; the two structured human PRs (#11862, #11974) show no AI-generation signature, though their level of polish (tables, dividers, exhaustive validation lists) is consistent with modern AI-assisted drafting — unverifiable from the corpus alone. For an AI PR-description generator, the real "competitor" here is habit, not bots: maintainers bypass descriptions entirely.

## Notable exemplars
- **PR #11974** — https://github.com/excalidraw/excalidraw/pull/11974 — the strongest sample: four well-named sections separate what (Summary) from why (Motivation, with a concrete "90 MB-class runtime per popout" cost) from risk (Compatibility) from proof (Validation with exact suite counts) — a complete reviewer packet in ~250 words.
- **PR #11862** — https://github.com/excalidraw/excalidraw/pull/11862 — the most thorough: Problem/Root Cause/Fix/Demo/Verification/Files-Changed with inline diffs, a demo video, and an explicit merge-order dependency callout; slightly over-formatted but leaves a reviewer nothing to ask.
