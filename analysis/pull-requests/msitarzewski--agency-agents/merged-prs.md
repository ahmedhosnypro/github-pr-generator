# Merged PRs: msitarzewski/agency-agents

## PR #806: feat: add Knowledge Graph Engineer + Master Plan Architect agents

- URL: https://github.com/msitarzewski/agency-agents/pull/806
- Author: msitarzewski
- Merged: 2026-08-26T12:22:21Z (created: 2026-08-26T12:21:49Z)
- Stats: +528 -1, 4 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: Closes #782, Closes #804, Closes #776

### Description

Two gated single-agent contributions — both clean-PASS on the automated gate (lint 0/0, low originality, canonical structure, no dupes).

| PR | Agent | Div | Author |
|----|-------|-----|--------|
| #782 | Knowledge Graph Engineer | engineering | @chen-jiying |
| #804 | Master Plan Architect | specialized | @augustoheiss |

- **Knowledge Graph Engineer** — entity-relationship extraction, graph-enhanced RAG, queryable Neo4j graphs with provenance/contradiction tracking. Also closes agent-request #776.
- **Master Plan Architect** — architectural teaching, red-team plan critique, comprehensive Markdown implementation plans.

README roster rows added for both. Hermes generated count 270 → 272. All guards green (divisions/tools/runbooks/hermes-plugin/lint).

Closes #782
Closes #804
Closes #776

Co-authored with @chen-jiying and @augustoheiss.

## PR #779: fix(install): reject unknown agent selections

- URL: https://github.com/msitarzewski/agency-agents/pull/779
- Author: Mr-Neutr0n
- Merged: 2026-08-26T13:46:46Z (created: 2026-08-12T11:36:47Z)
- Stats: +72 -3, 2 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Summary

`--agent` and `--agents-file` previously accepted unknown names. The installer then exited successfully, reported the unknown entry as selected, and installed nothing.

This change validates each requested slug against the source roster before building the selection set. Display names still resolve through the existing slugification path, while unknown CLI and file entries fail with a useful message.

## Verification

- `bash -n scripts/install.sh scripts/test-agent-selection.sh`
- `scripts/test-agent-selection.sh`
- manual dry-run reproduction for unknown and valid display-name selections
- repository division, tool, runbook, diff, secret, burst, title, and preflight checks

## PR #778: fix(convert): quote generated YAML frontmatter

- URL: https://github.com/msitarzewski/agency-agents/pull/778
- Author: Mr-Neutr0n
- Merged: 2026-08-26T13:49:51Z (created: 2026-08-12T11:34:18Z)
- Stats: +68 -19, 3 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Summary

Descriptions are emitted as plain YAML scalars by the Gemini CLI, OpenCode, Cursor, Antigravity, Qwen, and ZCode converters. A description containing `: `, such as the existing Developer Tooling Engineer description, makes the generated frontmatter invalid.

This change uses a small single-quote helper for generated scalar fields and doubles apostrophes safely. It covers names, descriptions, and optional tool lists without changing the source agent files.

## Verification

- `bash -n scripts/convert.sh scripts/test-convert-frontmatter.sh`
- `scripts/test-convert-frontmatter.sh`
- macOS Ruby YAML parsing of generated Gemini CLI and OpenCode frontmatter
- repository division, tool, runbook, agent-lint, diff, secret, burst, title, and preflight checks

## PR #777: fix(installer): deduplicate repeated tool selections

- URL: https://github.com/msitarzewski/agency-agents/pull/777
- Author: Mr-Neutr0n
- Merged: 2026-08-26T13:50:52Z (created: 2026-08-12T10:21:15Z)
- Stats: +9 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Summary

When `--tool` receives a comma-separated list, repeated values were retained. In parallel mode that started duplicate workers for the same tool and reported duplicate work.

This change validates each requested tool as before, then keeps the first occurrence while preserving the user's order.

## Verification

- `bash -n scripts/install.sh`
- `scripts/check-divisions.sh`
- `scripts/check-tools.sh`
- `scripts/check-runbooks.sh`
- `scripts/lint-agents.sh` (0 errors, existing warnings only)
- Parallel dry-run/install with `--tool claude-code,claude-code --jobs 2` installed 270 agents once and reported one tool.
- `git diff --check`

## PR #807: Add Research division + Research Synthesist (consolidated #770)

- URL: https://github.com/msitarzewski/agency-agents/pull/807
- Author: msitarzewski
- Merged: 2026-08-26T14:57:11Z (created: 2026-08-26T14:56:04Z)
- Stats: +153 -4, 8 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: Closes #770

### Description

Lands #770 (Research division) via a consolidated 3-way merge so it composes cleanly with the recently-merged install/convert fixes (#777/#778/#779) instead of reverting them, and regenerates the Hermes count.

## What
- New **research/** division (divisions.json 17→18, registered across install.sh/convert.sh/lint-agents.sh/CI + app division list)
- **Research Synthesist** agent — literature review, source evaluation, citation tracing, evidence synthesis. General evidence-synthesis methodology, distinct from the domain-specific researchers (UX/trend/investment) and academic domain-experts.

## Diligence
- 3-way merged: our #777/#778/#779 install/convert fixes verified intact
- Agent gate: lint 0/0, originality 0.0%, 136L/9§
- Full guard suite green at 18 divisions (divisions/tools/runbooks/hermes-plugin/lint)
- Hermes generated count regenerated 272 → 273

Closes #770

Co-authored with @prashantrajbista.
