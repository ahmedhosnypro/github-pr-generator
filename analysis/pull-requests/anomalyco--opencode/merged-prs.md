# Merged PRs: anomalyco/opencode

## PR #46279: fix(ai): use unique Gemini block ids

- URL: https://github.com/anomalyco/opencode/pull/46279
- Author: rekram1-node
- Merged: 2026-08-30T18:21:36Z (created: 2026-08-30T17:20:34Z)
- Stats: +158 -24, 2 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary

Gemini reused common-event IDs after a text or reasoning block completed. Different consumers assign different semantics to reused IDs: direct response assembly retains the previous block mapping, while live Session publication creates a new persisted block.

Gemini also left visible text active when reasoning resumed, causing visible output on either side of reasoning to assemble into one text block rather than preserve the provider sequence.

This change gives every newly started Gemini text and reasoning block a unique stream-local ID, closes the opposite active block when output switches between text and reasoning, routes deltas and endings through the active ID, and closes tracked active IDs during stream finalization. Direct response assembly and live Session publication now agree while preserving the streamed content order.

A focused fixture covers alternating reasoning and visible text. It verifies distinct IDs, matching delta/end IDs, four separately assembled content parts in wire order, and preserved thought-signature metadata.

## Testing

- `bun test test/provider/gemini.test.ts`
- `bun typecheck`

## PR #46278: feat(ai): add native Mistral provider

- URL: https://github.com/anomalyco/opencode/pull/46278
- Author: rekram1-node
- Merged: 2026-08-30T17:56:02Z (created: 2026-08-30T17:02:09Z)
- Stats: +2063 -28, 18 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: Fixes #43199

### Description

## Summary
- add a native Mistral Chat protocol and provider route
- preserve structured thinking, media, provider usage, cache keys, and Mistral tool-call IDs across replay
- accumulate fragmented tool calls by index, including continuations with omitted identity
- normalize hosted-model `stop` finishes to `tool-calls` when tool calls completed
- route `@ai-sdk/mistral` catalog models through the native provider
- retain the legacy package integration for compatibility

## Model behavior
- use one Mistral wire parser for all Chat models, including Mistral-hosted GLM
- expose `reasoning_effort` for current adjustable-reasoning models
- retain explicit `prompt_mode: reasoning` support for native-reasoning models
- keep vision selection in catalog capabilities rather than model-name protocol branches

## Testing
- `bun test test/provider/mistral-chat.test.ts test/provider-package.test.ts test/provider/native-providers.test.ts test/exports.test.ts`
- `RECORDED_PROVIDER=mistral bun test test/provider/mistral.recorded.test.ts` (4 pass)
- recorded native Mistral text/usage, reasoning replay, and tool-loop cassettes
- recorded a separate Mistral-hosted GLM indexed tool-call cassette
- `bun typecheck` in `packages/ai`
- `bun run build` in `packages/ai`
- `bun run test test/aisdk-native.test.ts test/provider.test.ts test/model-resolver.test.ts test/generate.test.ts` (63 pass)
- `bun typecheck` in `packages/core`
- `bun run build` in `packages/core`
- `git diff origin/v2...HEAD --check`

Fixes #43199

## PR #46281: fix(ai): reject truncated bedrock frames

- URL: https://github.com/anomalyco/opencode/pull/46281
- Author: rekram1-node
- Merged: 2026-08-30T17:47:34Z (created: 2026-08-30T17:30:33Z)
- Stats: +77 -5, 2 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary
- validate buffered AWS event-stream bytes when the Bedrock Converse transport reaches EOF
- fail incomplete trailing frames as incomplete-stream provider output errors while retaining the buffered bytes
- preserve decoding for frames fragmented across transport chunks and EOF at complete frame boundaries

## Testing
- `bun test test/provider/bedrock-converse.test.ts`
- `bun typecheck`
- `bunx prettier --check packages/ai/src/protocols/bedrock-event-stream.ts packages/ai/test/provider/bedrock-converse.test.ts`
- `git diff --check`

## PR #46077: refactor(core): bind standalone skill activation to Session

- URL: https://github.com/anomalyco/opencode/pull/46077
- Author: kitlangton
- Merged: 2026-08-30T14:22:04Z (created: 2026-08-29T03:44:49Z)
- Stats: +220 -40, 4 files
- Labels: contributor
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Why

Standalone skill activation still lives in the public Session service after
prompts and controls moved into ID-bound handles. It therefore cannot
be used through a retained Session handle with the same captured host services
and current-placement lookup as prompts and controls.

## What Changes

Move the existing activation operation into the lower Session factory and make
the public service delegate to it. A retained handle resolves the Session's
current Location each time it runs, including after movement.

The standalone contract remains distinct from prompt-attached skills:

| Activation | Preserved behavior |
| --- | --- |
| Missing Session | Fail before acquiring Location services |
| Missing skill | `SkillNotFoundError`, without recording or scheduling |
| Successful activation | Record `SessionEvent.Skill.Activated` immediately with raw registered skill content |
| Supplied message ID | Preserve the existing message-to-event ID mapping |
| Default / `resume: true` | Start the existing detached resume in the host Scope after recording |
| `resume: false` | Record only |

Standalone activation still does not become prompt admission. The change does
not add prompt preparation, inbox delivery, or a different scheduling policy.

## Scope

This is the standalone skill ownership follow-up to #46019. It is independent of
the projected-read cleanup in #46075 and intentionally does not change skill readiness or
model-facing formatting.

## Verification

Initial validation at `135fe3bd97`:

```sh
# packages/core
bun typecheck
bun run test test/session-owned.test.ts test/session-skill.test.ts test/session-prompt.test.ts test/session-prompt-hooks.test.ts test/session-run-coordinator.test.ts test/bus-session-routing.test.ts
bun run test

# packages/sdk
bun typecheck
OPENCODE_DISABLE_MODELS_FETCH=true bun run ../core/script/test.ts

# packages/server
bun typecheck
bun run ../core/script/test.ts
```

Focused Core: **110 passed, 0 failed**, 455 assertions across six files, including
detached handles, movement, ambient event context, validation order, and host-owned
resume lifetime. SDK: **26 passed, 0 failed**. Server: **45 passed, 3 skipped,
0 failed**. All three package typechecks and all **33 pre-push typecheck tasks**
passed at `135fe3bd97`.

Full Core: **3,977 passed, 40 skipped, 0 failed**, 79,563 assertions across 225
files (191.25 seconds).

Three simplify passes reviewed the complete diff for reuse, quality, and
efficiency. No changes were warranted; the implementation retains the established
native binding and structural pass-through patterns. Formatting, both Effect AST
scans, and diff checks passed. Oxlint reported zero errors and four pre-existing
warnings, including one on the relocated implementation.

After integrating `v2` at `171947787c`, including the confirmed test-race fix in
#46083, the focused Core suite again passed **110/110** and all **33 pre-push
typecheck tasks** passed at `8c55494b11`. The refactor diff is byte-identical to
the reviewed version; only its base changed.

A final reuse, quality, and efficiency review led to a test-only simplification
in `009477ebcd`: an uncompleted `Deferred` became `Effect.never`, preserving
all ordering and host-shutdown assertions. No production changes were needed.
After that edit, the focused suite passed **110/110** again (455 assertions),
Core `bun typecheck` passed, and Prettier and `git diff --check` passed.
All **33 pre-push typecheck tasks** also passed for the final commit.


## PR #46221: fix: remove Hy3 Free docs and correct Go chart rendering

- URL: https://github.com/anomalyco/opencode/pull/46221
- Author: MrMushrooooom
- Merged: 2026-08-30T04:09:57Z (created: 2026-08-30T04:06:45Z)
- Stats: +8 -109, 19 files
- Labels: contributor
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

- Remove Hy3 Free from Zen documentation across all locales.
- Fix Go chart color flashing and clipped bonus labels.
