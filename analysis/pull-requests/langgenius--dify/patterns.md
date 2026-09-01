# PR Patterns: langgenius/dify

## Corpus
- PRs analyzed: 5 (numbers: #40827, #41491, #41319, #41490, #41493)
- Caveat: all 5 were merged on the same day (2026-08-30) and form two tight clusters — a session/dependency-injection refactor chain (#40827, #41491, #41490) and an a11y change plus its revert (#41319, #41493). Four distinct authors, but two PRs (#41491, #41490) are by the same author (ShousenZHANG) and are near-duplicates of each other. This is a narrow window onto the repo's PR culture, not a broad sample.

## Titles
All 5 titles follow Conventional Commits exactly, with a type and (usually) a scope:
- `refactor: pass db.session explicitly in instruction_modify_workflow (#37403)` (#40827)
- `refactor(service_api): dep-inject app payloads with @model_validate` (#41491)
- `fix(web): improve a11y of dataset clickable divs with native buttons` (#41319)
- `refactor(service_api): dep-inject dataset payloads with @model_validate` (#41490)
- `revert(web): revert dataset button a11y changes` (#41493)

Patterns: type is always present (`refactor` ×3, `fix` ×1, `revert` ×1); scope in parentheses in 4 of 5 (`service_api` ×2, `web` ×2). Everything after the colon is lowercase, including proper-ish terms (`db.session`, `@model_validate`). Lengths range ~45–70 characters. No emoji, no trailing period. #40827 appends the tracking issue as a `(#37403)` suffix inside the title — the only PR to do so.

## Description structure
All 5 use `##` (H2) section headers; header vocabularies vary by author:

- #40827: prose `## Summary` paragraph (with inline file paths), `## Changes` (3 bullets keyed by file), `## Verification` (5 bullets of tool invocations with results)
- #41491: `## Summary`, `## Behaviour notes`, `## How did you test it?` (one-line "part of #36659" lead under Summary)
- #41319: one prose paragraph with no header, then `## Changes` (4 bullets), `## Verification` (3 bullets)
- #41490: `## Summary`, `## Deliberately left alone`, `## Behaviour notes`, `## How did you test it?` — the richest structure in the sample
- #41493: `## Summary` (3 bullets), `## Rationale` (3 bullets + closing paragraph), `## Verification` (2 bullets)

Bodies mix short prose paragraphs with bullet lists; bullets are dense and code-literate (backticked identifiers, file paths, class/method names). The two ShousenZHANG PRs share an identical skeleton and even repeated phrasing ("Behaviour notes", "How did you test it?", "part of #36659"), effectively one authorial template reused across a refactor series.

## Template usage
No formal repo template is visible: no `- [ ]` checklists, no boilerplate instruction text, no unfilled scaffold. Two hybrid signals exist, both from ShousenZHANG: the heading `## How did you test it?` reads like a template prompt that was kept, and each of those PRs ends with a fixed disclaimer — "This PR was fully generated with an AI assistant. I have reviewed the changes and run the relevant tests." — which suggests a per-contributor (or per-tooling) template rather than a repo-wide one. Conclusion: **freeform with strong personal conventions**; the repo appears to tolerate several structure families (`Summary/Changes/Verification` vs `Summary/.../How did you test it?`).

## Length & density
- #40827: ~140 words — moderate, tight bullets
- #41491: ~300 words — verbose, with scope-analysis prose
- #41319: ~95 words — the most concise
- #41490: ~330 words — longest; detailed enumeration of test-call-site changes
- #41493: ~175 words — mostly rationale prose

Median is moderate (~140–180 words), but the refactor-series PRs run long because they justify scope boundaries ("Deliberately left alone", enumerations of untouched call sites). Density is high either way: nearly every bullet carries a file path, symbol, command, or test count — no filler.

## Voice & tone
- Predominantly descriptive/narrative with imperative titles; bodies mix declarative prose ("the method now receives an explicit `session: Session` parameter", #40827) with imperative bullets ("- fully revert #41319...", #41493).
- First person is essentially absent except inside the AI disclaimer ("I have reviewed the changes..."). No "we".
- Register is technical and precise; British spelling in ShousenZHANG's headers ("Behaviour"). #41493 is notably direct/critical in tone for a revert: "changed the DOM and accessibility contracts without verifying the final widgets".

## Content habits
- **Cross-references are the dominant habit**: every PR except #41493 links a tracking issue or sibling PR — "Part of the ongoing session-injection refactor tracked in #37403" (#40827), "part of #36659" (#41491, #41490), "following the same approach as #41301" (#41319); #41493 reverts #41319 and links a review comment. No `Fixes #N`/`Closes` closing keywords observed anywhere.
- **Test plans**: universal — every PR lists exact commands plus numeric outcomes: "pytest ... → 47 passed" (#40827), "**350 passed**, identical count to `main` before the change" (#41490), "`pnpm lint:a11y` ... 0 warnings, 0 errors" (#41319). Tool names named explicitly: pytest, ruff, pyrefly, mypy, pnpm, vp.
- **Scope justifications**: refactor PRs explicitly enumerate what they did NOT touch (#41490's "Deliberately left alone" lists #40902, #39950, #41081, #39706 as conflicting PRs).
- **Screenshots/images**: none, even for the two `web`/a11y PRs (#41319, #41493) where UI changed.
- **Breaking-change callouts**: none; behaviour deltas are instead surfaced neutrally as "Behaviour notes" (e.g. "a malformed body returns 422 ... instead of 400", #41491/#41490) — notable because that is a user-visible API change.
- **Labels**: every PR carries `lgtm` plus a `size:{XS,S,M}` label and an area label (`refactor`/`web`) — auto-labeled contribution workflow.

## Bot-generated content
Two PRs (#41491, #41490) are explicitly AI-generated per their own footer: "This PR was fully generated with an AI assistant. I have reviewed the changes and run the relevant tests." The disclaimer is kept verbatim in the merged description — maintainers did not strip it, suggesting AI-authored PR descriptions are accepted in this repo provided a human attests to review and testing. No CodeRabbit/Copilot "Summary by ..." blocks observed. Notably, the PR these AI-generated slices pattern-match (#40827) reads human-written and contains no disclaimer, so the repo's merged stream mixes both.

## Notable exemplars
- **PR #41490** — https://github.com/langgenius/dify/pull/41490 — the most complete: tracking-issue link, explicit out-of-scope list naming four conflicting open PRs, neutral behavior-delta notes, and a 350-test verification block; AI-generated but reviewer-accountable.
- **PR #41493** — https://github.com/langgenius/dify/pull/41493 — a model revert PR: states exactly what it reverts (#41319), lists three concrete technical defects justifying the revert, and prescribes the correct follow-up approach, keeping the revert from being a blind rollback.
