# PR Patterns: trimstray/the-book-of-secret-knowledge

## Corpus
- PRs analyzed: 5 (numbers: #353, #250, #249, #286, #225)
- Caveat: 5 PRs by 4 distinct authors (crypt0rr authored 2: #250, #249), all merged by the maintainer in the same 5-day window (2022-02-23 → 2022-02-28) after long review queues (created 2021-07 → 2022-02). This repo is a curated link/knowledge list, so PRs are overwhelmingly single-line list additions (4 of 5 are `+1 -0, 1 files`) — the sample reflects that contribution type and cannot speak to how larger changes are described here.

## Titles
No conventional-commit usage, no scope prefixes, no emoji, no trailing periods. All 5 are short freeform "Add X"-style titles:
- `added shell cleaning trick` (#353)
- `Added TLScan` (#250)
- `Added vaultwarden` (#249)
- `Add Hurl to CLI tools` (#286)
- `Add Austin` (#225)

Pattern: `<Verb> <subject>`, ~11–22 characters. Casing is inconsistent — both `Added`/`Add` capitalized (#250, #249, #286, #225) and lowercase `added` (#353) appear; only #286 adds context beyond the tool name (`to CLI tools`). Subject casing mirrors the tool's own branding (`vaultwarden` lowercase, `TLScan`, `Hurl`, `Austin`).

## Description structure
There is effectively no structure. None of the 5 PRs uses any markdown headers, bullet lists, or sections:
- #353: one informal sentence — "I think that this trick could help some pentesters to get a comfortable shell."
- #250: single line — `- signed-off-by: crypt0rr <[EMAIL_REDACTED]>`
- #249: identical single line — `- signed-off-by: crypt0rr <[EMAIL_REDACTED]>`
- #286: one sentence — "Add Hurl to CLI tools, a tool to run and test HTTP request with plain text, Rust and libcurl."
- #225: one sentence — "Austin is a Python frame stack sampler for CPython that can be used to extract profiling data from a Python application with zero instrumentation and minimal impact."

The most common "pattern" (2 of 5) is a DCO sign-off line as the entire description — the title carries the "what", the sign-off is the body.

## Template usage
No evidence of a PR template: no checklists (`- [ ]`), no boilerplate, no "How Has This Been Tested"-style scaffold, no unfilled prompts. The only repeated text is crypt0rr's own `signed-off-by` line (a git/DCO convention, not a repo template), reproduced verbatim across their two PRs. Conclusion: **freeform**.

## Length & density
Extremely minimal descriptions:
- #353: ~15 words
- #250: sign-off line only (effectively 0 content words)
- #249: sign-off line only
- #286: ~21 words
- #225: ~27 words

Longest is ~27 words; two PRs contain no descriptive prose at all. Description length matches change size: 4 of 5 PRs are single-line list additions (`+1 -0`), so the norm here is "title is the description." #353 is the sole exception (a `+18 -4` content addition) and even it gets only one sentence of justification.

## Voice & tone
Mixed and informal:
- First person appears in #353 ("I think that this trick could help…") — hedged, casual.
- #286 uses imperative-ish echoing of its own title ("Add Hurl to CLI tools…").
- #225 is descriptive third person ("Austin is…").
No consistent register; nothing reads policy-driven or heavily edited.

## Content habits
- **Linked issues**: none — all 5 PRs report "Linked issues: none"; no `Fixes #N` or references to other PRs.
- **Test plans**: none in any description (unsurprising for list-addition changes).
- **Screenshots/images**: none.
- **Breaking-change callouts / reviewer ask-outs**: none.
- **Labels**: every PR is labeled; the pair `Status: Accepted, Type: Enhancement` dominates (3 PRs use `Type: Enhancement`, though status varies — #286 and #225 are `Status: Review Needed` even at merge, #353 is `Status: Accepted, Type: Feature`). The maintainer's triage labels carry metadata that the descriptions omit.
- **Tool-pitch convention**: for tool additions, the body (when present) is a one-line feature pitch of the tool (#286, #225) — effectively the tool's tagline restated.

## Bot-generated content
None. No CodeRabbit/Copilot/summary-bot blocks in any PR; all 5 descriptions are plainly human-authored (or empty). As a corpus of human-written minimal descriptions, this repo is a boundary case for AI PR-description tools: there is almost no source material pattern to imitate beyond "title + optional one-liner pitch".

## Notable exemplars
- **PR #225 "Add Austin"** — https://github.com/trimstray/the-book-of-secret-knowledge/pull/225 — the most informative description in the sample: one 27-word sentence that names the tool, what it measures (frame stack sampling for CPython), and its key properties ("zero instrumentation and minimal impact"). The ideal form of this repo's house style.
- **PR #286 "Add Hurl to CLI tools"** — https://github.com/trimstray/the-book-of-secret-knowledge/pull/286 — same pattern, slightly weaker: names the tool, its function (run/test HTTP requests), and implementation stack (Rust, libcurl) in one sentence.
