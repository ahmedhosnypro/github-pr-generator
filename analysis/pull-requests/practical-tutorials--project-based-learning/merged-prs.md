# Merged PRs: practical-tutorials/project-based-learning

## PR #875: Remove dead Scotch tutorial links

- URL: https://github.com/practical-tutorials/project-based-learning/pull/875
- Author: lonelyhty
- Merged: 2026-07-04T05:56:30Z (created: 2026-06-01T13:04:47Z)
- Stats: +2 -4, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Description
Removes or updates outdated Scotch tutorial links from the README:

- removes two Scotch tutorial entries that now return 410/404
- updates the Vue + GraphQL + Apollo tutorial to its DigitalOcean Community URL
- replaces the outdated ScotchIO additional resource with DigitalOcean Community Tutorials

## Motivation and Context
Helps with #344 by cleaning up dead or outdated tutorial links.

## How Has This Been Tested?
Checked the updated DigitalOcean URLs with HTTP HEAD requests and confirmed both return 200.

## Types of changes
- [x] Content Update (change which fixes an issue or updates an already existing submission)
- [ ] New Article (change which adds functionality)
- [ ] Documentation change

## Checklist:
- [x] My code follows the code style of this project.
- [x] I have updated the documentation accordingly.
- [x] I have read the **CONTRIBUTING** document.
- [x] I have made checks to ensure URLs and other resources are valid

## PR #876: Update Write You A Scheme link

- URL: https://github.com/practical-tutorials/project-based-learning/pull/876
- Author: lonelyhty
- Merged: 2026-07-04T05:56:36Z (created: 2026-06-02T08:11:43Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary
- Update the Write You A Scheme, Version 2 link to its canonical GitHub repository

## Verification
- `git diff --check`
- Confirmed the previous GitHub URL redirects to the updated destination
- Confirmed the updated GitHub URL returns `200` directly

## PR #881: Fix dead 'Build a Reddit Bot' link

- URL: https://github.com/practical-tutorials/project-based-learning/pull/881
- Author: Osamaali313
- Merged: 2026-07-04T05:56:42Z (created: 2026-06-09T19:39:51Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

The pythonforengineers.com "Build a Reddit Bot" tutorial moved. The old URL `http://pythonforengineers.com/build-a-reddit-bot-part-1/` returns **404**; the same article is live at `https://www.pythonforengineers.com/blog/build-a-reddit-bot-part-1/` (HTTP 200). This points the entry at the current location — same author, same content, one-line change.

## PR #893: docs: fix SSYGEN blog issues redirect and too-many-lists link

- URL: https://github.com/practical-tutorials/project-based-learning/pull/893
- Author: aoright
- Merged: 2026-07-04T05:56:48Z (created: 2026-06-29T05:05:20Z)
- Stats: +17 -17, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

This PR updates 16 blog issue links for the Lua/LÖVE BYTEPATH tutorial to point to the developer's new username (SSYGEN was renamed to a327ex). It also updates the link for 'Learning Rust with Too Many Linked Lists' to point to its active GitHub Pages path (rust-unofficial.github.io).

## PR #898: Add Next.js App Router tutorial

- URL: https://github.com/practical-tutorials/project-based-learning/pull/898
- Author: Sushanth012
- Merged: 2026-07-04T05:56:53Z (created: 2026-07-03T06:46:14Z)
- Stats: +4 -0, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: Closes #887

### Description

## Summary
- Adds a Next.js subsection to the JavaScript web applications list.
- Adds the official free Next.js App Router tutorial for building a full-stack dashboard app.

## Validation
- Verified the tutorial page loads and describes building a full-stack dashboard app with the App Router.
- Ran git diff --check.

Closes #887
