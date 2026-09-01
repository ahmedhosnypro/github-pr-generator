# PR Patterns: twbs/bootstrap

## Corpus
- PRs analyzed: 5 (numbers: #42874, #42875, #42876, #42877, #42879)
- Caveat: 4 of 5 PRs are by the same author (mdo, the project founder/maintainer), all merged within a ~25-hour window (2026-08-28 → 2026-08-29). Only #42879 is by an external contributor (minirang). The sample is too small and too maintainer-skewed to generalize across bootstrap's full contributor base; it cleanly shows the maintainer's house style versus the contributor-facing template.

## Titles
No Conventional Commits usage in the maintainer PRs; all four are terse imperative phrases:
- `Remove the breadcrumb bottom margin` (#42877)
- `Keep a nonmodal dialog centered` (#42876)
- `Tighten theme mix, shades, and border docs` (#42875)
- `Add an accordion-gap modifier` (#42874)

Pattern: `<imperative verb> <object>`, sentence case, ~25–40 characters, no scope prefix, no emoji, no trailing period. The external contributor's title is the only one with a conventional-commit-style scope: `docs: fix modal JS examples, list numbering, and typos` (#42879) — and it uses the lowercase `docs:` type prefix the maintainer titles omit.

## Description structure
Two distinct structures:

- Maintainer PRs (#42874–#42877): no section headers at all — just a bare bulleted list (`- `), typically 2–6 bullets. Bullets pair the change with the rationale in the same breath, e.g. #42877: "Remove the `--breadcrumb-margin-bottom` token and set `margin-bottom: 0` on `.breadcrumb`." followed by "A breadcrumb added a bottom margin of its own, which fought the spacing utility or layout gap around it." #42875 runs to 6 bullets, each covering one logical change ("Switch `$color-mix-space` from `lab` to `oklch`…", "Pull the `950` and `975` shades back from 76%/88% to 70%/76%…").
- Contributor PR #42879: full headed structure with `### Description`, `### Motivation & Context`, `### Type of changes`, `### Checklist`, `#### Live previews`, `### Related issues`, in that order (this is the repo template — see below).

Heading levels: `###` / `####` in the templated PR; none elsewhere. Lists dominate over prose — even #42879's "Motivation & Context" prose is template-driven.

## Template usage
Bootstrap clearly ships a PR template, visible in full in #42879, where the contributor left the template's HTML comment prompts in place verbatim:
- `<!-- Describe your changes in detail -->`
- `<!-- Why is this change required? What problem does it solve? -->`
- `<!-- What types of changes does your code introduce? Put an `x` in all the boxes that apply. -->`
- `<!-- If you're unsure about any of these, don't hesitate to ask. We're here to help! -->`
- `<!-- Please add direct links where your modifications can be seen in the documentation -->` with an unfilled `https://deploy-preview-{your_pr_number}--twbs-bootstrap.netlify.app/` link

The template includes two checkbox groups: "Type of changes" (`- [ ] Bug fix (non-breaking change which fixes an issue)` etc., all left unchecked in #42879) and a "Checklist" (`- [x] My code follows the code style of the project _(using `npm run lint`)_`, `- [ ] I have added tests to cover my changes`, etc., partially filled). The maintainer's own PRs bypass the template entirely. Conclusion: **repo template exists and external contributors follow it (sometimes only partially — unfilled prompts and unchecked boxes persist), while the maintainer writes freeform**.

## Length & density
- #42877: ~55 words (2 bullets)
- #42876: ~80 words (2 long bullets)
- #42875: ~130 words (6 bullets)
- #42874: ~110 words (6 bullets)
- #42879: ~200 words (template scaffolding inflates the count; actual authored prose is ~90 words)

Overall concise: maintainer PRs stay under ~130 words regardless of change size (+1/-1 up to +88/-71). Density is high — bullets carry both mechanism and motivation ("Put the space in a flex `gap` on the accordion rather than a margin on the panel. A flex gap does not join the `block-size` transition…"). No filler or preamble.

## Voice & tone
- Imperative/mood verbs open most maintainer bullets: "Remove…", "Switch…", "Pull…", "Mix…", "Let…", "Fix…", "Add…", "Swap…", "Document…".
- No first person in the maintainer PRs; the contributor PR uses neutral descriptive phrasing too ("Corrects the broken JavaScript modal example…").
- Tone is plain, unhurried explanatory engineering prose — notably willing to use a second sentence to explain *why* ("The darkest steps had collapsed together."; "The open state sets `transform: none` to end the entry animation, which removed that centering.").
- Heavy inline-code usage for identifiers: `--breadcrumb-margin-bottom`, `.dialog-nonmodal`, `show()`, `bootstrap.Modal.getInstance()`, `hidden.bs.modal`.

## Content habits
- **Linked issues**: none in any of the 5 PRs. #42879's "Related issues" section says "None. This was found while reviewing the documentation." No "Fixes #N" anywhere in the sample.
- **Screenshots/images**: none, despite 4 of 5 PRs being visual CSS/UI changes (centering, gaps, border colors).
- **Test plans**: none as a dedicated section. #42879's template checklist leaves "I have added tests to cover my changes" and "All new and existing tests passed" unchecked (a docs-only change).
- **Breaking-change callouts / reviewer ask-outs**: none. Reviews/comments are 0/0 on all four maintainer PRs (self-merged); #42879 has 1 review / 1 comment.
- **Doc cross-references**: #42874 notes it "Document[s] the modifier with an example and a `ScssDocs` block"; #42879 links the Netlify deploy-preview URL scaffold (left with the `{your_pr_number}` placeholder).
- **Labels**: consistent version+area labeling — `css, v6` / `docs, css, v6` / `docs, v5` / `docs, feature, css, v6`.

## Bot-generated content
No bot-generated description content in any of the 5 PRs — no CodeRabbit "Summary" blocks, no Copilot descriptions, no AI footers. The descriptions read as human-authored: the maintainer's bullets have an idiosyncratic explanatory voice, and #42879 preserves raw template HTML comments that an AI generator would typically strip. The only automation footprint is the Netlify deploy-preview URL scaffolded by the template itself.

## Notable exemplars
- **PR #42875** — https://github.com/twbs/bootstrap/pull/42875 — strongest maintainer sample: six bullets each pairing a concrete change ("Pull the `950` and `975` shades back from 76%/88% to 70%/76%") with its rationale ("The darkest steps had collapsed together"), plus a bug-fix bullet explaining the root cause in `Swatch.astro` — a complete audit trail in ~130 words.
- **PR #42876** — https://github.com/twbs/bootstrap/pull/42876 — best bug narrative: states the symptom ("Fix a nonmodal dialog that opens off center"), the mechanism ("`show()` does not use the top layer… the open state sets `transform: none`… which removed that centering"), and the fix with the property-level reason — exemplary cause→fix tracing in two bullets.
