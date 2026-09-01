# Merged PRs: firecrawl/firecrawl

## PR #4442: Exchange/applications proxy

- URL: https://github.com/firecrawl/firecrawl/pull/4442
- Author: developersdigest
- Merged: 2026-08-28T14:05:45Z (created: 2026-08-28T13:45:34Z)
- Stats: +13 -2, 1 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description



<!-- This is an auto-generated description by cubic. -->
## Summary by cubic
Adds a proxy for `/exchange/applications` so applicants can become providers without the `exchangeRetrieve` flag. Previously, every exchange route required that flag, which grants consuming the Exchange. The new route is for applicants who aren't yet customers, so requiring the flag would block them. The flag is now optional per route, defaulting to required, and only this route opts out.

<sup>Written for commit 50f16f3fededb2a1c9211fa01de8c5df484af4bb. Summary will update on new commits.</sup>

<a href="https://cubic.dev/pr/firecrawl/firecrawl/pull/4442?utm_source=github" target="_blank" rel="noopener noreferrer" data-no-image-dialog="true"><picture><source media="(prefers-color-scheme: dark)" srcset="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://www.cubic.dev/buttons/review-in-cubic-light.svg"><img alt="Review in cubic" src="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"></picture></a>

<!-- End of auto-generated description by cubic. -->



## PR #4444: feat(api/scrapeURL/formats/json): support ZDR

- URL: https://github.com/firecrawl/firecrawl/pull/4444
- Author: mogery
- Merged: 2026-08-28T17:42:52Z (created: 2026-08-28T17:24:32Z)
- Stats: +48 -13, 3 files
- Labels: none
- Reviews: 2 | Comments: 2
- Linked issues: none

### Description

ZDR deny policy on JSON mode has been lightened to only disallow json.agent/smart scrape (which is deprecated).
We must only use models in the JSON mode flow which we have ZDR agreements with going forward.

<!-- This is an auto-generated description by cubic. -->
---
## Summary by cubic
Relaxes Zero Data Retention (ZDR) restrictions on JSON mode, allowing non-agent JSON extraction while keeping the deprecated agent/smart scrape flow blocked.

- Passes the ZDR flag through to smart scrape, prompt injection guard, and schema generation to disable telemetry when ZDR is active.
- Blocks JSON mode with agent when ZDR is enabled, updating the warning message.

<sup>Written for commit 01c1a288820a6e65a02f3d4d0a1f0d0c4ea46e28. Summary will update on new commits.</sup>

<a href="https://cubic.dev/pr/firecrawl/firecrawl/pull/4444?utm_source=github" target="_blank" rel="noopener noreferrer" data-no-image-dialog="true"><picture><source media="(prefers-color-scheme: dark)" srcset="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://www.cubic.dev/buttons/review-in-cubic-light.svg"><img alt="Review in cubic" src="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"></picture></a>

<!-- End of auto-generated description by cubic. -->



## PR #4445: feat(exchange): proxy more routes

- URL: https://github.com/firecrawl/firecrawl/pull/4445
- Author: developersdigest
- Merged: 2026-08-28T20:18:25Z (created: 2026-08-28T20:12:30Z)
- Stats: +37 -0, 1 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description



<!-- This is an auto-generated description by cubic. -->
## Summary by cubic
Adds exchange proxy routes for `/platform`, `/publisher`, and `/claims` so those services are reachable through the exchange API.

- Proxies platform, publisher, and claims routes with `requiresRetrieveFlag` disabled.
- Uses the analytics timeout for platform and publisher routes and a new 20-second timeout for claims.

<sup>Written for commit 5c6d1e471eae994b1cca8dd0c38e0a32fae181c7. Summary will update on new commits.</sup>

<a href="https://cubic.dev/pr/firecrawl/firecrawl/pull/4445?utm_source=github" target="_blank" rel="noopener noreferrer" data-no-image-dialog="true"><picture><source media="(prefers-color-scheme: dark)" srcset="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://www.cubic.dev/buttons/review-in-cubic-light.svg"><img alt="Review in cubic" src="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"></picture></a>

<!-- End of auto-generated description by cubic. -->



## PR #4446: feat(exchange): proxy more routes

- URL: https://github.com/firecrawl/firecrawl/pull/4446
- Author: developersdigest
- Merged: 2026-08-28T22:21:38Z (created: 2026-08-28T21:56:41Z)
- Stats: +18 -0, 1 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description



<!-- This is an auto-generated description by cubic. -->
## Summary by cubic
Adds proxying for exchange rates lookup and claim release routes.

- Proxies `POST` and `GET /rates/lookup` through the existing exchange proxy.
- Proxies `POST /claims/:id/release` through the claims proxy.
- All three routes use the same rate limiter and auth as adjacent exchange routes.

<sup>Written for commit 4a7a2360cab016f4cf42b23029e24d89f352f3fe. Summary will update on new commits.</sup>

<a href="https://cubic.dev/pr/firecrawl/firecrawl/pull/4446?utm_source=github" target="_blank" rel="noopener noreferrer" data-no-image-dialog="true"><picture><source media="(prefers-color-scheme: dark)" srcset="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://www.cubic.dev/buttons/review-in-cubic-light.svg"><img alt="Review in cubic" src="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"></picture></a>

<!-- End of auto-generated description by cubic. -->



## PR #4448: fix(api): missing serde error

- URL: https://github.com/firecrawl/firecrawl/pull/4448
- Author: tomsideguide
- Merged: 2026-08-29T06:09:03Z (created: 2026-08-29T06:07:47Z)
- Stats: +2 -0, 1 files
- Labels: none
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description



<!-- This is an auto-generated description by cubic. -->
## Summary by cubic
Fixes missing serialization for `CONCURRENCY_QUEUE_TIMEOUT` errors so they now return the correct `ConcurrencyQueueTimeoutError` payload instead of falling through unhandled.

<sup>Written for commit 0d6a87614f910fc957ba40fbcc81f5eb8d1c96e1. Summary will update on new commits.</sup>

<a href="https://cubic.dev/pr/firecrawl/firecrawl/pull/4448?utm_source=github" target="_blank" rel="noopener noreferrer" data-no-image-dialog="true"><picture><source media="(prefers-color-scheme: dark)" srcset="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://www.cubic.dev/buttons/review-in-cubic-light.svg"><img alt="Review in cubic" src="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"></picture></a>

<!-- End of auto-generated description by cubic. -->



<!-- Note: 5 of 5 requested merged PRs returned. -->
