# Merged PRs: ollama/ollama

## PR #18058: proxy: continue requests when the model catalog changes

- URL: https://github.com/ollama/ollama/pull/18058
- Author: ParthSareen
- Merged: 2026-08-27T02:39:05Z (created: 2026-08-27T02:16:46Z)
- Stats: +109 -30, 2 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

Claude requests can refresh the model catalog before routing. If the refresh changed the catalog generation, Ollama returned an error instead of using the selected model.

Continue each request with the model snapshot it started with. New requests use the refreshed catalog.

This removes the intermittent `Claude model catalog changed; try again` error.

## PR #18056: app: synchronize macOS app handoff

- URL: https://github.com/ollama/ollama/pull/18056
- Author: ParthSareen
- Merged: 2026-08-27T06:15:54Z (created: 2026-08-27T01:45:50Z)
- Stats: +577 -48, 6 files
- Labels: none
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

macOS updates can leave more than one Ollama app process running. 

- The newest visible app instance wins. An older launch exits when it sees a newer one.
- The barrier fails open unless the app definitively loses that election. Discovery, inspection, signaling, and timeout failures warn and allow startup. This favors app availability, even if a stale instance remains.
- Handoff uses SIGUSR1 first because it preserves the Claude configuration. SIGTERM remains the compatibility fallback for older releases. SIGKILL is the final fallback for a process that does not exit.
- Once an instance receives SIGUSR1, handoff intent stays set. A later SIGTERM cannot trigger normal Claude restoration.
- Processes are tracked by PID and start time. Identity is checked again before signaling to avoid killing a process that reused the PID.
- The barrier requires two consecutive empty snapshots before startup continues. This accounts for delayed process visibility.
- We are not adding a lease. Two launches can still race if neither is visible to the other. We accept and document that narrow edge case.
- This does not change Squirrel or the updater. It only controls when the replacement app can continue through the existing update path.

## PR #18077: app: list account cloud models for Claude

- URL: https://github.com/ollama/ollama/pull/18077
- Author: hoyyeva
- Merged: 2026-08-27T20:22:12Z (created: 2026-08-27T20:03:41Z)
- Stats: +87 -16, 2 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## Summary

- include signed-in account cloud models in the Claude Desktop picker even when they are not recommendations
- continue using recommendation mappings for new and reset defaults, while preserving saved mappings
- retry model validation while the local Ollama server comes back after a Settings reset

## Why

The recommendation endpoint should determine Claude's defaults, not limit the selectable catalog. This keeps models such as `deepseek-v4-flash:cloud` selectable for users who have access while allowing `glm-5.3-flash:cloud` to remain the Sonnet 5 default supplied by the recommendation mapping.

Resetting all settings can also restart the local Ollama server. Claude mapping validation previously ran before that server was ready, leaving every model marked unavailable and causing the reset to fail.

## Test plan

- `go test ./app/cmd/app -count=1`
- `go test ./internal/proxy -count=1`



## PR #17381: Clean up dead code

- URL: https://github.com/ollama/ollama/pull/17381
- Author: dhiltgen
- Merged: 2026-08-27T21:33:52Z (created: 2026-07-24T22:30:26Z)
- Stats: +5 -333, 4 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

Largely from the llama-server work.

## PR #18081: lint fix

- URL: https://github.com/ollama/ollama/pull/18081
- Author: dhiltgen
- Merged: 2026-08-28T00:01:55Z (created: 2026-08-27T23:53:46Z)
- Stats: +0 -1, 1 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

(empty)
