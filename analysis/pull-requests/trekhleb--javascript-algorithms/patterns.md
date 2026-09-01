# PR Patterns: trekhleb/javascript-algorithms

## Corpus
- PRs analyzed: 5 (numbers: #2183, #2181, #2174, #2157, #916)
- Caveat: 5 different authors (huizixin, fauzan171, guuszz, shahidansari311, itsamirhn) — the sample is heterogeneous across authors but tiny per author (1 PR each), so we observe drive-by contributor style, not maintainer convention. All are small community contribution PRs (±1 to +371 lines, median one-file doc/test changes); none are large feature work. #916 was created 2022-07-30 but merged 2026-06-26 — a nearly 4-year-old PR merged in a recent backlog sweep, so its description predates the others by ~4 years. No PR has labels; 4 of 5 have zero reviews and zero comments (i.e., description carried the whole case for merge).

## Titles
Strong Conventional Commits usage in 4 of 5 titles, with exact observed forms:
- `fix: correct JSDoc position range to match code validation (1-70)` (#2183)
- `refactor: replace deprecated String.prototype.substr() with substring()` (#2181)
- `fix(pt-BR): correções de tradução em queue, insertion-sort e linked-list` (#2174) — scoped commit with non-English (Portuguese) subject
- `feat: add Deque data structure with tests and README` (#2157)

The outlier is the oldest PR: `Fix BUG in graph reverse method & Add needed tests` (#916) — no type prefix, Title Case, "BUG" capitalized. Pattern for recent PRs: `<type>(optional scope): <lowercase imperative-ish summary>`, ~50–75 characters, no emoji, no trailing period. Types observed: `fix` (2×), `refactor` (1×), `feat` (1×).

## Description structure
Four of five descriptions use `##` (H2) headers; header sets differ per author (no single shared skeleton):

- PR #2183: `## Description` → `## Changes` → `## Verification`. Evidence-led: opens by quoting the exact JSDoc line vs. the validating constant, in one fenced block with `// Current JSDoc (line 7)` / `// Actual validation (line 10)` comments, then a bullet under Changes, then a Verification section quoting the error-throwing code.
- PR #2181: `## Problem` → `## Fix`, with H3 subsections `### Files changed:` (article-numbered bullet list of 3 file paths with roles: "— source code", "— test") and `### Conversion pattern:` (before/after fenced diff-style snippet). Ends with a bare sentence "All 7 affected tests pass." outside any header.
- PR #2174: a single `## What` section containing a 4-item bullet list, each bullet formatted as `` `path` — "wrong" → "right" `` with bold on the changed token (e.g. "**file**" → "**fila**"). Closes with an English summary line despite the Portuguese body.
- PR #2157: `## What this PR adds` → `## Why it belongs here` → `## Files added` → `## Checklist`. Most sections of any sample (4 H2s); the only feature-add PR and the only one with a rationale section ("The repo has Queue and Stack but no Deque…").
- PR #916: no headers at all — two short prose paragraphs, the first being the linked-issue sentence.

Canonical order for the recent 4: [What/Problem/Description] → [changes/files detail] → [Verification/Checklist]. Fixes lead with problem evidence; the feature leads with motivation.

## Template usage
No repo PR template is evident: header names vary freely across PRs ("Description/Changes/Verification" vs "Problem/Fix" vs "What" vs "What this PR adds/Why it belongs here"), there is no repeated boilerplate, no "How Has This Been Tested" scaffold, and no unfilled template prompts. The only checklist in the corpus — "Header rows are the public contract for the table." plus 5 `- [x]` items in #2157 ("npm run lint passes (zero errors)", "100% code coverage", "One PR for one data structure") — is authored, pre-checked, and content-specific, not template residue. Conclusion: **freeform**, with a convergent informal habit (problem → changes → verification) rather than an enforced scaffold.

## Length & density
Short-to-moderate descriptions, scaling with change size:
- #2183: ~80 words (+1 −1) — code blocks carry half the payload
- #2181: ~110 words (+5 −5) — includes file list and conversion snippet
- #2174: ~90 words (+4 −4) — nearly all of it the 4-bullet diff list
- #2157: ~130 words (+371 −0) — largest change, most structured description
- #916: ~65 words (+35 −1) — prose only

Pattern: density is high — almost every sentence carries a fact (path, line, test count); no throat-clearing or preamble in any sample. Description length tracks diff size monotonically in this sample.

## Voice & tone
- Predominantly declarative/descriptive third person: "The JSDoc comment … states", "The codebase uses `substr()` in 5 places", "The behavior is identical for all cases". No first person ("I"/"we") anywhere; no direct address of reviewers.
- Titles are imperative/lowercase; bodies are present-tense expository. Formal-technical register; #916 is the loosest ("there will be crash" — non-native, unpolished), which matches its 2022 vintage.
- Borrowed precision as a habit: exact numbers everywhere — "(must be number from 1 to 75)" vs `70`, "5 places across 3 files", "All 7 affected tests pass", "14 tests, 100% coverage".

## Content habits
- **Code evidence in-description**: the signature habit — 3 of 5 PRs embed fenced code snippets of the actual code under discussion (#2183 quotes both the stale JSDoc and the validator; #2181 shows a before/after conversion; #2174 quotes wrong→right strings inline).
- **Linked issues**: rare — only #916 links an issue ("This PR fix the issue in #873."); 4 of 5 link nothing and carry no "Fixes #" line.
- **Test plans**: informal but consistent — verification is asserted with outcomes, not commands: "All 7 affected tests pass" (#2181), the error-message walkthrough (#2183), and #2157's checked boxes ("npm test passes (14/14 tests)", "100% code coverage"). No PR pastes commands-to-run for reviewers.
- **File-level accounting**: 3 of 5 enumerate the changed files with one-line roles (#2181's `### Files changed:`, #2157's `## Files added`, #2174's per-file bullets).
- **Screenshots/images**: none — expected for an algorithms/docs repo with no UI.
- **Breaking-change callouts / reviewer ask-outs**: none observed. No "please review X specifically", no RFC questions.
- **Labels**: none on any PR; 0 reviews / 0 comments on 4 of 5 (the maintainer merges on description + CI alone).

## Bot-generated content
No bot-generated description content observed: no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot-generated summaries, no release-notes bots in any of the 5 bodies. However, the recent four (#2183, #2181, #2174, #2157) share stylistic fingerprints strongly suggestive of AI-assisted authorship by contributors — perfectly parallel `##` sections, em-dash usage ("elements can be added/removed from either end in O(1) time", "— source code"), bolded before/after tokens, and self-checklists — though none carries an explicit bot/AI attribution. Whatever the authoring tool, maintainers merge these descriptions as-is (0 edits visible, 0 comment-driven rewrites), so the AI-style structured format is de facto accepted.

## Notable exemplars
- **PR #2181** — https://github.com/trekhleb/javascript-algorithms/pull/2181 — the most complete mechanical-change write-up: states the spec basis (Annex B deprecation), quantifies scope ("5 places across 3 files"), lists every touched file with its role, shows the exact before/after conversion, and closes with the test count that proves it.
- **PR #2183** — https://github.com/trekhleb/javascript-algorithms/pull/2183 — exemplary one-line-doc-fix write-up: it lets the code argue (quoting the stale JSDoc and the `topMaxValidPosition` constant side by side), so a 1-character-class change is reviewable in seconds without opening the diff.
