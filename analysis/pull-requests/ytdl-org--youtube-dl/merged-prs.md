# Merged PRs: ytdl-org/youtube-dl

## PR #33109: [YouTube] Update extractor for 2025-04, etc

- URL: https://github.com/ytdl-org/youtube-dl/pull/33109
- Author: dirkf
- Merged: 2025-04-08T00:59:00Z (created: 2025-04-07T17:33:38Z)
- Stats: +553 -258, 11 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

<details><summary>Boilerplate: own+yt-dlp code/bug fix+improvement</summary>

## Please follow the guide below

- You will be asked some questions, please read them **carefully** and answer honestly
- Put an `x` into all the boxes [ ] relevant to your *pull request* (like that [x])
- Use *Preview* tab to see how your *pull request* will actually look like

---

### Before submitting a *pull request* make sure you have:
- [x] [Searched](https://github.com/ytdl-org/youtube-dl/search?q=is%3Apr&type=Issues) the bugtracker for similar pull requests
- [x] Read [adding new extractor tutorial](https://github.com/ytdl-org/youtube-dl#adding-support-for-a-new-site)
- [x] Read [youtube-dl coding conventions](https://github.com/ytdl-org/youtube-dl#youtube-dl-coding-conventions) and adjusted the code to meet them
- [x] Covered the code with tests (note that PRs without tests will be REJECTED)
- [x] Checked the code with [flake8](https://pypi.python.org/pypi/flake8)

### In order to be accepted and merged into youtube-dl each piece of code must be in public domain or released under [Unlicense](http://unlicense.org/). Check one of the following options:
- [x] I am the original author of this code, except for portions from_yt-dlp_ for which this or the below have already been asserted, and I am willing to release it under [Unlicense](http://unlicense.org/)
- [ ] I am not the original author of this code but it is in public domain or released under [Unlicense](http://unlicense.org/) (provide reliable evidence)

### What is the purpose of your *pull request*?
- [x] Bug fix
- [x] Improvement
- [ ] New extractor
- [ ] New feature

---

</details>

### Description of your *pull request* and other information

The main object of this PR is to update the Youtube extractor to handle the latest players and improve compatibility with _yt-dlp_:
* [cache] now uses similar logic to yt-dlp, but with the modified `esc_rfc3986()` encoding cache keys, for Py2/3 compat
* [JSInterp]
  - various refactoring
  - unary operator handling is improved, now supporting `!`
* [JSInterp] Updates from _yt-dlp_
  - improve nested attribute support, attribute syntax prioritised over indexing
  - pass global stack when extracting objects
  - fix assignment to array elements with nested brackets 
* [YouTube]
  - rework nsig function name search
  - update cache required versions
* [YouTube] Updates from _yt-dlp_
  - rework signature test framework
  - add new signature tests

Perhaps too long delayed, the program version is updated. 

Rolled in are these changes:
* [compat]
  - add `compat_os_makedirs()` 
  - improve Py2 compatibility for URL Quoting
* [utils] Support optional safe argument for escape_rfc3986()
* [YouTube]
  - fix playlist continuation extraction
  - remove remaining hard-coded API keys
  - support shorts playlist
* [core]
  - align message routines better with yt-dlp
  - use `InfoExtractor` variants for remaining parent method calls
  - fix merging subtitles to empty target

Thx to relevant contributors per commit messages.

## PR #33189: [YouTube, misc] Back-ports from yt-dlp for broken YT player `2b83d2e0` and later

- URL: https://github.com/ytdl-org/youtube-dl/pull/33189
- Author: dirkf
- Merged: 2025-09-29T01:15:05Z (created: 2025-09-28T13:12:46Z)
- Stats: +213 -66, 5 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: fixes #33142, fixes #33187

### Description

## Please follow the guide below
<details>
<summary>Boilerplate: yt-dlp+own code, bug fix+new features</summary>
## Please follow the guide below

- You will be asked some questions, please read them **carefully** and answer honestly
- Put an `x` into all the boxes [ ] relevant to your *pull request* (like that [x])
- Use *Preview* tab to see how your *pull request* will actually look like

---

### Before submitting a *pull request* make sure you have:
- [x] [Searched](https://github.com/ytdl-org/youtube-dl/search?q=is%3Apr&type=Issues) the bugtracker for similar pull requests
- [x] Read [adding new extractor tutorial](https://github.com/ytdl-org/youtube-dl#adding-support-for-a-new-site)
- [x] Read [youtube-dl coding conventions](https://github.com/ytdl-org/youtube-dl#youtube-dl-coding-conventions) and adjusted the code to meet them
- [x] Covered the code with tests (note that PRs without tests will be REJECTED)
- [x] Checked the code with [flake8](https://pypi.python.org/pypi/flake8)

### In order to be accepted and merged into youtube-dl each piece of code must be in public domain or released under [Unlicense](http://unlicense.org/). Check one of the following options:
- [x] I am the original author of this code and I am willing to release it under [Unlicense](http://unlicense.org/), except for:
- [x] I am not the original author of this code but it is in public domain or released under [Unlicense](http://unlicense.org/) (provide reliable evidence): code from yt-dlp under Unlicense

### What is the purpose of your *pull request*?
- [x] Bug fix
- [ ] Improvement
- [ ] New extractor
- [x] New feature

</details>

---

### Description of your *pull request* and other information

This PR primarily addresses the problem of #33186. It includes a version of the interim fix from yt-dlp/yt-dlp#14398 (fixes #33187): thx @seproDev.

The PR also includes these changes:
* updates relevant YT player data: thx yt-dlp devs severally
* some YT extractor code clean-ups prompted by linting
* define a WEB user agent and force its use for video page downloads: fixes #33142
* add downloader support for the `available_at` (timestamp) format key and use it to implement the now required preroll waiting period for YT, as in yt-dlp/yt-dlp#14081: thx @bashonly
* fix YT subtitles extraction per yt-dlp/yt-dlp#13659: thx @bashonly
* extract srt subtitles for YT from yt-dlp/yt-dlp#13411: thx @gamer191
* extract fallback title and description from YT initial data, per yt-dlp/yt-dlp#14078: thx @bashonly
* support extracting LOCKUP_CONTENT_TYPE_VIDEO from YT subscriptions feed, per yt-dlp/yt-dlp#13665: thx @bashonly
* support the missing option --no-list-formats, as requested in yt-dlp/yt-dlp#14378
* and now we have to run the Windows stuff in Windows Server 2022, which apparently still supports our Py3.4 build.




## PR #33198: [YouTube] Rework alert handling, etc

- URL: https://github.com/ytdl-org/youtube-dl/pull/33198
- Author: dirkf
- Merged: 2025-10-18T10:02:28Z (created: 2025-10-17T07:20:18Z)
- Stats: +73 -79, 2 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: fixes #33196

### Description

<details>
<summary>Boilerplate: own+yt-dlp code, bug fix+improvement</summary>
## Please follow the guide below

- You will be asked some questions, please read them **carefully** and answer honestly
- Put an `x` into all the boxes [ ] relevant to your *pull request* (like that [x])
- Use *Preview* tab to see how your *pull request* will actually look like

---

### Before submitting a *pull request* make sure you have:
- [x] [Searched](https://github.com/ytdl-org/youtube-dl/search?q=is%3Apr&type=Issues) the bugtracker for similar pull requests
- [x] Read [adding new extractor tutorial](https://github.com/ytdl-org/youtube-dl#adding-support-for-a-new-site)
- [x] Read [youtube-dl coding conventions](https://github.com/ytdl-org/youtube-dl#youtube-dl-coding-conventions) and adjusted the code to meet them
- [x] Covered the code with tests (note that PRs without tests will be REJECTED)
- [x] Checked the code with [flake8](https://pypi.python.org/pypi/flake8)

### In order to be accepted and merged into youtube-dl each piece of code must be in public domain or released under [Unlicense](http://unlicense.org/). Check one of the following options:
- [x] I am the original author of this code and I am willing to release it under [Unlicense](http://unlicense.org/), except code from yt-dlp, for which this or the below has been asserted
- [ ] I am not the original author of this code but it is in public domain or released under [Unlicense](http://unlicense.org/) (provide reliable evidence)

### What is the purpose of your *pull request*?
- [x] Bug fix
- [x] Improvement
- [ ] New extractor
- [ ] New feature

</details>

---

### Description of your *pull request* and other information

* Reworks alert handling: fixes #33196
* Corrects some latent typos from #33189
* Modernises and simplifies some traversals.

As usual, (presumably) undependable dependencies caused the previously functional commit workflow to break, so now _wheel_ (whose installation from Python3.4's _pip-19.1_ began to fail) and _setuptools_ are always omitted when installing _pip_.

## PR #33216: [YouTube,etc]

- URL: https://github.com/ytdl-org/youtube-dl/pull/33216
- Author: dirkf
- Merged: 2025-11-21T01:52:11Z (created: 2025-11-05T04:22:19Z)
- Stats: +818 -186, 10 files
- Labels: none
- Reviews: 0 | Comments: 9
- Linked issues: Resolves #33200, Resolves #33212, fixes #33217

### Description

<details>
<summary>Boilerplate: own+yt-dlp code, bug fix+improvement</summary>
## Please follow the guide below

- You will be asked some questions, please read them **carefully** and answer honestly
- Put an `x` into all the boxes [ ] relevant to your *pull request* (like that [x])
- Use *Preview* tab to see how your *pull request* will actually look like

---

### Before submitting a *pull request* make sure you have:
- [x] [Searched](https://github.com/ytdl-org/youtube-dl/search?q=is%3Apr&type=Issues) the bugtracker for similar pull requests
- [x] Read [adding new extractor tutorial](https://github.com/ytdl-org/youtube-dl#adding-support-for-a-new-site)
- [x] Read [youtube-dl coding conventions](https://github.com/ytdl-org/youtube-dl#youtube-dl-coding-conventions) and adjusted the code to meet them
- [x] Covered the code with tests (note that PRs without tests will be REJECTED)
- [x] Checked the code with [flake8](https://pypi.python.org/pypi/flake8)

### In order to be accepted and merged into youtube-dl each piece of code must be in public domain or released under [Unlicense](http://unlicense.org/). Check one of the following options:
- [x] I am the original author of this code and I am willing to release it under [Unlicense](http://unlicense.org/), except code from yt-dlp, for which this or the below has been asserted
- [ ] I am not the original author of this code but it is in public domain or released under [Unlicense](http://unlicense.org/) (provide reliable evidence)

### What is the purpose of your *pull request*?
- [x] Bug fix
- [x] Improvement
- [ ] New extractor
- [ ] New feature

</details>

---

### Description of your *pull request* and other information

This PR updates the YT extractor to use different clients for video extraction, for as long as that works without some equivalent of yt-dlp/yt-dlp#14157, and makes the selection stable across supported Pythons.

Under the hood
* adds `partial_application` decorator function from _yt-dlp_ and applies it to relevant `utils` function 
* adds new `compat` definitions: `compat_filter_fns`, `compat_thread`, `compat_abc_ABC`
* adds `compat_dict` and `compat_dict_items` to support insertion-order-preserving dicts in all supported Pythons
* uses this to make traversal results stable
* adds `filter` traversal key and further traversal helper functions (`require`, `value`, `unpack`, `subs_list_to_dict`) from _yt-dlp_ with consequent test updates
* aligns `parse_duration()` behaviour with yt-dlp
* also fixes a few subsidiary YT-related bugs
  - completes the definition of `available_at`
  - targets pre-roll wait better
  - avoids spurious chapter extraction
  - improves mark_watched
  - improves detection of geo-restriction
  - fixes playlist thumbnail extraction
  - adds more codecs and dynamic range support - fixes #33217.

Resolves #33200.
Resolves #33212.

## PR #33227: [YouTube] YouTube etc, pt 2

- URL: https://github.com/ytdl-org/youtube-dl/pull/33227
- Author: dirkf
- Merged: 2025-11-26T03:02:36Z (created: 2025-11-26T02:17:55Z)
- Stats: +48 -54, 2 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: Fixes #33226

### Description

<details><summary>Boilerplate: own+yt-dlp code, bugfix+improvement</summary> 

## Please follow the guide below

- You will be asked some questions, please read them **carefully** and answer honestly
- Put an `x` into all the boxes [ ] relevant to your *pull request* (like that [x])
- Use *Preview* tab to see how your *pull request* will actually look like

---

### Before submitting a *pull request* make sure you have:
- [x] [Searched](https://github.com/ytdl-org/youtube-dl/search?q=is%3Apr&type=Issues) the bugtracker for similar pull requests
- [x] Read [adding new extractor tutorial](https://github.com/ytdl-org/youtube-dl#adding-support-for-a-new-site)
- [x] Read [youtube-dl coding conventions](https://github.com/ytdl-org/youtube-dl#youtube-dl-coding-conventions) and adjusted the code to meet them
- [x] Covered the code with tests (note that PRs without tests will be REJECTED)
- [x] Checked the code with [flake8](https://pypi.python.org/pypi/flake8)

### In order to be accepted and merged into youtube-dl each piece of code must be in public domain or released under [Unlicense](http://unlicense.org/). Check one of the following options:
- [x] I am the original author of this code and I am willing to release it under [Unlicense](http://unlicense.org/), except for yt-dlp code for which this or the below were already asserted
- [x] I am not the original author of this code but it is in public domain or released under [Unlicense](http://unlicense.org/) (provide reliable evidence)

### What is the purpose of your *pull request*?
- [x] Bug fix
- [x] Improvement
- [ ] New extractor
- [ ] New feature

---

</details>

### Description of your *pull request* and other information

See commit text.
Fixes #33226.

