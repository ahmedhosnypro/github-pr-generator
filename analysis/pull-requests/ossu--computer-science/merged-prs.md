# Merged PRs: ossu/computer-science

## PR #1410: Fix space invaders demo link

- URL: https://github.com/ossu/computer-science/pull/1410
- Author: kevintprivett
- Merged: 2026-04-15T07:33:58Z (created: 2026-03-30T05:17:15Z)
- Stats: +16 -1, 3 files
- Labels: none
- Reviews: 0 | Comments: 5
- Linked issues: none

### Description

The space invaders demo link is broken on the spd course page.

Rather than rely on youtube, I added the video to the repo and made a simple page to show the video.

Video credit to @pulkitkrishna00 included with permission.


## PR #1425: Pin Python version to 3.8.X

- URL: https://github.com/ossu/computer-science/pull/1425
- Author: kevintprivett
- Merged: 2026-04-21T03:00:42Z (created: 2026-04-20T05:36:59Z)
- Stats: +3 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

It's come up that some of the course code is incompatible with current versions of Python.  The course used Python 3.8 during lectures so that seems like best option.

The previous course page recommended to download the latest version of Spyder, but they dropped support for Python 3.8 with version 6.1, so I've updated the link and notes accordingly.

Ref:
https://github.com/ossu/computer-science/issues/1266#issuecomment-3796512005
https://discord.com/channels/744385009028431943/744397783523524659/1491865335735779619

## PR #1324: Change High School Math FAQ to OSSU Pre-College Math

- URL: https://github.com/ossu/computer-science/pull/1324
- Author: Flomza
- Merged: 2025-05-13T02:21:00Z (created: 2025-04-14T03:03:27Z)
- Stats: +7 -25, 2 files
- Labels: none
- Reviews: 0 | Comments: 4
- Linked issues: none

### Description

Also adds link to linear algebra prerequisite mentioned under Computer Graphics.

## PR #1443: docs: update resource links to HTTPS

- URL: https://github.com/ossu/computer-science/pull/1443
- Author: 2023Anita
- Merged: 2026-06-26T01:05:54Z (created: 2026-06-18T10:36:30Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Summary
- update the networking course and Wireshark lab links to HTTPS
- update the Semantic Versioning link to HTTPS

## Validation
- verified the HTTPS URLs respond successfully
- ran `git diff --check`

## PR #1447: Remove incorrect class-based Lecture 30 archive

- URL: https://github.com/ossu/computer-science/pull/1447
- Author: Sushanth012
- Merged: 2026-07-14T05:38:25Z (created: 2026-07-07T06:31:24Z)
- Stats: +2 -2, 1 files
- Labels: none
- Reviews: 0 | Comments: 2
- Linked issues: none

### Description

Addresses ossu/computer-science#1441

Summary:
- Remove the Lecture 30 YouTube archive because it points to CS2510 Shortest Path, which belongs with Lecture 31.
- Note that Lecture 22, Lecture 28, and Lecture 30 original course videos are broken, with only Lecture 28 currently listed as archived.

Validation:
- git diff --check
