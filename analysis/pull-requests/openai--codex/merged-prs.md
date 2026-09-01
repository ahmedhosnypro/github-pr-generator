# Merged PRs: openai/codex

Collected 5 most recently updated merged pull requests.

## PR #41660: Preserve Guardian authorization across history compaction

- URL: https://github.com/openai/codex/pull/41660
- Author: copyberry
- Merged: 2026-08-30T11:57:56Z (created: 2026-08-30T11:56:28Z)
- Stats: +281 -22, 14 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Preserve Guardian authorization across history compaction

## Why

Compaction and host-injected context can rewrite the model-visible conversation
without changing what the user authorized. Treating those updates as authorization
changes prevents Guardian from reusing an otherwise valid review.

## What changed

- Track a host-owned user-message revision separately from the conversation history
  generation.
- Advance the revision for genuine user messages and history resets, while preserving
  it across compaction and internal context injection.
- Use message content-kind metadata to distinguish host context from user input,
  conservatively treating unknown or incomplete metadata as user authorization.

## Testing

Added coverage that cached Guardian authorization survives compaction and internal
context, but is invalidated by user input and rollback.

<!-- copyberry-projection-id: a97d234930339c8f039d837b97f8cf1ae62058ed2de6b78bdbbd924aa824e570 -->

## PR #41666: Approve the first Node REPL execution without a Guardian wait

- URL: https://github.com/openai/codex/pull/41666
- Author: copyberry
- Merged: 2026-08-30T13:04:30Z (created: 2026-08-30T13:02:14Z)
- Stats: +174 -13, 3 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Approve the first Node REPL execution without a Guardian wait

## Why

The first REPL execution should proceed while its initial asynchronous Guardian
classification is still pending.

## What changed

- Fast-approve the first `js` execution from a Node REPL-backed server while
  continuing its asynchronous classification.
- Track `js` executions separately so setup and reset tools do not consume the
  first-execution allowance.
- Apply the normal Guardian review policy to subsequent executions.

## Testing

Add coverage for browser and computer-use startup, reset, and module-directory
setup sequences, verifying that only the first `js` execution skips the wait.

<!-- copyberry-projection-id: 713ef8e4b0a1482a8bdbf7373ffb5587ba357d6d55ccfafe5ee9fd49b9f84d1d -->

## PR #41673: Repair cursor-style rendering on older JediTerm terminals

- URL: https://github.com/openai/codex/pull/41673
- Author: copyberry
- Merged: 2026-08-30T13:44:28Z (created: 2026-08-30T13:42:45Z)
- Stats: +234 -26, 6 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Repair cursor-style rendering on older JediTerm terminals

## Why

Older JediTerm versions can print the space intermediate in `DECSCUSR`,
overwriting the glyph beneath a cursor-style command.

## What changed

- Apply cursor-style commands at a repairable, terminal-owned glyph and redraw
  that glyph with its original style and hyperlink before restoring the requested
  cursor position.
- Omit the style command when the viewport has no safe repair anchor.
- Handle skipped cells, wide glyphs, and single-column viewports without
  corrupting content or causing scrolling.

## Testing

Add cursor rendering tests for styled and cursor-only frames, skipped and wide
hyperlinked glyphs, single-column viewports, and viewports without owned cells.

<!-- copyberry-projection-id: 4ce8ca6cf4d096764088153cac245f3c3d5e6f3e75eb2d0298cca64e864cdbba -->

## PR #41683: Set working directories for environment MCP tests

- URL: https://github.com/openai/codex/pull/41683
- Author: copyberry
- Merged: 2026-08-30T14:05:36Z (created: 2026-08-30T14:04:10Z)
- Stats: +47 -14, 9 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Set working directories for environment MCP tests

## Why

Environment-backed stdio MCP servers have no host-local working-directory
fallback, so their test fixtures must provide a workspace explicitly.

## What changed

- Set the fixture workspace as `cwd` for environment-backed MCP servers across
  the core integration tests.
- Reuse the same test environment when configuring MCP servers and building
  fixtures that need an explicit working directory.

<!-- copyberry-projection-id: fec559f251f1cbdbe34f7b8faec63137a45b4481e092e1eefda270e2329182a4 -->

## PR #41700: Support package-style MCP server names

- URL: https://github.com/openai/codex/pull/41700
- Author: copyberry
- Merged: 2026-08-30T16:47:53Z (created: 2026-08-30T16:45:38Z)
- Stats: +159 -13, 12 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Support package-style MCP server names

## What changed

- Allow MCP server names to contain `:`, `@`, `/`, and `.`, enabling names such as `npm:@modelcontextprotocol/server-sequential.thinking`.
- Preserve these names across `mcp add`, `get`, `list`, and `remove`, runtime tool namespaces, and OAuth credential lookup.
- Quote non-bare server names in generated `config.toml` recovery hints and keep similarly escaped OAuth credential names isolated.

## Testing

- Add CLI and runtime round-trip coverage for npm-style names.
- Add snapshot coverage for quoted recovery hints and a regression test for OAuth credential-name collisions.

<!-- copyberry-projection-id: 9759ce4005c420e24d27f36cef4cc318384507043f9571b16f23729e8f0a6e92 -->
