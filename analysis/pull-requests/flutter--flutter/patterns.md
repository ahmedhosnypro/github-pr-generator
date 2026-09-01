# PR Patterns: flutter/flutter

## Corpus
- PRs analyzed: 5 (numbers: #69846, #191547, #192031, #192037, #192040)
- Critical caveat: this sample is maximally skewed. 4 of 5 PRs (#191547, #192031, #192037, #192040) are authored by the same bot, `engine-flutter-autoroll`, all merged within a 9-day window (2026-08-22 → 2026-08-30), all identical dependency-roll PRs (+1/-1, 1 file, labels `engine`, `CICD`). The only human PR (#69846 by jmagman) dates to 2020-11-05 — six years older than the rest. A single 2020 human PR next to 4 2026 bot rolls supports essentially **no repo-wide conclusions** about how flutter/flutter maintainers write PRs today; treat this report as "autoroll bot corpus + one legacy human outlier".

## Titles
Two distinct genres in the sample:
- Human (#69846): `Remove add-to-app Xcode build phase input files` — plain imperative-mood sentence, no scope prefix, no conventional-commit type (`feat:`/`fix:`), no emoji, sentence-style single capital, ~40 characters.
- Autoroller (#191547, #192031): `Roll Fuchsia Linux SDK from ic6GjOSn-KN508XyK... to Cqs-NyeELd60hqv1e...` and (#192037, #192040): `Roll Skia from 3ae8e3d1e335 to ce359c7fbfe6 (1 revision)` — fixed machine format `Roll <dep> from <old> to <new> (N revisions)`, with truncated hashes for SDK IDs (`...`) and full short SHAs for Skia. Between the two Skia rolls the revision count is always shown `(1 revision)`.

No conventional commits anywhere; no emoji; no trailing punctuation.

## Description structure
- Human (#69846): two `##` (H2) sections: `## Description` (one prose sentence, then a numbered list 1–4 of reasons) followed by `## Related Issues` (one line: "Follow up to https://github.com/flutter/flutter/pull/69699"). There is also an inline screenshot inside the Description section before the numbered list. The `\r` characters embedded in the raw body suggest the description was authored or edited via a tool that preserved CRLF line endings.
- Autoroller (all 4): flat prose, **no markdown headers at all**. Structure is a fixed block: optional revision log line(s) (prerevision `https://skia.googlesource.com/.../+log/<from>..<to>` then date-prefixed commit lines, e.g. `2026-08-30 [EMAIL_REDACTED] Roll vulkan-deps ... (1 revision)`), then a boilerplate revert/bug-filing block.

## Template usage
- Human (#69846): `## Description` / `## Related Issues` look like remnant headers of a flutter/flutter PR template (that era of the repo did ship a template with these section names), but every prompt is filled in — no leftover instructional text like "Describe your changes", no checklists (`- [ ]`). Conclusion: template-authored, fully filled.
- Autoroller: the revert boilerplate is byte-identical across all 4 roll PRs ("If this roll has caused a breakage, revert this CL and stop the roller using the controls here:" + "Please CC ... to ensure that a human is aware of the problem" + "To file a bug in Flutter: https://github.com/flutter/flutter/issues/new/choose" + "To report a problem with the AutoRoller itself..." + "Documentation for the AutoRoller is here:..."). This is generator output, not a human-filled template.
- Overall: **template-generated**, split between a human filling the repo template (1 PR) and a roller emitting a fixed scaffold (4 PRs).

## Length & density
- #69846: ~110 words of body across 2 sections — concise but explanatory; each numbered point is one dense sentence of rationale ("App.framework should have been listed as an output, not an input.").
- #191547 / #192031: ~70 words each, nearly all boilerplate.
- #192037 / #192040: ~85 words each (extra revision-log lines).
The human PR's word count is justification-dense (4 reasons for a +0/-6 change), while bot PRs are boilerplate-dense with near-zero new information per roll.

## Voice & tone
- #69846: neutral third-person, declarative, terse engineering register; no "I/we"; numbered rationale rather than narrative.
- Autoroller: imperative address built into boilerplate ("revert this CL", "Please CC", "To file a bug...") — instructive tone aimed at whichever human triages a breakage.
More specific flutter-specific habits (e.g., the "cherry-pick to stable" or "test-exempt" phrases common in flutter/flutter PRs) cannot be corroborated from this sample.

## Content habits
- **Linked issues**: 0 of 5 PRs use `Fixes #N`. The human PR instead writes "Follow up to https://github.com/flutter/flutter/pull/69699" (linking a prior PR, not an issue). Every roll PR's metadata shows `Linked issues: none`.
- **Screenshots**: 1 of 5 — #69846 embeds a user-images.githubusercontent.com PNG (`![Screen Shot 2020-11-04 at 5 53 32 PM](...)`) showing the Xcode build phase being changed, directly under the one-line description.
- **Test plans**: none — no "How to test" section and no test commands in any PR (the roll PRs rely on CI, evidently implied by the `CICD` label).
- **Rollback/breakage handling**: the autoroll boilerplate itself is the breakage protocol — explicit revert instructions, human CC list, and bug-filing links.
- **Reviewer ask-outs / breaking-change callouts**: none observed.
- **Labels**: human PR carries domain triage labels (`tool`, `a: existing-apps`, `t: xcode`); roll PRs all carry `engine`, `CICD` — consistent, machine-applied labeling.

## Bot-generated content
The dominant feature of this corpus: 4 of 5 descriptions are 100% bot-generated by Skia's AutoRoller (`engine-flutter-autoroll`). Canonical snippet (#191547):

> If this roll has caused a breakage, revert this CL and stop the roller
> using the controls here:
> https://autoroll.skia.org/r/fuchsia-linux-sdk-flutter
> Please CC ... on the revert to ensure that a human is aware of the problem.

Skia rolls additionally prepend a googlesource `+log/<from>..<to>` diff link and dated commit lines (`2026-08-30 [EMAIL_REDACTED] Roll SKP CIPD package from 574 to 575`). This structure is fully preserved on merge — maintainers do not rewrite roll descriptions; it is functional ops runbook text, not a narrative summary. No CodeRabbit/Copilot-style AI summary blocks appear in any PR; the competition here is a deterministic release-automation template, which AI PR-description generators would replace with prose summaries of the rolled commits.

## Notable exemplars
- **PR #69846** — https://github.com/flutter/flutter/pull/69846 — the only human exemplar and a genuinely well-written one: one-line description, an annotated screenshot of the exact Xcode UI being changed, four numbered reasons covering both the "what" and the "why now", and a follow-up link to the preceding PR (#69699) — a compact audit trail for a +0/-6 change.
- The autoroll PRs (#191547 et al.) are exemplars of a different genre: identical, verifiable, rollback-ready automation output — and a reminder that a large share of flutter/flutter's merged-PR stream is machine-authored noise that any PR-writing convention or tool must explicitly tolerate or filter.
