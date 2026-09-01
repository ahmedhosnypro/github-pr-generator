# PR Patterns: Genymobile/scrcpy

## Corpus
- PRs analyzed: 5 (numbers: #6772, #6770, #6911, #6918, #6922)
- Caveat: all 5 PRs are by the same author (rom1v, the project founder/maintainer); this reflects one maintainer's PR style, not necessarily repo-wide convention. scrcpy is largely a single-maintainer project, so the sample may in fact be representative of merged PRs, but external-contributor style is unobservable from this sample.

## Titles
No conventional-commit prefixes (`feat:`/`fix:`) and no scope tags. Pattern: bare imperative verb phrase, sentence case, no emoji, no trailing period:
- `Add flex display support (resizable virtual display)` (#6772)
- `Fix size constraints for camera capture` (#6922)
- `Rename sc_delay_buffer to sc_video_regulator` (#6918)
- `Fix data race` (#6911)
- `Reset capture on rotation (fix square displays)` (#6770)

Lengths ~26–55 characters. Two of 5 add a parenthetical clarification after the main phrase (`(resizable virtual display)`, `(fix square displays)`). Identifiers are kept verbatim in titles (`sc_delay_buffer`), matching the exact-rename pattern `Rename X to Y`.

## Description structure
Highly variable — structure scales with change size:

- **#6772** (large feature, +1131/−352): full document with `##` (H2) headers, in order: `## Demo` → `## Download binaries` → `## Preparation` → `## Principles` → `## Glitches` → `## Size and DPI` → `## PR History`. Opens with usage examples in ` ```bash ` fenced blocks before any prose. Ends with a `---` separator and trailers: "Supersedes #6350, #6351 and #6705." / "Fixes #6632".
- **#6922** (small fix, +7/−1): no markdown headers; two bolded commit-subject blocks (`**Only apply alignment constraint for camera**`, `**Use OpenGL for camera to adapt to the target size**`) each followed by a short paragraph, separated by `---`. Mirrors the two commits in the PR — the description is essentially the commit messages inlined.
- **#6918** (rename): two prose sentences, no structure at all.
- **#6911** (bugfix): three short prose paragraphs (context → root cause → fix) plus a `CI:` link line.
- **#6770** (bugfix): two prose paragraphs then a "To reproduce the issue:" block with an indented command and `<kbd>Alt</kbd>+<kbd>r</kbd>` steps.

Lists appear only inside the large PR (#6772: bullet lists under Preparation, Principles, PR History). Small fixes are pure prose + code blocks.

## Template usage
No evidence of any repo PR template: no `- [ ]` checklists, no boilerplate instructions, no "How Has This Been Tested" scaffold, no unfilled prompts in any of the 5. Conclusion: **freeform**, with recognizable personal conventions (usage examples first, `Fixes #N` trailer, CI/binaries link to the author's fork).

## Length & density
Bimodal:
- #6772: ~700+ words — a full design document (principles, known glitches, design tradeoffs, 18-entry PR history).
- #6770: ~110 words
- #6922: ~90 words
- #6911: ~55 words
- #6918: ~30 words

Pattern: description effort is proportional to design complexity, not diff size (#6918 is +319/−318 but gets 30 words because it's a mechanical rename). Prose is dense and technical — no filler, no greetings, no "this PR does X" meta-narration.

## Voice & tone
- Predominantly declarative/descriptive present tense: "The core of this feature … consists in a call to `VirtualDisplay.resize()`" (#6772), "Fields in `struct sc_screen` were written from the decoder thread" (#6911).
- Imperative appears in fix statements: "Pass the session size as data attached to the SDL event" (#6911).
- Occasional first person for design judgment calls: "I think it's the correct thing to do", "I think a default size and DPI are good enough" (#6772) — opinion is explicitly flagged as opinion.
- Technical register throughout; uses hedges/corrections honestly (`~struck-out text~` for a revised claim in #6772's Principles, an "EDIT:" pointer to a comment).

## Content habits
- **Runnable commands everywhere**: every PR except the rename (#6918) contains at least one copy-pasteable `scrcpy …` command line — as usage examples (#6772), reproduction steps (#6770, #6922: "To reproduce the issue:").
- **Linked issues**: `Fixes #N` trailers in #6772 ("Fixes #6632") and #6922 ("Fixes #6919"), placed at the very end after a `---`. #6772 also lists superseded PRs ("Supersedes #6350, #6351 and #6705") and prerequisite PRs as a bulleted list under "## Preparation". Two PRs (#6918, #6911) have no linked issue.
- **Test/verification evidence = CI + prebuilt binaries**: not a test plan section, but links to GitHub Actions runs on the author's fork ("Binaries: https://github.com/rom1v/scrcpy/actions/runs/…", "CI: https://github.com/rom1v/scrcpy/actions/runs/…") in 3 of 5 PRs (#6772, #6922, #6911).
- **Media**: #6772 embeds demo videos via `user-attachments` URLs and collapses older iterations in `<details><summary>previous video</summary>` / `<details><summary>old versions</summary>` blocks. Other PRs have none.
- **PR-as-living-document habit**: #6772 maintains an explicit "## PR History" changelog of 18 force-pushed iterations (`flex-display.1` … `flex-display.18`) with one-line summaries.
- **Breaking-change callouts / reviewer ask-outs**: none observed.
- **Labels**: none on any of the 5 PRs.
- Review engagement is near-zero: 4 of 5 PRs have 0 reviews / ≤3 comments; only #6772 drew heavy review (92 reviews, 128 comments). These are maintainer self-merge style PRs.

## Bot-generated content
No bot-generated content observed in any of the 5 descriptions — no CodeRabbit/Copilot summary blocks, no AI-disclaimer footers. All descriptions read as hand-written by the maintainer, including idiosyncratic details (`<kbd>` tags, strikethrough self-corrections, `<details>` collapsibles) that no current PR-summary bot produces.

## Notable exemplars
- **PR #6772** — https://github.com/Genymobile/scrcpy/pull/6772 — an exemplar of the "PR description as design doc" style: usage examples up front, demo video, design principles with the hard parts called out ("The difficult part is correctly handling resize events…"), known limitations (Glitches), a full iteration history, and proper supersede/fix trailers.
- **PR #6770** — https://github.com/Genymobile/scrcpy/pull/6770 — the best small-PR sample: states the invariant violation in two sentences, gives an exact reproduction command plus keyboard shortcut, and even cites the commit that fixed a related broken shortcut (`5fedc79`), making the repro verifiable.
