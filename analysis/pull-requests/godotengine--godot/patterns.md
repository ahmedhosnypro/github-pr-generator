# PR Patterns: godotengine/godot

## Corpus
- PRs analyzed: 5 (numbers: #121940, #122931, #122945, #122963, #117999)
- Caveat: 5 PRs by 5 different authors (aaronfranke, ttencate, kitbdev, lawnjelly, BlueCube3310), which is good author diversity, but the sample is still small; also mixed branches/lifecycles — #122963 targets the 3.x branch (`[3.x]` prefix) and #117999 sat open ~5 months (created 2026-03-30, merged 2026-08-26) while #122945 was merged ~3 hours after creation. Conclusions are indicative, not exhaustive.

## Titles
No conventional-commit types (`feat:`/`fix:`) anywhere. Patterns observed:
- Plain imperative/descriptive sentence: `Fix crash when setting the root Viewport's World3D to null` (#121940), `Fix duplicate Toggle Comment context option` (#122945), `Fix some UB / uninitialized vars` (#122963) — "Fix …" leads 3 of 5 titles.
- Verb-first feature title: `Add shader uniform hints `no_storage` and `no_editor`` (#122931) — inline backticks around identifiers in the title.
- Scope prefix with colon: `DDS: Fix loading 3D textures with mipmaps` (#117999) — subsystem tag, not a conventional-commit type.
- Branch tag prefix: `[3.x] Fix some UB / uninitialized vars` (#122963) — backport-branch marker.
Length ~35–60 characters, sentence-case, no emoji, no trailing period.

## Description structure
Header usage splits cleanly into two camps:
- **Template-header camp (3 of 5):** #121940, #122931, #122945 all use identical `##` (H2) headers in identical order: `## What problem(s) does this PR solve?` then `## Additional information`. The problem section carries a `- Closes <URL>` bullet in #122931 ("Closes https://github.com/godotengine/godot-proposals/issues/15338") and #122945 ("Closes https://github.com/godotengine/godot/issues/122941"); #121940 uses prose plus three fenced `cpp` code blocks instead.
- **Freeform camp (2 of 5):** #122963 opens with prose ("Fixes an uninitialized read in the batching…"), a bare `Fixes #122431.` line, then a custom `## Notes` header with 3 bullets. #117999 has no headers at all — two prose sentences plus a test-attachment link.

Lists appear mostly as bullets under "Notes"/"Closes" lines; code fences and `<img>` tags carry much of the content weight in the longer PRs.

## Template usage
Strong evidence of a repo-wide PR template: the exact header pair `## What problem(s) does this PR solve?` / `## Additional information` appears verbatim in 3 of 5 PRs, including the parenthetical "(s)" — too specific to be coincidence. However, no checklists (`- [ ]`), no "How Has This Been Tested" scaffold, and no leftover instructional boilerplate are visible, meaning authors fill the template fully (or strip unused parts). The 2 freeform PRs (#122963 by a frequent core contributor, #117999) show the template isn't strictly enforced. Conclusion: **template — a short two-section template, commonly used but not mandatory**.

## Length & density
Short-to-medium, skewed by code/images:
- #121940: ~140 words of prose plus 3 `cpp` code blocks (~30 lines) — the most thorough.
- #122931: ~80 words plus 2 code/output blocks and 3 inline screenshots.
- #122945: ~35 words total — minimal viable description (Closes link + 2-sentence root cause).
- #122963: ~110 words, bullet-heavy.
- #117999: ~25 words plus an attachment link — extremely terse.
Pattern: density comes from artifacts (code snippets, screenshots, zip attachments), not prose. Explanations directly quote the offending code rather than describing it abstractly (#121940 pastes the buggy snippet, then the fixed snippet).

## Voice & tone
- Mix of first person and neutral voice: #121940 "I did not use AI to make this pull request."; #122945 "but I accidentally added it back here when rebasing"; #122963 "I did initially start going through the batching…" — candid, informal first-person admissions are tolerated, even of mistakes ("I accidentally").
- #122931 and #117999 are impersonal/descriptive ("The ones with `no_storage` are omitted from the .tres file").
- Tone is peer-to-peer engineering register: hedge words ("probably another good one to cherry-pick", #121940), trade-off notes ("many vars aren't zeroed _on purpose_", #122963).

## Content habits
- **Linked issues:** explicit closing refs in 3 of 5 — as full-URL "Closes" bullets inside the template section (#122931 → godot-proposals#15338, #122945 → #122941), or a bare "Fixes #122431." line (#122963). #121940 and #117999 link nothing.
- **Code snippets:** fenced blocks in 3 of 5 (#121940 ×3, #122931 ×2) — before/after code comparison is a signature habit.
- **Screenshots/images:** #122931 embeds 3 `<img>` screenshots (inspector visibility, completion, error reporting) for a small feature — visual proof is expected for editor-facing changes.
- **Attachments:** demo/test zips in 2 of 5 ("shader_usage_flags_demo.zip" #122931, "3dtexture_test.zip" #117999) — repro projects substitute for a written test plan. No CI/checklist-style test plans anywhere; no "tested on X" boilerplate.
- **Breaking-change callouts:** none. Reviewer ask-outs: soft ones only — "probably another good one to cherry-pick to supported branches" (#121940), and a scope-guard note in #122963 explaining why related work was left out ("it should really be a separate PR").
- **Labels:** consistently applied `topic:*` labels (topic:core, topic:rendering, topic:editor, topic:shaders, topic:import) plus kind labels (bug/enhancement/regression/crash) on all 5 PRs.

## Bot-generated content
No CodeRabbit/Copilot summaries or other bot-generated description blocks in any of the 5 PRs. The only AI mention is the human disclaimer in #121940: "I did not use AI to make this pull request." under Additional information — notable as a repo culture signal: AI authorship disclaimers appear by name rather than bot output being present. All descriptions read as human-written by the submitting author.

## Notable exemplars
- **PR #121940** — https://github.com/godotengine/godot/pull/121940 — textbook crash-fix write-up: fills both template sections, pastes the exact buggy code, explains the null path, shows the fixed code, and flags cherry-pickability; reviewable without opening the diff.
- **PR #122931** — https://github.com/godotengine/godot/pull/122931 — best feature PR: links the governing proposal instead of re-arguing rationale, then proves behavior with a demo project, file-output diff, and three targeted screenshots.
