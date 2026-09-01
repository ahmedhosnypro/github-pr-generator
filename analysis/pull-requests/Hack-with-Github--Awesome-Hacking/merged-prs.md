# Merged PRs: Hack-with-Github/Awesome-Hacking

## PR #172: Added Awesome Drone Hacking List

- URL: https://github.com/Hack-with-Github/Awesome-Hacking/pull/172
- Author: nicholasaleks
- Merged: 2026-04-24T13:47:38Z (created: 2025-06-19T19:01:32Z)
- Stats: +1 -0, 1 files
- Labels: none
- Reviews: 13 | Comments: 2
- Linked issues: none

### Description

(empty)

## PR #173: feat: add Awesome Node.js Security to the list

- URL: https://github.com/Hack-with-Github/Awesome-Hacking/pull/173
- Author: lirantal
- Merged: 2026-04-20T14:27:49Z (created: 2025-07-12T18:52:48Z)
- Stats: +1 -0, 1 files
- Labels: none
- Reviews: 19 | Comments: 3
- Linked issues: none

### Description

adding a new awesome repo to the mix

## PR #211: redesign the repository banner with a cleaner GitHub-style visual identity

- URL: https://github.com/Hack-with-Github/Awesome-Hacking/pull/211
- Author: grayguava
- Merged: 2026-05-07T16:44:36Z (created: 2026-05-07T14:10:53Z)
- Stats: +1 -1, 3 files
- Labels: none
- Reviews: 1 | Comments: 3
- Linked issues: none

### Description

- replaced the original flat background with a modern gradient composition
- updated title typography using Hubot Sans (GitHub official font)
- used Segoe UI for supporting text to improve readability and hierarchy
- improved spacing, composition, and overall visual balance
- integrated the Securitocat mascot for a more playful GitHub-inspired aesthetic

mascot source:
https://octodex.github.com/securitocat/

## PR #234: chore: update lock-threads from v5 to v6.0.2

- URL: https://github.com/Hack-with-Github/Awesome-Hacking/pull/234
- Author: 0xbadshah
- Merged: 2026-07-26T03:12:31Z (created: 2026-07-26T03:09:58Z)
- Stats: +2 -2, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary

- Update `dessant/lock-threads` from v5 to v6.0.2
- v5 targets Node 20 which GitHub has deprecated; the runner forces it to Node 24 where it fails with `"github-token" length must be less than or equal to 100 characters long`
- v6.0.2 natively targets Node 24, fixing the failure

This workflow runs hourly and has been failing on every run, generating CI failure notifications.

## Test plan

- [ ] Verify the workflow passes on the next scheduled run (top of the hour)
- [ ] Or trigger manually via workflow_dispatch

## PR #235: chore: compress repository banner from PNG to WebP

- URL: https://github.com/Hack-with-Github/Awesome-Hacking/pull/235
- Author: 0xbadshah
- Merged: 2026-07-26T03:29:02Z (created: 2026-07-26T03:26:22Z)
- Stats: +6 -10, 4 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: #212

### Description

## Summary

- Compress repository banner from PNG (1.13 MB) to WebP (~124 KB) — 91% size reduction
- Replace manual contributor list with auto-generated contributors wall via contrib.rocks
- Cherry-picked from #212 (original author: @grayguava)

Closes #212
