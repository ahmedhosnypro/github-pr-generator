# Merged PRs: NousResearch/hermes-agent

## PR #98546: fix(compaction): native capability survives same-provider /model switches and gateway resume (salvage #94036 + #97292)

- URL: https://github.com/NousResearch/hermes-agent/pull/98546
- Author: teknium1
- Merged: 2026-08-30T12:16:11Z (created: 2026-08-30T11:54:20Z)
- Stats: +601 -35, 25 files
- Labels: type/bug, comp/agent, comp/cli, comp/gateway, tool/delegate, area/config, P2, sweeper:risk-session-state, sweeper:risk-message-delivery, sweeper:risk-compatibility
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Summary
Native-compaction capability no longer silently drops to slow local summarization after a runtime model switch or a gateway restart that restores a persisted `/model` override. Same-provider effective-endpoint switches preserve capability; provider-changing or unresolved-endpoint switches remain default-deny; rollback/fallback restoration preserves prior capability state.

Salvaged as ONE stacked branch: the two PRs share five files and #97292's `ModelSwitchResult.runtime_capabilities` plumbing builds on #94036's `resolve_native_compaction_capabilities` machinery. Both were CONFLICTING against main; resolved onto current main preserving default-deny.

## Changes
- #94036 (4 commits, @steveonjava): capability derived from the effective switch endpoint on same-provider switches; rollback preserves prior state
- #97292 (3 commits, @steveonjava): gateway resume restores the persisted override WITH provider capability declarations and output cap; trusted-proxy capability propagation
- Follow-up (ours): `_inherit_parent_capabilities()` — delegated subagents inherit the endpoint-scoped capability map only on the parent's exact provider+base_url; any delegation override stays default-deny

## Validation
| Scenario | Before (main) | After |
|---|---|---|
| Same-provider /model switch | capability silently dropped | preserved |
| Provider-changing switch | deny | deny (unchanged) |
| Gateway resume w/ persisted override | restored without capabilities | capabilities carried through |
| Untrusted proxy | — | deny |

204 targeted tests pass; ruff clean; credential-free probes confirm each row.

Salvage of #94036 and #97292 — all 7 commits keep @steveonjava's authorship.

## Infographic

![Capability preserved](https://v3b.fal.media/files/b/0aa868df/Qu5-V2qfOR8TUatCMUzp7_jE2pLP6w.png)


## PR #98547: fix(compression): native-compaction settings hot-apply to open sessions (salvage #96740)

- URL: https://github.com/NousResearch/hermes-agent/pull/98547
- Author: teknium1
- Merged: 2026-08-30T12:16:20Z (created: 2026-08-30T11:54:23Z)
- Stats: +92 -1, 4 files
- Labels: type/bug, comp/gateway, comp/tui, area/config, P2, sweeper:risk-message-delivery, sweeper:risk-compatibility
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Summary
Enabling `compression.codex_responses_native` (or changing its threshold) now takes effect in already-open Desktop/TUI sessions and evicts stale messaging-gateway cached agents — previously the cached foreground agent kept minutes-long local summarization until a fresh session.

## Changes
- `tui_gateway/server.py` (+24): `_apply_live_compression_config` hot-applies `codex_responses_native` + `codex_responses_compact_threshold` with bool-guard; removing the key restores defaults
- `gateway/run.py` (+7): agent cache signature gains the PR's 2 native-compaction keys + 5 widened compaction-routing keys (`in_place`, `checkpoint_required`, `micro_compact`, `micro_compact_every_n_turns`, `micro_compact_defrag_threshold_tokens`) — same stale-cache class
- Tests: 4 new hot-reload tests + signature assertions

Cache-safe: routing-only attribute updates — no system-prompt rebuild, no toolset swap, no past-context mutation.

## Validation
Probe: open session with native compaction off → flip config → live session routes native compaction with the new threshold; key removal restores defaults. 51 hot-reload/agent-cache + 52 native-compaction sibling tests pass.

Salvage of #96740 — credit @imsuperseller (commit re-authored from their coding agent's local identity to their GitHub noreply per attribution policy).

## Infographic

![Settings apply live now](https://v3b.fal.media/files/b/0aa868e4/U7fyJi3FgblYzIVIB0DuS_0uiZ6il3.png)


## PR #98558: fix(approval): unattended webhook/API sessions no longer stall 300s on dangerous-command approval (#37284, salvage #37317)

- URL: https://github.com/NousResearch/hermes-agent/pull/98558
- Author: teknium1
- Merged: 2026-08-30T14:04:17Z (created: 2026-08-30T12:28:41Z)
- Stats: +337 -1, 5 files
- Labels: type/bug, comp/cli, comp/tools, platform/webhook, area/config, P2, sweeper:risk-security-boundary, sweeper:risk-compatibility
- Reviews: 0 | Comments: 2
- Linked issues: Fixes #37284

### Description

## Summary
Sessions on unattended programmatic platforms (webhook, msgraph_webhook, api_server) no longer stall for the full approval timeout when they hit a dangerous-command gate — the decision resolves instantly via a new `approvals.unattended_mode` config key (default `deny`), mirroring `cron_mode`.

Root cause: these platforms bind `HERMES_SESSION_PLATFORM` like chat gateways do, so `_is_gateway_approval_context()` routed them into the interactive `/approve` wait — but their adapters have no `send_exec_approval` and no reply channel, so nobody can ever answer. The session blocked 60–300s and then failed closed anyway (#37284, #87509). Observed live Aug 30: a memory-watchdog webhook run sat the full 300s on an approval, which held up a `hermes update` gateway drain for 5+ minutes.

Salvages #37317 by @liuhao1024 (webhook exclusion + tests, authorship preserved) with the policy flipped from auto-approve-with-warning to deny-by-default, and the fix widened from webhook-only to the whole unattended class.

## Changes
- `tools/approval.py`: `_UNATTENDED_APPROVAL_PLATFORMS` frozenset + `_is_unattended_platform_approval_context()`; excluded from gateway approval context (cherry-picked from #37317, widened)
- `tools/approval.py`: `approvals.unattended_mode` reader (`deny`/`approve`, default deny); deny branches in `_run_approval_gate`, `check_all_command_guards` (with tirith parity, mirroring the cron branch), and `check_execute_code_guard` (the #87509 sibling site)
- `hermes_cli/config_defaults.py`: `approvals.unattended_mode: deny` default + comment
- `website/docs/user-guide/security.md`: key documented in the approvals table
- `tests/tools/test_approval.py`: contributor's exclusion tests kept; auto-approve test flipped to deny-default; added opt-in/approve, safe-command, api_server, and execute_code coverage

## Validation
| Scenario (real `check_all_command_guards`, isolated HERMES_HOME, webhook session) | Before (origin/main) | After |
|---|---|---|
| Dangerous command | pending approval submitted → waits `approvals.timeout` → fail closed | instant deny (0.04s) with actionable message |
| Safe command | approved | approved |
| `unattended_mode: approve` | n/a | auto-approves (old #37317 behavior, now opt-in) |
| execute_code | one-shot gateway approval nobody can answer | instant deny |

Targeted tests: `tests/tools/test_approval.py` + `test_approval_config_readonly.py` — 121/121 pass.

**Live repro:** confirmed on origin/main (pending-approval path taken in a real webhook-session subprocess) and instant-deny confirmed on this branch, same harness.

Fixes #37284. Fixes the api_server half of #87509. Complementary to #71661 (addressable cross-platform approvals), which remains a valid follow-up for users who WANT remote approval of webhook sessions.

## Infographic

![Unattended approvals — deny by default](https://v3b.fal.media/files/b/0aa869c1/OlUzIx72NavzYvwGuEY7o_anBqxLZU.png)


## PR #98099: fix(skills): skill_view directory file_path + skill_manage categorized name resolution

- URL: https://github.com/NousResearch/hermes-agent/pull/98099
- Author: kshitijk4poor
- Merged: 2026-08-30T14:34:41Z (created: 2026-08-29T19:26:07Z)
- Stats: +98 -1, 4 files
- Labels: type/bug, comp/tools, tool/skills, P2, sweeper:risk-compatibility
- Reviews: 0 | Comments: 2
- Linked issues: none

### Description

## Real-world impact

Agents calling `skill_view(name, file_path=…)` on a **directory** (e.g. `references`) got a raw `[Errno 21] Is a directory: '/…/references'` OS error instead of the helpful not-found payload with the `available_files` listing. This is the exact string that recurs 28× across five months of local optimization audit logs — the background review agent hits it every time it lists a skill's support files.

Agents calling `skill_manage` with a **categorized name** (`software-development/my-skill`) got `Skill '…' not found in active profile 'default'` — even though that is the form skill_view's own ambiguity hint instructs the caller to use (`Pass the full relative path instead of the bare name (e.g., 'category/skill-name')`). Every skill_manage call that followed the hint failed, and the agent retried repeatedly — the #1 recurring error class in the audit logs (926 occurrences in one month).

## What changed

**1. `skill_view` directory request (tools/skills_tool.py)**
```python
# before
if not target_file.exists():      # a directory EXISTS → falls through
    …not-found listing…
content = target_file.read_text() # ← raises [Errno 21] on a directory

# after
if not target_file.is_file():     # directories now take the listing branch
    …not-found listing…
```
The plugin-skill sibling branch already gated on `is_file()`; this aligns the local-skill branch (same bug class, sibling call path).

**2. `skill_manage` categorized names (tools/skill_manager_tool.py)**
```python
# before — only matched the bare directory name
if skill_md.parent.name == name: …

# after — also matches the full relative path (category/skill-name)
def _matches(skill_md):
    if skill_md.parent.name == name: return True
    rel = skill_md.parent.resolve().relative_to(_skills_dir().resolve())
    return str(rel) == name
```
Gives `_find_skill`'s 12 callers (edit / patch / delete / write_file / remove_file / preflight / ledger) resolution parity with `skill_view`.

## Test plan
- [x] New regression tests fail on `main`, pass with the fix:
  - `test_view_file_path_directory_returns_available_files` (skills_tool)
  - `test_edit_existing_skill_by_categorized_path` (skill_manager_tool)
  - `test_find_skill_accepts_categorized_path` + bare-name control
- [x] Full skills test surface green: 194 passed, 1 skipped (`tests/tools/test_skill*` + `test_skills_tool.py` + background-review guard tests)
- [x] Reproduced both symptoms on a clean worktree of upstream/main before fixing

## Follow-up (review feedback)

**1ba66281a3** — addressed @kokhlo's performance note: the categorized-name match now only runs when the lookup name contains a path separator (bare-name lookups never touch the resolve machinery), and the skills root is resolved once, lazily. Also switched `str(rel)` → `rel.as_posix()` so `category/skill` lookups work on Windows, where `str(Path)` renders backslashes.


## PR #98628: fix(compression): lean compaction is one auxiliary request again — 7-11 min digest stalls eliminated (#96603)

- URL: https://github.com/NousResearch/hermes-agent/pull/98628
- Author: teknium1
- Merged: 2026-08-30T16:03:58Z (created: 2026-08-30T14:33:26Z)
- Stats: +288 -211, 7 files
- Labels: type/perf, comp/agent, P1, sweeper:risk-session-state, area/sessions, area/compression
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Summary
Lean compaction now makes exactly one auxiliary LLM request per attempt — the per-chunk digest loop (up to 28 sequential aux calls) is gone, which is what turned compactions into 7-11 minute stalls on slow auxiliary routes (#96603: gpt-5.6 at high reasoning effort as the aux model).

Teknium's directive: one chunk, one request.

## Changes
- `agent/context_compressor.py`: digest loop removed; the main summary request absorbs the session-log duties (same hard rules — identifiers verbatim, dense bullets, transcript-is-data) with a raised single-response token budget. Oversized regions get evenly-sampled input with explicit `[... elided ...]` markers — never a second request. The LLM-free anchor index (full region) and session_search recovery footer are unchanged; those carry the needle-fact class (per `evals/compaction/results/SCORECARD-2026-08-15.md`, the anchor index — not the digests — drove GUI needle-facts 23.3→60.0).
- Dead code removed: digest constants/prompt/serializer, pristine-tool snapshot, sibling-call route echo
- `tests/agent/test_lean_single_aux_call.py` (new, 9 tests): pins exactly-one-call (sabotage-verified — restoring a second call turns it red), session-log section present, sampled input on oversized regions, anchor index + recovery footer intact
- Eval harness wording + docs updated in same PR

## Validation
| | Before | After |
|---|---|---|
| Aux calls, 362K-char region (probe) | 7 | 1 |
| Wall time on slow aux route (#96603) | 7-11 min | ~1 summary call |

194 + 6 targeted tests pass (memory-capped); ruff clean. Recall impact quantifiable via the permanent `evals/compaction/` harness; anchor index + recovery arm (+20-43pts measured) are retained unchanged.

Addresses the lean-pipeline half of #96603.

## Infographic

![One call compaction](https://v3b.fal.media/files/b/0aa86caf/Ezyi355W-2rxdvbtGcuPW_GUUakO0d.png)



## Live large-session A/B (real 500K historical transcript, real aux calls)

Real sweep-campaign lineage from the Aug 15 eval corpus (1,338 messages, ~499,625 tokens), identical input to both builds:

| | OLD (main, digest loop) | NEW (this PR) |
|---|---|---|
| Aux calls | 19 (summary + 18 digests) | 1 |
| Wall time | 196.5s | 39.6s |
| Tokens after | 57,567 | 46,135 |
| Anchor index + recovery footer | ✔ | ✔ |

5x faster on a fast aux route; on slow aux routes (#96603: gpt-5.6 @ high effort) the 19 sequential calls are the reported 7-11 minutes. Also ~11K tokens leaner post-compaction — the old 81K-char digest wall rode in every subsequent request.

