# Merged PRs: DietrichGebert/ponytail

## PR #601: fix: drop commandWindows from hooks.json for Claude.ai marketplace validation (#593)

- URL: https://github.com/DietrichGebert/ponytail/pull/601
- Author: prayag0one4
- Merged: 2026-08-07T21:34:41Z (created: 2026-07-16T01:14:55Z)
- Stats: +19 -22, 2 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: Closes #593

### Description

## Problem

The Claude.ai plugin marketplace validator rejects `claude-codex-hooks.json` because `commandWindows` is not a recognized field in the supported hooks schema. Installation from the marketplace fails with:

```
MARKETPLACE_ERROR:REMOTE_SYNC_FAILED — status: failed_content
Unknown hook field(s) [commandWindows]
```

## Root Cause

The `commandWindows` field is redundant. The shared `command` field already runs cross-platform:
- Claude Code expands `${CLAUDE_PLUGIN_ROOT}` before the shell sees it
- VS Code Copilot ignores `commandWindows` and runs `command` through PowerShell on Windows
- `node` is natively available in both bash and PowerShell

## Fix

Remove all three `commandWindows` fields from `claude-codex-hooks.json`. Update the regression test to assert `commandWindows` is absent (marketplace validation guard) and remove the now-unused `CMD_VAR_SYNTAX` guard.

## Verification

All 6 hooks-windows tests pass, including the new marketplace validation check. The `command` field remains cross-platform — `node` runs natively on both bash and PowerShell, and `exec`-free is already enforced by existing tests.

Closes #593

## PR #579: fix: detect VS Code Copilot via CLAUDE_PLUGIN_ROOT fallback (#528)

- URL: https://github.com/DietrichGebert/ponytail/pull/579
- Author: krishrathi1
- Merged: 2026-08-07T21:37:10Z (created: 2026-07-10T05:52:27Z)
- Stats: +47 -2, 2 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

VS Code Copilot never sets COPILOT_PLUGIN_DATA, only CLAUDE_PLUGIN_ROOT (pointed at an .vscode/agent-plugins/... install path), so isCopilot was false and ponytail assumed native Claude Code — emitting the statusline setup nudge, which VS Code Copilot doesn't read. Also guard stateDir: it was built from the same unset COPILOT_PLUGIN_DATA whenever isCopilot resolved via this new fallback, so fall back to getClaudeDir() there too.

## PR #661: feat: add Grok Build native skills adapter (revive #561)

- URL: https://github.com/DietrichGebert/ponytail/pull/661
- Author: p-clements
- Merged: 2026-08-07T21:44:01Z (created: 2026-08-01T00:22:59Z)
- Stats: +99 -1, 7 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary

Native **Grok Build** skill plugin, rebased from [#561](https://github.com/DietrichGebert/ponytail/pull/561). It keeps that contribution's clean marketplace/plugin packaging and shared Ponytail skill content, while using Grok's supported native skill activation path.

## Important behavior note

The original #561 hook-based approach was a reasonable Claude-compatible design, but it assumes that Grok consumes lifecycle-hook stdout as model context. Current xAI Grok Build documentation defines `SessionStart`, `UserPromptSubmit`, and `SubagentStart` as passive events; only `PreToolUse` and `Stop`/`SubagentStop` have output-control contracts. Passive hook stdout is informational and is not injected into the conversation. See xAI's [Hook events](https://github.com/xai-org/grok-build/blob/main/crates/codegen/xai-grok-pager/docs/user-guide/10-hooks.md#hook-events) and [hook output contract](https://github.com/xai-org/grok-build/blob/main/crates/codegen/xai-grok-pager/docs/user-guide/10-hooks.md#output-blocking-hooks).

So #561's hooks could execute and persist mode state, but they could not deliver the intended Ponytail ruleset to the main session or subagents. This is a platform-contract mismatch, not a problem with the original contribution's packaging approach.

This PR therefore uses Grok's documented native skill mechanism: skill descriptions can trigger automatic invocation for matching coding tasks, while `/ponytail` explicitly loads Ponytail when deterministic activation is wanted. See xAI's [Skills guide](https://github.com/xai-org/grok-build/blob/main/crates/codegen/xai-grok-pager/docs/user-guide/08-skills.md#automatic-invocation).

### Resulting Grok behavior

- Native Ponytail skills and commands are installed and available.
- Grok can auto-invoke `ponytail` for coding tasks from the existing skill description.
- `/ponytail`, `/ponytail lite`, `/ponytail full`, and `/ponytail ultra` make activation explicit.
- This does **not** claim hook-based always-on injection, persistent hook-managed mode state, or subagent context injection.
- No Grok MCP server is added: the skills already provide the required instruction content without a separate runtime.

## Packaging

- Root `plugin.json` is a minimal Grok manifest.
- `.grok-plugin/marketplace.json` keeps the repo marketplace entry.
- No lifecycle hooks are registered, so the adapter stays thin and avoids dead host-specific runtime paths.
- English, Spanish, Korean, and portability docs describe the supported behavior.

## Validation

- `node --test tests/grok-plugin.test.js tests/hooks-windows.test.js tests/hooks.test.js tests/gemini-extension.test.js`
- `node scripts/check-rule-copies.js`
- `node scripts/check-versions.js`
- `grok plugin validate .`
- Isolated `GROK_HOME` install: 6 skills, 0 hooks.


## PR #483: Emit statusline setup nudge at most once per user

- URL: https://github.com/DietrichGebert/ponytail/pull/483
- Author: gglucass
- Merged: 2026-07-10T02:44:33Z (created: 2026-07-02T07:38:41Z)
- Stats: +24 -1, 2 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

The SessionStart hook re-emits the STATUSLINE SETUP NEEDED nudge on every session start whenever `settings.json` has no `statusLine` configured. Users who saw the offer and declined it keep seeing it (and keep getting proactively re-offered by the model) forever.

This change writes a flag file (`$CLAUDE_CONFIG_DIR/.ponytail-statusline-nudged`) the first time the nudge is emitted and skips the nudge on subsequent sessions. Users who want the badge later can still set it up manually or delete the flag file.

Context: ponytail is distributed to Headroom Desktop users, so this recurring nudge currently lands in every one of their sessions.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## PR #703: chore: release v4.9.0

- URL: https://github.com/DietrichGebert/ponytail/pull/703
- Author: DietrichGebert
- Merged: 2026-08-07T21:13:25Z (created: 2026-08-07T21:03:06Z)
- Stats: +9 -9, 9 files
- Labels: none
- Reviews: 2 | Comments: 0
- Linked issues: none

### Description

53 commits since v4.8.4. Minor bump: new features plus roughly 30 fixes.

- New host: Qoder support (hooks for prompt tracking and tool use)
- /ponytail default <mode> persists your default, and bare /ponytail now reports the active level instead of resetting it
- Subagent injection can be scoped by agent type (PONYTAIL_SUBAGENT_MATCHER)
- pi extension: hide the status badge or silence the startup toast via config
- Roughly 30 fixes: PowerShell/Windows hooks, Codex output schema, OpenCode Qwen compat, safer uninstall, statusline nudge honoring CLAUDE_CONFIG_DIR
