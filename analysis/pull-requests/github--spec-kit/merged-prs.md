# Merged PRs: github/spec-kit

## PR #4340: fix(events): stop falling back to a fake "pwsh" argv when no launcher exists

- URL: https://github.com/github/spec-kit/pull/4340
- Author: Noor-ul-ain001
- Merged: 2026-08-28T16:22:54Z (created: 2026-08-26T12:42:05Z)
- Stats: +41 -1, 2 files
- Labels: none
- Reviews: 2 | Comments: 0
- Linked issues: none

### Description

## Summary
- `_resolve_event_command_argv`'s `ps` branch did:
  ```python
  launcher = shutil.which("pwsh") or shutil.which("powershell") or "pwsh"
  ```
  When neither `pwsh` nor `powershell` is on PATH, this silently returns `["pwsh", "-File", <script>, ...]` instead of degrading to "no runnable script" (`None`) like every other failure branch in this same function (unparseable frontmatter, non-mapping scripts, unresolvable script path, etc.).
- `subprocess.run()` then raises `FileNotFoundError` trying to exec a binary that was just proven absent, which `resolve_and_run_event_command`'s generic exception handler reports as a confusing `Event command X error: [Errno 2] No such file or directory: 'pwsh'` (exit code 2) instead of the clean `No script found for event command` warning (exit code 0) every other missing-script case gets.
- This function is explicitly documented as mirroring the generated dispatcher's own stdlib-only `_resolve_argv` (same file), which already gets this right: `if not launcher: return None`. The two had drifted apart.
- Fix: mirror that behavior — return `None` when neither launcher is found, instead of fabricating an argv naming a binary that doesn't exist.

## Test plan
- [x] Added `test_ps_variant_returns_none_when_no_launcher_available` to `tests/integrations/test_events.py::TestCommandRunner`: with `shutil.which` mocked to return `None` for every name, the resolver must return `None` rather than an argv naming a nonexistent `pwsh`.
- [x] Verified the test fails without the fix (test-the-test): it asserted `argv is None` but got `['pwsh', '-File', '.../boot.ps1']` — reproducing the exact bug.
- [x] Ran the full `tests/integrations/test_events.py` suite: 118 passed, 4 pre-existing Windows symlink-elevation failures (need admin rights, unrelated to this change), 1 skipped.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>

https://claude.ai/code/session_01PJHJ2dHP2RVCNncHqN8Qm9

## PR #4359: fix: decode feature.json as UTF-8 in Windows PowerShell

- URL: https://github.com/github/spec-kit/pull/4359
- Author: hamedrabah
- Merged: 2026-08-28T18:37:36Z (created: 2026-08-28T00:45:02Z)
- Stats: +37 -3, 2 files
- Labels: none
- Reviews: 4 | Comments: 0
- Linked issues: Fixes #4333

### Description

## Description

Fixes #4333.

Windows PowerShell 5.1 decodes `Get-Content -Raw` with the active ANSI code page, so a BOM-less UTF-8 `feature.json` can corrupt non-ASCII feature paths before JSON parsing. Read both existing `feature.json` paths with `System.IO.File.ReadAllText(..., Encoding.UTF8)` instead.

The regression writes a BOM-less UTF-8 feature directory containing Chinese characters, invokes `Get-FeaturePathsEnv` under Windows PowerShell 5.1, and verifies the exact resolved path.

## Testing

- [ ] Tested locally with `uv run specify --help`
- [ ] Ran existing tests with `uv sync && uv run pytest`
- [ ] Tested with a sample project (if applicable)

Additional checks:

- `python3 -m py_compile tests/test_check_prerequisites_paths_only.py`
- `git diff --check`
- The Windows-only regression is skipped on macOS. `uv sync` could not complete because the configured package registry was unreachable, so CI still needs to execute the test on Windows PowerShell 5.1.

## AI Disclosure

- [ ] I **did not** use AI assistance for this contribution
- [x] I **did** use AI assistance (describe below)

Codex (GPT-5, autonomous) assisted with issue investigation, implementation, test design, and review. The resulting diff and repository requirements were manually reviewed before submission.


## PR #4362: fix(auth): reject malformed URL ports before credential matching

- URL: https://github.com/github/spec-kit/pull/4362
- Author: WOLIKIMCHENG
- Merged: 2026-08-28T18:59:31Z (created: 2026-08-28T09:34:08Z)
- Stats: +8 -4, 2 files
- Labels: none
- Reviews: 2 | Comments: 0
- Linked issues: none

### Description

## Description

Prevent malformed explicit ports from matching `auth.json` entries before URL validation. Valid explicit ports continue matching by hostname.

## Testing

- `.venv/bin/python -m pytest tests/test_authentication.py -q`
- `uvx ruff@0.15.0 check src tests`
- `git diff --check`

## PR #4318: fix(bundler): reject non-string catalog entry tag members

- URL: https://github.com/github/spec-kit/pull/4318
- Author: Noor-ul-ain001
- Merged: 2026-08-28T21:34:15Z (created: 2026-08-25T14:45:00Z)
- Stats: +17 -3, 2 files
- Labels: none
- Reviews: 2 | Comments: 0
- Linked issues: none

### Description

## Summary
- `_parse_tags` in `src/specify_cli/bundler/models/catalog.py` validates that a catalog entry's `tags` field is a list/tuple, but then silently coerces each member with `str(t) for t in value` — so `tags: [1, true, {}]` becomes `("1", "True", "{}")` instead of being rejected.
- This is the same bug class just fixed in #4091 for the manifest's `_parse_str_list` (`src/specify_cli/bundler/models/manifest.py`), which rejects non-string list members with `'{field}' must be a list of strings`. The catalog's `_parse_tags` sibling wasn't updated in that PR, even though catalogs are explicitly untrusted input (per its own docstring).
- Fix: reject any non-string member the same way the manifest fix does, instead of silently coercing it.

## Test plan
- [x] Added `test_catalog_entry_rejects_non_string_tag_members` to `tests/contract/test_catalog_schema.py`, mirroring the existing `test_catalog_entry_rejects_string_tags`.
- [x] Verified the new test fails without the fix (`DID NOT RAISE BundlerError`) and passes with it.
- [x] Ran `tests/contract/test_catalog_schema.py` — 21 passed; the remaining 22 errors are pre-existing Windows `tmp_path`/`PermissionError: WinError 5` environment failures unrelated to this change (reproduced on an unmodified checkout).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FW9fAYsCBCAgdKWovtSyqt

## PR #4369: [extension] Add AgentDocx SpecKit V2 extension to community catalog

- URL: https://github.com/github/spec-kit/pull/4369
- Author: github-actions
- Merged: 2026-08-28T21:42:14Z (created: 2026-08-28T21:19:22Z)
- Stats: +53 -1, 2 files
- Labels: extension-submission, automated
- Reviews: 3 | Comments: 0
- Linked issues: Closes #4342

### Description

Add `agentdocx-speckitv2` community extension submitted by `@ahmed200346`.

## Changes

- `extensions/catalog.community.json` — new entry inserted in alphabetical order after `agentdocx-speckit`
- `docs/community/extensions.md` — new row inserted in alphabetical order after "AgentDocx"

## Validation Results

| Check | Result |
|-------|--------|
| Extension ID format (`^[a-z][a-z0-9-]*$`) | ✅ Pass |
| Version semver (`0.0.7`) | ✅ Pass |
| Repository exists and is public | ✅ Pass |
| `extension.yml` present | ✅ Pass |
| `README.md` present | ✅ Pass |
| `LICENSE.md` present | ✅ Pass |
| GitHub release `v0.0.7` exists | ✅ Pass |
| Download URL pattern valid | ✅ Pass |
| Testing checklist all checked | ✅ Pass |
| Submission requirements all checked | ✅ Pass |

Closes #4342
cc `@ahmed200346`

---
*Posted on behalf of `@ahmed200346` by GitHub Copilot (model: claude-sonnet-4.6, autonomous)*




> Generated by [🧩 Add Community Extension from Issue Submission](https://github.com/github/spec-kit/actions/runs/33211664160) for issue #4342 · 264.7 AIC · ⌖ 16.5 AIC · ⊞ 35.3K · [◷](https://github.com/search?q=repo%3Agithub%2Fspec-kit+%22gh-aw-workflow-id%3A+add-community-extension%22&type=pullrequests)

<!-- gh-aw-agentic-workflow: Add Community Extension from Issue Submission, engine: copilot, version: 1.0.60, model: claude-sonnet-4.6, id: 33211664160, workflow_id: add-community-extension, run: https://github.com/github/spec-kit/actions/runs/33211664160 -->

<!-- gh-aw-workflow-id: add-community-extension -->
<!-- gh-aw-workflow-call-id: github/spec-kit/add-community-extension -->
