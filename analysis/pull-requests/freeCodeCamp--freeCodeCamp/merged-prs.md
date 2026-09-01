# Merged PRs: freeCodeCamp/freeCodeCamp

## PR #69787: fix: flaky test in ms-trophy

- URL: https://github.com/freeCodeCamp/freeCodeCamp/pull/69787
- Author: huyenltnguyen
- Merged: 2026-08-28T19:26:49Z (created: 2026-08-28T12:01:04Z)
- Stats: +5 -2, 1 files
- Labels: platform: learn
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

Checklist:

<!-- Please follow this checklist and put an x in each of the boxes, like this: [x]. It will ensure that our team takes your pull request seriously. -->

- [x] I have read and followed the [contribution guidelines](https://contribute.freecodecamp.org).
- [x] I have read and followed the [how to open a pull request guide](https://contribute.freecodecamp.org/how-to-open-a-pull-request/).
- [x] My pull request targets the `main` branch of freeCodeCamp.
- [x] I have tested these changes either locally on my machine, or GitHub Codespaces.

<!--If your pull request closes a GitHub issue, replace the XXXXX below with the issue number.-->

This is an attempt to resolve:

<img width="882" height="70" alt="Screenshot 2026-08-28 at 18 58 13" src="https://github.com/user-attachments/assets/732b93e2-f276-4e91-889c-b9b53dd0d6a0" />

Log: https://github.com/freeCodeCamp/freeCodeCamp/actions/runs/33151375010/job/98792389409#step:10:2097

I suspect the cause is similar to #69500: we need to wait for dialogs to appear / disappear.

<!-- Feel free to add any additional description of changes below this line -->


## PR #69273: refactor(curriculum): Replace regex-based test cases in Binary Search Workshop

- URL: https://github.com/freeCodeCamp/freeCodeCamp/pull/69273
- Author: jeffrinkdev
- Merged: 2026-08-29T08:07:19Z (created: 2026-08-04T22:35:12Z)
- Stats: +94 -46, 14 files
- Labels: status: waiting review, scope: curriculum, js v9 cert, Naomi's Sprints
- Reviews: 24 | Comments: 6
- Linked issues: #68694

### Description

Checklist:

<!-- Please follow this checklist and put an x in each of the boxes, like this: [x]. It will ensure that our team takes your pull request seriously. -->

- [x] I have read and followed the [contribution guidelines](https://contribute.freecodecamp.org).
- [x] I have read and followed the [how to open a pull request guide](https://contribute.freecodecamp.org/how-to-open-a-pull-request/).
- [x] My pull request targets the `main` branch of freeCodeCamp.
- [x] I have tested these changes either locally on my machine, or GitHub Codespaces.

<!--If your pull request closes a GitHub issue, replace the XXXXX below with the issue number.-->

Closes #68694

<!-- Feel free to add any additional description of changes below this line -->

## Overview
- Used Explorer AST tools where possible to replace brittle or inflexible hint tests.
- Updated all other regex tests to be more flexible about operand ordering, syntax, etc..
- Added runtime tests of the camper's function in the final step.
- Added additional hints where warranted or instructed by the course.
- Clarified some hints and instructions.

## Notes
- Much of the workshop involved statements within the main function that are not directly exposed by Explorer AST tools and, in those cases, retained the regex-based tests. Nearly all of those tests were improved.

## Suggested Improvements


1. [**FOLLOW-UP**: I opened a new issue (#69534) to address this.]
The workshop itself can be improved to require the user to use `const` and `let`/`var` more correctly. As it stands:
    1. Everything is currently a `let` declaration in the seeds and solutions (and is perfectly functional code).
    1. We don't ask for or require the camper to use one or the other.
    1. The original hint tests permitted any of the three declaration styles.
    1. Functionally, some of those _must_ remain `let`, like `low` and `high` for example outside of the `while` loop.
    1. Other declarations probably should be `const`, like `mid` and `valueAtMiddle` inside the `while` loop.
    1. The declaration type can be determined by considering the full variable expression string from Explorer helpers. Example: "variable.toString()" will return something like `let foo = 0` which can then be matched.


## PR #69797: fix: clarify second-best laptop instructions

- URL: https://github.com/freeCodeCamp/freeCodeCamp/pull/69797
- Author: noctis-coder
- Merged: 2026-08-29T17:53:30Z (created: 2026-08-29T04:23:14Z)
- Stats: +4 -4, 2 files
- Labels: status: waiting review, scope: curriculum
- Reviews: 2 | Comments: 2
- Linked issues: #69794

### Description

Checklist:

<!-- Please follow this checklist and put an x in each of the boxes, like this: [x]. It will ensure that our team takes your pull request seriously. -->

* [x] I have read and followed the [[contribution guidelines](https://contribute.freecodecamp.org/)](https://contribute.freecodecamp.org).
* [x] I have read and followed the [[how to open a pull request guide](https://contribute.freecodecamp.org/how-to-open-a-pull-request/)](https://contribute.freecodecamp.org/how-to-open-a-pull-request/).
* [x] My pull request targets the `main` branch of freeCodeCamp.
* [x] I have tested these changes either locally on my machine, or GitHub Codespaces.

Closes #69794

<!-- Feel free to add any additional description of changes below this line -->

Updated the JavaScript and Python Daily Coding Challenge instructions to make the expected laptop-selection behavior clearer and more precise.

* Clarified the meaning of the second-most expensive laptop.
* Improved the wording for the fallback option when the second-most expensive laptop is outside the budget.
* Kept the behavior consistent between the JavaScript and Python versions.

## PR #69793: fix(curriculum): add section headers to form validation lecture

- URL: https://github.com/freeCodeCamp/freeCodeCamp/pull/69793
- Author: TEE0207
- Merged: 2026-08-30T10:15:12Z (created: 2026-08-28T16:48:32Z)
- Stats: +12 -0, 1 files
- Labels: status: waiting review, scope: curriculum, js v9 cert, Naomi's Sprints
- Reviews: 3 | Comments: 0
- Linked issues: #69316

### Description

Added ## Title Case headers to break up the --interactive-- body into logical sections (HTML validation setup, pattern attribute, checkValidity, reportValidity, setCustomValidity, validity property), following the convention established in the sort method lecture. No prose changes, --questions-- untouched.

Checklist:

<!-- Please follow this checklist and put an x in each of the boxes, like this: [x]. It will ensure that our team takes your pull request seriously. -->

- [x] I have read and followed the [contribution guidelines](https://contribute.freecodecamp.org).
- [x] I have read and followed the [how to open a pull request guide](https://contribute.freecodecamp.org/how-to-open-a-pull-request/).
- [x] My pull request targets the `main` branch of freeCodeCamp.
- [x] I have tested these changes either locally on my machine, or GitHub Codespaces.

<!--If your pull request closes a GitHub issue, replace the XXXXX below with the issue number.-->

Closes #69316

<!-- Feel free to add any additional description of changes below this line -->


## PR #69799: chore(a11y): use semantic keyboard markup in Responsive Web Design V9

- URL: https://github.com/freeCodeCamp/freeCodeCamp/pull/69799
- Author: Naman-bh
- Merged: 2026-08-30T17:39:09Z (created: 2026-08-29T06:18:07Z)
- Stats: +12 -12, 9 files
- Labels: scope: curriculum, status: waiting update
- Reviews: 5 | Comments: 2
- Linked issues: #69724

### Description

Checklist:

<!-- Please follow this checklist and put an x in each of the boxes, like this: [x]. It will ensure that our team takes your pull request seriously. -->

- [x ] I have read and followed the [contribution guidelines](https://contribute.freecodecamp.org).
- [x ] I have read and followed the [how to open a pull request guide](https://contribute.freecodecamp.org/how-to-open-a-pull-request/).
- [x ] My pull request targets the `main` branch of freeCodeCamp.
- [x ] I have tested these changes either locally on my machine, or GitHub Codespaces.

<!--If your pull request closes a GitHub issue, replace the XXXXX below with the issue number.-->

Closes #69724

<!-- Feel free to add any additional description of changes below this line -->

