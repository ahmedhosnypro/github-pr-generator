# Merged PRs: Significant-Gravitas/AutoGPT

## PR #14232: fix(frontend): clean up wallet timers

- URL: https://github.com/Significant-Gravitas/AutoGPT/pull/14232
- Author: Torantulino
- Merged: 2026-08-29T15:04:40Z (created: 2026-08-29T14:06:47Z)
- Stats: +85 -9, 3 files
- Labels: size/m, platform/frontend, cla: signed
- Reviews: 1 | Comments: 3
- Linked issues: none

### Description

### Why / What / How

The frontend CI run on #14024 completed all tests, then failed during Happy DOM teardown when a delayed wallet confetti callback accessed `window` after it had been removed. The wallet also had a second uncancelled 300 ms balance-flash timer with the same lifecycle risk.

This PR makes both timers component-owned. Task-group confetti timers are tracked as a set and cancelled on unmount, while the balance flash keeps a single replaceable timer handle that is cancelled on unmount. The confetti cleanup is intentionally separate from the celebration effect so onboarding state updates do not cancel a valid in-flight celebration.

Failing run: https://github.com/Significant-Gravitas/AutoGPT/actions/runs/33204047905/job/98960589942

### Changes 🏗️

- Track and clear all delayed task-group confetti timers on unmount.
- Track, replace, and clear the wallet balance-flash timer without changing nullable-credit behavior.
- Add focused fake-timer regressions for both unmount paths and a transient unavailable-credit edge case.
- Remove the test comment that documented the now-fixed cross-test timer leak.

### Checklist 📋

#### For code changes:
- [x] I have clearly listed my changes in the PR description
- [x] I have made a test plan
- [x] I have tested my changes according to the test plan:
  - [x] Focused wallet suite: 15/15 passing
  - [x] `pnpm lint`
  - [x] `pnpm types`
  - [ ] `pnpm test:unit`: 554/559 files and 5,988/5,994 tests pass locally; the six failures are unrelated assertions that hard-code en-US currency/date formatting while this Windows runner resolves `Intl` to en-GB. All wallet tests pass.

#### For configuration changes:

- [x] `.env.default` is already compatible with my changes
- [x] `docker-compose.yml` is already compatible with my changes
- [x] No configuration changes are included


## PR #14229: perf(backend): cache redundant active-subscription lookups on the billing status endpoint

- URL: https://github.com/Significant-Gravitas/AutoGPT/pull/14229
- Author: Bentlybro
- Merged: 2026-08-29T15:11:23Z (created: 2026-08-29T13:17:52Z)
- Stats: +90 -12, 2 files
- Labels: size/l, platform/backend, cla: signed
- Reviews: 1 | Comments: 3
- Linked issues: none

### Description

### Why / What / How

**Why:** `get_subscription_status` (`GET /api/credits/subscription`) resolves the customer's active Stripe subscription up to three times in a single request — once each in `get_user_billing_cycle`, `get_active_subscription_period_end`, and `get_proration_credit_cents` — and the endpoint is hit on essentially every authenticated page load (PaywallGate wraps the app shell). Each of those repeats a live Stripe `Subscription.list` for the same customer, so a single page view fans out to several identical Stripe reads, and the same reads happen again on the next view.

**What:** Collapse those redundant lookups into one short-lived per-customer cache on the read-only display path.

**How:**
- Add `_get_active_subscription_cached`, a `@cached(ttl_seconds=15)` wrapper over `_get_active_subscription`, used by the three read-only display helpers.
- Route `get_proration_credit_cents` through it instead of its own `Subscription.list`, preserving the previous active-only semantics (a trialing sub still prorates to 0).
- Subscription **mutation** flows keep calling `_get_active_subscription` directly, so they always act on fresh Stripe state. The 15s window only affects display fields (billing cycle, next-invoice date, proration estimate), which the frontend re-fetches and which self-correct well within tolerances already in place elsewhere (the pending-change lookup is cached for 30s).

Net effect: ~3–4 Stripe `Subscription.list` calls per request drop to ~1 per customer per window, cutting redundant Stripe traffic on the billing status endpoint with no change to authenticated behavior.

### Changes 🏗️

- `backend/data/credit.py`: new `_get_active_subscription_cached`; `get_user_billing_cycle`, `get_active_subscription_period_end`, and `get_proration_credit_cents` now share it.
- `backend/data/credit_subscription_test.py`: autouse fixture to isolate the new cache between tests; updated the proration test to the shared lookup; added a cache-dedup test and a trialing-sub proration test.

### Checklist 📋

#### For code changes:
- [x] I have clearly listed my changes in the PR description
- [x] I have made a test plan
- [ ] I have tested my changes according to the test plan:
  - [ ] Unit: proration (active + trialing), period-end, and the new cache-dedup test pass
  - [ ] Functional: `GET /api/credits/subscription` returns 200 with unchanged shape

#### For configuration changes:
- [x] `.env.default` is updated or already compatible with my changes (no config changes)
- [x] `docker-compose.yml` is updated or already compatible with my changes (no config changes)


## PR #8448: Updating docs nav structure to make Platform first class citizen v2 

- URL: https://github.com/Significant-Gravitas/AutoGPT/pull/8448
- Author: kbarnard10
- Merged: 2024-10-28T16:21:16Z (created: 2024-10-24T22:09:23Z)
- Stats: +674 -604, 51 files
- Labels: documentation, size/xl, Review effort [1-5]: 4, platform/backend
- Reviews: 1 | Comments: 6
- Linked issues: none

### Description

### Background

Updating the documentation navigation to create a section for Platform and moving AutoGPT Classic documentation to separate section. Cleaned up from original PR and incorporating that feedback. 

### Changes 🏗️
- Revised navigation structure to move classic to own section (no documentation changes) 
- Renaming "docs" to "contribute"
- Renaming "setup" to "getting started"
- Adding video to platform getting started documentation 
- Updated favicon
- New homepage copy based on approved blog copy 

## PR #14024: feat(platform): increase skill description limit to 1,024 chars

- URL: https://github.com/Significant-Gravitas/AutoGPT/pull/14024
- Author: Torantulino
- Merged: 2026-08-29T15:51:27Z (created: 2026-08-13T19:43:26Z)
- Stats: +76 -13, 5 files
- Labels: size/m, platform/frontend, platform/backend, cla: signed
- Reviews: 4 | Comments: 5
- Linked issues: none

### Description

### Why / What / How

The 250-character skill description cap is too restrictive for detailed, useful skill summaries. This raises the limit to 1,024 characters while keeping backend and frontend validation aligned.

This matches [Claude's skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), which specify a maximum of 1,024 characters for the `description` field and recommend describing both what a skill does and when to use it.

The change mirrors #13448 across the same five files on the latest `dev`: the backend limit and guardrail test, the frontend limit and validation test, and the skills-page upload test. The current frontend helper lives in the shared SkillsPanel path after later refactoring, so that current counterpart is updated.

### Changes 🏗️

- Raise backend `MAX_DESCRIPTION_CHARS` from 250 to 1,024
- Update the backend guardrail assertion to 1,024
- Raise frontend `MAX_SKILL_DESCRIPTION_CHARS` from 250 to 1,024
- Lock the frontend helper test to the 1,024-character limit
- Update the skills-page over-limit case to assert 1,025/1,024

### Checklist 📋

#### For code changes:
- [x] I have clearly listed my changes in the PR description
- [x] I have made a test plan
- [x] I have tested my changes according to the test plan:
  - [x] Frontend formatting
  - [x] Frontend lint (passes with pre-existing warnings)
  - [x] Frontend type-check
  - [x] Changed frontend suites: 23/23 tests pass
  - [x] Backend files compile and the 1,024 guardrail assertion is validated
  - [ ] Full frontend suite: 4,902 passed; 7 unrelated locale/environment-dependent tests failed under Windows/Node 22

#### For configuration changes:

Not applicable; this PR does not change configuration.

## PR #14231: feat(backend): per-user rate limit on the subscription status endpoint

- URL: https://github.com/Significant-Gravitas/AutoGPT/pull/14231
- Author: Bentlybro
- Merged: 2026-08-29T22:58:44Z (created: 2026-08-29T13:47:31Z)
- Stats: +370 -2, 5 files
- Labels: size/l, platform/frontend, platform/backend, cla: signed
- Reviews: 7 | Comments: 7
- Linked issues: none

### Description

### Why / What / How

**Why:** `GET /api/credits/subscription` is fetched on essentially every authenticated page load (PaywallGate wraps the app shell) and, on a cold cache, fans out to several Stripe reads per request. Unlike `/search/global` — which already has a per-user QPS limiter for the same reason (per-request fan-out to a paid API) — this endpoint has no request-rate ceiling, so a scripted client can hammer it unbounded.

**What:** Add a per-user rate limit to `GET /credits/subscription`, consistent with the existing search limiter.

**How:**
- New `credits_rate_limit.py`: a per-user fixed-window Redis counter (`SET NX EX` + `INCR`), **fail-open on Redis brown-out**, raising `429` past the cap. Single key per check (cluster-safe). Mirrors `backend/api/features/search/rate_limit.py`.
- Cap: **60 requests / minute / user**. The frontend shares one React Query entry with a 60s `staleTime`, so steady-state use is ~1/min per tab; even a heavy multi-tab user hard-reloading peaks around ~15/min — the cap leaves ~4x headroom.
- Wired as a **route dependency on the GET only**, so the internal callers of `get_subscription_status` (e.g. the POST update flow returning fresh state) are never affected — dependencies run for HTTP requests, not direct function calls.
- PaywallGate already renders its children regardless of the subscription query result (it only overlays a modal when `tier === "NO_TIER"`), so a 429 degrades gracefully rather than blocking the app.

### Changes 🏗️

- `backend/api/features/credits_rate_limit.py`: new per-user limiter + tests.
- `backend/api/features/v1.py`: apply it as a dependency on `GET /credits/subscription`.

### Checklist 📋

#### For code changes:
- [x] I have clearly listed my changes in the PR description
- [x] I have made a test plan
- [ ] I have tested my changes according to the test plan:
  - [ ] Unit: first-hit TTL, at/over-limit (429), fail-open on Redis error, per-user key isolation
  - [ ] Functional: `GET /api/credits/subscription` returns 200 under normal use; internal POST-update flow unaffected

#### For configuration changes:
- [x] `.env.default` is updated or already compatible with my changes (no config changes)
- [x] `docker-compose.yml` is updated or already compatible with my changes (no config changes)

