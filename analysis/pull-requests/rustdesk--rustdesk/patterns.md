# PR Patterns: rustdesk/rustdesk

## Corpus
- PRs analyzed: 5 (numbers: #15980, #15978, #15830, #15959, #15970)
- Caveat: only two authors appear — fufesou (#15980, #15830, #15970) and the rustdesk org account (#15978, #15959) — and all 5 PRs were merged on a single day (2026-08-27), though created 2026-08-11 → 2026-08-26. This is a narrow slice of two maintainers' styles, not necessarily repo-wide convention. No PR in the sample carries any labels.

## Titles
All 5 titles are strict Conventional Commits:
- `fix: show speed in desktop file transfer status` (#15980)
- `fix(linux): a Wayland session without XAUTHORITY is not incomplete` (#15978)
- `fix(file-transfer): improve large directory loading` (#15830)
- `chore(flutter): bump desktop_multi_window for show recovery` (#15959)
- `fix(flutter): align terminal shortcuts with platform conventions` (#15970)

Pattern: `<type>(<optional scope>): <lowercase imperative description>`. Types observed: `fix` (4×), `chore` (1×). Scopes observed: `linux`, `file-transfer`, `flutter` (2×); one PR unscoped. All lowercase after the colon, no emoji, no trailing period, no sentence-case capitalization. Lengths ~45–75 characters — longer and more descriptive than typical one-liners; #15978's title itself states the root-cause model ("a Wayland session without XAUTHORITY is not incomplete").

## Description structure
There is no single shared skeleton; structure varies by change type. Per PR (human-written portion only, bot blocks excluded):

- PR #15980: one prose line ("Add speed for the desktop version; mobile is not affected.") followed by 5 screenshots. No headers at all.
- PR #15978: "Fixes #15952." opening line, then 5 dense prose paragraphs (problem → mechanism → fix → second failure mode → scope note), ending with a `Claude-Session: https://claude.ai/code/...` attribution line. No markdown headers.
- PR #15830: `## Summary` (8 bullets), `## Testing` (short prose + one checked checkbox `- [x] new -> old/new. Read dir, transfer files, delete files, rename, new dir`), `## Known limitations` (4 bullets).
- PR #15959: two short prose paragraphs, no headers, no checklists.
- PR #15970: two prose paragraphs, then a 12-row markdown table of platform/shortcut/behavior, a reference URL, and a `## Tests` section with 7 checked checkboxes.

Heading level used is `##` (H2) when headers exist (3 of 5 PRs have none or only one). Section names differ per PR (`Summary`/`Testing`/`Known limitations` vs `Tests`), indicating ad-hoc rather than templated headers. Bulleted lists dominate prose in #15830; prose dominates in #15978 and #15959.

## Template usage
No evidence of a repo PR template: no unfilled prompts, no instructional boilerplate, no "How Has This Been Tested"-style scaffold, no bare `- [ ]` checklists. Checklists that appear (#15830, #15970) are already ticked `- [x]` and read as authored test evidence, not template residue. Header names are inconsistent across PRs (`## Testing` vs `## Tests`), which rules out a fixed scaffold. Conclusion: **freeform**, with a personal habit of addingsummary/testing/limitations sections on larger changes (#15830, +440 lines) and skipping structure entirely on small ones (#15959, +1 line).

## Length & density
Bimodal — either minimal or thorough, nothing in between:
- #15980: ~11 words of prose + 5 images (the screenshots are the description)
- #15959: ~75 words
- #15970: ~150 words + a 12-row table + 7-item test checklist
- #15830: ~200 words across 3 sections
- #15978: ~400 words of dense technical prose (the longest and densest)

Change size correlates with description length: +1 line gets 75 words; +440 lines gets the full Summary/Testing/Known-limitations treatment. Prose is dense and quantified rather than padded — e.g. #15978 counts "10 rounds x 6 process patterns x 4 variables = 240 `get_env` calls… ~2900 fork/exec per refresh, and the service loop repeats every 500 ms".

## Voice & tone
- Neutral third-person, descriptive present tense: "The portal answers on the first pattern, which ends the walk there" (#15978); "This applies the same shortcut handling to the Flutter web/mobile terminal" (#15970).
- No first person anywhere in the 5 descriptions; imperative mood appears in bullets ("Build file-list rows lazily…", #15830).
- Formal, precise engineering register with deep domain specificity: inline-code identifiers (`get_display_xauth_xwayland`, `WAYLAND_DISPLAY`, `Ctrl+Shift+C`) are pervasive, and #15978 cites measured impact ("a full core on a low-end laptop and ~60% of a core on a 13600KF").
- #15978 discloses AI assistance with a trailing `Claude-Session:` link while remaining a fully human-shaped technical narrative.

## Content habits
- **Linked issues**: sparse. Only #15978 links an issue ("Fixes #15952." as its opening line). Cross-PR references are more common: #15970 opens "This is a follow-up to #15931." and #15959 references the external dependency PR "rustdesk-org/rustdesk_desktop_multi_window#37".
- **Screenshots**: heavy in UI work — #15980 embeds 5 `<img>` screenshots (`user-attachments` URLs) as essentially the entire description. The other 4 PRs have no images despite 3 touching Flutter UI.
- **Test plans**: present as checked checklists when behavior changes (#15970: 7 items including per-platform manual checks like "Flutter web on Linux: `Ctrl+Shift+C`, `Ctrl+Shift+V`, and `Ctrl+V` -> `0x16`"; #15830: a client-matrix checkbox). Absent on small fixes (#15980, #15959) and on the root-cause fix #15978.
- **Behavior tables**: #15970 documents the shortcut matrix as a markdown table (platform × shortcut × behavior) — an effective spec-in-description pattern.
- **Known-limitations callouts**: #15830 has an explicit `## Known limitations` section listing 4 residual edge cases ("Directory errors contain neither a path nor a request ID…") — an unusually candid habit that pre-empts review questions.
- **Breaking-change callouts / reviewer ask-outs / labels / milestones**: none observed in any PR (all 5 have `Labels: none`).

## Bot-generated content
Present and left intact in 4 of 5 PRs (all except the 1-line #15959):
- **CodeRabbit**: a `## Summary by CodeRabbit` release-notes block wrapped in `<!-- This is an auto-generated comment: release notes by coderabbit.ai -->` markers, with categorized bullets (`* **Bug Fixes**`, `* **Performance**`, `* **New Features**`). #15830 even shows a duplicated `## Summary by CodeRabbit` header, and it was merged as-is — maintainers do not edit or trim these blocks.
- **Greptile**: a larger `<!-- greptile_comment -->` block with collapsible `<details>` sections: `Greptile Summary`, `Confidence Score: N/5` (4/5 on #15978, 5/5 elsewhere), an `Important Files Changed` table mapping each file to a one-line overview, and in two PRs mermaid diagrams (a flowchart in #15978, a sequence diagram in #15830). Example: "The PR appears safe to merge, with a non-blocking concern that ranked session candidates should be collected from one process rather than four independent PID selections."

The bot content is appended *below* the human description; the human-authored portion still leads and carries the real signal. CodeRabbit/Greptile summaries here are direct competitors to AI-generated PR descriptions — but maintainers treat them as supplementary release notes, not as the description itself, and still hand-write the opening prose.

## Notable exemplars
- **PR #15978** — https://github.com/rustdesk/rustdesk/pull/15978 — the strongest sample: opens with "Fixes #15952.", then walks from symptom to quantified root cause ("~2900 fork/exec per refresh… every 500 ms") to fix rationale and a second-order failure mode, all in 5 tight paragraphs — a masterclass in root-cause-first PR writing with zero boilerplate.
- **PR #15830** — https://github.com/rustdesk/rustdesk/pull/15830 — best structured large change: `## Summary` / `## Testing` / `## Known limitations` gives a reviewer the what, the evidence (an 87,289-file directory that previously failed to open), and the accepted trade-offs in ~200 words.
