# Merged PRs: anthropics/skills

## PR #1557: Update claude-api skill: prompt-audit subcommand

- URL: https://github.com/anthropics/skills/pull/1557
- Author: cj-ant
- Merged: 2026-08-13T18:09:55Z (created: 2026-08-13T15:46:48Z)
- Stats: +227 -3, 3 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## What this does

Adds a `prompt-audit` subcommand to the `claude-api` skill. It audits prompts, skill files, and tool descriptions for instructions written for older models and produces a findings report plus a proposed diff.

## Why now

The skill already covers API-level migration through `migrate`, but nothing in it looks at the prompt text that rides along with the code. Emphasis boosters (`CRITICAL: you MUST...`), JSON-forcing prefill stacks, `<scratchpad>` instructions, and per-model workarounds don't error when you change the model ID, so a migration can pass while the prompts stay tuned to the model you left. On current models that text is not neutral: it causes over-triggering, over-planning, and rigid responses.

## What changed

**New file: `shared/prompt-audit.md` (219 lines).** A seven-step procedure:

- Step 0 establishes scope and target model from the request and the repository, states both as assumptions at the top of the report, and does not stop to ask. The audit is non-interactive so it behaves the same in a chat session, CI, or a batch run.
- Steps 1 to 3 inventory the prompt surface (system prompts, tool `description` fields, skill and rule files, request-building code, few-shot blocks), establish provenance with `git blame`, and classify each line as context (keep) or constraint (test).
- Step 4 is four groups of dated-pattern tables, each with a greppable "Signals" row: pressure language, scaffolds replaced by API features (prefill to `output_config.format`, "think step by step" to adaptive thinking), over-specification, fossils, brittle skill files, tool descriptions, and request config.
- An explicit keep list of 11 items the audit must not flag, including context, exact scripts for fragile operations, tool contract detail, and working redundancy. "An audit that finds nothing should change nothing."
- Steps 5 and 6 define the two deliverables: a report (`file:line`, quoted evidence, pattern, why obsolete, confidence, action) and a proposed diff limited to high and medium confidence findings, one finding per hunk. Edits are applied only when the request explicitly asked.
- Step 7 covers verification: probe behavior before and after, one change at a time, re-add in minimal form if a cut regresses.

**`SKILL.md` (3 edits).**

- New `prompt-audit` row in the subcommand table.
- The `migrate` row now ends by pointing at `shared/prompt-audit.md`, since prompt text written for the source model is part of every migration.
- "Language Detection" now opens with an intent check: decide first whether the request involves a specific SDK language at all. Prompt audits, model choice, pricing, and conceptual API questions are language-agnostic, so the skill skips detection and doesn't ask for a language on those.
- New reading-guide entry for audit-shaped requests ("is this prompt outdated", "remove the cruft").

**`shared/model-migration.md` (1 edit).** The "Prompt-Behavior Changes" intro cross-references the audit for dated prompt text beyond a single migration.

The skill's frontmatter `description` (the trigger string) is unchanged.

## How we know it works

Documentation-only change. On a 20-case benchmark of dated patterns planted in a working app (a case counts as fixed when at least one of three runs fixes it), an audit run with this file fixed 14 of the 15 cases it was not developed against, compared with 12 of 15 for the skill without it and 8 of 15 with no skill. On a clean codebase with nothing planted, 2 of 3 runs proposed no edits. Structurally, the diff against `main` is limited to the three files above and contains no unresolved template placeholders.


## PR #1554: Add claude-academy-guide skill

- URL: https://github.com/anthropics/skills/pull/1554
- Author: kswan-wk
- Merged: 2026-08-17T13:04:00Z (created: 2026-08-13T00:30:06Z)
- Stats: +361 -0, 3 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## Summary

Adds `claude-academy-guide`, an opt-in skill that recommends matching Claude Academy (academy.claude.com) courses, tutorials, and use cases when a user asks how to use Claude or a Claude product. It answers the question first, then — only on a strong intent match — appends at most one or two links. It never invents Academy content and stays silent on weak or tangential matches.

- **`skills/claude-academy-guide/SKILL.md`** — recommendation rules only (answer first, strong matches only, ≤2 items, exact catalog URLs, no invented titles/slugs, no titles from memory). Deliberately embeds **no** catalog snapshot: Academy content ships continuously and a baked-in list would go stale in a repo that updates by PR.
- **`skills/claude-academy-guide/LICENSE.txt`** — Apache 2.0, same as the other open skills here.
- **`.claude-plugin/marketplace.json`** — registers the skill as its own opt-in plugin entry (not added to `example-skills`), so it is never default-enabled.

## Runtime network fetch — please note

The skill reads the **live catalog at `https://academy.claude.com/assets/data/catalog.json`** (an Anthropic-owned property, publicly served, rebuilt on each Academy content release). Specifics:

- Fetched at most once per conversation, and only when a recommendation already looks warranted.
- The file is treated strictly as data: only item fields (title, url, summary, kind, level, products, tags, visibility) are read; anything else in it is ignored.
- Honors the file's `staleAfter` / `generatedAt` timestamps.
- **No-fetch / failed-fetch / stale behavior:** the skill names no specific item at all; if the user was clearly looking for learning content it points to the matching product hub (academy.claude.com/claude, /code, /cowork, /fluency, /platform) or the searchable library (academy.claude.com/resources). This is silent — the user is never told about fetching or errors.
- All recommended URLs are constrained to `https://academy.claude.com/`.

No other network access, no scripts, no external dependencies — the skill is a single ~150-line markdown file.

## Testing

Tested internally against how-to, getting-started, and "what training do you have for X" questions across Claude, Claude Code, Cowork, and the API to tune the strong-match threshold and the two-item cap, and to confirm the hub/library fallback when the catalog can't be fetched.


## PR #1553: Add discernment-nudge skill

- URL: https://github.com/anthropics/skills/pull/1553
- Author: kswan-wk
- Merged: 2026-08-17T17:23:12Z (created: 2026-08-13T00:30:03Z)
- Stats: +420 -0, 3 files
- Labels: none
- Reviews: 2 | Comments: 0
- Linked issues: none

### Description

## Summary

Adds `discernment-nudge`, an opt-in skill that appends two or three short, targeted follow-up questions after a substantive answer the user is likely to act on — advice, estimates, drafted plans, data interpretation, multi-step reasoning. Each question points at something concrete in the answer (a figure, an assumption, a piece of missing context) so the user can check key facts, probe the reasoning, and notice what the answer had to guess at before relying on it.

- **`skills/discernment-nudge/SKILL.md`** — trigger/skip rules and output format. Fires at most once per conversation. Explicit carve-outs for creative writing, casual chat, code the user will run, simple lookups, purely educational explanations, and cases where the user already asked for verification, asked for the quick version, asked for a review of their own work, or supplied the source material. Output is plain text only: a fixed lead-in line plus 2–3 bullets, nothing after.
- **`skills/discernment-nudge/LICENSE.txt`** — Apache 2.0, same as the other open skills here.
- **`.claude-plugin/marketplace.json`** — registers the skill as its own opt-in plugin entry (not added to `example-skills`), so it is never default-enabled.

No scripts, no network access, no external dependencies — the skill is a single markdown file.

## Testing

Tested internally across advice, estimation, drafting, and data-analysis conversations to tune the trigger boundaries (in particular the educational and "user already asked to verify" carve-outs) and the once-per-conversation rule.


## PR #1605: Rename claude-academy-guide skill to academy-guide and shorten its description

- URL: https://github.com/anthropics/skills/pull/1605
- Author: kswan-wk
- Merged: 2026-08-18T16:02:06Z (created: 2026-08-18T02:11:05Z)
- Stats: +13 -16, 3 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## Summary
Two changes to make the existing Academy skill packageable as an uploaded custom skill, with no other content changes:

- **Rename** `claude-academy-guide` → `academy-guide` in place: the skill folder, the `name` line in SKILL.md, and the marketplace.json entry name and path. Skill names cannot contain the reserved words "claude" or "anthropic" (per the [agent skills best-practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)). Nothing new is added and nothing is duplicated.
- **Description** shortened from 1,176 to 992 characters to fit the 1,024-character limit that skill upload validation applies to the SKILL.md frontmatter description. The shortened text is the version tested internally; the selection eval on it holds the triggering improvements from #1554 and is better at staying silent on pure product-fact questions.

## Follow-up
The pending export-script fix needs to allowlist the new name `academy-guide`, otherwise the next export run would delete the renamed skill.

## PR #1623: Update claude-api skill: Python SDK 0.x to 1.x upgrade guide

- URL: https://github.com/anthropics/skills/pull/1623
- Author: cj-ant
- Merged: 2026-08-21T17:10:54Z (created: 2026-08-21T14:25:11Z)
- Stats: +303 -6, 4 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## What this does

Adds an `upgrade` subcommand to the `claude-api` skill for moving a Python project from `anthropic` 0.x to 1.x, and updates the Python README for the 1.x HTTP layer.

## Why now

`anthropic` 1.0.0 is on PyPI. It moves the HTTP layer from `httpx` to its maintained fork `httpx2`, raises the floor to Python 3.10, and removes long-deprecated surface (Text Completions, `LegacyAPIResponse`, several aliases and parameters). Most edits are mechanical, but an `httpx.Timeout` or `httpx.Client` handed to a 1.x client fails at request time rather than import time, and HTTP mocking or tracing that patches `httpx` silently stops seeing SDK traffic. The skill's `migrate` subcommand covers model migrations, not package upgrades, so there was nothing to route these requests to.

## What changed

**New file: `python/claude-api/sdk-upgrade.md` (286 lines).**

- Step 0 confirms scope (same ask-first rule as `migrate`), reads the current version, and checks that a 1.x release is published before writing a pin.
- Step 1 is an inventory table: one row per signal to grep for (`import httpx`, `with_raw_response`, `completions.create`, `respx` / `pytest_httpx` / OpenTelemetry `httpx` instrumentation, and so on), each pointing at the section that handles it. Re-run at the end, it doubles as verification.
- Steps 2 to 8 cover the dependency bump, `httpx` to `httpx2` objects, awaited async `.with_raw_response`, Text Completions removal, removed sampling parameters (with the `extra_body` escape hatch for callers pinned to an older model), renamed exports, and smaller call-site changes.
- Closing sections cover verification and the report format. The SDK repo's `MIGRATION.md` stays authoritative and the guide says to defer to it on any disagreement.

**`SKILL.md` (2 edits).**

- New `upgrade` row in the subcommand table. Trailing words can name a language or scope (`upgrade python src/`). A language with no bundled guide gets pointed at its SDK CHANGELOG rather than an improvised port of the Python steps. The row states this is not model migration.
- New reading-guide entry for "upgrading the SDK package across a major version, or writing new code against a project already on 1.x".

**`python/claude-api/README.md` (3 edits).** Timeouts use `anthropic.Timeout` instead of `httpx.Timeout` (and the stray `import httpx` is gone), the async and custom-client notes name `httpx2`, and a short paragraph explains that `anthropic.Timeout` is `httpx2.Timeout` with a link to `MIGRATION.md` and `/claude-api upgrade python`.

**`shared/live-sources.md` (1 edit).** New "SDK major-version upgrade guides" table with the Python `MIGRATION.md` URL and extraction prompt.

The frontmatter `description` is unchanged. No unresolved template placeholders.

