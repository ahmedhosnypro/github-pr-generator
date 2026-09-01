# Merged PRs: multica-ai/andrej-karpathy-skills

## PR #51: Add Multica link at the top of README

- URL: https://github.com/multica-ai/andrej-karpathy-skills/pull/51
- Author: forrestchang
- Merged: 2026-04-13T18:11:59Z (created: 2026-04-13T18:07:07Z)
- Stats: +2 -0, 1 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Summary
- Add a prominent link to [Multica](https://github.com/multica-ai/multica) at the top of the README, right below the title, for discoverability and traffic.

## Changes
Added a blockquote with a link to the Multica open-source agents platform at the beginning of the README.

## PR #7: Add examples of common mistakes on each principles

- URL: https://github.com/multica-ai/andrej-karpathy-skills/pull/7
- Author: josepha-mayo
- Merged: 2026-01-31T18:50:36Z (created: 2026-01-29T20:54:15Z)
- Stats: +522 -0, 1 files
- Labels: none
- Reviews: 0 | Comments: 3
- Linked issues: none

### Description

Add examples of common mistakes for each principle

Adds EXAMPLES.md with concrete before/after code demonstrating each of
the four principles:

- Think Before Coding: Shows hidden assumptions and silent interpretation
  picking that LLMs commonly do
- Simplicity First: Demonstrates over-abstraction and speculative features
  with Strategy pattern and unnecessary configurability
- Surgical Changes: Shows drive-by refactoring and style drift with actual
  diff format
- Goal-Driven Execution: Contrasts vague approaches with verifiable success
  criteria and test-first workflows

Each example includes:
- Real code patterns (not toy examples)
- Explanation of why the "wrong" version is problematic
- The "right" version showing minimal/surgical approach
- When to add complexity later if needed

Includes anti-patterns summary table and key insight on premature complexity.

Addresses the need for tangible examples mentioned in README's "real-world
examples" section.

## PR #93: Add Chinese translation for README

- URL: https://github.com/multica-ai/andrej-karpathy-skills/pull/93
- Author: herobrine19
- Merged: 2026-04-18T17:51:04Z (created: 2026-04-18T13:11:35Z)
- Stats: +169 -0, 2 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

- Add README.zh.md with full Chinese translation
- Add language switcher link in original README.md

## PR #92: Add Cursor project rule and CURSOR.md setup guide

- URL: https://github.com/multica-ai/andrej-karpathy-skills/pull/92
- Author: azakharko
- Merged: 2026-04-18T17:51:53Z (created: 2026-04-18T00:53:18Z)
- Stats: +102 -0, 3 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary

Adds first-class support for [Cursor](https://cursor.com/) alongside the existing Claude Code plugin and CLAUDE.md flow: a committed project rule so the Karpathy guidelines apply automatically in Cursor, plus documentation for using and maintaining them.

## Changes

.cursor/rules/karpathy-guidelines.mdc — Project rule with alwaysApply: true, same behavioral content as CLAUDE.md (four principles + success criteria).
CURSOR.md — Cursor-specific setup: using this repo in Cursor, copying the rule to other projects, optional personal skills via skills/karpathy-guidelines/SKILL.md, Claude Code vs Cursor, and contributor sync note for CLAUDE.md / rule / SKILL.md.
README.md — New “Using with Cursor” subsection linking to the rule and CURSOR.md.

## Notes

No change to .claude-plugin/ or plugin install steps; Claude users are unaffected.
Cursor does not read CLAUDE.md by default; the rule is the supported path for Cursor.

## PR #95: docs: Sync Chinese README with English version (add Cursor section)

- URL: https://github.com/multica-ai/andrej-karpathy-skills/pull/95
- Author: herobrine19
- Merged: 2026-04-20T10:05:04Z (created: 2026-04-19T06:39:38Z)
- Stats: +4 -0, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Sync Chinese README with English version (add Cursor section)
