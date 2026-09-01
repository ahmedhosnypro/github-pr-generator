# PR Patterns: react/react

## Corpus
- PRs analyzed: 5 (numbers: #37087, #37251, #37382, #37384, #37389)
- Caveat: 3 of 5 PRs are by a single author (eps1lon, a React Core Team member per the `React Core Team` label); the other two are external contributors (teamleaderleo, lazerg) merged the same day. The sample therefore shows a visible split between core-team and community-contributor description style, but 5 PRs from 3 authors is still a small sample for repo-wide conclusions.

## Titles
All 5 titles use React's bracketed-area prefix convention (not Conventional Commits — no `feat:`/`fix:` types):
- `[DOM] Treat omitted Fragment Event listener options same as `capture: false`` (#37251)
- `[test] Remove the custom `toThrow` override for legacy V8 error messages` (#37384)
- `[DOM] Copy `source` onto the synthetic toggle event` (#37389)
- `[test] Bump Jest to 30.4` (#37382)
- `[FlightReply] Performance improvements when decoding` (#37087)

Pattern: `[<area>] <imperative/capitalized verb phrase>`. Area tags observed: `DOM` (2×, uppercase), `test` (2×, lowercase), `FlightReply` (1×, camelCase) — casing of the tag itself is inconsistent. After the bracket the verb is always capitalized (`Treat`, `Remove`, `Copy`, `Bump`, `Performance` — the last is a noun phrase). Inline code spans appear in 3 of 5 titles. No emoji, no trailing periods, no issue numbers in titles.

## Description structure
Two distinct structures, cleanly split by author type:

- External contributors (#37251, #37389) use the repo's two-section scaffold: `## Summary` followed by `## How did you test this change?` — exact headers, H2 level, in that order. Body under Summary is prose paragraphs (2 in #37251: problem then fix, e.g. "This change normalizes omitted options to the same capture-false identity…"); the test section is one or two sentences ("Added a test to the SimpleEventPlugin suite that dispatches a `ToggleEvent` with a `source`…").
- Core team (eps1lon: #37384, #37382, #37087) omit all headings — pure prose paragraphs, one per concern. #37384 is 3 paragraphs (what the override did → why it's now dead → real motivation: "the custom matcher deep-imports `expect/build/toThrowMatchers`, which no longer resolves on Jest 30"). #37382 is 5 dense paragraphs walking through each side effect of the Jest 30 bump. #37087 is a single line.
- No bulleted lists in the body of any PR except one list item under #37251's test header ("- added test characterizing the bug in the first commit").

## Template usage
The `## Summary` / `## How did you test this change?` pair matches React's known PR template, but the evidence is that it is **partially adopted**: exactly the 2 non-core-team PRs follow it, while all 3 core-team PRs skip the headers entirely. No checklists (`- [ ]`), no leftover boilerplate prompts, no unfilled scaffold text in any PR. Note that #37251 and #37384's descriptions preserve literal `\r` carriage returns — consistent with content written into a web form textarea (the template prompt), while core-team members may author from a different tool. Conclusion: **template exists but is optional in practice; adherence correlates with contributor status, not enforcement**.

## Length & density
- #37251: ~150 words across 2 sections
- #37389: ~110 words across 2 sections
- #37384: ~130 words of prose
- #37382: ~330 words across 5 paragraphs (by far the longest; matches its size: +1669 −1281, 61 files)
- #37087: 7 words ("This fixes security vulnerabilities in Server Functions.") — anomalously terse, and the text does not match the title (`[FlightReply] Performance improvements when decoding`); it reads like a placeholder or truncated body.

Pattern: external contributors write compact 100–150 word descriptions; the core team scales description length with blast radius (trivial Jest-bump rationale still gets a paragraph per side effect). The single outlier (#37087) shows that even merges of +100 −89 across 24 files can land with a one-line description.

## Voice & tone
- Third-person descriptive prose throughout; no "I" / "we" anywhere in the 5 descriptions.
- Explanatory rather than imperative voice: bodies describe behavior ("`FragmentInstance` tracks its event listeners…", "V8 only ever produces the modern format"), not instructions to reviewers.
- Precise, mechanism-level language with heavy inline code: API names (`EventTarget` contract, "tuple of type, callback, and capture flag"), file paths (`scripts/jest/matchers/toThrow.js`, `.nvmrc`), and exact commands (`yarn test packages/react-dom/src/events`, `yarn lint`, `yarn prettier-check`, `yarn flow dom-node` in #37389).
- Tone is neutral and factual; the only hedge observed is "Mostly removing this because…" (#37384).

## Content habits
- **Linked issues**: only 1 of 5 PRs links an issue — #37389 uses "Fixes #37387" as its final Summary line. The other 4 link nothing.
- **Test plans**: 2 of 5 PRs state how they were tested; of those, only #37389 lists verbatim commands (4 `yarn` invocations) plus the fail-on-main/pass-with-fix claim. #37251 just notes "added test characterizing the bug in the first commit". Core-team PRs (#37382, #37384, #37087) contain no test-plan section at all — verification is implicit.
- **Commit-structure callouts**: "The first commit adds a test… the second commit contains the fix" (#37251) — describing intended review-by-commit, a nice touch seen once.
- **Stacking references**: #37384 mentions "the Jest 30 upgrade stacked on top"; #37382 references "the PR below this one" — stacked-diff workflow visible in prose, without links.
- **Screenshots/images**: none — all 5 PRs are non-visual (DOM internals, test infra, Flight decoding).
- **Breaking-change callouts / reviewer ask-outs**: none.
- **Labels**: every PR carries `CLA Signed`; core-team PRs additionally carry `React Core Team`. No area/component labels observed.

## Bot-generated content
No bot-generated description content in any of the 5 PRs — no CodeRabbit/Copilot summary blocks, no AI disclosure footers, no auto-generated release notes, despite #37382 being a dependency-bump PR (the category where Dependabot-style bodies are most common; here the bump was done manually by a maintainer with a hand-written rationale). All descriptions read as human-authored engineering notes.

## Notable exemplars
- **PR #37389** — https://github.com/react/react/pull/37389 — the model community contribution: fills the template exactly, explains the bug at the API-contract level (`ToggleEventInterface` only listing `newState`/`oldState`), links "Fixes #37387", and gives a reproducible test plan with four verbatim commands and a fail-on-main/pass-with-fix statement — all in ~110 words.
- **PR #37382** — https://github.com/react/react/pull/37382 — best core-team example: a 61-file Jest 30 migration where each of 5 paragraphs owns one side effect (jsdom unpinning, matcher renames, `node` export-condition resolution, Prettier/snapshot fallout), so reviewers can audit a large diff concern-by-concern.
