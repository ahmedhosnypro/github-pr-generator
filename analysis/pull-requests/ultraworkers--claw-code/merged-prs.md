# Merged PRs: ultraworkers/claw-code

## PR #3237: fix: validate attached redirection paths

- URL: https://github.com/ultraworkers/claw-code/pull/3237
- Author: hiSandog
- Merged: 2026-06-08T05:43:53Z (created: 2026-06-08T02:20:16Z)
- Stats: +31 -0, 2 files
- Labels: none
- Reviews: 0 | Comments: 3
- Linked issues: none

### Description

## Summary
- strip attached shell redirection operators before extracting path candidates
- validate redirection targets like <../file and 2>../file against workspace scope
- add regression coverage for attached redirection targets

## Validation
- python3 -m unittest tests.test_security_scope -q
- python3 -m compileall -q src/path_scope.py tests/test_security_scope.py
- git diff --check -- src/path_scope.py tests/test_security_scope.py

## PR #3263: Improve command lookup normalization

- URL: https://github.com/ultraworkers/claw-code/pull/3263
- Author: hiSandog
- Merged: 2026-06-26T16:16:51Z (created: 2026-06-25T07:44:12Z)
- Stats: +17 -2, 2 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Summary
- Trim and normalize command lookup input before alias resolution.
- Prioritize exact command-name matches before broader substring matches.
- Add coverage for whitespace/case-normalized command lookup and execution.

## Validation
- env PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tests.test_porting_workspace.PortingWorkspaceTests.test_commands_and_tools_cli_run tests.test_porting_workspace.PortingWorkspaceTests.test_command_lookup_normalizes_user_input_whitespace
- git diff --check

## PR #3180: fix: make cc2 renderer path errors concise

- URL: https://github.com/ultraworkers/claw-code/pull/3180
- Author: Yeachan-Heo
- Merged: 2026-05-28T02:08:27Z (created: 2026-05-28T02:01:52Z)
- Stats: +24 -5, 1 files
- Labels: none
- Reviews: 1 | Comments: 3
- Linked issues: none

### Description

## Summary
- replace CC2 renderer tracebacks for directory board JSON, invalid board JSON, and directory markdown paths with concise `ERROR:` messages
- preserves successful render/check behavior

## Validation
- `python3 .omx/cc2/render_board_md.py /tmp/cc2-render-0200/board-json-dir /tmp/cc2-render-0200/out.md`
- `python3 .omx/cc2/render_board_md.py /tmp/cc2-render-0200/bad.json /tmp/cc2-render-0200/out.md`
- `python3 .omx/cc2/render_board_md.py .omx/cc2/board.json /tmp/cc2-render-0200/out-md-dir`
- `python3 .omx/cc2/render_board_md.py .omx/cc2/board.json /tmp/cc2-render-0200/out-md-dir --check`
- `python3 .omx/cc2/render_board_md.py .omx/cc2/board.json /tmp/cc2-render-0200/out.md`
- `python3 .omx/cc2/render_board_md.py .omx/cc2/board.json /tmp/cc2-render-0200/out.md --check`
- `python3 scripts/cc2_board.py validate`

—
*[repo owner's gaebal-gajae (clawdbot) 🦞]*

## PR #3253: docs: document mlx-lm backend for Apple Silicon and known gotchas

- URL: https://github.com/ultraworkers/claw-code/pull/3253
- Author: EmreCelenli
- Merged: 2026-06-26T16:17:10Z (created: 2026-06-18T16:52:24Z)
- Stats: +23 -0, 1 files
- Labels: none
- Reviews: 0 | Comments: 7
- Linked issues: none

### Description

## Summary
Adds an mlx-lm section to `docs/local-openai-compatible-providers.md`, plus two troubleshooting rows for
real issues hit during setup: bare model names 404 against Hugging Face (needs full HF repo ID), and a
known unfixed mlx-lm bug (ml-explore/mlx-lm#973) where `<|im_end|>` leaks into output.

## Anti-slop triage
- Classification: docs-only
- Evidence: verified end-to-end on a 16GB M1 Mac running `mlx_lm.server` + `claw`.
- Non-destructive review result: merge candidate

## Verification
- [x] All commands in the new section run end-to-end as written.
- [x] `git diff --check` passes.
- [x] No secrets, tokens, or unrelated churn included.

## Resolution gate
- [x] Doesn't resolve a tracked issue, documents a gap found via direct testing.
- [x] Intended to merge.
- [x] No automation-lane merges/closes without owner approval.

## PR #3280: fix(sandbox): fall back to --map-auto when root-user mapping is restricted

- URL: https://github.com/ultraworkers/claw-code/pull/3280
- Author: Einspanner123
- Merged: 2026-08-06T11:18:35Z (created: 2026-07-31T09:06:48Z)
- Stats: +131 -16, 1 files
- Labels: none
- Reviews: 2 | Comments: 10
- Linked issues: none

### Description

Replaces the closed #3013 (stale, conflicts with main) with a fresh rebase onto `ultraworkers:main`.

## Problem

`unshare --user --map-root-user` fails on kernels and containers that block unprivileged writes to `/proc/self/uid_map` (e.g. GitHub Actions, restricted AppArmor profiles, some container runtimes) with EPERM. As a result the sandbox silently disables itself even though a working mapping exists.

## Fix

util-linux delegates to the setuid `newuidmap`/`newgidmap` helpers when `--map-auto` is also present. Probe both candidate mappings at startup and prefer the plain form:

1. `--user --map-root-user` (works on most systems, no extra deps)
2. `--user --map-root-user --map-auto` (fallback for restricted kernels/containers)

The chosen mapping is cached and reused by both the capability probe and the launcher, so the sandbox now enables on systems where only the fallback works. The plain form stays first, so systems without `newuidmap`/`newgidmap` or a `/etc/subuid` range are unaffected.

**Note**: the `--map-auto` fallback depends on the setuid `newuidmap`/`newgidmap` helpers (the `uidmap` package on Debian/Ubuntu) and on the current user having a subuid/subgid range. The startup probe covers this dependency: when the helpers or range are missing, `unshare --map-auto` fails and the plain form is used (verified: `unshare --user --map-root-user --map-auto true` exits 127 with `failed to execute newuidmap` without the helper).

## Verification

- On a restricted host: `unshare --user --map-root-user true` fails, combined form succeeds
- `cargo test -p runtime sandbox` passes (incl. new test guarding candidate order)
- `cargo clippy` clean for the changed file
