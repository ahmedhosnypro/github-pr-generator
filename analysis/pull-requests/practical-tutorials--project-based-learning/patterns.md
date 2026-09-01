# PR Patterns: practical-tutorials/project-based-learning

## Corpus
- PRs analyzed: 5 (numbers: #875, #876, #881, #893, #898)
- Caveats: all 5 PRs are the same *kind* of change — curated-list edits to the README/tutorial index (each touches exactly 1 file; +1/-1 up to +17/-17) — and all 5 were merged in a single batch on 2026-07-04. Authorship is reasonably diverse (4 distinct authors: lonelyhty ×2, Osamaali313, aoright, Sushanth012), so title/description style generalizes moderately, but the sample tells us nothing about how code-heavy PRs are written in this repo. Labels are absent on all 5; reviews/comments are essentially zero (only #881 has 1 review).

## Titles
Imperative `<Verb> <object>` form dominates; lengths ~30–65 characters, no emoji, no trailing period, mostly sentence-case/lowercase:
- `Remove dead Scotch tutorial links` (#875)
- `Update Write You A Scheme link` (#876)
- `Fix dead 'Build a Reddit Bot' link` (#881)
- `docs: fix SSYGEN blog issues redirect and too-many-lists link` (#893) — the only Conventional-Commits-style prefix observed (`docs:`, lowercase verb after colon)
- `Add Next.js App Router tutorial` (#898)

Conventional-commits usage is the exception (1 of 5), not the rule. Quoting of proper nouns appears once (`'Build a Reddit Bot'`).

## Description structure
Two distinct styles coexist:

1. **Sectioned (H2 markdown headers + bullets)** — 3 of 5:
   - #875: `## Description` (intro line + 3 bullets), `## Motivation and Context`, `## How Has This Been Tested?`, `## Types of changes` (checklist), `## Checklist:` (checklist) — the classic community PR-template scaffold
   - #876: `## Summary` (1 bullet), `## Verification` (3 bullets, e.g. "`git diff --check`")
   - #898: `## Summary` (2 bullets), `## Validation` (2 bullets), then a trailing "Closes #887" line outside any header
2. **Pure prose, no headers at all** — 2 of 5:
   - #881: single paragraph explaining the moved URL with inline code for both URLs ("The old URL `http://pythonforengineers.com/build-a-reddit-bot-part-1/` returns **404**")
   - #893: two sentences ("This PR updates 16 blog issue links… to point to the developer's new username (SSYGEN was renamed to a327ex).")

No consistent canonical order across PRs; `Summary`/`Verification`-style pairs (#876, #898) look like a de-facto mini-convention among shorter PRs.

## Template usage
Evidence of a real repo PR template exists exactly once: #875 contains the unmistakable scaffold —
- `## Types of changes` with mutually exclusive options: `- [x] Content Update (change which fixes an issue or updates an already existing submission)` / `- [ ] New Article (change which adds functionality)` / `- [ ] Documentation change`
- `## Checklist:` with boilerplate items: `- [x] I have read the **CONTRIBUTING** document.`, `- [x] I have made checks to ensure URLs and other resources are valid`

The other 4 PRs show no checklist and no leftover template prompts — they either replaced the template with their own structure (#876, #898) or wrote freeform prose (#881, #893). Conclusion: **partial template usage** — a template exists in the repo, but most merged contributors in this sample did not retain it, and maintainers merge regardless.

## Length & density
Descriptions are short throughout:
- #875: ~90 words (longest; template checklists inflate it)
- #881: ~55 words
- #893: ~50 words
- #898: ~45 words
- #876: ~35 words (shortest)

Everything fits in one screen. Density is high: sentences carry concrete artifacts (URLs, HTTP status codes, link counts — "16 blog issue links") rather than narrative. Concise-by-default pattern, matched to the tiny diffs.

## Voice & tone
- Imperative mood in all 5 titles and in sectioned bullets ("Removes or updates outdated Scotch tutorial links", "Adds a Next.js subsection").
- Descriptions themselves lean descriptive/third-person; first person appears only inside template checkbox boilerplate (#875: "I have updated the documentation accordingly") — never in authored prose.
- Informal-but-precise register; #881 is the most conversational ("same author, same content, one-line change") while remaining factual.
- Bold is used once for an HTTP status ("**404**", #881); inline code is used liberally for URLs and commands.

## Content habits
- **Link-issue references**: 2 of 5. #875 uses the soft form "Helps with #344"; #898 uses the closing keyword "Closes #887" (also surfaced as the PR's linked issue). The other 3 have no linked issue.
- **Test/verification plans**: 3 of 5 include explicit verification steps (#875 "Checked the updated DigitalOcean URLs with HTTP HEAD requests and confirmed both return 200"; #876 "`git diff --check`… returns `200` directly"; #898 "Ran git diff --check"). Verification here means *checking the link works*, not running test suites — appropriate to a curated-list repo.
- **Inline evidence**: the standout habit — dead/old URL vs new URL quoted directly in the body with HTTP status codes (#881, #875, #893).
- **Screenshots/images**: none in any PR (expected for link-list edits).
- **Breaking-change callouts / reviewer ask-outs / labels**: none observed.

## Bot-generated content
No bot-generated description content in any of the 5 PRs — no CodeRabbit "Summary by" blocks, no Copilot summaries, no AI-disclosure footers. All descriptions read as human-written; the two house styles (template-fill vs. terse Summary/Verification) are both attributable to human author habits.

## Notable exemplars
- **PR #881** — https://github.com/practical-tutorials/project-based-learning/pull/881 — the best freeform sample: one paragraph that states the problem (old URL → 404), the evidence (new URL → HTTP 200), and the scope ("same author, same content, one-line change"); a complete review case in ~55 words.
- **PR #875** — https://github.com/practical-tutorials/project-based-learning/pull/875 — the best structured sample: fully filled repo template with a typed change classification, a completed checklist, and a concrete verification method, plus a soft issue link ("Helps with #344").
