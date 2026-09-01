# PR Patterns: electron/electron

## Corpus
- PRs analyzed: 5 (numbers: #53312, #53294, #53304, #53174, #53199)
- Caveat: the sample is heavily skewed toward automation. #53312 is authored by the `electron-pgo-updater` bot; #53304 and #53199 are mechanical backports authored by the `trop` bot that just say "Backport of #53294" / "Backport of #53174" and reproduce the source PR's release notes. Only 2 PRs (#53294 by MarshallOfSound, #53174 by codebytere) contain substantive human-written descriptions, and interestingly both human PRs plus both backports cover just two underlying fixes. Conclusions below therefore describe Electron's *workflow-shaped* conventions (template + bot machinery) more than individual author style.

## Titles
All 5 titles use strict Conventional Commits format: `<type>: <lowercase description>`:
- `build: update PGO profiles` (#53312)
- `fix: crash in webRequest proxy for redirected CORS preflights and frameless factories` (#53294, and identically for its backport #53304)
- `fix: preload SwiftShader before the GPU sandbox locks down again` (#53174, and identically for its backport #53199)

Patterns: only two types observed (`fix` 4×, `build` 1×); description after the colon is always lowercase, imperative-ish but often descriptive ("preload SwiftShader before the GPU sandbox locks down again"), no scope parentheses, no emoji, no trailing period. Backports copy the original title verbatim — no `[43-x-y]`-style branch prefix in the title itself (branch targeting lives in labels like `43-x-y`, `46-x-y`). Length ranges from ~27 characters (#53312) to ~89 (#53294).

## Description structure
Two distinct structures, by authorship:

- Human PRs (#53294, #53174) follow an identical three-part scaffold with `####` (H4) headers:
  1. `#### Description of Change`
  2. `#### Checklist`
  3. `#### Release Notes` — content always begins with the literal marker `Notes:` (the electron/clerk release-notes convention), e.g. "Notes: Fixed crashes in the main process when a `webRequest.onBeforeRequest` listener redirected a CORS preflight request…".

  Within `Description of Change`, #53294 uses bullets (3 items, one per crash scenario plus "Adds a crash-case fixture for each."), while #53174 uses dense multi-sentence prose paragraphs that narrate root cause, upstream context, and verification.
- Bot PRs bypass the scaffold: #53312 is two prose sentences plus a bare `Notes: none` line (no headers); the trop backports (#53304, #53199) are literally `Backport of #53294` / `See that PR for details.` followed by the copied `Notes:` line.

## Template usage
Strong evidence of a repo-wide PR template. Both human PRs carry the same `#### Description of Change` / `#### Checklist` / `#### Release Notes` skeleton with checked boxes `- [x]`, and the checklist items are template boilerplate, though not byte-identical between the two PRs:
- #53294: `- [x] PR description included`, `- [x] \`npm test\` passes`, `- [x] tests are [changed or added](…/testing.md)`
- #53174: `- [x] I have filled out the PR description`, `- [x] [I have reviewed and verified the changes](…/policy/ai.md)`, `- [x] [PR release notes](…/clerk…) describe the change in a way relevant to app developers, and are [capitalized, punctuated, and past tense](…#examples).`

The overlap (a description-filled item, a release-notes item with clerk links) and the shared `Notes:` trailer indicate a common template that evolves over time, plus an explicit AI-assistance disclosure item linking to `electron/governance/policy/ai.md`. The mandatory `Notes:` trailer is enforced by tooling (electron/clerk) — even the one-line bot PR carries `Notes: none`. Conclusion: **template-driven, tool-enforced**.

## Length & density
Bimodal:
- #53174: ~330 words in `Description of Change` — a deep root-cause narrative citing the upstream Chromium CL (`CL 7636200`), Code Integrity event IDs (`event 3033`), error codes (`0x060C201E`), and reproduction states (MSIX-packaged vs unpackaged vs Electron 41).
- #53294: ~80 words across 3 tight bullets.
- Bot PRs: 15–25 words each (#53312 ~30 words; backports ~10 words plus the copied Notes line).

So there is no single length norm: the template fixes the *structure*, and authors choose density freely — terse bullets for a well-understood crash fix, long-form prose when the diagnosis spans an upstream Chromium change.

## Voice & tone
- Titles and release notes are imperative/past-tense descriptive, no first person ("Fixed the GPU process being terminated in AppX/MSIX packaged apps…").
- The `Description of Change` body in #53174 uses neutral third-person explanatory prose ("On Windows the GPU process turns on `MITIGATION_FORCE_MS_SIGNED_BINS` once its sandbox is up…"); #53294's bullets are clipped, telegraphic ("Adds a crash-case fixture for each.").
- Register is technical and precise throughout — packed with proper nouns (SwiftShader, Dawn, WARP, MSIX) and exact identifiers, no hedging, no pleasantries, no emoji.

## Content habits
- **Linked issues**: weak linker practice in this sample. Metadata shows "Linked issues: none" for all 5; only #53174 references an issue at all, inline as a full URL (`Fixes https://github.com/electron/electron/issues/52700`) — not the `Fixes #N` shorthand. #53294 links no issue despite being a crash fix.
- **Upstream cross-references**: a distinctive habit. #53174 links two Chromium Gerrit CLs (the regressing CL 7636200 and the proposed narrower fix 8286976) and states the patch "goes away once that or an equivalent lands" — Electron PRs document their own future obsolescence.
- **Verification narratives**: embedded in prose rather than a separate test-plan section. #53174: "Verified on Windows 11 arm64 with an MSIX-installed Electron 42.9.2 app: `navigator.gpu.requestAdapter()` alone produces the 3033 and kills the GPU process…" with a matrix of packaged/unpackaged/older-version outcomes. #53294 relies on the checklist (`npm test` passes, tests added).
- **Release notes discipline**: every PR ends in a `Notes:` line written for app developers (past tense, capitalized, per the clerk README linked from the checklist); bots use `Notes: none` when there's nothing user-facing.
- **Backport machinery**: backport PRs are deliberately content-free ("Backport of #53174 / See that PR for details.") — all explanation debt is deferred to the original PR. Labels carry the release-line targeting (`merged/43-x-y`, `44-x-y`, etc.).
- No screenshots/images, no breaking-change callouts, no reviewer ask-outs in this sample (all 5 are low-level fixes/chores; no UI surface).

## Bot-generated content
Automation dominates this corpus:
- **trop** (backport bot) authored 2 of 5 PRs (#53304, #53199) with the fixed formula: "Backport of #NNNNN\n\nSee that PR for details.\n\n\nNotes: <copied release note>". Maintainers merge these as-is — the terse bot body is accepted convention, not cleaned up.
- **electron-pgo-updater** authored #53312 end-to-end, including a functional description ("Updates the PGO profile state files to the profiles generated and uploaded by [this workflow run](…)") and the required `Notes: none` trailer — bots comply with the same clerk release-notes contract as humans.
- No CodeRabbit/Copilot-style AI summaries in any of the 5 PRs. Notably, rather than AI-generated descriptions, Electron's governance goes the other way: the checklist in #53174 includes a human-attestation item, "I have reviewed and verified the changes" (linking to `policy/ai.md`), i.e. AI assistance is allowed but must be sworn to as human-reviewed. For AI PR-description tooling, the competitive bar here is the clerk-enforced `Notes:` line plus the `Description of Change`/`Checklist` scaffold — any generator must emit exactly that skeleton to fit in.

## Notable exemplars
- **PR #53174** — https://github.com/electron/electron/pull/53174 — the standout: a complete forensic narrative (regressing upstream CL, Windows Code Integrity mechanics, AppX/MSIX vs unpackaged behavior matrix, hex error codes, and an explicit exit plan for the patch) inside the standard template. This is what a root-cause PR description should look like.
- **PR #53294** — https://github.com/electron/electron/pull/53294 — the concise counter-model: three bullets covering two distinct crash modes plus the test additions, fully template-compliant, proving the scaffold works equally well at ~80 words as at ~330.
