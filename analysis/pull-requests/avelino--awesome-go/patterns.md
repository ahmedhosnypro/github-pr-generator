# PR Patterns: avelino/awesome-go

## Corpus
- PRs analyzed: 5 (numbers: #6630, #6632, #6633, #6634, #6636)
- Caveat: every PR is the same genre of change — a one-line addition of a single package to a curated list (all `+1 -0, 1 files`). Three of five (#6630, #6632, #6634) are by one author (tigusigalpa) and are byte-identical except for the package name. All merged within ~24h (2026-08-29 → 2026-08-30), with 0 reviews and 1 comment each. This sample reflects the "add my package" flow only; it says nothing about how the repo handles removals, reorganizations, or maintainer-authored PRs.

## Titles
All 5 titles follow the identical format `Add <package-name> to <Section> section`:
- `Add telegram-wallet-go to Finance section` (#6630)
- `Add bitget-go to Finance section` (#6632)
- `Add ScheduleGate to Other Software` (#6633 — the only one omitting the word "section")
- `Add kucoin-go to Finance section` (#6634)
- `Add ws-reconnect to Networking section` (#6636)

No Conventional-Commits prefixes, no emoji, no trailing period, imperative verb "Add" + package name + target section. Lengths ~30–45 characters. Finance is the dominant section (3 of 5).

## Description structure
Two distinct structures, both list-driven with essentially no narrative:

- tigusigalpa's 3 PRs (#6630, #6632, #6634): a bare label-led list with no headings, no prose, and no sentence — e.g. `Forge link: https://github.com/tigusigalpa/telegram-wallet-go`, `pkg.go.dev: …`, `goreportcard.com: …`, `Coverage: https://app.codecov.io/…`. Word-for-word identical across the three PRs except the package name.
- #6633: three link lines (no Coverage line), then a bolded mini-header `**What:**` followed by two short prose sentences describing the addition ("ScheduleGate is a single Go binary that runs a DCMA 14-point Integrated Master Schedule (IMS) health assessment on MS Project Excel/CSV exports.").
- #6636: the only PR using markdown headings — five `##`-level sections (`## Required links`, `## Pre-submission checklist`, `## Repository requirements`, `## Pull Request content`, `## Category quality`), each a checked-off checklist.

Canonical order (when headings exist): links → checklists. Prose is rare; when present (#6633) it is ≤3 sentences.

## Template usage
A repo PR template clearly exists. #6636 reproduces it in full: bold checklist auto-scaffold with guidance lines like *"Provide the links below. Our CI will automatically validate them."*, checklist items such as `- [x] The description is clear, concise, non-promotional, and **ends with a period**.`, `- [x] The package has been added in **alphabetical order**.`, plus a closing "Thanks for your PR, you're awesome! :sunglasses:". The other 4 PRs do not retain the template visibly — tigusigalpa's PRs compress it to just the link fields (the checklist items were presumably deleted rather than checked, or a shortened variant was used). Conclusion: **template exists and is CI-oriented**; 1 of 5 PRs keeps it visibly, the rest reduce it to the required links only.

## Length & density
Extremely short descriptions:
- #6630, #6632, #6634: ~20–25 words each (four bare link lines)
- #6633: ~55 words (links + 3-sentence pitch)
- #6636: ~180 words, but nearly all is template boilerplate, not authored content

Authored (non-template) content across the corpus averages well under 50 words. Density pattern: metadata links instead of prose — the description functions as compliance paperwork for a CI-maintained list, matching the one-line diffs (+1 −0).

## Voice & tone
- Imperative titles ("Add X to Y"), but descriptions are almost voiceless — the 3 identical PRs contain no verbs or first person at all.
- #6633 is the only PR with descriptive prose; it uses third-person declarative ("ScheduleGate is a single Go binary that runs…", "It's used by schedulers in defense/government project controls work").
- Template text in #6636 is friendly instruction-register ("Thanks for your PR, you're awesome! :sunglasses:"), but that is scaffold, not author voice.

## Content habits
- **Linked issues**: none of the 5 PRs link an issue; there is no "Fixes #N" anywhere in the sample.
- **Quality evidence links**: the dominant habit — every PR includes `pkg.go.dev` and `goreportcard.com` links; 3 of 5 (all tigusigalpa's) add a Codecov coverage link. This map directly onto the merge labels (`quality:ok` on all 5, `needs-maturity` on 4, `needs-coverage` on 2).
- **Test plans / screenshots / breaking changes / reviewer ask-outs**: none observed — unsurprising for one-line list entries.
- **Labels as the review record**: labels (`needs-maturity`, `needs-coverage`, `quality:ok`) plus exactly 1 comment and 0 reviews per PR suggest maintainer triage happens via labels/CI rather than threaded discussion.

## Bot-generated content
No CodeRabbit/Copilot-style description blocks observed in any of the 5 bodies. However, the template in #6636 repeatedly defers generation/validation to automation: *"Provide the links below. Our CI will automatically validate them."* — i.e., the repo's competitor to AI-written descriptions is structured CI enforcement of a form, not free-text quality. All bodies read as either form-fills or hand-written prose; no AI-summary signature. Each PR having exactly 1 comment (content not captured in the corpus) hints at an automated first response, but that cannot be confirmed from the data.

## Notable exemplars
- **PR #6636** — https://github.com/avelino/awesome-go/pull/6636 — the only PR that completes the full template, converting a one-line addition into a verifiable compliance record (every CI-checked box ticked); the faithful execution of what the repo asks for.
- **PR #6633** — https://github.com/avelino/awesome-go/pull/6633 — the strongest authored content: three required links plus a two-sentence explanation of what the package does and who it's for, which is more than the template's minimum yet still ~55 words.
