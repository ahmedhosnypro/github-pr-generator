# Merged PRs: yt-dlp/yt-dlp


## PR #17324: [docs] Fix `Namespace` documentation

- URL: https://github.com/yt-dlp/yt-dlp/pull/17324
- Author: doe1080
- Merged: 2026-08-29T22:12:12Z (created: 2026-07-28T17:26:47Z)
- Stats: +1 -2, 2 files
- Labels: docs/meta/cleanup
- Reviews: 2 | Comments: 4
- Linked issues: none

### Description

<!--
    **IMPORTANT**: PRs without the template will be CLOSED

    Due to the high volume of pull requests, it may be a while before your PR is reviewed.
    Please try to keep your pull request focused on a single bugfix or new feature.
    Pull requests with a vast scope and/or very large diff will take much longer to review.
    It is recommended for new contributors to stick to smaller pull requests, so you can receive much more immediate feedback as you familiarize yourself with the codebase.

    PLEASE AVOID FORCE-PUSHING after opening a PR, as it makes reviewing more difficult.

    PLEASE MAKE SURE TO ENABLE EDITS BY MAINTAINERS!
-->

### Description of your *pull request* and other information

<details open><summary>Template</summary> <!-- OPEN is intentional -->

<!--
    # PLEASE FOLLOW THE GUIDE BELOW

    - You will be asked some questions, please read them **carefully** and answer honestly
    - Put an `x` into all the boxes `[ ]` relevant to your *pull request* (like [x])
    - Use *Preview* tab to see what your *pull request* will actually look like
    - If any of the questions are left unanswered, your pull request will be closed
    - If any of your answers are dishonest, you will be permanently blocked from this repository
-->

### Before submitting a *pull request* you must attest to the following:
- [x] This pull request complies with yt-dlp's [**NO AI / NO LLM POLICY**](https://github.com/yt-dlp/yt-dlp/blob/master/CONTRIBUTING.md#no-ai--no-llm-policy)
- [x] I have skimmed through [contributing guidelines](https://github.com/yt-dlp/yt-dlp/blob/master/CONTRIBUTING.md#developer-instructions) including [yt-dlp coding conventions](https://github.com/yt-dlp/yt-dlp/blob/master/CONTRIBUTING.md#yt-dlp-coding-conventions)
- [x] I have [searched](https://github.com/yt-dlp/yt-dlp/search?q=is%3Apr&type=Issues) the tracker for similar pull requests

### In order to be accepted and merged into yt-dlp each piece of code must be in public domain or released under [Unlicense](http://unlicense.org/). Check those that apply and remove the others:
- [x] I am the original author of the code in this PR, and I am willing to release it under [Unlicense](http://unlicense.org/)

### What is the purpose of your *pull request*? Check those that apply and remove the others:
- [x] docs
</details>



## PR #17311: [utils] `subs_list_to_dict`: Fix empty value handling

- URL: https://github.com/yt-dlp/yt-dlp/pull/17311
- Author: doe1080
- Merged: 2026-08-29T21:55:23Z (created: 2026-07-26T01:47:24Z)
- Stats: +14 -2, 2 files
- Labels: bug
- Reviews: 6 | Comments: 0
- Linked issues: none

### Description

<!--
    **IMPORTANT**: PRs without the template will be CLOSED

    Due to the high volume of pull requests, it may be a while before your PR is reviewed.
    Please try to keep your pull request focused on a single bugfix or new feature.
    Pull requests with a vast scope and/or very large diff will take much longer to review.
    It is recommended for new contributors to stick to smaller pull requests, so you can receive much more immediate feedback as you familiarize yourself with the codebase.

    PLEASE AVOID FORCE-PUSHING after opening a PR, as it makes reviewing more difficult.

    PLEASE MAKE SURE TO ENABLE EDITS BY MAINTAINERS!
-->

### Description of your *pull request* and other information

Fix fallback behavior for empty subtitle `id` and `ext` values

<details open><summary>Template</summary> <!-- OPEN is intentional -->

<!--
    # PLEASE FOLLOW THE GUIDE BELOW

    - You will be asked some questions, please read them **carefully** and answer honestly
    - Put an `x` into all the boxes `[ ]` relevant to your *pull request* (like [x])
    - Use *Preview* tab to see what your *pull request* will actually look like
    - If any of the questions are left unanswered, your pull request will be closed
    - If any of your answers are dishonest, you will be permanently blocked from this repository
-->

### Before submitting a *pull request* you must attest to the following:
- [x] This pull request complies with yt-dlp's [**NO AI / NO LLM POLICY**](https://github.com/yt-dlp/yt-dlp/blob/master/CONTRIBUTING.md#no-ai--no-llm-policy)
- [x] I have skimmed through [contributing guidelines](https://github.com/yt-dlp/yt-dlp/blob/master/CONTRIBUTING.md#developer-instructions) including [yt-dlp coding conventions](https://github.com/yt-dlp/yt-dlp/blob/master/CONTRIBUTING.md#yt-dlp-coding-conventions)
- [x] I have [searched](https://github.com/yt-dlp/yt-dlp/search?q=is%3Apr&type=Issues) the tracker for similar pull requests

### In order to be accepted and merged into yt-dlp each piece of code must be in public domain or released under [Unlicense](http://unlicense.org/). Check those that apply and remove the others:
- [x] I am the original author of the code in this PR, and I am willing to release it under [Unlicense](http://unlicense.org/)

### What is the purpose of your *pull request*? Check those that apply and remove the others:
- [x] Core bug fix/improvement

</details>



## PR #17567: [ie/applepodcasts] Fix token caching

- URL: https://github.com/yt-dlp/yt-dlp/pull/17567
- Author: tcely
- Merged: 2026-08-29T23:22:48Z (created: 2026-08-29T14:26:56Z)
- Stats: +1 -1, 1 files
- Labels: site-bug
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

<!--
    **IMPORTANT**: PRs without the template will be CLOSED

    Due to the high volume of pull requests, it may be a while before your PR is reviewed.
    Please try to keep your pull request focused on a single bugfix or new feature.
    Pull requests with a vast scope and/or very large diff will take much longer to review.
    It is recommended for new contributors to stick to smaller pull requests, so you can receive much more immediate feedback as you familiarize yourself with the codebase.

    PLEASE AVOID FORCE-PUSHING after opening a PR, as it makes reviewing more difficult.

    PLEASE MAKE SURE TO ENABLE EDITS BY MAINTAINERS!
-->

### Description of your *pull request* and other information

It looks like this line was missing the rest needed to return the cached value.

Ahh. After reviewing aaf7405ba3a45b32c59f160426efc9b561af035a, it may have simply been missed when updating to the new approach.


<details open><summary>Template</summary> <!-- OPEN is intentional -->

<!--
    # PLEASE FOLLOW THE GUIDE BELOW

    - You will be asked some questions, please read them **carefully** and answer honestly
    - Put an `x` into all the boxes `[ ]` relevant to your *pull request* (like [x])
    - Use *Preview* tab to see what your *pull request* will actually look like
    - If any of the questions are left unanswered, your pull request will be closed
    - If any of your answers are dishonest, you will be permanently blocked from this repository
-->

### Before submitting a *pull request* you must attest to the following:
- [x] This pull request complies with yt-dlp's [**NO AI / NO LLM POLICY**](https://github.com/yt-dlp/yt-dlp/blob/master/CONTRIBUTING.md#no-ai--no-llm-policy)
- [x] I have skimmed through [contributing guidelines](https://github.com/yt-dlp/yt-dlp/blob/master/CONTRIBUTING.md#developer-instructions) including [yt-dlp coding conventions](https://github.com/yt-dlp/yt-dlp/blob/master/CONTRIBUTING.md#yt-dlp-coding-conventions)
- [x] I have [searched](https://github.com/yt-dlp/yt-dlp/search?q=is%3Apr&type=Issues) the tracker for similar pull requests

### In order to be accepted and merged into yt-dlp each piece of code must be in public domain or released under [Unlicense](http://unlicense.org/). Check those that apply and remove the others:
- [x] I am the original author of the code in this PR, and I am willing to release it under [Unlicense](http://unlicense.org/)

### What is the purpose of your *pull request*? Check those that apply and remove the others:
- [x] Fix or improvement to an extractor (Make sure to add/update tests)

</details>



## PR #16683: [ie] Do not warn on intentional generic results

- URL: https://github.com/yt-dlp/yt-dlp/pull/16683
- Author: FraFraFra-LongD
- Merged: 2026-08-30T13:53:38Z (created: 2026-05-10T16:00:26Z)
- Stats: +3 -0, 1 files
- Labels: enhancement, pending-fixes, core:extractor
- Reviews: 5 | Comments: 0
- Linked issues: none

### Description

### Description of your *pull request* and other information

`GenericIE._real_extract` emits a `"Falling back on generic information extractor"` warning for every URL it processes, including URLs that are deliberately handed off to `GenericIE` by dedicated extractors (e.g. `ThisVidIE`, `AtScaleConfIE`). This creates noise in the output for users of those extractors and obscures genuine accidental fallbacks.

`GenericIE` already has an `is_intentional` mechanism (gated on the URL-smuggled `to_generic` key, introduced for `KickStarterIE` and internal self-referencing paths in `generic.py` itself). However, `InfoExtractor.url_result()` provided no way for an extractor to pass that flag when delegating via `url_result(..., ie='Generic', ...)`, so extractors like `ThisVidIE` and `AtScaleConfIE` could not opt in.

1. **`extractor/common.py`**: Add an `intentional_generic` keyword argument to `url_result()`. When `True`, it smuggles `{'to_generic': True}` into the URL using the existing `smuggle_url` / `unsmuggle_url` mechanism, feeding directly into the pre-existing `is_intentional` check in `GenericIE`. No new keys or branches are introduced in `generic.py`.
2. **`extractor/thisvid.py`**: Pass `intentional_generic=True` to `url_result()`. `ThisVidIE` deliberately delegates to `GenericIE` (with `url_transparent=True`) to let Generic locate the embedded player while `ThisVidIE` supplies title, age limit, and uploader metadata.
3. **`extractor/atscaleconf.py`**: Pass `video_kwargs={'intentional_generic': True}` to `playlist_from_matches()`. The extractor scrapes video URLs from the conference page and intentionally routes each one through `GenericIE`.

No changes were made to extractors that use `GenericIE` as a genuine last-resort fallback (e.g. `lenta.py`); those will continue to emit the warning as expected.

<details open><summary>Template</summary>

### Before submitting a *pull request* make sure you have:
- [x] At least skimmed through [contributing guidelines](https://github.com/yt-dlp/yt-dlp/blob/master/CONTRIBUTING.md#developer-instructions) including [yt-dlp coding conventions](https://github.com/yt-dlp/yt-dlp/blob/master/CONTRIBUTING.md#yt-dlp-coding-conventions)
- [x] [Searched](https://github.com/yt-dlp/yt-dlp/search?q=is%3Apr&type=Issues) the bugtracker for similar pull requests

### In order to be accepted and merged into yt-dlp each piece of code must be in public domain or released under [Unlicense](http://unlicense.org/). Check those that apply and remove the others:
- [X] I am the original author of the code in this PR, and I am willing to release it under [Unlicense](http://unlicense.org/)
- [ ] I am not the original author of the code in this PR, but it is in the public domain or released under [Unlicense](http://unlicense.org/) (provide reliable evidence)
- [X] I have read the [policy against AI/LLM contributions](https://github.com/yt-dlp/yt-dlp/blob/master/CONTRIBUTING.md#automated-contributions-ai--llm-policy) and understand I may be blocked from the repository if it is violated

### What is the purpose of your *pull request*? Check those that apply and remove the others:
- [x] Fix or improvement to an extractor (Make sure to add/update tests)
- [x] Core bug fix/improvement

</details>


## PR #16934: [utils] `devalue`: Improve binary type parsing

- URL: https://github.com/yt-dlp/yt-dlp/pull/16934
- Author: doe1080
- Merged: 2026-08-30T13:58:46Z (created: 2026-06-11T17:14:39Z)
- Stats: +146 -20, 2 files
- Labels: bug, enhancement
- Reviews: 14 | Comments: 0
- Linked issues: none

### Description

<!--
    **IMPORTANT**: PRs without the template will be CLOSED
    
    Due to the high volume of pull requests, it may be a while before your PR is reviewed.
    Please try to keep your pull request focused on a single bugfix or new feature.
    Pull requests with a vast scope and/or very large diff will take much longer to review.
    It is recommended for new contributors to stick to smaller pull requests, so you can receive much more immediate feedback as you familiarize yourself with the codebase.

    PLEASE AVOID FORCE-PUSHING after opening a PR, as it makes reviewing more difficult.
-->

### Description of your *pull request* and other information

| Typecode | C type | Python min bytes | Windows / MSVC LLP64 | macOS / Linux LP64 |
|---|---|---:|---:|---:|
| `l` | `signed long` | 4 | 4 bytes | 8 bytes |
| `L` | `unsigned long` | 4 | 4 bytes | 8 bytes |
| `q` | `signed long long` | 8 | 8 bytes | 8 bytes |
| `Q` | `unsigned long long` | 8 | 8 bytes | 8 bytes |

https://docs.python.org/3/library/array.html
https://learn.microsoft.com/en-us/cpp/cpp/data-type-ranges
https://docs.oracle.com/cd/E19620-01/805-3024/lp64-1/index.html

<details open><summary>Template</summary> <!-- OPEN is intentional -->

<!--
    # PLEASE FOLLOW THE GUIDE BELOW

    - You will be asked some questions, please read them **carefully** and answer honestly
    - Put an `x` into all the boxes `[ ]` relevant to your *pull request* (like [x])
    - Use *Preview* tab to see what your *pull request* will actually look like
-->

### Before submitting a *pull request* make sure you have:
- [x] At least skimmed through [contributing guidelines](https://github.com/yt-dlp/yt-dlp/blob/master/CONTRIBUTING.md#developer-instructions) including [yt-dlp coding conventions](https://github.com/yt-dlp/yt-dlp/blob/master/CONTRIBUTING.md#yt-dlp-coding-conventions)
- [x] [Searched](https://github.com/yt-dlp/yt-dlp/search?q=is%3Apr&type=Issues) the bugtracker for similar pull requests

### In order to be accepted and merged into yt-dlp each piece of code must be in public domain or released under [Unlicense](http://unlicense.org/). Check those that apply and remove the others:
- [x] I am the original author of the code in this PR, and I am willing to release it under [Unlicense](http://unlicense.org/)
- [x] I have read the [policy against AI/LLM contributions](https://github.com/yt-dlp/yt-dlp/blob/master/CONTRIBUTING.md#automated-contributions-ai--llm-policy) and understand I may be blocked from the repository if it is violated

### What is the purpose of your *pull request*? Check those that apply and remove the others:
- [x] Core bug fix/improvement

</details>

