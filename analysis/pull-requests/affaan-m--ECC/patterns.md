# PR Patterns: affaan-m/ECC

## Corpus
- PRs analyzed: 5 (numbers: #2899, #2633, #2693, #2869, #2902)
- Authors: haelyra (2), Juanpacol (1), andrest (1), actus7 (1) — four distinct contributors, so author diversity is decent for n=5. However, all 5 merged within a ~17-hour window on 2026-08-29, likely reflecting one maintainer's review/merge batch; this may bias toward PRs that satisfy one maintainer's bar rather than the full contributor spectrum.
- No PR has labels; review activity is high (3–19 reviews, 2–10 comments each).

## Titles
All 5 titles are strict Conventional Commits with type `fix:` — 100% adherence, casing lowercase throughout after the colon:

- `fix(hooks): classify platform-dependent raw prefixes` (#2899)
- `fix(agents): point harness-optimizer at eval-harness instead of missing skill` (#2633)
- `fix(lib): correct stale model rates in the shared cost estimator and skill` (#2693)
- `fix(hooks): consolidate MCP health-check fixes (3 PRs)` (#2869)
- `fix: forward-port reviewed ECC 2.2 fixes (13 PRs)` (#2902)

Scoped 4 of 5; scopes observed: `hooks` (2×), `agents`, `lib`. #2902 is the only unscoped title (repo-wide forward-port). No emoji, no trailing period, all describe the change in descriptive (not imperative-verb) phrasing. Two titles encode batch size in parentheses: `(3 PRs)`, `(13 PRs)`. Lengths range ~48–83 characters — on the long side, prioritizing specificity.

## Description structure
Every description uses `##` (H2) section headers; `## Summary` is the near-universal opener (4 of 5: #2899, #2633, #2869, #2902 — #2693 opens with `## What Changed`). Exact headers per PR, in order:

- PR #2899: `## Summary` → `## Validation` → `## Failure evidence`
- PR #2633: `## Summary` → `## Type` → `## Testing` → `## Checklist`
- PR #2693: `## What Changed` → `## Why This Change` → (`### The skill docs`, H3 subsection) → `## Testing Done` → `## Type of Change` → `## Security & Quality Checklist` → `## Documentation` → `## Notes for the reviewer`
- PR #2869: `## Summary` → `### Included` (H3) → `### Maintainer integration` (H3) → `### Verification` (H3) → bare `Closes #…` lines
- PR #2902: `## Summary` → `## Maintainer patches` → `## Roadmap fit` → `## Verification`

Common spine: Summary/What changed → rationale → verification evidence. Mix of prose paragraphs (dominant in #2899, #2869, #2902) and bullets (dominant in #2633). #2693 and #2869 use Markdown tables (#2693: rate-comparison tables with `| Bucket | Was | Correct | Effect |`; #2869 embeds tables via lists). #2693 uses H3 subsections and fenced code blocks extensively.

## Template usage
Evidence of a repo PR template exists but is not uniformly followed — **partial template usage**:

- #2633 shows a compact scaffold: `## Type` with `- [x] Agent`, `## Checklist` with `- [x] Follows format guidelines`, `- [x] Tested with Claude Code`, `- [x] No sensitive info (API keys, paths)`, `- [x] Clear descriptions`.
- #2693 shows a much longer scaffold: `## Type of Change` (`- [x] ` fix:` Bug fix`), `## Security & Quality Checklist` (`- [x] No secrets or API keys committed (ghp_, sk-, AKIA, xoxb, xoxp patterns checked)`, `- [ ] Shell scripts pass shellcheck (if applicable) - no shell scripts touched`), `## Documentation` (`- [ ] README updated (if needed) - not needed, no surface change`). Unchecked boxes carry inline justifications — the author filled the template conscientiously rather than deleting it.
- The other 3 PRs (#2899, #2869, #2902) use no checklists at all; their `## Summary` / `## Validation` / `## Verification` structure looks author-imposed, not template-derived.

The two distinct checklist shapes in #2633 vs #2693 suggest either multiple coexisting templates (per change type) or a template that evolved over time. Conclusion: **partial** — a template (or templates) exists and about half the sample uses it.

## Length & density
Bimodal; overall these are long, dense descriptions:
- #2633: ~150 words (shortest)
- #2899: ~190 words
- #2869: ~210 words
- #2902: ~330 words
- #2693: ~900 words — an outlier; includes two full verbatim test-output blocks (the RED run "Results: 10 passed, 12 failed" and the GREEN run "Results: 22 passed, 0 failed"), two code excerpts, three tables.

Pattern: verbose by most repos' standards, but density is evidentiary rather than narrative — words go to precise file paths, byte counts ("16,384 bytes", "8,192 bytes"), regexes, and test tallies. Descriptions scale roughly with change risk, not diff size: #2902 (+2,772/-302, 44 files) is far shorter than #2693 (+24/-12, 3 files).

## Voice & tone
- Formal, high-register engineering prose; essentially no first person. The rare first-person-adjacent phrasing is absent even in `## Notes for the reviewer` (#2693), which addresses the reader in declaratives ("This is the same defect family as #2691…").
- Titles/bullets favor descriptive noun phrases over imperative verbs: "classify platform-dependent raw prefixes", "Corrects the stale model rate table".
- Hedged-precision style with explicit scoping of what was *not* changed: #2869 — "The hook preflight answers only whether the configured endpoint is reachable"; #2902 — "It does not introduce an ECC 3 context profile, capability model, sandbox tier…"; #2693 — "deliberately not bundled here".
- Occasional bold for emphasis of key numbers: "**3x**", "**Opus 4.5 and later bill at $5/$25**" (#2693).

## Content habits
- **Linked issues / cross-references**: heavy cross-referencing culture. #2869 uses explicit `Closes #2776 / Closes #2749 / Closes #2812` lines (the only PR with linked issues). #2899 opens "Follow-up to #2380"; #2693 relates to #2691 ("independent of #2691… can merge in either order"); #2902 enumerates 13 source PRs by number and discusses #2903/#2904 supersession.
- **Test plans**: systematic in all 5 — exact test files with pass counts: #2899 lists five suites ("hooks.test.js: 250 passed"); #2633 gives "3391/3391 passed"; #2902 gives "4,086 passed, 0 failed"; #2693 pastes full before/after test output and compares against a recorded baseline ("3442 / 3431 / 11… The same 11 failures are pre-existing"). Lint/format gates are routinely cited (`ESLint passed`, `git diff --check passed`, `markdownlint`).
- **Screenshots/images**: none — consistent with a CLI/scripts/tooling repo.
- **Breaking-change callouts**: none framed as such, but #2693 explicitly argues backward compatibility ("`RATE_TABLE` keeps its existing keys and shape, so the export stays backward compatible").
- **Reviewer ask-outs**: #2693 has a dedicated `## Notes for the reviewer` section anticipating merge-order and scope questions. #2869 has `### Maintainer integration` explaining why part of a source PR's approach was dropped ("The POST fallback was removed because it became redundant…"), preserving contributor attribution.
- **Consolidation/forward-port habit**: 3 of 5 PRs (#2869, #2902, and #2899 as a follow-up) are meta-PRs that consolidate or port other PRs — a distinctive repo workflow where individual contributor PRs get folded into maintenance batches.

## Bot-generated content
No bot-generated description blocks observed: no CodeRabbit "Summary by CodeRabbit", no Copilot-generated summaries, no AI-disclaimer footers in any of the 5 PRs. The prose is idiosyncratic and argument-driven (e.g., #2693's digression on why `claude-opus-4-20250514` needs a separate regex branch), which reads as authored rather than generated. Caveat: the highly regular section scaffolding and exhaustive verification bullet style is compatible with AI-assistance conventions, so assistance cannot be ruled out — but there is no structural bot signature to quote.

## Notable exemplars
- **PR #2693** — https://github.com/affaan-m/ECC/pull/2693 — the strongest sample: quantified impact tables (`3x over-estimate`), verbatim RED-then-GREEN test runs, a pre-existing-failure baseline comparison proving the PR breaks nothing, and a `## Notes for the reviewer` section that pre-answers merge-order and scope questions; a complete audit trail for a 3-file change.
- **PR #2869** — https://github.com/affaan-m/ECC/pull/2869 — exemplary consolidation PR: credits all three source PRs, explains precisely why part of one source's approach was dropped ("could make a stalled GET plus stalled POST consume twice `ECC_MCP_HEALTH_TIMEOUT_MS`"), and closes all three issues explicitly — attribution and technical reasoning in ~200 words.
