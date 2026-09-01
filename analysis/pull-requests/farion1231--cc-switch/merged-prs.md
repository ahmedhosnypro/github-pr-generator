# Merged PRs: farion1231/cc-switch

## PR #6810: fix(prompts): keep unmanaged prompt files intact when a restore enables none

- URL: https://github.com/farion1231/cc-switch/pull/6810
- Author: SailingLoong
- Merged: 2026-08-26T03:55:04Z (created: 2026-08-25T13:22:17Z)
- Stats: +16 -9, 1 files
- Labels: backend
- Reviews: 1 | Comments: 2
- Linked issues: #6778

### Description

Hi 👋 Another one from the open-issue pile — this time the WebDAV AGENTS.md wipe reported in #6778.

Fixes #6778

## Problem

WebDAV/S3 "download" restores `db.sql` and then runs `run_post_import_sync` → `PromptService::sync_all_to_live`, which projects the imported prompt rows back to the live prompt files. When the restored database has **no enabled prompt** for an app, `project_prompt_set_to_path` took the `else` branch and overwrote the local file (e.g. `~/.config/opencode/AGENTS.md`) with an empty string. Those files are never part of the upload payload, so a machine whose cloud DB happens to have no enabled prompt gets its local AGENTS.md wiped by a plain download — exactly the data destruction #6778 describes.

## Fix

Drop the clear-on-nothing-enabled branch from `project_prompt_set_to_path` and leave the target file untouched instead.

- This is safe because that branch was only ever reachable from restore paths: `project_prompt_set_to_path` ← `sync_to_live` ← `sync_all_to_live` ← `run_post_import_sync`, and `sync_to_live` has no other production caller. On a restore, "no enabled prompt in the snapshot" says nothing about the local file, so the conservative choice is to leave it alone.
- The interactive behavior is unchanged: disabling the last prompt from the UI still clears the file via `PromptService::upsert_prompt`.
- The pre-existing test pinned the wiping behavior (`restored_prompt_projection_clears_a_stale_file_when_none_are_enabled`); it is renamed and now asserts the local content survives.

## Tests

- `restored_prompt_projection_preserves_the_live_file_when_none_are_enabled` (replaces the old clearing test): seeded local file stays intact when the restored set has no enabled prompt. Revert-verified: it fails on `main`.
- Full `cargo test` green (14 test binaries, 0 failed), `cargo fmt --check` and `cargo clippy --all-targets -- -D warnings` clean. No frontend files touched; `pnpm typecheck` / `pnpm format:check` pass on the identical frontend tree.

## Checklist / 检查清单

- [x] `pnpm typecheck` passes / 通过 TypeScript 类型检查
- [x] `pnpm format:check` passes / 通过代码格式检查
- [x] `cargo clippy` passes (if Rust code changed) / 通过 Clippy 检查（如修改了 Rust 代码）
- [x] Updated i18n files if user-facing text changed / 如修改了用户可见文本，已更新国际化文件

Happy to adjust — e.g. if you'd rather surface a note that an unmanaged local file was left untouched, I can add that on top.


## PR #6472: fix(ci): run WSL2 contract tests via prebuilt binaries

- URL: https://github.com/farion1231/cc-switch/pull/6472
- Author: ISuuuu
- Merged: 2026-08-26T14:55:12Z (created: 2026-08-15T06:05:44Z)
- Stats: +28 -3, 1 files
- Labels: actions
- Reviews: 0 | Comments: 4
- Linked issues: none

### Description

## Summary

Fixes the intermittent `Backend Checks (Windows + WSL2 home)` failure caused by MSVC `mt.exe` errors `c1010070` / `LNK1327`.

The workflow now:

- compiles the library test binary while `TEMP` and `TMP` point to the Windows runner's native temporary directory;
- reads the executable path from Cargo's JSON artifact output and waits for Cargo to finish;
- propagates Cargo compilation failures;
- runs the prebuilt test binary directly after switching `TEMP` and `TMP` to the WSL2 UNC directory.

This prevents Cargo from relinking under `\\wsl.localhost`, where `link.exe` / `mt.exe` cannot create manifest temporary files.

## Scope

This PR changes only `.github/workflows/ci.yml`. The scheduled full-suite WSL2 workflow is unchanged and can be handled independently.

## Related

Related to #6428.

## Checklist

- [x] Latest head passed the full CI workflow, including the Windows 2025 + WSL2 contract job
- [x] Workflow YAML parses successfully
- [x] Final diff received two independent reviews with no P0, P1, or P2 findings


## PR #6779: fix(provider): always project edits to live configuration

- URL: https://github.com/farion1231/cc-switch/pull/6779
- Author: YUZHEthefool
- Merged: 2026-08-26T15:51:34Z (created: 2026-08-24T15:41:08Z)
- Stats: +442 -130, 4 files
- Labels: backend, proxy
- Reviews: 0 | Comments: 3
- Linked issues: none

### Description

## Summary

Split the backend portion of closed PR #6187 into a separate PR. This fixes provider updates that reported success while leaving the live configuration file unchanged, including the universal-provider path.

## Changes

- Centralize provider-to-live synchronization and proxy-takeover ownership decisions for saves and explicit resyncs.
- Treat stale backup rows as recoverable: refresh the backup and write the live file when there is no corroborating takeover evidence.
- Do not let a persisted `proxy_config.enabled` flag alone suppress a live write after an interrupted teardown; use live placeholders, active per-app switch locks, and running-proxy evidence.
- Refresh Claude, Codex, and Grok Build proxy-safe projections during active takeover, including the Grok Build path.
- Re-project a generated universal-provider child when it is the effective current provider, continue syncing other apps if one projection fails, and report failed app names instead of returning a false success.
- Add regression tests for normal edits, stale backups, interrupted teardown flags, and universal-provider live projection.

## Review follow-up

This is the backend half of closed PR #6187 by BingZi-233. The Codex P1 review was addressed by requiring corroborating takeover evidence instead of trusting `proxy_config.enabled` unconditionally. The original author is retained as a co-author in the commit (`Co-authored-by: BingZi-233 <lhby233@outlook.com>`).

## Verification

- `cargo fmt --all -- --check`
- `cargo check --all-targets`
- Targeted provider regression tests pass.
- `cargo test --lib` passes except two pre-existing Windows symlink tests that require the SeCreateSymbolicLink privilege.


## PR #6831: fix(codex-oauth): align identity tests with JWT parsing

- URL: https://github.com/farion1231/cc-switch/pull/6831
- Author: SaladDay
- Merged: 2026-08-27T07:31:00Z (created: 2026-08-26T07:51:07Z)
- Stats: +129 -118, 5 files
- Labels: backend, proxy
- Reviews: 0 | Comments: 3
- Linked issues: none

### Description

## Summary

- remove the test-only fallback from Codex id-token identity extraction
- require a valid compact JWT shape and algorithm header before trusting the subject claim
- use structurally valid JWT fixtures throughout managed-account identity flows

## Scope

This is the identity-fixture follow-up suggested after #6780. It does not add signature, issuer, or audience verification; change OAuth routing or account state; or implement the separate (sub, workspace) account-deduplication follow-up.

## Testing

- cargo test --lib
- cargo clippy --lib --tests -- -D warnings
- cargo fmt --all -- --check
- two independent blind review passes

## PR #6941: fix(proxy): preserve mid-conversation system messages for prefix cache

- URL: https://github.com/farion1231/cc-switch/pull/6941
- Author: htyvista
- Merged: 2026-08-29T14:55:03Z (created: 2026-08-28T09:15:15Z)
- Stats: +40 -53, 1 files
- Labels: backend, proxy
- Reviews: 3 | Comments: 4
- Linked issues: #6789

### Description

## Summary / 概述

Remove `normalize_openai_system_messages` which merged ALL system messages to the head of the messages array. When Claude Code injects `<total_tokens>` metadata as a mid-conversation system message, this caused the merged system prompt to change every turn, breaking radix prefix cache on sglang/GLM-5.2.

移除 `normalize_openai_system_messages` 函数。该函数会将所有 system 消息合并到消息数组头部。当 Claude Code 在对话中间注入 `<total_tokens>` 元数据时，合并后的 system prompt 每轮都会变化，导致 sglang/GLM-5.2 上的前缀缓存无法命中。

The conversion flow now:
1. Top-level `system` field → placed as the first system message
2. All messages from the `messages` array (including mid-conversation system) → extended in their original order, no merging or reordering

转换流程现在：
1. 顶层 `system` 字段 → 作为第一条 system 消息放在最前面
2. `messages` 数组中的所有消息（包括对话中间的 system）→ 按原始顺序 extend，不合并、不重排

This preserves prefix stability across turns while keeping all system content intact.

这样保证了跨轮次的前缀稳定性，同时保留了所有 system 内容。

## Background / 背景

This fix targets the OpenAI-compatible `/v1/chat/completions` endpoint (not the Anthropic messages endpoint). The OpenAI API does not restrict system messages to the head of the array — messages are processed in order regardless of role. sglang's OpenAI-compatible endpoint behaves the same way, processing mid-conversation system messages in place without merging.

本修复针对的是 OpenAI 兼容的 `/v1/chat/completions` 接口（非 Anthropic messages 接口）。OpenAI API 不限制 system 消息只能出现在数组开头——messages 按顺序处理，与 role 无关。sglang 的 OpenAI 兼容接口行为一致，对话中间的 system 消息按原位处理，不合并。

For reference, new-api also preserves system message positions when converting to the chat endpoint, without merging.

作为参考，new-api 在转换到 chat 接口时也保持 system 消息原位，不合并。

## Related Issue / 关联 Issue

Fixes #6789

## Screenshots / 截图

<img width="3442" height="872" alt="image" src="https://github.com/user-attachments/assets/527993b0-a883-4002-9ec8-588d51f93ca0" />

## Validation / 验证

- `cargo build --release --features custom-protocol` passed.
- Manually tested: CC Switch proxy with Claude Code → sglang/GLM-5.2 via `/v1/chat/completions`, prefix cache hit rate significantly improved.

## Checklist / 检查清单

- [ ] `pnpm typecheck` was not run; this is a Rust-only change /
      未运行；本次仅修改 Rust 后端代码
- [ ] `pnpm format:check` was not run; this is a Rust-only change /
      未运行；本次仅修改 Rust 后端代码
- [x] `cargo test` passes /
      `cargo test` 已通过
- [x] `cargo clippy` passes /
      `cargo clippy` 已通过
- [x] No user-facing text changed; i18n update is not applicable /
      未修改用户可见文本，不需要更新国际化文件

