# Merged PRs: openclaw/openclaw

## PR #120900: feat(ui): review install policy warnings

- URL: https://github.com/openclaw/openclaw/pull/120900
- Author: jesse-merhi
- Merged: 2026-08-15T03:07:03Z (created: 2026-08-09T04:59:17Z)
- Stats: +1748 -212, 33 files
- Labels: docs, app: web-ui, gateway, cli, security, maintainer, size: XL, proof: sufficient, P2, rating: 🐚 platinum hermit
- Reviews: 1 | Comments: 44
- Linked issues: none

### Description

## New behavior

An authenticated administrator can review an install-policy warning in the Control UI and deliberately continue that plugin install.

- `plugins.install` accepts the optional literal `acknowledgeInstallPolicyWarning: true`
- the boolean is acknowledgement for that install invocation; there is no server token, TTL, bearer capability, or restart-generation state
- structured warning details distinguish an acknowledgeable `warn` from terminal `block` and scan failures
- the Plugins page shows the reason, severity-labelled findings, bounded technical details, and an explicit **Install anyway** action
- clicking **Install anyway** resends the same request with the boolean set
- the review stays visible and disabled while the acknowledged retry is pending
- catalog, detail, and ClawHub aliases share one install identity
- after success, the warning is retired and the success/restart message follows the runtime plugin ID returned by the installer, even when it differs from the catalog fallback ID

## Security-owner decision

Approved by Jesse Merhi, OpenClaw secops, on 2026-08-14.

An `operator.admin` caller already has authority to install executable plugin code. The acknowledgement is therefore an accidental-install interlock, not a second permission system. It intentionally approves every `warn` encountered during that install invocation; each warning is still freshly evaluated, while `block`, changed same-stage warnings, malformed output, and scan failures remain terminal.

## Stack context

#116489 is merged. This PR is the Gateway and Control UI layer directly on `main`, plus the runtime-identity feedback follow-up described below. The superseded server-token PR #120899 is closed.

## How it works

1. An authenticated `operator.admin` client submits `plugins.install`.
2. Without acknowledgement, a policy `warn` returns bounded review details and does not install.
3. The operator reviews the warning and clicks **Install anyway**.
4. The UI resends the original request with `acknowledgeInstallPolicyWarning: true`.
5. The Base installer treats that as force-style acknowledgement for the invocation and freshly evaluates every warning before continuing.
6. A successful result moves feedback from the request/catalog identity to the returned runtime plugin identity before the catalog refresh.

Implementation: [additive request schema](https://github.com/openclaw/openclaw/blob/6c7a452d3eff94cb9b5ac173b25248e65ca6cdde/packages/gateway-protocol/src/schema/plugins.ts), [Gateway projection](https://github.com/openclaw/openclaw/blob/6c7a452d3eff94cb9b5ac173b25248e65ca6cdde/src/gateway/server-methods/plugins.ts), [public warning-details contract](https://github.com/openclaw/openclaw/blob/6c7a452d3eff94cb9b5ac173b25248e65ca6cdde/packages/gateway-protocol/src/install-policy-warning-error-details.ts), [warning parser](https://github.com/openclaw/openclaw/blob/6c7a452d3eff94cb9b5ac173b25248e65ca6cdde/ui/src/pages/plugins/install-policy-warning.ts), and [review UI](https://github.com/openclaw/openclaw/blob/6c7a452d3eff94cb9b5ac173b25248e65ca6cdde/ui/src/pages/plugins/view.ts).

## Visual proof


https://github.com/user-attachments/assets/5e1aad4c-5836-4023-b270-46e3d543c95e



**What this shows:** Starting from the hosted fallback identity `@openclaw/bluebubbles`, an administrator opens the warning, reviews the finding, clicks **Install anyway**, and reaches the installed runtime identity `bluebubbles`. The warning disappears and the restart message remains visible on the installed row.

**State:** Recorded on the pre-landing head with an identical UI tree; the current head preserves that UI tree after a byte-identical rebase onto current `main`. Local source Control UI; deterministic mocked Gateway; desktop viewport; manual Computer Use interaction.

![Install policy warning review](https://github.com/user-attachments/assets/421208ae-817d-431d-bf41-fb0214233213)

**What this shows:** The policy reason, warning finding, and explicit acknowledgement action are visible before installation.

**State:** Same recorded flow, before acknowledgement.

<img width="928" height="768" alt="Installed runtime plugin with success and restart message" src="https://github.com/user-attachments/assets/7ac6c22e-d289-44f3-baab-278fd4d1406a" />

**What this shows:** The catalog fallback row has been replaced by the returned runtime plugin, with the warning gone and “Installed BlueBubbles. A Gateway restart is required” still visible.

**State:** Same recorded flow, after acknowledgement and catalog refresh.

<img width="393" height="794" alt="Install policy review on a narrow mobile viewport" src="https://github.com/user-attachments/assets/98825efa-47bf-47d2-aa9b-e8494c982676" />

**What this shows:** The same review remains readable and actionable on a narrow mobile viewport.

<img width="1182" height="1000" alt="Changed dependency warning replaces the original warning" src="https://github.com/user-attachments/assets/b9c0dceb-4ce9-4a0d-9fb4-834c778f08a8" />

**What this shows:** A later dependency-stage warning replaces the earlier review instead of being silently covered by it.

## How to verify

1. Open the Plugins page with a hosted catalog entry whose fallback ID differs from its installed runtime ID.
2. Start the install and return an `install_policy_warning_acknowledgement_required` error.
3. Confirm the warning is visible and the plugin is not installed.
4. Click **Install anyway** and return a successful plugin result under the runtime ID.
5. Confirm the warning is gone, the installed row is present, and the success/restart message remains visible.

Supporting checks:

- exact-head focused protocol, Gateway, plugin, and UI proof: **138/138 passed**
- exact-head Chromium mocked-Gateway Plugins flow: **6/6 passed**
- earlier broader proof against the byte-identical feature commits: **207/207 passed**
- the built `@openclaw/gateway-protocol` package root exports and executes the warning-details parser/type contract for external consumers
- `git diff --check` is clean

Exact head: `6c7a452d3eff94cb9b5ac173b25248e65ca6cdde`; direct base: `3289e08c3005515fb8e49379fd18951ef2530507`.

## Scope

Direct layer: **33 files, +1748/-212**.

- production: 17 files, +733/-73
- tests and test support: 12 files, +997/-127
- docs: 4 files, +18/-12


## PR #130993: fix: Responses sessions compact before reaching context limit

- URL: https://github.com/openclaw/openclaw/pull/130993
- Author: VACInc
- Merged: 2026-08-30T03:28:53Z (created: 2026-08-27T15:17:19Z)
- Stats: +1357 -509, 30 files
- Labels: docs, gateway, agents, maintainer, size: XL, P1, rating: 🦐 gold shrimp, merge-risk: 🚨 compatibility, status: ⏳ waiting on author
- Reviews: 0 | Comments: 54
- Linked issues: none

### Description

## Summary

### High-level TLDR

This PR fixes six failures in the same long-session compaction pipeline:

1. OpenAI Responses terminal usage could lose its coherent context boundary, causing replay estimation to nearly double-count context and trigger compaction too early.
2. A legitimate multi-stage compaction could be aborted by an outer aggregate deadline even though each serial model request was still making healthy progress.
3. The summary quality gate treated a normally ended assistant response as proof that the user task was complete, then rejected a correct summary that kept unfinished work under `## Pending user asks`.
4. A second latest-request retention gate disabled its own deterministic repair precisely when a generated summary omitted or over-paraphrased that request, then spent a corrective attempt and failed with `latest_user_ask_not_reflected`.
5. On split turns, a lossy model-generated prefix summary replaced the authoritative source ask as required retention context, so deterministic repair could not restore the fact the final audit required.
6. The native-watchdog exception also skipped the caller-abort race, so cancellation could leave runtime or plugin preparation pending before the next abort-aware model request.

The intentional split-turn design is unchanged: older context is summarized while the recent suffix, including tool-call/tool-result continuity, remains verbatim. Requests remain serial. The configured timeout remains 180 seconds; for built-in staged compaction it applies to each model request, while custom/plugin compaction remains bounded once at the host boundary.

## Root cause and fix

### A. False Responses context pressure

The Responses terminal mapper preserved billable token buckets but omitted the provider's coherent input/total snapshot from `usage.contextUsage`. The pressure owner therefore fell back to estimating the mirrored transcript and could count provider-owned context again.

Sanitized decision replay:

- Before: route `compact_then_truncate`, estimated prompt `390486`, budget `252000`, source `transcript_estimate`.
- After: coherent provider snapshot `{ promptTokens: 197462, totalTokens: 197764 }`, route `fits`, estimated prompt `198202`, budget `252000`, source `provider_context_usage`.

The fix projects a terminal snapshot only when it is coherent. Output-absent snapshots require `total_tokens >= input_tokens`; zero or smaller totals remain unavailable. Prompt-only recovery truncation no longer rewrites durable provider-owned transcript rows, avoiding a later idempotency collision.

Direct dependency-contract check, re-verified against upstream `openai/codex` `main` at `63d2138` (2026-08-30): Codex deserializes `response.completed.usage` with `input_tokens`, `output_tokens`, and `total_tokens` all required and maps it into one `TokenUsage`, including cached input, cache-write input, and reasoning output (`codex-rs/codex-api/src/sse/responses.rs:128-150`; the `cache_write_input_tokens` bucket is newer than the earlier citation and is already bounded by the coherence predicate here). Codex measures context as `total_tokens` (`codex-rs/protocol/src/protocol.rs:2365-2375`) and estimates only items after the last reported usage (`codex-rs/core/src/context_manager/history.rs:443`), the same model this PR's pressure owner uses. Codex's local compaction keeps recent prompt history while retrying (`codex-rs/core/src/compact.rs:245` `run_compact_task_inner_impl`, `:644` `build_compacted_history`), and remote compaction installs provider-returned compacted history from the selected prompt (`codex-rs/core/src/compact_remote.rs:192` `run_remote_compact_task_inner_impl`).

### B. Healthy staged compaction mistaken for a hang

Sanitized runtime evidence from the newest manual failure:

- compaction failed at about 178.852 seconds with `Compaction timed out`;
- the final provider request was aborted about 25.6 seconds after it started;
- the deterministic plan required two serial summary chunks (about 64k and 83k estimated tokens) followed by a merge.

The first request consumed most of one aggregate 180-second operation deadline. Although native compaction refreshed its watchdog at each serial request boundary, normal `resolveContextEngine()` resolution returned a proxy closure for `compact()`. Exact function identity was lost, `isRuntimeCompactionDelegate()` returned false, and the host silently installed a second aggregate deadline around native compaction.

The fix makes watchdog ownership an explicit process-global function capability that survives registry projection proxies and duplicated dist chunks. Both normal resolution and fresh logical-turn resolution inherit it only from the canonical runtime delegate. Custom and plugin compaction functions do not inherit it and remain host-bounded.

### C. Completed response confused with completed task

An isolated replay of the unchanged pre-failure transcript reproduced this after all model calls completed successfully:

- two chunk summaries and the merge completed;
- the merged summary retained every required section and correctly listed the still-unfinished request under `## Pending user asks`;
- a structural oracle marked the request complete solely because the retained assistant tail had non-empty text and `stopReason="stop"`;
- the audit rejected the summary as `completed_latest_user_ask_marked_pending`;
- a corrective three-call retry made the same semantic classification and failed the same sole check.

All six provider calls completed in about 143 seconds, ruling out timeout as the cause of that replay. `stopReason="stop"` proves response termination, not user-task completion.

The fix removes that invalid completion bit from compaction preparation, retention, and quality auditing. The summarizer still receives the full latest turn and is still instructed to put only unresolved requests under `## Pending user asks`. Final budgeting now preserves the section chosen from that full transcript instead of moving an ask between completed and pending state using a structural guess.

## Why previous fixes did not fix these failures

- The older identifier-retention repair (#129423) validates summary retention after compaction is selected. It cannot provide missing provider usage, alter pressure routing, or change watchdog ownership.
- #130620 fixed four earlier `latest_user_ask_not_reflected` failures by exposing the audited ask to the summarizer. It also introduced the invalid completed-turn predicate; the new `completed_latest_user_ask_marked_pending` failures are distinct.
- The first timeout follow-up refreshed the native watchdog but did not test the normally resolved default engine. Its regression constructed `new LegacyContextEngine()` directly, so it missed registry proxy identity loss.
- A broader attempted timeout exception for every non-owning engine was unsafe: a synthetic custom CLI engine could then hang without a host deadline. This PR keeps the exception capability-bound to the canonical native delegate and proves both default resolution paths preserve that capability.

## Diagnostic handoff (redacted)

No private chat URL, account, session key, run ID, provider response ID, tool-call ID, transcript content, or credential is included here.

Historical signatures in the affected chat were not one bug:

- four earlier quality failures ended with `latest_user_ask_not_reflected` and were addressed by #130620;
- four 180-second timeouts preceded the request-refresh repair;
- one 178.852-second timeout occurred after that repair and is explained by registry proxy ownership loss;
- the isolated exact-transcript replay completed six calls in about 143 seconds, then failed solely with `completed_latest_user_ask_marked_pending`;
- the older #129423 event was `missing_identifiers` in a different session.

Triage signatures:

- `pressureSource=transcript_estimate` despite a recent coherent Responses terminal usage snapshot: inspect terminal usage projection.
- `pressureSource=provider_context_usage` with a decision below budget: the false-pressure path is working; do not attribute a later failure to accounting without new evidence.
- `Compaction timed out` near the configured limit while a later serial request ran only for the remaining fraction: inspect watchdog ownership/refresh.
- one model request itself exceeding the configured limit: expected safety timeout, not this bug.
- custom/plugin compaction exceeding its aggregate host deadline: expected host ownership.
- `completed_latest_user_ask_marked_pending` after a normal assistant stop while requested work remains unfinished: inspect structural response state being consumed as semantic task state.

One diagnostic gap remains outside this repair: first-pass quality reason codes are logged only when retries are exhausted. If a first candidate fails quality and a later corrective attempt times out, production logs retain the timeout but not the first-pass reason. The isolated replay was needed to recover that boundary.

## Evidence map

- Responses usage producer: `packages/ai/src/providers/openai-responses-terminal-usage.ts`; consumer: `src/agents/embedded-agent-runner/run/preemptive-compaction.ts`; recovery projection: `src/agents/embedded-agent-runner/tool-result-truncation.ts`.
- Timeout owner: `src/agents/embedded-agent-runner/compaction-safety-timeout.ts`; native request boundary: `src/agents/embedded-agent-runner/compaction-session-execution.ts`; registry projection: `src/context-engine/registry.ts`; canonical delegate: `src/context-engine/delegate.ts`.
- Summary semantic owner: `src/agents/agent-hooks/compaction-safeguard.ts`; retention/audit: `src/agents/agent-hooks/compaction-safeguard-quality.ts`; split preparation: `packages/agent-core/src/harness/compaction/compaction.ts`.
- Timeout siblings covered: normal default resolution, logical-turn projection, manual/queued compaction, CLI, overflow, timeout recovery, and custom-engine host bounds.
- Quality siblings covered: ordinary latest turns, split turns, preserved recent turns, final artifact budgeting, identifier retention, and corrective generation.

## Real-behavior and regression proof

The two newly added tests failed on prior PR head `76598e92b81e` for the exact defects:

```text
preserves native compaction watchdog ownership through default resolution
AssertionError: expected false to be true

does not treat a terminal assistant response as proof that the latest task is complete
AssertionError: compaction result was cancel=true
```

After the fix at `24bc0c0b2b4`:

```text
pnpm exec vitest run \
  src/context-engine/context-engine.test.ts \
  src/context-engine/host-param-projection.test.ts \
  src/agents/embedded-agent-runner.compaction-safety-timeout.test.ts \
  src/agents/agent-hooks/compaction-safeguard.test.ts \
  packages/agent-core/src/harness/compaction/compaction.test.ts

Test Files  7 passed (7)
Tests       451 passed (451)
```

Changed-surface formatting, production/test typechecks, assertion and max-line ratchets, dependency/plugin boundaries, dead-export checks, and full core lint also pass locally. Exact-head GitHub CI remains the authoritative full-suite gate.

Live deployment proof, exact head `5594d1b` overlaid on a maintainer gateway from 2026-08-29 21:12Z through 2026-08-30 02:36Z: 7 automatic compactions, 7 successes, 0 failures. `openai/gpt-5.6-sol` ×5 (46 s to 3.5 min each, three of them split-turn) and `minimax/MiniMax-M3` ×2 (under 1.5 min). Counting the prior head `9fcbe25` deployed from 19:34Z, about 30 successes and 0 failures. Zero `Compaction timed out`, `guard_blocked`, `missing_identifiers`, branch-fallback, or budget-exceed lines in that window; the only safeguard output is the pre-existing informational `finalized artifact truncated; loss=...` line. Earlier the same day, intermediate heads on the same gateway produced 34 `guard_blocked` cancellations from `duplicate_section` (the audit ran against the assembled artifact, whose nested split-turn section repeated every required heading) and `retained_turn_ask_marked_pending` (the split-prefix summarizer received no corrective feedback and was audited in the wrong format); commits `decc184`, `e4146f2`, and `5594d1b` fixed both and the failures stopped. Log lines are redacted of session identifiers.

The earlier Responses transport head passed the authenticated OpenAI gateway-profile live workflow, including native OpenAI and GPT-5.6 Ultra selections: [workflow run](https://github.com/openclaw/openclaw/actions/runs/33091940647).

## User impact

- Responses sessions no longer compact because replay estimation double-counted a coherent provider usage snapshot.
- Prompt-only recovery does not mutate durable provider-owned transcript rows.
- Legitimate built-in split compaction can span several healthy serial requests without an outer aggregate deadline cutting off later stages.
- A normally ended assistant response no longer makes the quality gate declare unfinished user work complete.
- Tool-call and recent-turn detail remain protected by the existing intentional split design.

## LOC and risk

- Production versus merge-base `f9b3bcc`: +351/-221 (net +130) across 16 files (`git diff --numstat`, tests/test-support/baseline/docs excluded; ClawSweeper's +140 classifies test-support differently).
- Tests/test support/baseline: +1006/-288 (net +718).
- Docs: +1/-1.
- Runtime growth by owner: Responses usage coherence boundary (`openai-responses-terminal-usage.ts` +27), progress-refreshable native watchdog and its abort helpers (`compaction-safety-timeout.ts` +26, `compaction-session-execution.ts` +24, `context-engine/compaction-watchdog.ts` +25, `context-engine-abort.ts` +42, `with-timeout.ts` +14), and audited-ask retention (`compaction-safeguard-quality.ts` +30). Offsets: the invalid completion oracle and retained-suffix scan (`agent-core/.../compaction.ts` -39, `compaction-safeguard.ts` -17) and registry projection cleanup (`registry.ts` -8). Each remaining addition is an ownership boundary (provider snapshot coherence, watchdog capability that survives registry proxies, abort-reason preservation); none is compatibility code.
- No configuration, protocol, database, persisted-state, or timeout-default surface changes. `agents.defaults.compaction.timeoutSeconds` keeps its key, default, and schema, but its meaning for built-in compaction is intentionally changed from an operation-wide cap to a per-model-request window that resets on staged progress (cause B); plugin-owned and native-harness compaction keep the operation-wide bound. Documented in `docs/gateway/config-agents.md` and `schema.help.agents.ts`. Operators who raised the value to survive multi-stage compaction can return to the default.

The remaining positive production delta establishes the provider usage/projection boundary, prompt-only truncation, a progress-refreshable native watchdog, and capability-preserving registry ownership; none is test-only compatibility code.

## What was not tested

- The original large session was not re-run wall-clock end to end; the live proof above covers automatic compactions on a maintainer gateway running this exact head, and the original transcript was replayed only in isolated state for RCA. Deterministic regressions cover both repaired owner boundaries.
- No runner-level test asserts `source: "provider_context_usage"` from a Responses-shaped payload end to end; the mapper and transport tests join by type only.

## Known follow-ups (not blocking)

- After a per-request timeout, the compaction model fallback inherits a nearly expired host watchdog because the failure exit at `src/agents/embedded-agent-runner/compaction-session-execution.ts:642` does not call `compactionTimeoutReset()`; same outcome as `main`, but it contradicts the per-request contract. One-line rearm.
- On re-distill the model can copy the previous artifact's `## Latest user request context` block into `## Decisions` (seen in 2 of 7 live compactions); `createSummaryQualityRetentionPlan` strips only the exact current block. Strip any such block from the body.
- `compact.hooks.harness.ts:975-982` bypasses the outer wrapper for unmarked engines in a way `compactWithSafetyTimeout` never does, so the "no second aggregate timeout" test proves the mock; align the harness with the real owner split.
- Docs could add that native harness compaction (Codex, Copilot) and plugin engines wrapping `delegateCompactionToRuntime` also get one operation-wide window, and that setup and post-processing get their own windows.


### D. Missing latest request disabled its own repair

Sanitized evidence from the newest manual failure after deployed PR head `24bc0c0b2b4`:

- all four provider requests succeeded in about 38.990, 24.163, 56.499, and 24.232 seconds;
- two candidate summaries finalized;
- the operation ended after about 154.746 seconds with only `latest_user_ask_not_reflected`;
- the source latest request was a short approval/continuation request; no private text or identifier is retained here;
- there was no provider, transport, timeout, or split-turn failure in this occurrence.

The quality-retention owner had two circular fast paths. First, `createSummaryQualityRetentionPlan()` returned `null` whenever the generated audit artifact lacked enough token overlap with the latest request. That is exactly the state in which its bounded `requiredAskContext` fallback is needed. Second, even with that precondition removed, the within-cap fast path rebuilt only for missing identifiers or oversized protected sections; it never asked whether the latest request itself was missing. A structured summary could therefore fit the cap, bypass deterministic retention, fail the final audit, consume another complete model attempt, and fail again.

The canonical fix removes the obsolete whole-artifact precondition and makes missing latest-request overlap a reason to rebuild a fitting structured body. The existing bounded source context is retained in the section chosen by the summarizer when possible, or under a neutral `Latest user request context:` label when no section reflects it. The final audit remains fail-closed if the required fact cannot fit. No timeout, retry count, split-turn, config, protocol, or persistence behavior changes.

This is the unfinished consumer half of the earlier repair, not a recurrence of the producer bug. #130620 made the audited latest turn visible to the summarizer; it could not force a model to preserve enough literal overlap. #129423 restored omitted identifiers through the same retention owner, but the latest-request precondition and within-cap fast path remained.

Regression proof for commit `95b5526f4f8`:

- the new owner-boundary scenario fails on deployed head `24bc0c0b2b4` in both agent test projects because compaction returns `cancel: true`;
- after the fix it succeeds in both projects, restores the bounded source request context, passes the final source audit, calls the summarizer once, and records no cancellation;
- the complete safeguard file passes 286/286 assertions across both projects;
- the full changed-file gate passes formatting, production and test typechecks, lint, dead-export analysis, import-cycle checks, and database/state policy guards;
- isolated structured Autoreview reports no P0 finding.

Updated LOC at this head:

- Production: +183/-132 (net +51).
- Tests/test support: +323/-104 (net +219).
- Docs: +1/-1.
- This latest repair alone is +5/-10 production (net -5) and +44/-4 tests.


### E. Split-turn summary replaced the authoritative source ask

Sanitized evidence from the newest manual failure after deployed PR head `95b5526f4f8`:

- the operation used the intentional split-turn path and completed two finalization passes;
- it ended after about 142.592 seconds with `reason=guard_blocked`;
- the sole quality reason was `latest_user_ask_not_reflected`;
- the source request was a short approval/continuation ask; no private text, session identifier, response identifier, or transcript content is retained here;
- the deployed files matched the PR head, and there was no timeout or transport failure in this occurrence.

The split-turn summarizer output was incorrectly assigned to `requiredAskContext`. That generated, lossy text then took precedence over the authoritative `latestUserAsk`. The deterministic retention planner correctly noticed that the source ask was absent, but the only protected text it was given was the generated split summary, so rebuilding could never restore the fact the final audit required.

The fix keeps the split-turn summary as supplemental context while always sourcing mandatory request retention from `latestUserAsk`. It deletes the generated-summary substitution instead of weakening the audit, adding retries, or adding another fallback. Split behavior, tool-call continuity, timeouts, providers, configuration, and persistence are unchanged.

Regression proof at `4aca82299c0`:

- the focused split-turn scenario fails on prior head `95b5526f4f8` because the final audit returns false after both generated summaries omit the source ask;
- after the fix, the final artifact contains the exact source ask and identifier and passes the source audit in the same two model calls;
- `src/agents/agent-hooks/compaction-safeguard.test.ts`: 143/143 tests pass;
- the complete changed-file gate passes formatting, production/test typechecks, lint, dependency and plugin boundaries, dead-export analysis, import-cycle checks, and database/state policy guards.

This follow-up is production +1/-4 (net -3) and tests +5/-4 (net +1). No configuration, protocol, database, persisted-state, timeout, retry, provider, or channel surface changes.


### F. Native watchdog bypass dropped caller cancellation

ClawSweeper exact-head review of `4aca82299c0` identified a logical P1 in the earlier timeout repair. The canonical native delegate correctly bypassed the host aggregate timeout, but it also bypassed the wrapper that races the caller abort signal. Native preparation can await runtime or plugin setup before reaching its later abort-aware model call, so a cancelled manual or recovery operation could remain pending during that preparation.

The fix separates those two policies: native compaction still owns its progress-aware per-model-request watchdog, while the host boundary rejects immediately on caller cancellation and removes its listener after settlement. Custom/plugin engines remain host-timeout-bounded as before.

Both regressions failed on `4aca82299c0` for the intended reason:

- a pre-aborted invocation still called and resolved the native delegate;
- an in-flight native preparation remained pending after the caller aborted.

At `add844e23d5`, both reject with the caller reason; the pre-aborted path never starts the delegate. The focused timeout suite passes 27/27, the adjacent compaction hook and overflow suites pass 161/161, and the full changed-file gate passes. This repair is production +41/-29 (net +12), establishing the shared cancellation race used by both host-bounded and native compaction paths; tests are +44/-0.

ClawSweeper completed the first logical review and emitted the finding, but its publisher then failed on an invalid generated live-proof plan even though that review marked live proof not applicable. That publisher failure was workflow infrastructure, not a second code finding. The finding was accepted and repaired. A replacement exact-head review at `add844e23d5` completed successfully, reports the patch correct with no findings and security cleared, and exact-head GitHub CI is green.


## Follow-up invariant fixes

Commit `6ab2b77ebd6` closes the three owner-boundary gaps found in exact-head review without removing the existing accounting, watchdog, cancellation, source-ask, split-turn, or fail-closed budgeting repairs:

- quarantined custom context engines now expose native watchdog ownership when their actual compaction dispatch is the built-in fallback;
- frozen tool-result projections report progress only when the next provider projection changes, avoiding a no-op retry;
- source requests omitted by the generated summary are conservatively restored under `## Pending user asks`, and the audit rejects deterministic request context placed elsewhere.

Focused verification passes across the changed and retained sibling paths, including context-engine resolution, Responses usage, compaction timeout/cancellation, split-turn safeguards, tool-result projection, hooks, overflow recovery, transport mapping, and node timeout behavior. The changed-surface gate passed formatting, typechecks, lint, dead-export, dependency/plugin-boundary, state/database, and import-cycle guards. Fresh structured autoreview reports no P0 findings.


### G. Bound delegated native setup and post-processing

Exact-head review found that the native delegate could leave preparation before the first provider request outside any safety deadline. The repair restores a host-owned, progress-refreshable window: preparation is bounded, setup completion and each provider request refresh the window, client fallback starts with a fresh window, and successful compaction refreshes again before side effects, checkpoint persistence, and after-compaction hooks. Custom and plugin compaction remains host-bounded as before.

At fa810150aa7, the focused timeout, overflow-recovery, and hook suites pass 382 tests across six project instances. The complete changed-surface gate passes formatting, production and test typechecks, lint, dead-export analysis, dependency and plugin boundaries, state and database guards, and import-cycle checks.

## Worked on by

- @VACInc




## PR #128995: feat: make full session actions available from chat header

- URL: https://github.com/openclaw/openclaw/pull/128995
- Author: roboclaw-bot
- Merged: 2026-08-26T04:45:55Z (created: 2026-08-25T04:00:05Z)
- Stats: +1407 -747, 22 files
- Labels: docs, app: web-ui, maintainer, size: XL, P2, rating: 🐚 platinum hermit, status: 👀 ready for maintainer look
- Reviews: 0 | Comments: 49
- Linked issues: none

### Description

## What Problem This Solves

Fixes an issue where users managing the current chat session from the top-right header menu could not pin it, mark it unread, set its icon, copy its session ID, or move it to a group even though those actions were available from the sidebar.

## Why This Change Was Made

The sidebar and chat header now compose one canonical session-management presenter for action IDs, labels, shortcuts, enablement, compact drill-downs, and selection handling. Pane-specific Panels, Layout, View, status, and Continue in terminal controls remain owned by the header, while shared mutations route through the existing session organizer operations.

Both surfaces also consume one canonical group collector. It merges the Gateway group catalog with groups already observed on session rows, so the header's **Move to group** submenu does not lose newly observed groups while the catalog catches up.

Every newly shared header patch re-resolves the current row at its mutation boundary. If a no-ID row was deleted while the lazy operation or group-catalog write was in flight, pin, unread, icon, existing-group, remove-from-group, and new-group actions skip the patch and show a visible retry outcome instead of recreating the removed session. Durable-ID rows retain their captured-row fallback because the Gateway enforces `expectedSessionId`.

Child-session gating now uses the canonical navigation-parent relation, so both `parentSessionKey` forks and `spawnedBy` children receive the same action restrictions as the sidebar.

This makes common session actions appear on both surfaces by default. Intentional surface-only actions stay explicit in the two wrappers instead of requiring divergent action renderers and dispatch contracts.

## User Impact

Desktop and mobile users can perform the full single-session management flow from the chat header: Pin/Unpin, Mark unread/read, Rename, Assign owner, Set icon, Fork, Copy session ID, Move to group, Archive/Restore, and Delete.

## Evidence

- No-ID mutation regressions fail on the stale implementation for pin, unread, icon, new-group, existing-group, and remove-from-group actions; all pass after the shared current-row repair.
- A parentSessionKey-only fork regression fails on the old header child classification and passes with the canonical navigation-parent helper.
- Focused shared menu/header/pane/category-owner/sidebar Vitest coverage: 152 tests passed.
- Real Chromium session-menu E2E: 2 tests passed at desktop and 390x844 mobile viewports; all three fresh captures were inspected.
- Complete changed-file gate passed: formatting, assertion/max-lines ratchets, dependency and plugin guards, dead exports, i18n, core-test/UI typechecks, full core lint, and UI lint.
- Exact Control UI production build passed with 493 B of startup-JS budget remaining on current `main`.
- Final uncommitted autoreview: clean, 0.99 correctness. Final full-branch autoreview: clean, 0.99 correctness.
- Production LOC: +927/-717 (net +210). Tests/support: +479/-29 (net +450). Docs are net-neutral; the assertion baseline shrinks by one line.

### Desktop

![Desktop chat header session menu](https://github.com/user-attachments/assets/b828fdf1-a645-4e24-bcb9-fe3c8fdc508f)

### Mobile

![Mobile chat header session menu](https://github.com/user-attachments/assets/c5ded49d-1e31-4246-8bb5-462b55319bf3)


## PR #128223: fix(cli): resolve alias targets from the write snapshot

- URL: https://github.com/openclaw/openclaw/pull/128223
- Author: 8exgh
- Merged: 2026-08-27T09:45:33Z (created: 2026-08-23T12:54:12Z)
- Stats: +60 -4, 2 files
- Labels: commands, size: S, P2, rating: 🦪 silver shellfish, merge-risk: 🚨 compatibility, status: 📣 needs proof
- Reviews: 0 | Comments: 12
- Linked issues: Closes #127618

### Description

Closes #127618

<details>
<summary>Additional instructions</summary>

**MUST:** Keep **Allow edits from maintainers** enabled for this PR so maintainers
can help update the branch when needed.

</details>

## What Problem This Solves

`openclaw models aliases add <alias> <model-or-alias>` resolved the target before
`updateConfig` obtained the snapshot and hash that fence the write. If another
config writer remapped the input alias between those reads, the command
successfully attached the new alias to the stale model and logged that stale
target.

## Why This Change Was Made

`modelsAliasesAddCommand` now resolves `modelRaw` inside the `updateConfig`
mutator from `context.runtimeConfig`. Resolution and the compare-and-swap write
therefore share one authoritative snapshot. The canonical model key is persisted
to the source config and retained for the post-commit success line.

No shared resolver, config shape, CLI flag, migration, fallback, or docs change
is included.

## User Impact

- `models aliases add` follows the alias mapping current at the fenced write.
- The printed `Alias <alias> -> <target>` line matches the persisted target.
- Runtime-only built-in aliases still resolve while only source-form config is
  written.

## Evidence

AI-assisted (Claude Code and Codex); I have read and understand the change.

**Red-before on current main**

`node scripts/run-vitest.mjs src/commands/models/aliases.test.ts`

The reconstructed two-snapshot regression failed as intended: the stale
pre-snapshot mapped `old-alias` to `openai/gpt-5.6-sol`, the CAS snapshot mapped
it to `anthropic/claude-opus-5`, and pre-fix code wrote `new-alias` to the stale
OpenAI target. Result: 1 failed, 17 passed.

**Focused owner and sibling tests**

```text
scripts/pr review-tests 128223 \
  src/commands/models/aliases.test.ts \
  src/commands/models/set.test.ts \
  src/commands/models/shared.test.ts \
  src/commands/models/fallbacks-shared.test.ts \
  src/commands/promos/claim.test.ts \
  src/commands/promos/list.test.ts
```

All requested files passed and were observed in the native review output.
`pnpm check:changed` and `git diff --check` also passed.

**Autoreview**

Fresh branch autoreview with Codex `gpt-5.6-sol` at high reasoning reported no
accepted or actionable findings; overall correctness confidence was 0.99.

**Real CLI/config-I/O proof**

Blacksmith Testbox lease `tbx_01m118jw10zrx3x400tr2ten3b`, Actions run
`33058459463`, executed the exact reviewed tree with an isolated config. An
external atomic writer moved `old-alias` from the OpenAI model to the Anthropic
model before the real CLI write:

```text
SETUP dependency install and build passed
INITIAL old-alias -> openai/gpt-5.6-sol
WRITER old-alias -> anthropic/claude-opus-5
COMMAND models aliases add new-alias old-alias
Updated config: <PROOF_DIR>/openclaw.json
Alias new-alias -> anthropic/claude-opus-5
PERSISTED {"openai/gpt-5.6-sol":{"params":{"temperature":0.2}},"anthropic/claude-opus-5":{"alias":"new-alias"}}
```

The remote command and assertions exited 0.

**Gate note**

Local `prepare-gates` build and check passed. The full test encountered unrelated
tooling noise: `telegram-user-crabbox-proof.test.ts` reproduced the same failure
on current main, `test-live.test.ts` passed on current-main retry, and the
`test-perf-budget.test.ts` / `test-projects.test.ts` shard reproduced a no-output
hang on current main. An initial Blacksmith Testbox full-gate lease failed before
tests because its hydrated checkout lacked `node_modules` and could not import
`tsx`.

Exact-head CI run `33057073509` completed successfully with no failed jobs.
`OPENCLAW_TESTBOX=1 scripts/pr prepare-run 128223` accepted that hosted proof and
completed with `gates_mode=hosted_exact_or_recent_parent`.

## Repair Closeout

- Root cause: `aliases add` resolved `modelRaw` before the CAS-owned config
  snapshot existed.
- Owner: `src/commands/models/aliases.ts`.
- Canonical fix: resolve inside `updateConfig` using `context.runtimeConfig`.
- Sibling coverage: aliases, set, fallbacks-shared, shared, and promo command
  tests passed.
- Production LOC: +6/-4, net +2.
- Tests: +54/-0.
- Effective diff: two files; `src/commands/models/shared.ts` is unchanged.


## PR #123535: fix(ui): avoid session catalog refresh storms

- URL: https://github.com/openclaw/openclaw/pull/123535
- Author: jesse-merhi
- Merged: 2026-08-27T16:09:02Z (created: 2026-08-14T07:04:31Z)
- Stats: +168 -27, 6 files
- Labels: app: web-ui, maintainer, size: S, P2, rating: 🐚 platinum hermit, merge-risk: 🚨 availability, status: 👀 ready for maintainer look
- Reviews: 1 | Comments: 167
- Linked issues: none

### Description

## What Problem This Solves

The sidebar session catalog can launch redundant full refreshes when a visible browser window receives focus, when browser/operator presence changes, or when focus arrives during an active startup request. Those events cannot all change the native catalog inventory, but they currently replace the scheduled freshness poll or queue another scan.

## Why This Change Was Made

The catalog lifecycle now distinguishes passive focus from real visibility/native-presence changes. Explicit presence `mode` is authoritative; the authenticated `node` role is used only for older mode-less node records. Activation bursts still coalesce, while a real hidden-to-visible transition can queue one required follow-up behind an active request.

This PR is now standalone on `main`; it no longer depends on #123482.

## User Impact

Opening or focusing the Control UI no longer causes catalog refresh storms, while native node changes and a returning hidden tab still refresh promptly.

## Evidence

- Five focused regressions failed on current `main`: three presence-classification cases and two duplicate-focus scans.
- `node scripts/run-vitest.mjs ui/src/components/app-sidebar-session-catalog-live.test.ts ui/src/components/app-sidebar.test.ts` — 311/311 passing.
- `node scripts/run-vitest.mjs ui/src/e2e/claude-sessions.e2e.test.ts` — 8/8 passing; proves focus preserves the scheduled poll.
- Scoped UI/core-test typechecks, lint, formatting, dead-export, dependency, patch, max-lines, and assertion-safety checks passed.
- Fresh autoreview: clean, no accepted/actionable findings.
- Production LOC: +43/-22 (net +21), required to preserve queued real changes while suppressing passive focus/browser churn. Tests/test support: +125/-5.
- Current head: `746d759ed720662f261ffcfa574c8df7a2ba789e`.
