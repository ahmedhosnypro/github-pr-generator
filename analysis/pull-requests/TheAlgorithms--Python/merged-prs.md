# Merged PRs: TheAlgorithms/Python

## PR #15083: Add suffix automaton

- URL: https://github.com/TheAlgorithms/Python/pull/15083
- Author: Clear20-22
- Merged: 2026-08-30T08:07:24Z (created: 2026-08-25T17:24:08Z)
- Stats: +177 -0, 1 files
- Labels: tests are failing
- Reviews: 5 | Comments: 0
- Linked issues: none

### Description

### Describe your change:

This pull request implements the **Suffix Automaton (SAM)** data structure and algorithm in `strings/suffix_automaton.py`.

A Suffix Automaton is the minimal Deterministic Finite Automaton (DFA) that recognizes all suffixes and substrings of a given string in $O(N)$ time and $O(N)$ space.

**Key features implemented:**
- $O(1)$ amortized extension / $O(N)$ construction.
- $O(|pattern|)$ substring search (`contains`).
- $O(N)$ distinct substrings count (`count_distinct_substrings`).
- $O(|pattern|)$ substring occurrence count (`count_occurrences`).

* [x] Add an algorithm?
* [ ] Fix a bug or typo in an existing algorithm?
* [ ] Add or change doctests? -- Note: Please avoid changing both code and tests in a single pull request.
* [ ] Documentation change?

### Checklist:
* [x] I have read [CONTRIBUTING.md](https://github.com/TheAlgorithms/Python/blob/master/CONTRIBUTING.md).
* [x] This pull request is all my own work -- I have not plagiarized.
* [x] I know that pull requests will not be merged if they fail the automated tests.
* [x] This PR only changes one algorithm file. To ease review, please open separate PRs for separate algorithms.
* [x] All new Python files are placed inside an existing directory.
* [x] All filenames are in all lowercase characters with no spaces or dashes.
* [x] All functions and variable names follow Python naming conventions.
* [x] All function parameters and return values are annotated with Python [type hints](https://docs.python.org/3/library/typing.html).
* [x] All functions have [doctests](https://docs.python.org/3/library/doctest.html) that pass the automated testing.
* [x] All new algorithms include at least one URL that points to Wikipedia or another similar explanation.
* [x] If this pull request resolves one or more open issues then the description above includes the issue number(s) with a [closing keyword](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue): "Fixes #ISSUE-NUMBER".


## PR #15120: quantum: modernize QFT to Qiskit 2.x and re-enable its test

- URL: https://github.com/TheAlgorithms/Python/pull/15120
- Author: priya-sundaram-dev
- Merged: 2026-08-30T08:29:04Z (created: 2026-08-30T07:54:36Z)
- Stats: +36 -20, 3 files
- Labels: enhancement
- Reviews: 3 | Comments: 4
- Linked issues: none

### Description

### Describe your change:

Follow-up to #15118 and the ask in #15081. Re-opens #15119 (auto-closed by the keeper bot for the draft's unchecked template — CI has since gone fully green, so there's no reason to keep it a draft).

`quantum/q_fourier_transform.py` imported `Aer` and `execute` from `qiskit` — both **removed in the Qiskit 1.0 API break** — so the file could never import, which is why it sat on the `--ignore` list and its doctest was never validated. This ports it to the current API:

- Simulate with the **pure-Python `BasicSimulator`** (`transpile()` + `backend.run()`) instead of `Aer.get_backend("qasm_simulator")` + `execute()`. `BasicSimulator` ships inside `qiskit` core, so **no compiled `qiskit-aer` backend is required** — relevant because `qiskit-aer` has no Python 3.14 wheels yet (Qiskit/qiskit-aer#2378), while this repo requires Python ≥ 3.14.
- Seed the run (`seed_simulator=42`) and rewrite the doctest to check the **reproducible, shot-noise-independent** facts (all four outcomes appear; counts sum to the shot total) rather than exact per-state counts — the old `{'00': 2500, ...}` doctest was statistically impossible and only "passed" because it was ignored.
- Add `qiskit>=2` to `dependencies`; drop `--ignore=quantum/q_fourier_transform.py` and the stale `# TODO: #8818` comment from `build.yml`.

**CI is green:** `build` and `build_docs` both pass on the repo's Python 3.14 interpreter, confirming `qiskit` core installs/imports and the new doctest runs and passes. Closes the quantum half of #8818.

The remaining TensorFlow `--ignore` entries are hard-blocked by the Python 3.14 floor (TensorFlow tops out at 3.13); full matrix is in #15081 / the earlier #15119 thread.

* [ ] Add an algorithm?
* [x] Fix a bug or typo in an existing algorithm?
* [x] Add or change doctests? -- Note: Please avoid changing both code and tests in a single pull request.
* [ ] Documentation change?

### Checklist:
* [x] I have read [CONTRIBUTING.md](https://github.com/TheAlgorithms/Python/blob/master/CONTRIBUTING.md).
* [x] This pull request is all my own work -- I have not plagiarized.
* [x] I know that pull requests will not be merged if they fail the automated tests.
* [x] This PR only changes one algorithm file.  To ease review, please open separate PRs for separate algorithms.
* [x] All new Python files are placed inside an existing directory.
* [x] All filenames are in all lowercase characters with no spaces or dashes.
* [x] All functions and variable names follow Python naming conventions.
* [x] All function parameters and return values are annotated with Python [type hints](https://docs.python.org/3/library/typing.html).
* [x] All functions have [doctests](https://docs.python.org/3/library/doctest.html) that pass the automated testing.
* [x] All new algorithms include at least one URL that points to Wikipedia or another similar explanation.


## PR #15109: Add uv-pre-commit

- URL: https://github.com/TheAlgorithms/Python/pull/15109
- Author: cclauss
- Merged: 2026-08-30T10:49:07Z (created: 2026-08-28T09:25:36Z)
- Stats: +920 -530, 4 files
- Labels: documentation
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

### Describe your change:

Add https://github.com/astral-sh/uv-pre-commit to pre-commit to keep `uv.lock` up to date

Helps with https://github.com/TheAlgorithms/Python/security/dependabot

* [ ] Add an algorithm?
* [ ] Fix a bug or typo in an existing algorithm?
* [ ] Add or change doctests? -- Note: Please avoid changing both code and tests in a single pull request.
* [ ] Documentation change?
* [ ] Change pre-commit tests

### Checklist:
* [x] I have read [CONTRIBUTING.md](https://github.com/TheAlgorithms/Python/blob/master/CONTRIBUTING.md).
* [x] This pull request is all my own work -- I have not plagiarized.
* [x] I know that pull requests will not be merged if they fail the automated tests.
* [ ] This PR only changes one algorithm file.  To ease review, please open separate PRs for separate algorithms.
* [ ] All new Python files are placed inside an existing directory.
* [ ] All filenames are in all lowercase characters with no spaces or dashes.
* [ ] All functions and variable names follow Python naming conventions.
* [ ] All function parameters and return values are annotated with Python [type hints](https://docs.python.org/3/library/typing.html).
* [ ] All functions have [doctests](https://docs.python.org/3/library/doctest.html) that pass the automated testing.
* [ ] All new algorithms include at least one URL that points to Wikipedia or another similar explanation.
* [ ] If this pull request resolves one or more open issues then the description above includes the issue number(s) with a [closing keyword](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue): "Fixes #ISSUE-NUMBER".


## PR #15121: docs: add AGENTS.md with contribution rules for AI agents

- URL: https://github.com/TheAlgorithms/Python/pull/15121
- Author: priya-sundaram-dev
- Merged: 2026-08-30T10:59:57Z (created: 2026-08-30T09:55:08Z)
- Stats: +62 -0, 1 files
- Labels: documentation
- Reviews: 1 | Comments: 2
- Linked issues: none

### Description

### Describe your change:

Adds a model-neutral `AGENTS.md` at the repo root, as suggested by @cclauss in #15119, so AI coding agents (and their humans) have a single place that records the conventions that most often trip up automated PRs.

The headline rule is the one that keeps closing bot PRs: **`algorithms-keeper` closes any PR whose "Describe your change" section has no checked box**, so the file tells agents to tick the template before submitting. It also summarizes the ruff / type-hint / doctest / naming / placement requirements and points at `CONTRIBUTING.md` as the source of truth (it never overrides it).

I used the vendor-neutral `AGENTS.md` filename (the emerging cross-tool convention) rather than a tool-specific one so every agent picks it up.

* [x] Documentation change?

### Checklist:
* [x] I have read [CONTRIBUTING.md](https://github.com/TheAlgorithms/Python/blob/master/CONTRIBUTING.md).
* [x] This pull request is all my own work -- I have not plagiarized.
* [x] I know that pull requests will not be merged if they fail the automated tests.
* [x] All filenames are in all lowercase characters with no spaces or dashes.
* [x] All functions and variable names follow Python naming conventions.

## PR #14745: Add type hints to pancake_sort function

- URL: https://github.com/TheAlgorithms/Python/pull/14745
- Author: changsheng0804-blip
- Merged: 2026-08-30T17:00:33Z (created: 2026-05-31T15:05:20Z)
- Stats: +6 -1, 1 files
- Labels: enhancement
- Reviews: 2 | Comments: 0
- Linked issues: Fixes #14737

### Description

### Describe your change:

Added type hints to the pancake_sort function to improve code readability and static type checking support.

Changes made:
- Added from typing import List import
- Added type hints to pancake_sort(arr: List[int]) -> List[int]

Fixes #14737

* [x] Add an algorithm?
* [ ] Fix a bug or typo in an existing algorithm?
* [ ] Documentation change?

### Checklist:
* [x] I have read [CONTRIBUTING.md](https://github.com/TheAlgorithms/Python/blob/master/CONTRIBUTING.md).
* [x] This pull request is all my own work -- I have not plagiarized.
* [x] I know that pull requests will not be merged if they fail the automated tests.
* [x] This PR only changes one algorithm file. To ease review, please open separate PRs for separate algorithms.
* [x] All new Python files are placed inside an existing directory.
* [x] All filenames are in all lowercase characters with no spaces or dashes.
* [x] All functions and variable names follow Python naming conventions.
* [x] All function parameters and return values are annotated with Python [type hints](https://docs.python.org/3/library/typing.html).
* [x] All functions have doctests that pass the automated testing.
* [x] All new algorithms include at least one URL that points to Wikipedia or another similar explanation.
* [x] If this pull request resolves one or more open issues then the description above includes Fixes #\.
