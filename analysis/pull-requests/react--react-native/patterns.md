# PR Patterns: react/react-native

## Corpus
- PRs analyzed: 5 (numbers: #57712, #58057, #58058, #58051, #58052)
- Caveat: all 5 PRs are by the same author (cipolleschi, labeled `p: Facebook` / `Partner`), merged 2026-07-28 → 2026-08-26. All are release-engineering / CI / version-bump work targeting stable branches, not feature PRs. Two of the five pairs are near-identical backports (#58057/#58058, #58051/#58052), so the 5 PRs cover only ~3 distinct changes. The sample shows one maintainer's backport workflow, not repo-wide community convention.

## Titles
No Conventional Commits types (`feat:`/`fix:`) anywhere. The dominant convention is a square-bracket target-branch prefix followed by a sentence-case imperative description:
- `[0.86] Use macOS 26 runners for iOS E2E tests` (#58057)
- `[0.87] Use macOS 26 runners for iOS E2E tests` (#58058)
- `[0.86] Bump Hermes V1 to 250829098.0.17` (#58051)
- `[0.87] Bump Hermes V1 to 250829098.0.17` (#58052)
- Outlier: `Enable npm trusted publishing on 0.85` (#57712) — no bracket prefix, "on 0.85" stated inline instead.

Format: `[<version>] <imperative verb phrase>`. Lengths ~25–50 chars, sentence case, no emoji, no trailing period. 4 of 5 titles correspond to PRs labeled `Pick Request` — the bracketed version appears to be the standard backport-title convention.

## Description structure
Every PR uses the React Native three-part skeleton — Summary → Changelog → Test Plan — but header formatting is inconsistent across PRs:

- #57712: `## Summary` (H2, 6 bullets), then prose note, `## Changelog:`, `## Test plan` (5 bullets) — all H2 headings
- #58057 / #58058: `Summary:` as **plain text** (no `#`), 3 prose paragraphs; `## Changelog:` (H2); `Test Plan:` as plain text (5 bullets each)
- #58051 / #58052: `## Summary:` (H2), 1 prose line; `## Changelog:`; `## Test Plan:` (H2, 2 bullets)

The changelog line follows a strict `[CATEGORY] [TYPE] - description` convention in every PR:
- `[Internal] - Migrate to trusted publishing.` (#57712)
- `[INTERNAL] [FIXED] - Run iOS E2E tests on macOS 26 runners with Xcode 26.` (#58057, #58058)
- `[INTERNAL] [CHANGED] - Bump Hermes V1 to 250829098.0.17.` (#58051, #58052)

Summaries are bulleted in #57712 but prose paragraphs elsewhere; lists vs prose varies by change complexity, not by template.

## Template usage
Strong evidence of a repo template: all 5 PRs contain the same three sections (Summary / Changelog `[CATEGORY][TYPE]` / Test Plan), matching React Native's published PR template, and the changelog bracket convention is applied uniformly. However, header markup is applied loosely — some PRs demote section headers to plain text (`Summary:`, `Test Plan:`) while keeping `## Changelog:` — and no checklists (`- [ ]`) or unfilled template prompts appear. Conclusion: **template (mandated skeleton, inconsistently marked up)** — sections always present and manually completed, but heading levels are not enforced.

## Length & density
- #57712: ~160 words — longest; 6 summary bullets + 5 test bullets + one prose caveat
- #58057 / #58058: ~125 words each — 3 prose paragraphs + 5 test bullets
- #58051 / #58052: ~45 words each — 1 sentence summary + 2 test bullets

Overall concise: 40–160 words per description, none exceeding one screen. Density scales with the diff (+3/-3 bumps get 45 words; +560/-300 release pipeline gets 160).

## Voice & tone
- Third-person/neutral descriptive prose; no first-person ("I", "we") in any of the 5 descriptions.
- Summary sentences use imperative/present-tense verbs: "Bump the Hermes V1 version…", "Moves the RNTester and template app iOS E2E jobs…".
- Formal, terse, operational register — assumes reader knows the release machinery ("This is stacked on #57711 and should be retargeted to `0.85-stable` after that PR merges.").
- Willing to state known limitations plainly: "Flow could not start locally because the installed Flow binary does not support `experimental.pattern_matching`…" (#57712) and "No post-release recovery/resume path is included." (#57712).

## Content habits
- **Linked issues**: none — all 5 PRs have "Linked issues: none". Instead they link to other PRs: "Backports #57993 to `0.86-stable`" (#58057), "This is stacked on #57711" (#57712).
- **Test plans**: systematic and command-exact. Every PR lists the literal commands run, e.g. `` `git diff --check origin/0.86-stable...HEAD` ``, `` `node --check .github/workflow-scripts/maestro-ios.js` ``, and a full jest invocation `` `yarn jest .github/workflow-scripts/__tests__/maestro-ios-test.js --runInBand --config ...` `` (#58057). Trivial bumps fall back to "`git diff --check` + CI on this PR." (#58051).
- **Screenshots/images**: none — consistent with the infra-only corpus.
- **Breaking-change callouts / reviewer ask-outs**: none. Risk is communicated via inline caveats instead (#57712).
- **Review activity**: 0 reviews on all 5 PRs, 0–1 comments — these maintainer backports merge without recorded discussion.
- **Labels**: `CLA Signed`, `p: Facebook`, `Partner` on all 5; `Pick Request` on the 4 stable-branch backports.

## Bot-generated content
No bot-generated description content observed in any of the 5 PRs — no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot summaries, no AI-disclosure footers. The uniform three-section skeleton is a human-written repo template, not machine generation. (With 5 single-author samples, minor AI assistance can't be ruled out, but there is no structural signature of it.)

## Notable exemplars
- **PR #57712** — https://github.com/react/react-native/pull/57712 — the most complete description: itemized summary bullets, stated stacking dependency ("stacked on #57711"), explicit scope exclusion ("No post-release recovery/resume path is included"), an exact test-command list, and an honest note about what could *not* be validated (Flow).
- **PR #58057** — https://github.com/react/react-native/pull/58057 — best backport description: names the source PR (#57993), and explains how a cherry-pick conflict was resolved ("the conflict was resolved by preserving its existing retry behavior and adding a focused simulator-selection test") — exactly the context a backport reviewer needs.
