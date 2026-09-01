# PR Patterns: microsoft/PowerToys

## Corpus
- PRs analyzed: 5 (numbers: #50198, #50178, #50210, #50220, #50230)
- Caveat: 5 PRs merged in a 3-day window (2026-08-28 → 2026-08-30) by 4 authors (khmyznikov authored #50220 and #50230). Area coverage skews heavily toward Command Palette and UI-test infrastructure (4 of 5); no PRs from other product areas. Sample is too small and recent to represent repo-wide convention across all ~months of activity.

## Titles
No Conventional Commits types (`feat:`/`fix:`) anywhere. Instead, two product-area scope prefixes coexist:
- Square-bracketed area tags: `[Settings] Fix Simplified Chinese Quick Access translation` (#50198), `[UITests][MouseUtilities] Migrate to .Next and add test for Cursor Wrap` (#50230), `[GH Actions][UITests] Trigger new UI tests automatically per modified module` (#50220)
- Colon scope: `CmdPal: Restore content viewer spec and regenerate IDL` (#50210), `CmdPal: Add IFormContent2 support` (#50178)

All titles use a capitalized imperative verb after the prefix (`Fix`, `Add`, `Restore`, `Migrate`, `Trigger`), no emoji, no trailing period, ~40–70 characters. Multiple stacked bracket scopes are acceptable (#50220, #50230). #50230 contains a leftover `<!-- Suggested title: [UITests][Mouse Utilities] Migrate and expand UI tests to UITest.Next -->` HTML comment in its body — and the merged title differs from it, so title choice stayed manual.

## Description structure
Four of 5 PRs follow the repo's fixed four-section scaffold, always with `##` (H2) headers in this exact order:
1. `## Summary of the Pull Request`
2. `## PR Checklist`
3. `## Detailed Description of the Pull Request / Additional comments`
4. `## Validation Steps Performed`

- #50198: all four sections, each filled with prose or bullets.
- #50210: all four section headers present, but Detailed Description and Validation are left empty, and the template's HTML guide comments are still inline (`<!-- Provide a more detailed description of the PR... -->`, `<!-- Describe how you validated the behavior... -->`).
- #50220: all four sections; Detailed Description is a flat bullet list of behaviors ("Detects modules changed by a PR from the merge-base diff against its target branch.").
- #50230: all four sections, plus added `###` subsections inside Detailed Description ("### Mouse Utilities UI-test project", "### Effect-based test support", "### Authenticated Settings IPC in Release CI", "### Autonomous validation hardening", "### Checklist migration and manual boundaries") and two Markdown tables, plus an extra `## Reviewer guide` section at the end.
- #50178 (maintainer zadjii-msft): bypasses the template entirely — three short prose paragraphs, ends with "Closes: _future work item_". No headers, no checklist.

## Template usage
Strong evidence of a repo-wide PR template. The checklist items are verbatim-identical across PRs, e.g. `- [ ] **Communication:** I've discussed this with core contributors already. If the work hasn't been agreed, this work might be rejected`, `- [ ] **Tests:** Added/updated and all pass`, `- [ ] **Localization:** All end-user-facing strings can be localized`, `- [ ] **Dev docs:** Added/updated`, `- [ ] **New binaries:** Added on the required places` with four nested sub-bullets (JSON for signing, WXS for installer, YML for CI pipeline, YML for signed pipeline), and `- [ ] **Documentation updated:** ... docs repo ...`. #50210 retains the unfilled `- [ ] Closes: #xxx` placeholder and HTML comment `<!--  - [ ] Closes: #yyy (add separate lines for additional resolved issues) -->`.

Filling behavior varies: #50198 checks 2 boxes honestly and leaves irrelevant ones unchecked; #50210 leaves everything unchecked (including its own Closes placeholder) yet was merged; #50220 and #50230 rewrite checklist items into explanatory statements, e.g. #50220's `- [x] Closes: N/A (no linked issue)` and `- [x] **Localization:** N/A; no end-user-facing strings`, and #50230's `- [x] JSON for signing: N/A - no shipped binary`. Conclusion: **mandatory template, inconsistently enforced** — maintainers merge both fully-honored and half-empty versions.

## Length & density
Bimodal distribution:
- #50178: ~110 words, dense conversational prose
- #50210: ~120 words of authored text (plus boilerplate)
- #50198: ~230 words total
- #50220: ~330 words
- #50230: ~1,500 words — an extreme outlier with two tables, five `###` subsections, build links, SHAs, and run IDs

Median PR is concise (~150–330 words) bullets-and-short-prose; the template keeps even small changes structured. #50230 shows the ceiling: exhaustive validation evidence is welcome, not trimmed.

## Voice & tone
Mostly third-person/descriptive present tense: "Adds a side-by-side `Microsoft.PowerToys.UITest.Next` end-to-end suite" (#50230), "Detects modules changed by a PR" (#50220), "Adds Simplified Chinese translator guidance" (#50198). One clear outlier: #50178 is informal first-person plural with rhetorical asides — "If we wanted to be more technically correct (and we do), then our `SubmitForm` should also accept an action ID" and "Built it and ran the sample locally." Formal engineering register otherwise; no exclamation marks, no emoji anywhere.

## Content habits
- **Linked issues**: via the checklist's `Closes:` item, not GitHub keywords in prose — #50198 checks `- [x] Closes: #50172`, #50230 checks `- [x] Closes: #40667`, #50220 writes "Closes: N/A", #50178 writes "Closes: _future work item_". All 5 PRs show "Linked issues: none" in metadata because of this placement.
- **Test plans**: the `## Validation Steps Performed` section is the norm (4 of 5 PRs). Specifics with counts: #50220 lists "3 passed, 0 failed" Pester runs and four real-module mapping checks; #50198 justifies *not* running tests ("No build or automated tests were run because this is a translator-comment-only localization change"); #50230 supplies result tables ("40/40 passed" across four local-VM profiles; "198/198 passed" in Azure) with build IDs and source SHAs.
- **Screenshots**: only #50230 embeds images (two GitHub attachment screenshots of CI results). None of the UI-adjacent changes in the template-following PRs include screenshots.
- **Cross-references to other PRs**: #50210 cites "merged PR #43964"; #50230 cites "Runner IPC authentication added by #49527".
- **Reviewer ask-outs**: #50230 ends with a `## Reviewer guide` giving a numbered suggested review order across 7 file groups — a courtesy not seen elsewhere in the sample.
- **Labels**: uniform `Product-<Area>` labels (`Product-Settings`, `Product-Command Palette`, `Area-Tests`, `Product-Mouse Utilities`) plus `Ready for review` on all 5; #50178 also carries a milestone label `0.102`.

## Bot-generated content
No CodeRabbit "Summary" blocks, no Copilot-generated description sections, no AI-watermark footers in any of the 5 PRs. Two indirect signals of agent-assisted *workflow* (not description-writing): #50230 mentions "agent-owned Azure/local-VM completion safeguards used to validate the suite autonomously" and "agent-owned wait requirement" — tooling for CI verification, authored by a human-voiced description; and its leftover `<!-- Suggested title: ... -->` comment suggests a helper proposed (but did not dictate) the title. All five descriptions read as human-authored; PowerToys maintainers do not retain bot-generated summaries.

## Notable exemplars
- **PR #50230** — https://github.com/microsoft/PowerToys/pull/50230 — the strongest sample: every checklist item replaced with an explicit N/A-rationale, prose `###` subsections, quantified validation tables (40/40 across two OSes and two resource profiles, 198/198 in CI), and a closing `## Reviewer guide` — a complete audit trail for a +3,519-line change.
- **PR #50198** — https://github.com/microsoft/PowerToys/pull/50198 — best minimal-change example: a 1-line localization fix still gets a real Summary, an honest `Closes: #50172`, and a Validation section that explains *why* no build was run, in ~230 words.
