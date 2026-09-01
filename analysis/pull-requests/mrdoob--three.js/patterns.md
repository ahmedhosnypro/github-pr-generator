# PR Patterns: mrdoob/three.js

## Corpus
- PRs analyzed: 5 (numbers: #34396, #34144, #34401, #34404, #34403)
- Caveat: the sample is heavily bot-skewed — 2 of 5 PRs (#34404, #34403) are Renovate dependency-update PRs with fully machine-generated bodies, leaving only 3 human-written descriptions. The human PRs come from just 2 authors (sunag ×2, Mugen87 ×1), both long-time three.js maintainers. No labels are used on any PR, and review activity is minimal (0–1 reviews, 0–5 comments) — merges are fast (#34401 merged ~26h after creation; Renovate PRs merged within ~16 minutes). Treat this as evidence of maintainer-led conventions, not a broad contributor sample.

## Titles
Two distinct title families, no conventional-commit types on human PRs:
- Human PRs use a `<Component>: <imperative summary>` scheme with a capitalized subsystem prefix and colon:
  - `Inspector: Support nonce and CSP compliance` (#34396)
  - `Editor: Add group selection.` (#34144 — note the trailing period, an inconsistency)
  - `Nodes: Add \`updateBefore\` and \`updateAfter\` support for compute stage` (#34401 — includes inline code spans in the title)
- Renovate PRs use standard `chore(deps):` conventional-commit prefixes: `chore(deps): update devdependencies (non-major)` (#34404), `chore(deps): update github/codeql-action digest to cdf488f` (#34403).

No emoji, single line, lengths ~30–80 characters. The human scheme is not Conventional Commits (no `feat:`/`fix:` types, subsystem name instead of a scope).

## Description structure
All 3 human PRs share an identical skeleton: a leading issue-reference line, a blank line, then a bold pseudo-header `**Description**` (bold text, not a markdown `#` heading), followed by the body:

- #34396: `Closes https://github.com/mrdoob/three.js/issues/34391` → `**Description**` → single prose sentence ("Enables `nonce` support and CSP compliance across the Inspector.")
- #34144: `Fixed  #16276.` → `**Description**` → prose lead ("The PR adds group selection similar to how Blender supports it:") + 4-item bulleted feature list → video link → "For testing:" rawcdn URL
- #34401: `Related issue: -` (unfilled, dash placeholder) → `**Description**` → one dense technical paragraph → screenshot `<img>` → fenced `js` code sample

Notably, `**Description**` is the *only* section header in human PRs — there are no `##`/`###` markdown headings; bullets and media carry the detail. The Renovate PRs have their own fixed structure: update table → `---` → `### Release Notes` with `<details>` blocks → `### Configuration` → rebase checkbox → footer.

## Template usage
Strong evidence of a minimal repo PR template or muscle-memory convention: all 3 human PRs open with a "related issue" line in slightly different phrasings (`Closes …`, `Fixed #16276.`, `Related issue: -`) followed by the identical `**Description**` bold marker. #34401 even preserves an unfilled prompt (`Related issue: -`), which reads as a leftover template field. No checklists (`- [ ]`), no "How Has This Been Tested" scaffolds, no type-of-change boilerplate appear in human PRs. Conclusion: **lightweight template (issue link + `**Description**`) — minimal scaffold, free prose after it**.

## Length & density
Extremely concise human descriptions:
- #34396: ~12 words of actual description — the shortest; relies on the linked issue for context
- #34144: ~70 words + video + live-test URL
- #34401: ~85 words + screenshot + ~10-line code sample

Median well under 100 words; bullets/statements describe behavior, never code walkthroughs. Verbosity is carried by artifacts (video, screenshot, code snippet, live preview URL) rather than prose. Renovate bodies are long (~2,500 words) but entirely auto-generated.

## Voice & tone
- Third-person or imperative framing of the change itself: "Enables `nonce` support…" (#34396), "The PR adds group selection…" (#34144), "This PR introduces support…" (#34401) — descriptions speak about "the PR", never about the author.
- No first person ("I"/"we") anywhere; formal, terse, engineering register.
- Code identifiers are consistently wrapped in backticks (`` `nonce` ``, `` `updateBefore` ``, `` `renderer.compute()` ``).

## Content habits
- **Linked issues**: 2 of 3 human PRs link an issue (#34396 "Closes …/issues/34391"; #34144 "Fixed #16276"); #34401 has none (`Related issue: -`).
- **Rich media**: 2 of 3 include user-attachment media — #34144 embeds a demo video link, #34401 embeds a screenshot (`<img width="648" …>`) plus a runnable `js` code sample.
- **Live testing URLs**: #34144 provides a rawcdn preview link for manual testing ("For testing: https://rawcdn.githack.com/…editor/index.html") — a distinctive three.js habit (testing via live editor builds rather than written test plans).
- **Test-plan sections, breaking-change callouts, reviewer ask-outs, labels**: none observed in any human PR; no explicit tests section anywhere.
- Merge cadence: fast merges with few or zero reviews suggest trust-based maintainer merging.

## Bot-generated content
Renovate (Mend) is the dominant bot presence: #34404 and #34403 are 100% machine-generated with the canonical Renovate layout — "This PR contains the following updates:" table with Age/Confidence merge-confidence badges, `<details>`-collapsed release notes, a "### Configuration" block (schedule: "after 1am and before 7am on monday", Asia/Tokyo), an HTML-comment rebase checkbox (`- [ ] <!-- rebase-check -->If you want to rebase/retry this PR, check this box`), and a `<!--renovate-debug:…-->` footer. These bodies are merged as-is, untouched by maintainers (both merged ~16 minutes after creation, 0 comments, and #34404 has automerge enabled — "🚦 **Automerge**: Enabled."). No CodeRabbit/Copilot-style AI summaries appear in human PRs. Note for AI-PR-description tooling: routine maintenance PRs in this repo are already fully bot-owned; human PRs are aspirational targets only.

## Notable exemplars
- **PR #34144** — https://github.com/mrdoob/three.js/pull/34144 — the strongest human sample: closes its issue, explains the feature by analogy to Blender, enumerates behaviors in 4 crisp bullets (including history support), and backs it with a demo video plus a live test URL — a complete reviewer package in ~70 words.
- **PR #34401** — https://github.com/mrdoob/three.js/pull/34401 — good technical pattern: one precise paragraph naming the API (`updateBefore`/`updateAfter`, `renderer.compute()`) and concrete consumers (`GaussianBlurNode`), plus screenshot and code sample; marred only by the unfilled `Related issue: -` prompt.
