# PR Patterns: 521xueweihan/HelloGitHub

## Corpus
- PRs analyzed: 5 (numbers: #1417, #1622, #2580, #2652, #2584)
- Caveat: although the 5 PRs span 2020–2023 and come from 5 different authors (KevinZonda, TestGifts, eltociear, liaocp666, hey-sa), they are homogeneous in a different way — every one is a small docs/README-only change (+1/-1 up to +42/-2 lines, 1–3 files). This samples the repo's "community typo/translation fix" traffic, not feature development. Also notable: HelloGitHub is a content curation repo (a monthly digest of GitHub projects), so PRs of this kind may be atypical of the repo's actual contribution flow (which largely happens via issues recommending projects).

## Titles
No conventional-commit or scope-prefix convention at all. Observed formats:
- `Update README_en.md` (#1417)
- `Update README.md` (#1622)
- `Add Japanese README` (#2580)
- `修复文字错误` (#2652 — Chinese, "fix text errors")
- `Update PromptPerfect on README.md` (#2584)

Pattern: simple verb-first phrases ("Update", "Add", "修复"), 3–6 words, no type prefixes, no scopes, no issue references, no emoji, no trailing period. Titles name the file touched (`README.md`) in 3 of 5. Mixed languages: 4 English, 1 Chinese — reflecting the repo's bilingual (Chinese-primary) community.

## Description structure
There is effectively no description structure. Of 5 PRs:
- 3 of 5 have **empty** descriptions (#1417, #2652, #2584)
- 2 of 5 have a single unstructured line: `Standardizing the format of documents` (#1622) and `I created Japanese translated README.` (#2580)

No headers, no lists, no paragraphs — nothing to order.

## Template usage
No evidence of any PR template: no checklists (`- [ ]`), no boilerplate text, no "How Has This Been Tested" scaffolds, no unfilled template prompts. The empty descriptions confirm there is no template that contributors must delete or fill. Conclusion: **fully freeform** — and in practice, freeform means "usually left blank".

## Length & density
Extremely minimal: 0 words (#1417, #2652, #2584), 6 words (#1622), 7 words (#2580). Median description length is 0 words. The titles alone carry nearly all the information, which is arguably proportionate given the diffs are 1–9 changed lines of documentation.

## Voice & tone
What little prose exists is casual and first-person: "I created Japanese translated README." (#2580) — or terse label-like fragments: "Standardizing the format of documents" (#1622, present participle, no subject). No formality, no engineering register, no technical justification anywhere in the sample.

## Content habits
- **Linked issues**: none in any of the 5 PRs — no "Fixes #N" or issue references.
- **Screenshots/images**: none.
- **Test plans / breaking-change callouts / reviewer ask-outs**: none; unsurprising for docs-only diffs, but there is no habit of even a one-line verification note.
- **Labels**: none on any PR; the maintainer does not triage PRs with labels in this sample.
- **Review engagement**: minimal — 0 reviews on 4 of 5 PRs (only #2584 has 1 review), 0–1 comments each. Merges happen quickly with little discussion (e.g. #2584 created and merged ~34 minutes apart).

## Bot-generated content
None. No CodeRabbit/Copilot summaries, no AI-disclosure footers in any of the 5 descriptions — consistent with the near-total absence of description text. (Also note the sample predates widespread AI PR tooling: 2020–2023.)

## Notable exemplars
- **PR #2580** — https://github.com/521xueweihan/HelloGitHub/pull/2580 — the strongest of the five simply by having both an informative title ("Add Japanese README") and a one-line description stating intent; modest, but it is the only PR in the sample where a reviewer learns something from the metadata alone.
- **PR #2652** — https://github.com/521xueweihan/HelloGitHub/pull/2652 — cited as the counterpattern: an empty description with a vague Chinese title ("修复文字错误"), merged with zero discussion; a reader must open the diff to learn anything.
