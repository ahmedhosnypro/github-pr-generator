# Merged PRs: affaan-m/ECC

## PR #2899: fix(hooks): classify platform-dependent raw prefixes

- URL: https://github.com/affaan-m/ECC/pull/2899
- Author: haelyra
- Merged: 2026-08-29T03:14:10Z (created: 2026-08-29T02:35:37Z)
- Stats: +25 -22, 2 files
- Labels: none
- Reviews: 3 | Comments: 2
- Linked issues: none

### Description

## Summary

Follow-up to #2380. The exact post-merge matrix showed that synchronous raw-input echoes can be truncated at platform-dependent pipe sizes: macOS Node 18 returned a 16 KiB prefix and macOS Node 20 returned an 8 KiB prefix, while the original classifier recognized only an exact 64 KiB prefix.

This patch removes the fixed buffer-size assumption. A non-empty stdout value is classified as passthrough only when it is a byte-exact prefix of the original hook event. A mismatched prefix remains genuine child output. The hook contract expects complete JSON output, so a truncated raw-event prefix is not a valid replacement result and must be suppressed.

## Validation

- plugin-hook-bootstrap-no-echo.test.js: 13 passed, including deterministic 8 KiB, 16 KiB, and 64 KiB prefix cases plus a mismatch guard
- plugin-hook-bootstrap.test.js: 15 passed
- hooks.test.js: 250 passed
- bash-hook-dispatcher.test.js: 6 passed
- run-with-flags-truncation.test.js: 7 passed
- ESLint passed on all affected source and test files
- git diff --check passed

## Failure evidence

- macOS Node 18 Yarn: raw prefix escaped at 16,384 bytes
- macOS Node 20 Yarn: raw prefix escaped at 8,192 bytes

This restores the intended #2380 behavior without changing genuine hook output or fail-open handling.

## PR #2633: fix(agents): point harness-optimizer at eval-harness instead of missing skill

- URL: https://github.com/affaan-m/ECC/pull/2633
- Author: Juanpacol
- Merged: 2026-08-29T03:37:14Z (created: 2026-07-30T13:39:26Z)
- Stats: +30 -19, 1 files
- Labels: none
- Reviews: 6 | Comments: 4
- Linked issues: none

### Description

## Summary
- `agents/harness-optimizer.md` told the agent to run `/harness-audit` as if it were a skill under `skills/`, but `/harness-audit` is a command backed by `scripts/harness-audit.js`, and subagents cannot invoke slash commands during their own run.
- Reworked the agent's workflow and output contract to be a direct derivative of `skills/eval-harness/SKILL.md`'s own methodology (EVAL DEFINITION / EVAL REPORT, Grader Types, pass@k / pass^k) instead of an ad-hoc scorecard.
- Restructured the body to match the agent template in `CONTRIBUTING.md` (`Your Role`, `Workflow` with Step 1/2/3, `Output Format`, `Examples`).

## Type
- [x] Agent

## Testing
- `npx markdownlint-cli 'agents/harness-optimizer.md' --ignore node_modules` — clean
- `node scripts/ci/validate-agents.js` — validated all 67 agent files, no errors
- `node tests/run-all.js` — 3391/3391 passed

## Checklist
- [x] Follows format guidelines
- [x] Tested with Claude Code
- [x] No sensitive info (API keys, paths)
- [x] Clear descriptions

## PR #2693: fix(lib): correct stale model rates in the shared cost estimator and skill

- URL: https://github.com/affaan-m/ECC/pull/2693
- Author: andrest
- Merged: 2026-08-29T03:59:59Z (created: 2026-08-06T19:53:12Z)
- Stats: +24 -12, 3 files
- Labels: none
- Reviews: 6 | Comments: 7
- Linked issues: none

### Description

## What Changed

Corrects the stale model rate table in `scripts/lib/cost-estimate.js` and in the `cost-aware-llm-pipeline` skill, in all three languages.

- `scripts/lib/cost-estimate.js`: `opus` was $15/$75, `haiku` was $0.80/$4.00, and Fable and Mythos had no bucket at all. Adds `opusLegacy`, `haikuLegacy` and `fable` buckets.
- `skills/cost-aware-llm-pipeline/SKILL.md` plus its `zh-CN` and `ja-JP` translations: the published Pricing Reference table carried the same stale numbers.
- `tests/lib/cost-estimate.test.js`: the existing test pinned the stale values, so it is updated to pin the correct ones, plus coverage for the legacy spellings and the new buckets.

## Why This Change

`scripts/lib/cost-estimate.js` holds a **second, independent copy** of the rate table that `scripts/hooks/cost-tracker.js` had, with the same defect:

```js
sonnet: { in: 3.0, out: 15.0 },
opus: { in: 15.0, out: 75.0 }
```

$15/$75 are Claude 3 Opus era rates. **Opus 4.5 and later bill at $5/$25**, so every current-generation Opus estimate was exactly **3x** real spend. Two further errors in the same eight lines:

| Bucket | Was | Correct | Effect |
|---|---|---|---|
| `opus` | $15.00 / $75.00 | $5.00 / $25.00 | 3x over-estimate |
| `haiku` | $0.80 / $4.00 | $1.00 / $5.00 | Haiku 3.5's rate applied to Haiku 4.5, 1.25x under-estimate |
| Fable / Mythos | (no bucket) | $10.00 / $50.00 | fell through to `sonnet`, 3.3x under-estimate |

Legacy buckets are **added rather than overwritten**, so correcting the current generation does not reprice the old one. `opusLegacy` keeps $15/$75 for the three models that really billed it (Claude 3 Opus, Opus 4.0, Opus 4.1) and `haikuLegacy` keeps $0.80/$4.00 for Claude 3.5 Haiku. Claude 3 Haiku is deliberately not modelled: Claude Code never ran it.

The matching regexes are the ones already used by the cost tracker, so the two tables now agree on which model is legacy:

```js
const LEGACY_OPUS_RE = /claude-3-opus|opus-4-0(?!\d)|opus-4-1(?!\d)|opus-4[-@]\d{8}/;
const LEGACY_HAIKU_RE = /3-5-haiku|haiku-3-5/;
```

Opus 4.0's snapshot is `claude-opus-4-20250514`, with no minor segment, which is why the bare `opus-4-<date>` form is matched separately: an `opus-4-0` substring alone misses it and would reprice a legacy estimate at a third of its real cost. The `[-@]` covers Vertex AI's `claude-opus-4@20250514`; Bedrock's `anthropic.claude-3-opus-20240229-v1:0` is caught by the first alternative.

`RATE_TABLE` keeps its existing keys and shape, so the export stays backward compatible.

### The skill docs

The Pricing Reference table published the same stale numbers as prose. The `Relative Cost` column is derived from the rates, so it is corrected with them. Against a corrected Haiku 4.5 baseline the multiples are now exact, which is why the approximation markers (`~`, `約`) are dropped:

| Model | Input | Output | Relative Cost |
|-------|-------|--------|---------------|
| Haiku 4.5 | $1.00 | $5.00 | 1x |
| Sonnet 4.6 | $3.00 | $15.00 | 3x |
| Opus 4.5 | $5.00 | $25.00 | 5x |

Only the numerals changed in the translations. No prose was rewritten or machine-translated, and each file keeps its own language and table formatting.

## Testing Done

- [x] Manual testing completed
- [x] Automated tests pass locally (`node tests/run-all.js`)
- [x] Edge cases considered and tested

Verified **RED before GREEN**. With the updated test pinning the correct rates and `scripts/lib/cost-estimate.js` unchanged:

```
=== Testing cost-estimate.js ===

RATE_TABLE:
  ✗ RATE_TABLE has a bucket per billing tier
    Error: Missing haikuLegacy
  ✗ RATE_TABLE carries current published rates, not Claude 3 era rates
    Error: Expected values to be strictly deep-equal:
+ actual - expected
  {
+   in: 15,
+   out: 75
-   in: 5,
-   out: 25
  }

estimateCost:
  ✗ opus 1M/1M tokens returns 30
    Error: Expected values to be strictly equal:
90 !== 30
  ✓ sonnet 1M/1M tokens returns 18
  ✗ haiku 1M/1M tokens returns 6
    Error: Expected values to be strictly equal:
4.8 !== 6
  ✓ null model with 0 tokens returns 0
  ✗ full model name claude-opus-4-6 uses current opus rates
    Error: Expected values to be strictly equal:
0.0225 !== 0.0075
  ✓ claude-3-opus-20240229 keeps legacy opus rates
  ✓ anthropic.claude-3-opus-20240229-v1:0 keeps legacy opus rates
  ✓ claude-opus-4-20250514 keeps legacy opus rates
  ✓ claude-opus-4@20250514 keeps legacy opus rates
  ✓ claude-opus-4-0 keeps legacy opus rates
  ✓ claude-opus-4-1 keeps legacy opus rates
  ✗ claude-opus-4-5 uses current opus rates
    Error: Expected values to be strictly equal:
90 !== 30
  ✗ claude-opus-4-7 uses current opus rates
  ✗ claude-opus-4-8 uses current opus rates
  ✗ claude-opus-5 uses current opus rates
  ✓ claude-3-5-haiku keeps legacy haiku rates
  ✗ claude-haiku-4-5 uses current haiku rates
    Error: Expected values to be strictly equal:
4.8 !== 6
  ✗ claude-fable-5 uses fable rates
    Error: Expected values to be strictly equal:
18 !== 60
  ✗ claude-mythos-5 uses fable rates
  ✓ unknown model falls back to sonnet rates

Results: 10 passed, 12 failed
```

With the fix applied, same command, same environment:

```
=== Testing cost-estimate.js ===

RATE_TABLE:
  ✓ RATE_TABLE has a bucket per billing tier
  ✓ RATE_TABLE carries current published rates, not Claude 3 era rates

estimateCost:
  ✓ opus 1M/1M tokens returns 30
  ✓ sonnet 1M/1M tokens returns 18
  ✓ haiku 1M/1M tokens returns 6
  ✓ null model with 0 tokens returns 0
  ✓ full model name claude-opus-4-6 uses current opus rates
  ✓ claude-3-opus-20240229 keeps legacy opus rates
  ✓ anthropic.claude-3-opus-20240229-v1:0 keeps legacy opus rates
  ✓ claude-opus-4-20250514 keeps legacy opus rates
  ✓ claude-opus-4@20250514 keeps legacy opus rates
  ✓ claude-opus-4-0 keeps legacy opus rates
  ✓ claude-opus-4-1 keeps legacy opus rates
  ✓ claude-opus-4-5 uses current opus rates
  ✓ claude-opus-4-7 uses current opus rates
  ✓ claude-opus-4-8 uses current opus rates
  ✓ claude-opus-5 uses current opus rates
  ✓ claude-3-5-haiku keeps legacy haiku rates
  ✓ claude-haiku-4-5 uses current haiku rates
  ✓ claude-fable-5 uses fable rates
  ✓ claude-mythos-5 uses fable rates
  ✓ unknown model falls back to sonnet rates

Results: 22 passed, 0 failed
```

Full suite, this branch:

```
  Total Tests: 3442
  Passed:      3431  ✓
  Failed:        11  ✗
```

Baseline on this branch's merge base, with the changes stashed: identical, `3442 / 3431 / 11`. The same **11 failures are pre-existing**, in the same 5 suites (`detect-project-worktree`, `gateguard-fact-force`, `observe-subdirectory-detection`, `suggest-compact`, `dry-run`), none touched here.

The totals are unchanged because `tests/run-all.js` aggregates on a `Passed: <n>` pattern and this file prints `Results: <n> passed, <n> failed`, so it has always contributed 0 to the headline count. The suite does run it, and a failure there still fails the run via the exit status. Worth a separate fix; deliberately not bundled here.

`eslint`, `markdownlint`, `check-unicode-safety`, `validate-skills`, `validate-hooks` and `catalog:check` all pass.

## Type of Change
- [x] `fix:` Bug fix

## Security & Quality Checklist
- [x] No secrets or API keys committed (ghp_, sk-, AKIA, xoxb, xoxp patterns checked)
- [x] JSON files validate cleanly
- [ ] Shell scripts pass shellcheck (if applicable) - no shell scripts touched
- [x] Pre-commit hooks pass locally (if configured)
- [x] No sensitive data exposed in logs or output
- [x] Follows conventional commits format

## Documentation
- [x] Updated relevant documentation (the skill's Pricing Reference, all three languages)
- [x] Added comments for complex logic
- [ ] README updated (if needed) - not needed, no surface change

## Notes for the reviewer

- This is the same defect family as #2691, in the two places that PR did not reach. It is **independent of #2691** and touches no file that PR touches, so the two can merge in either order.
- `scripts/lib/cost-estimate.js` currently has no runtime consumer in the repo beyond its own test; it is exported shared surface. Correcting it stops the stale numbers being adopted by the next caller, and removes a table that contradicts the one in `cost-tracker.js`.
- `Haiku 4.5 | $0.80 | $4.00` in the skill tables was outside the original report of this bug, but it is the same stale-table defect and it anchors the whole `Relative Cost` column, so it is corrected here rather than left to contradict the row above it.


## PR #2869: fix(hooks): consolidate MCP health-check fixes (3 PRs)

- URL: https://github.com/affaan-m/ECC/pull/2869
- Author: actus7
- Merged: 2026-08-29T04:22:27Z (created: 2026-08-25T01:29:34Z)
- Stats: +132 -4, 4 files
- Labels: none
- Reviews: 4 | Comments: 5
- Linked issues: Closes #2776, Closes #2749, Closes #2812

### Description

## Summary

Consolidates two shippable MCP compatibility fixes and preserves the useful POST-only-server signal from a third source PR.

### Included

- #2749 — treat a routed HTTP 404 as proof that a POST-only Streamable HTTP endpoint is reachable
- #2812 — accept the standard `_meta` and string `cursor` parameters on `tools/list`

### Maintainer integration

- #2776 supplied a valuable real-server reproduction and a JSON-RPC POST fallback. The combined review found that #2749’s narrower reachability rule already resolves the false-negative without sending an unauthenticated protocol request. The POST fallback was removed because it became redundant after 404 was accepted and could make a stalled GET plus stalled POST consume twice `ECC_MCP_HEALTH_TIMEOUT_MS`. The contributor signal and attribution remain explicit here.
- The real authenticated MCP call remains authoritative for protocol validity. The hook preflight answers only whether the configured endpoint is reachable.
- Current `main` remains the merge base; exact-head hosted CI and exact post-merge `main` CI are required before completion.

### Verification

- `node tests/hooks/mcp-health-check.test.js` — 23 passed
- `node tests/scripts/memory-mcp.test.js` — 13 passed
- ESLint on all four changed implementation/test files
- `git diff --check`

Closes #2776
Closes #2749
Closes #2812

## PR #2902: fix: forward-port reviewed ECC 2.2 fixes (13 PRs)

- URL: https://github.com/affaan-m/ECC/pull/2902
- Author: haelyra
- Merged: 2026-08-29T20:30:55Z (created: 2026-08-29T17:54:00Z)
- Stats: +2772 -302, 44 files
- Labels: none
- Reviews: 19 | Comments: 10
- Linked issues: none

### Description

## Summary

Forward-ports thirteen reviewed or approved pull requests onto current `main` while preserving contributor commit authorship:

- #2588: portable Corepack-pinned pnpm resolution for the Codex pre-push hook.
- #2591: immutable setup-python v7 action update.
- #2605: truthful context output when the window size is inferred.
- #2607: AdaL project installation target and capability metadata.
- #2611: documented and machine-checked graduated GateGuard controls.
- #2631: strict frontmatter validation for localized skill mirrors.
- #2640: linked-directory, NUL-safe, error-visible skill discovery.
- #2684: portable GAN score parsing and Bash 3.2 final-score selection.
- #2731: recursive operator-home redaction before compliance serialization.
- #2751: valid catch-all regular-expression hook matchers.
- #2760: OpenCode loader compatibility through a plugin-only export.
- #2889: syntax-aware, fail-closed GateGuard heredoc inspection.
- #2892: narrow recovery hints that do not weaken destructive-command denial.

## Maintainer patches

Review and full-suite follow-up also fixed:

- weighted GAN totals being confused with verdict thresholds;
- explicit `BASH_PATH` support in Windows shell tests;
- a scoped archive-extraction timeout for loaded Windows runners;
- quoted YAML comments, deterministic validator read failures, and immutable collection paths;
- inferred large-window truth and host-environment isolation;
- portable NUL sorting without GNU `sort -z`;
- report-key redaction with deterministic collision preservation;
- GateGuard regex-scanner keyword handling;
- Bash-correct `<<-` tab stripping before continuation joins, closing a reproduced destructive-command bypass;
- stale matcher mirrors in native Codex hooks and PostToolUse tests.

## Roadmap fit

This advances the ECC 2.2 M0 verified distribution, portability, security, privacy, and truthful-runtime substrate. It does not introduce an ECC 3 context profile, capability model, sandbox tier, evidence contract, canonical state, provider authority, or orchestration control plane.

## Verification

- complete repository suite: 4,086 passed, 0 failed
- lint and Markdown lint: passed
- diff checks: passed
- focused validator, context, GateGuard, hook, stocktake, package, and skill-comply suites: passed

PRs #2903 and #2904 are superseded by this consolidated head but will remain open until this PR merges and the exact resulting `main` commit passes CI and CodeQL. Source PRs will be closed with attribution only after that same post-merge gate.
