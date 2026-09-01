# Merged PRs: microsoft/vscode

## PR #332931: sessions: Show chat status on its owning row

- URL: https://github.com/microsoft/vscode/pull/332931
- Author: sandy081
- Merged: 2026-08-27T20:38:03Z (created: 2026-08-27T12:47:03Z)
- Stats: +199 -21, 5 files
- Labels: on-testplan
- Reviews: 3 | Comments: 1
- Linked issues: none

### Description

Follow-up to #332922.

## What changed
- Present the parent session row using the canonical main chat status while preserving aggregate session status for filtering, lifecycle, notifications, and flat lists.
- Show non-main chat **Input Needed** state, pulse, title emphasis, and reduced-motion fallback on the owning nested chat row.
- Add spacing between hierarchy guides and both parent and child status icons/twisties in desktop and phone layouts.
- Add focused regression coverage for status ownership, reactive updates, accessibility, and needs-input visuals.

## Validation
- `npm run compile`
- Hygiene on all four changed files
- 76 Sessions list tests
- ESLint and diff hygiene

## PR #333050: agentHost: inherit isolation in created sessions

- URL: https://github.com/microsoft/vscode/pull/333050
- Author: sandy081
- Merged: 2026-08-27T22:54:02Z (created: 2026-08-27T22:23:03Z)
- Stats: +99 -10, 5 files
- Labels: on-testplan
- Reviews: 3 | Comments: 0
- Linked issues: none

### Description

## Summary

- inherit the creating session's host-owned isolation for independent `create_session` calls
- keep isolation inheritance independent from provider-owned configuration, including when selecting another provider
- validate inherited isolation against the target workspace and document the contract

## Validation

- `npm run compile`
- `npm run hygiene`
- `npm run typecheck-client`
- `npm run valid-layers-check`
- `./scripts/test.sh --run src/vs/platform/agentHost/test/node/sessionServerTools.test.ts`
- focused `AgentService` isolation inheritance test
- Copilot prompt snapshot replay (22 tests)

## PR #333130: sessions: Reveal nested chat twistie on hover

- URL: https://github.com/microsoft/vscode/pull/333130
- Author: sandy081
- Merged: 2026-08-28T09:34:04Z (created: 2026-08-28T09:01:47Z)
- Stats: +85 -7, 3 files
- Labels: on-testplan
- Reviews: 5 | Comments: 0
- Linked issues: none

### Description

Follow-up to #332931.

## What changed
- Keep the parent session status icon visible at rest, when selected, and during keyboard focus/navigation.
- Replace the status icon with the native nested-chat twistie only while the parent session row is hovered.
- Preserve keyboard collapse/expand behavior independently of twistie visibility.
- Keep the twistie visible in phone/touch layouts where hover is unavailable.
- Add focused regression coverage for rest, selection, and keyboard-focus states.

## Validation
- `npm run compile`
- Hygiene on both changed files
- Focused Sessions list twistie tests
- Client typecheck, ESLint, and diff hygiene

## PR #333138: sessions: Add spacing between session list rows

- URL: https://github.com/microsoft/vscode/pull/333138
- Author: sandy081
- Merged: 2026-08-28T11:17:13Z (created: 2026-08-28T10:50:43Z)
- Stats: +111 -9, 3 files
- Labels: on-testplan
- Reviews: 3 | Comments: 1
- Linked issues: none

### Description

Adds a small vertical gap between session and nested chat rows in the Agents Window.

The spacing is owned by the Sessions list instance: row heights reserve the gap, while backgrounds and focus/selection outlines remain fitted to the visible row content. Embedded flat session lists are unchanged.

Tests:
- `npm run compile`
- `npm run hygiene`
- `./scripts/test.sh --run src/vs/sessions/contrib/sessions/test/browser/sessionsList.test.ts`

## PR #333398: agentHost: Avoid restarting active session listings

- URL: https://github.com/microsoft/vscode/pull/333398
- Author: sandy081
- Merged: 2026-08-30T18:19:19Z (created: 2026-08-30T14:24:49Z)
- Stats: +20 -30, 3 files
- Labels: none
- Reviews: 2 | Comments: 0
- Linked issues: Fixes #333284

### Description

Fixes #333284

## What changed

- Remove the pre- and post-computation epoch retries added by #331679.
- Preserve #331176's coalescing behavior: callers after invalidation start a fresh computation, while an existing caller can finish.
- Update the session catalog documentation and regression coverage for that contract.

## Why

Registry churn could keep an existing `listSessions` request chained across complete catalog computations. In the reported trace, one request traversed 11 computations and remained pending for approximately 396 seconds. The retry behavior was not required for #331679's migration-resilience work.

## Validation

- `npm run compile`
- `npm run hygiene`
- `npm run transpile-client`
- `./scripts/test.sh --run src/vs/platform/agentHost/test/node/agentService.test.ts` (395 passing)
