# PR Patterns: iptv-org/iptv

## Corpus
- PRs analyzed: 5 (numbers: #48704, #48774, #49078, #49095, #49370)
- Caveat: 3 of 5 PRs (#48704, #49078, #49370) are by the same author (LPhilip1999), and all 5 PRs are small playlist/data-file edits (1–2 files, +1/-1 up to +1/-145 lines) merged within a 4-day window (2026-08-19 → 2026-08-23). This reflects how routine m3u playlist contributions look in this repo; it is too small and homogeneous to generalize about the repo's code-change PR culture (e.g. for the `scripts/` tooling).

## Titles
Two distinct title styles, no Conventional Commits (no `feat:`/`fix:`), no emoji, no trailing punctuation:
- Recurring-author pattern: `Add and modifying streams (MMDDYY)` — verbatim identical across #48704 (`(081926)`), #49078 (`(082126)`), #49370 (`(082326)`); the parenthetical is a US-format date stamp of the batch. Grammatically rough but consistent.
- File-scoped pattern: `<file>: <action>` or `Update <file>` — `hu.m3u: Assign tvg-id for Oxygen Music` (#48774), `Update gt.m3u` (#49095). Imperative verb, capitalized after the colon, names the concrete channel/field changed.

All titles are single-line, 20–45 characters, descriptive of the playlist touched.

## Description structure
No markdown section headers anywhere — zero `##`/`###` headings across all 5 descriptions. Structure is entirely plain text:
- #48704: region-tag lines in caps as pseudo-headers (`PH UPDATES:`, `US UPDATE:`) followed by numbered lists (`1. Update feed ID for Mindanow Network TV`).
- #48774: a single line — `Closes: https://github.com/iptv-org/iptv/issues/48773`. The description *is* the issue link.
- #49078: one prose sentence ("Connection timed out. All comclark streams temporary removed until futher notice.") then a `closes: #49076` line. (Note typos in both prose and the closes keyword.)
- #49095: the most structured — a summary sentence ("This pull request updates the Guatemala (gt.m3u) playlist."), an `Added:` plain-text label, channel name + resolution, the stream URL, and a justification sentence ("The World TV Guatemala channel has already been added and approved in the iptv-org database.").
- #49370: two lines — a bold-faced file tag `**us_klowdtv:**` then "Editing assign ID for The First TV."

Lists are numbered (`1.`/`2.`), not bulleted; CRLF line endings appear in the raw bodies, consistent with form-field submission without markdown editing.

## Template usage
No evidence of any PR template: no `- [ ]` checklists, no "How Has This Been Tested" scaffold, no boilerplate instructions, no leftover placeholder prompts. The only repeated shape is LPhilip1999's personal region-tag habit (`PH UPDATES:`, `**us_klowdtv:**`), which is a self-imposed convention, not repo scaffolding. Conclusion: **freeform**, extremely minimal.

## Length & density
Extremely short descriptions, roughly:
- #48704: ~30 words (4 numbered items)
- #48774: ~5 words (link only)
- #49078: ~15 words
- #49095: ~45 words (longest, and the only one with a full sentence of context/justification)
- #49370: ~8 words

Pattern: terse notes proportional to tiny diffs, but frequently *under*-documented — #48774 and #49370 give no rationale, source, or verification at all.

## Voice & tone
- Imperative or gerund verbs ("Update", "Reinstate", "Added", "Editing") for the change list; descriptive present tense ("This pull request updates…") for the one authored summary (#49095).
- No first-person pronouns observed; no direct address to reviewers.
- Informal and unpolished: non-native phrasing ("Add and modifying streams", "Editing assign ID"), typos ("futher notice"), inconsistent capitalization of `closes:`/`Closes:`.

## Content habits
- **Linked issues**: 2 of 5 — #48774 uses a full-URL `Closes: https://github.com/iptv-org/iptv/issues/48773` (also recorded as a linked issue); #49078 uses `closes #49076` inline and repeats `closes: #49076` as the last line. The other 3 link nothing.
- **Screenshots/images**: none.
- **Test plans / verification**: none — no "tested by playing the stream" notes, no commands. #49095's justification ("channel has already been added and approved in the iptv-org database") is the closest thing to verification evidence.
- **Breaking-change callouts / reviewer ask-outs**: none.
- **Labels**: none on any of the 5 PRs. Reviews: exactly 2 on every PR, suggesting a required-review gate despite the minimal descriptions.

## Bot-generated content
No bot-generated content observed — no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot descriptions, no AI footers. All 5 descriptions are plainly human-written (typos, CRLF artifacts, idiosyncratic phrasing). This repo's PR descriptions currently contain zero AI-assist structure for tools in this space to imitate or compete with.

## Notable exemplars
- **PR #49095** — https://github.com/iptv-org/iptv/pull/49095 — the strongest sample: it states what changed (which playlist, which channel, at what quality), gives the concrete artifact (the stream URL), and justifies acceptance by referencing prior database approval — the only PR in the sample with a complete what/why.
- **PR #48704** — https://github.com/iptv-org/iptv/pull/48704 — best multi-change accounting: the `PH UPDATES:` / `US UPDATE:` region grouping with numbered items makes a 3-change batch scannable, despite the rough phrasing.
