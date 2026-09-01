# PR Patterns: freeCodeCamp/freeCodeCamp

## Corpus
- PRs analyzed: 5 (numbers: #69787, #69273, #69797, #69793, #69799)
- Authors are 5 distinct contributors (huyenltnguyen, jeffrinkdev, noctis-coder, TEE0207, Naman-bh) — no single-author bias. However 4 of 5 PRs are curriculum/content changes (labels `scope: curriculum`, `js v9 cert`, `platform: learn`) and 4 of 5 are small diffs (+4/-4 to +94/-46), so the sample skews toward the curriculum-contributor workflow rather than core platform work.

## Titles
All 5 titles follow Conventional Commits exactly: `<type>[(scope)]: <lowercase description>`.
- `fix: flaky test in ms-trophy` (#69787)
- `refactor(curriculum): Replace regex-based test cases in Binary Search Workshop` (#69273 — only outlier, capitalizes "Replace")
- `fix: clarify second-best laptop instructions` (#69797)
- `fix(curriculum): add section headers to form validation lecture` (#69793)
- `chore(a11y): use semantic keyboard markup in Responsive Web Design V9` (#69799)

Types observed: `fix` (3×), `refactor` (1×), `chore` (1×). Scopes used: `curriculum` (2×), `a11y` (1×); scope is optional. Lengths ~30–60 chars, single line, no emoji, no trailing period, lowercase by default.

## Description structure
Every description is anchored by the same scaffold (see Template below). The free-form portion differs per PR:
- #69787: after the checklist, "This is an attempt to resolve:" + embedded screenshot + CI log link (`Log: https://github.com/.../actions/runs/.../job/...#step:10:2097`) + root-cause hypothesis ("I suspect the cause is similar to #69500: we need to wait for dialogs to appear / disappear.").
- #69273: `Closes #68694`, then appended `## Overview` (5 bullets), `## Notes` (1 bullet with prose), `## Suggested Improvements` (a numbered 6-point analysis with nested sub-numbering, plus an inline follow-up marker: "[**FOLLOW-UP**: I opened a new issue (#69534) to address this.]").
- #69797: `Closes #69794`, then one prose sentence ("Updated the JavaScript and Python Daily Coding Challenge instructions…") + 3 bullets ("Clarified the meaning…", "Improved the wording…", "Kept the behavior consistent…").
- #69793: unusual ordering — the prose summary ("Added ## Title Case headers to break up the --interactive-- body into logical sections…") is placed BEFORE the `Checklist:` scaffold instead of after the trailing template comment; then `Closes #69316`.
- #69799: template only, `Closes #69724`, no additional free-form content at all.

Heading levels: contributor-added sections use `##` (H2) only. Lists dominate prose in longer descriptions.

## Template usage
Strong evidence of a repo-enforced PR template, filled in 5 of 5 cases. Identical boilerplate appears verbatim across all PRs:
- A `Checklist:` block with an HTML comment instruction: `<!-- Please follow this checklist and put an x in each of the boxes, like this: [x]. It will ensure that our team takes your pull request seriously. -->`
- Four identical checkbox items, all ticked in every sample (`- [x]` in 3 PRs, `* [x]` in #69797, malformed `- [x ]` in #69799): "I have read and followed the [contribution guidelines]…", "I have read and followed the [how to open a pull request guide]…", "My pull request targets the `main` branch of freeCodeCamp.", "I have tested these changes either locally on my machine, or GitHub Codespaces."
- A placeholder comment: `<!--If your pull request closes a GitHub issue, replace the XXXXX below with the issue number.-->` followed by `Closes #NNNNN` (4 of 5; #69787 has no linked issue and the line is absent).
- A trailing scaffold comment left in place by everyone: `<!-- Feel free to add any additional description of changes below this line -->`.

Notably, nobody deletes the HTML comments — the template scaffolding survives into merged PRs. Conclusion: **template — consistently used, moderately enforced**; contributors add content around the scaffold rather than filling structured slots, and one (#69799) adds nothing at all beyond the template.

## Length & density
Extreme spread:
- #69799: ~10 words of authored content (checklist + `Closes` line only)
- #69797: ~45 words
- #69793: ~50 words (excluding template)
- #69787: ~60 words plus a screenshot and log link
- #69273: ~280 words — by far the longest, with the only multi-section structure

Median is very short (<60 words); only the 24-review curriculum refactor (#69273, +94/-46 across 14 files) invested in a detailed description. Description effort tracks review intensity and diff size, not a uniform norm.

## Voice & tone
- Mixed imperative/descriptive. Titles are imperative-ish fragments; bodies favor past-tense descriptive statements: "Updated the JavaScript and Python Daily Coding Challenge instructions…" (#69797), "Used Explorer AST tools where possible…", "Clarified some hints and instructions." (#69273).
- First person appears once, used conversationally for a hypothesis: "I suspect the cause is similar to #69500" (#69787).
- Tone is collegial-contributor register, less terse than maintainer-terse style; #69273 is notably explanatory and pedagogical (numbered sub-arguments about `const` vs `let` correctness).

## Content habits
- **Linked issues**: systematic — `Closes #NNNNN` in 4 of 5 PRs (#69273→#68694, #69797→#69794, #69793→#69316, #69799→#69724); the template explicitly prompts for it, and contributors comply. This is the strongest, most reliable habit in the corpus.
- **Screenshots/images**: 1 of 5 — #69787 embeds an error screenshot (`<img ... alt="Screenshot 2026-08-28 at 18 58 13">`) plus a link to the failing CI run's job log (note: the run/job IDs in the corpus were redacted as `[PHONE_REDACTED]` by the collection pipeline).
- **Test plans**: no dedicated test-plan sections; testing is asserted only via the template checklist item ("I have tested these changes either locally on my machine, or GitHub Codespaces"). No commands or outputs are ever quoted.
- **Follow-up management**: #69273 demonstrates exemplary hygiene — flags a known limitation inline and converts it to a tracked issue: "[**FOLLOW-UP**: I opened a new issue (#69534) to address this.]".
- **Cross-PR/issue references**: #69787 links diagnostic context to #69500. No breaking-change callouts or explicit reviewer ask-outs anywhere (review load is visible only in the metadata: #69273 accumulated 24 reviews/6 comments before merge).

## Bot-generated content
No bot-generated description content in any of the 5 PRs — no CodeRabbit walks, Copilot summaries, or AI attribution footers. All bodies are human-authored around the static repo template. (The `[PHONE_REDACTED]` markers in #69787 are a corpus-collection artifact, not bot content.)

## Notable exemplars
- **PR #69273** — https://github.com/freeCodeCamp/freeCodeCamp/pull/69273 — the strongest sample: template-compliant yet substantively structured (`## Overview` / `## Notes` / `## Suggested Improvements`), links its tracking issue, and responsibly shepherds a known gap into a follow-up issue (#69534) rather than hiding it.
- **PR #69787** — https://github.com/freeCodeCamp/freeCodeCamp/pull/69787 — best diagnostic write-up for a flaky test: screenshot of the failure, deep link to the CI step that failed, and a stated root-cause hypothesis tied to a prior fix (#69500) — a compact evidence chain in ~60 words.
