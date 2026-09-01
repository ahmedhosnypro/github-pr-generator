# Merged PRs: immich-app/immich

## PR #31080: fix: generate release notes from the previous release on the line

- URL: https://github.com/immich-app/immich/pull/31080
- Author: bo0tzz
- Merged: 2026-08-28T14:56:13Z (created: 2026-08-28T08:18:31Z)
- Stats: +12 -0, 1 files
- Labels: changelog:skip, backport:release/v3.2
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

GitHub picks the globally latest release as the starting point, which is wrong
once a patch release and a newer line coexist. Release candidates now describe
the delta since the previous candidate, and a full release the whole line.


## PR #31094: fix: generate release notes from the previous release on the line

- URL: https://github.com/immich-app/immich/pull/31094
- Author: immich-push-o-matic
- Merged: 2026-08-28T15:06:35Z (created: 2026-08-28T14:56:33Z)
- Stats: +12 -0, 1 files
- Labels: changelog:skip
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

Backport of #31080 to `release/v3.2`.

## PR #30976: fix(web): misleading toast notification 

- URL: https://github.com/immich-app/immich/pull/30976
- Author: brn-lin
- Merged: 2026-08-27T17:08:55Z (created: 2026-08-24T20:34:59Z)
- Stats: +9 -3, 1 files
- Labels: 🖥️web, changelog:bugfix
- Reviews: 2 | Comments: 1
- Linked issues: Fixes #30849

### Description

## Description

Fixes #30849, misleading toast notification.

When trying to add a picture from an album that was shared from a different user into your own album, the toast message would say "Success", but with an appropriate "Asset cannot be added to the album" message. This happened because toastManager.primary() was used for all scenarios, including scenarios where assets cannot be added to the album.

I added the appropriate toastManager method to each of the branches in the if/else statement, so that each scenario will trigger the appropriate toast along with the appropriate message.


## How Has This Been Tested?

Since no test file for album.service.ts in the frontend web folder existed, I created one. The test file that I created only has tests for the part of the album.service.ts file that had the issue. The test suite tests that the appropriate toastManager method is called with the appropriate scenario.

In order to reproduce, just click on album.service.spec.ts and click the green check marks to run the tests yourself.


## Screenshots

### Before

<img width="362" height="165" alt="Before" src="https://github.com/user-attachments/assets/abc8fc1e-47ea-41a0-aa1e-7c2e2b83f804" />

### After

<img width="350" height="154" alt="After" src="https://github.com/user-attachments/assets/232b086a-4b13-49f9-8fab-b7f74ed888d2" />


## Checklist:

- [x] I have carefully read CONTRIBUTING.md
- [x] I have performed a self-review of my own code
- [x] I have made corresponding changes to the documentation if applicable
- [x] I have no unrelated changes in the PR.
- [x] I have confirmed that any new dependencies are strictly necessary.
- [x] I have written tests for new code (if applicable)
- [x] I have followed naming conventions/patterns in the surrounding code
- [x] All code in `src/services/` uses repositories implementations for database calls, filesystem operations, etc.
- [x] All code in `src/repositories/` is pretty basic/simple and does not have any immich specific logic (that belongs in `src/services/`)


## Please describe to which degree, if any, an LLM was used in creating this pull request.

I used ChatGPT to help me trace the bug through the codebase, and also to understand what was going on in this part of the codebase. I also used it to help me figure out what the root of the problem was. I also used it to generate a template test file, and then I manually fixed any errors and double checked it to make sure that it was testing things properly.


## PR #31128: chore(deps): update base-image to v202608300913

- URL: https://github.com/immich-app/immich/pull/31128
- Author: renovate
- Merged: 2026-08-30T09:35:21Z (created: 2026-08-30T09:26:23Z)
- Stats: +3 -3, 2 files
- Labels: dependencies, changelog:skip, renovate, backport:release/v3.2
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

This PR contains the following updates:

| Package | Type | Update | Change |
|---|---|---|---|
| [ghcr.io/immich-app/base-server-dev](https://redirect.github.com/immich-app/base-images) | stage | major | `202608251107` → `202608300913` |
| [ghcr.io/immich-app/base-server-prod](https://redirect.github.com/immich-app/base-images) | final | major | `202608251107` → `202608300913` |

---

### Release Notes

<details>
<summary>immich-app/base-images (ghcr.io/immich-app/base-server-dev)</summary>

### [`v202608300913`](https://redirect.github.com/immich-app/base-images/compare/202608251107...202608300913)

[Compare Source](https://redirect.github.com/immich-app/base-images/compare/202608251107...202608300913)

</details>

---

### Configuration

📅 **Schedule**: (UTC)

- Branch creation
  - "before 9am on tuesday"
- Automerge
  - At any time (no schedule defined)

🚦 **Automerge**: Disabled by config. Please merge this manually once you are satisfied.

♻ **Rebasing**: Whenever PR becomes conflicted, or you tick the rebase/retry checkbox.

🔕 **Ignore**: Close this PR and you won't be reminded about these updates again.

---

 - [ ] <!-- rebase-check -->If you want to rebase/retry this PR, check this box

---

This PR was generated by [Mend Renovate](https://mend.io/renovate/). View the [repository job log](https://developer.mend.io/github/immich-app/immich).
<!--renovate-debug:eyJjcmVhdGVkSW5WZXIiOiI0NC40OS4wIiwidXBkYXRlZEluVmVyIjoiNDQuNDkuMCIsInRhcmdldEJyYW5jaCI6Im1haW4iLCJsYWJlbHMiOlsiY2hhbmdlbG9nOnNraXAiLCJkZXBlbmRlbmNpZXMiLCJyZW5vdmF0ZSJdfQ==-->


## PR #31129: chore(deps): update base-image to v202608300913

- URL: https://github.com/immich-app/immich/pull/31129
- Author: immich-push-o-matic
- Merged: 2026-08-30T10:44:15Z (created: 2026-08-30T09:35:40Z)
- Stats: +3 -3, 2 files
- Labels: changelog:skip
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

Backport of #31128 to `release/v3.2`.
