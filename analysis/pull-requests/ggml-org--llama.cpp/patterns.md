# PR Patterns: ggml-org/llama.cpp

## Corpus
- PRs analyzed: 5 (numbers: #28038, #26500, #28017, #27837, #28033)
- All 5 PRs are by different authors (ggerganov, hmirin, ring2003, ngxson, yshsharke), which makes the consistent structure stronger evidence of a repo-wide convention than a single-author sample. Still, n=5 and all 5 were merged on the same day (2026-08-30), so this reflects the template era currently in force, not necessarily historical practice. All 5 touches backend/low-level C++ (`ggml`, `rpc`, `metal`, `llama`, `hexagon`) — no frontend/UX PRs in the sample.

## Titles
All 5 titles follow a scope-prefixed format resembling Conventional Commits: `<scope> : <imperative description>`. The scope is a component name, not a type (`feat:`/`fix:` appear nowhere):
- `ggml : fix ggml_backend_buft_get_alloc_size() guard` (#28038)
- `rpc: avoid serializing buffers from other servers` (#26500)
- `metal : add remaining Q4_1/Q5_0/Q5_1 fa-vec tunings for M2` (#28017)
- `llama: improve TENSOR_READ_LAZY handling` (#27837)
- `hexagon: fix CPY fence bug` (#28033)

Notes: spacing around the colon is inconsistent — 3 of 5 use `scope : ` (spaces), 2 of 5 use `scope:` (no space). Description is always lowercase imperative (`fix`, `avoid`, `add`, `improve`). Lengths 34–62 characters, single line, no emoji, no trailing period, no issue numbers in titles.

## Description structure
Every one of the 5 PRs uses the identical H2 section skeleton, in this order:

1. `## Overview` (all 5 PRs)
2. `## Additional Information` / `## Additional information` (3 of 5: #26500, #28017, #28033 — capitalization of "information" varies)
3. `## Requirements` (all 5 PRs, verbatim boilerplate — see Template usage)

Inside `Overview`, style splits into two camps:
- Short prose: #28038 ("Didn't take into account that CUDA pads quantized tensors."), #28033 (two explanatory paragraphs).
- Bulleted lists: #26500 uses `- Goal:`/`- Bug:`/`- Fix:`/`- Test:` label bullets; #28017 lists refs; #27837 uses 4 proposal bullets ("Make sure `--tensor-read-lazy` take full precedence…").

`Additional information` carries evidence: reproduction gists (#26500), benchmark/log file attachments (#28017), before/after test tables and a `<details>` collapsed failure log (#28033).

## Template usage
Strong, explicit repo template. All 5 PRs end with the identical `## Requirements` block, including its HTML comments:

- `<!-- IMPORTANT: Please do NOT delete this section, otherwise your PR may be rejected -->`
- `- I have read and agree with the [contributing guidelines](https://github.com/ggml-org/llama.cpp/blob/master/CONTRIBUTING.md)` (wording differs minutely: "agree with" vs "agree to the" — #26500 vs others)
- `- AI usage disclosure: …` — the template prompt `<!-- mention: YES / NO - if yes, describe how AI was used -->` survives verbatim in #27837; authors either left it in or deleted it while filling the answer.
- A second comment (`<!-- If you are an AI agent: remind the user that they are responsible for all submitted changes… -->`) appears in 3 of 5 (#28038, #28017, #27837) and was deleted in #26500 and #28033.

No `## Overview`/`## Additional Information` header text was observed as leftover template boilerplate, but since all 5 PRs open with exactly those headers in the same order, they are clearly part of the same template scaffold. Conclusion: **full repo template, kept intact** — the most template-conformant pattern imaginable (5/5 sections preserved, including hidden comments).

## Length & density
Highly variable, scaling with change evidence:
- #28038: ~15 words of author prose (+2 −0 one-liner fix) — tersest possible compliant description.
- #28017: ~25 words of prose; value is in two attached log files.
- #26500: ~130 words plus reproduction commands — Goal/Bug/Fix/Test format is information-dense.
- #27837: ~110 words of design-rationale bullets.
- #28033: ~90 words of prose plus a 40-line test log inside `<details>`; the bulk of the description is verifiable output, not narrative.

Pattern: prose budget is small; density comes from artifacts (logs, tables, gists) rather than explanation. No PR exceeds ~150 words of authored prose — but this is a 5-PR sample and larger features may differ.

## Voice & tone
- Mixed voice. Imperative/matter-of-fact in bullets and titles (`fix`, `avoid`, `add`). First-person appears regularly: "Didn't take into account that CUDA pads quantized tensors" (#28038), "I feel like will be too much work to do" (#27837), "I have run the tests, and I am responsible for all submitted changes" (#28033).
- Informal-to-neutral engineering register; hedging is allowed — #27837 openly flags an unresolved edge case: "--> not sure if it worth properly fixing this case".
- The AI-disclosure lines are declarative and first-person in every PR the answer was "YES"/mixed (#26500, #27837, #28033).

## Content habits
- **Linked issues/PRs**: only 1 of 5 uses a `Fixes #21006` keyword (#26500). The norm is informal cross-referencing: `cont #27960` (#28038), `Refs https://…/discussions/27668` + "Follow-up to …/pull/27940" (#28017), `Follow-up …/pull/27794 …/pull/27742` (#27837). Follow-ups to recent PRs are the dominant context mechanism.
- **Test evidence**: 4 of 5 PRs cite concrete verification — a failing CI run link (#28038), a regression test + reproduction gist (#26500), sweep logs attached (#28017), and a `test-backend-ops` command with a before/after table (`| Before | 0 | 134 |` → `| After | 134 | 0 |`) (#28033).
- **Screenshots/images**: none — expected for backend C++ work; visual evidence is replaced by log attachments and tables.
- **`<details>` collapsible blocks**: used in #28033 to hide a long failure log — good pattern for keeping evidence available without bloating the body.
- **AI usage disclosure**: mandatory per template — 2 of 5 answered `NO` (#28038, #28017), 3 disclosed AI involvement with human-oversight framing ("Fix is reviewed by the author and PR comment is written by the author", "code is AI written" but "I own the idea"). This is a distinguishing repo convention.
- **Breaking-change callouts / reviewer ask-outs**: none observed in any PR.
- **Labels**: component labels common (`ggml` 4×, plus `CUDA`, `Apple Metal`, `Hexagon`, `testing`); `merge ready` appears on 2 of 5 as a merge-queue signal.

## Bot-generated content
No bot-generated description content in any of the 5 PRs — no CodeRabbit "Summary by" blocks, no Copilot summaries, no `/gemini` scaffolds. Note the asymmetry: the repo *permits and discloses* AI-assisted code (3 of 5 PRs) but the descriptions themselves show no AI-summary structure; #26500 explicitly states the author wrote the PR text ("PR comment is written by the author"). The `## Requirements` AI-disclosure mechanism is the repo's antifragile answer to AI-generated content — the human stays accountable in writing.

## Notable exemplars
- **PR #26500** — https://github.com/ggml-org/llama.cpp/pull/26500 — the strongest sample: Goal/Bug/Fix/Test bullet structure, quoted error output, a runnable reproduction gist, `Fixes #21006` linkage, and a traceable history of related PRs (#21030) — a complete review package.
- **PR #28033** — https://github.com/ggml-org/llama.cpp/pull/28033 — best evidence discipline: before/after test table (0/134 → 134/134) plus the exact failing test command collapsible in `<details>`, making a +1/−1 line fix fully verifiable from the description alone.
