# Merged PRs: ohmyzsh/ohmyzsh

## PR #14031: fix(diagnostics): correct `reserved_words` array name

- URL: https://github.com/ohmyzsh/ohmyzsh/pull/14031
- Author: mxtymoshyk
- Merged: 2026-08-30T17:10:58Z (created: 2026-08-30T08:50:23Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 2 | Comments: 1
- Linked issues: none

### Description

`reserved_words` is declared on line 261, but the `is-at-least 5.1` branch appends to `reserved_word` — singular. zsh doesn't complain about assigning to an undeclared name, so this silently creates a new global array that no loop ever reads, and those seven names are never checked. The `else` branch just below spells `builtins` correctly, so only the modern-zsh path is affected.

In practice that means on any zsh >= 5.1 — so essentially every install in use — `omz_diagnostic_dump` never checks whether `declare`, `export`, `integer`, `float`, `local`, `readonly` or `typeset` have been redefined, and happily reports that all core commands are defined normally.

That set isn't incidental: a shadowed `local` or `typeset` is exactly the kind of thing that makes a shell behave inexplicably, and `builtins_fatal` on line 278 already lists `local` alongside `builtin` and `command`. So the dump is currently blind to one of the three things it treats as fatal. It also leaks a stray global array as a side effect.

Before moving these I checked that all seven really are reserved words in modern zsh, so the existing test on line 280 still passes for them on an unmodified shell and this doesn't produce false warnings:

```
declare: reserved     export: reserved      integer: reserved
float: reserved       local: reserved       readonly: reserved
typeset: reserved
```

zsh promoted them to reserved words in 5.1, which is why the `is-at-least 5.1` split exists in the first place — so this just restores what the branch was meant to do.

## Standards checklist:

- [x] The PR title is descriptive.
- [x] The PR doesn't replicate another PR which is already open.
- [x] I have read the contribution guide and followed all the instructions.
- [x] The code follows the code style guide detailed in the wiki.
- [x] The code is mine or it's from somewhere with an MIT-compatible license.
- [x] If I used AI tools (ChatGPT, Claude, Gemini, etc.) to assist with this contribution, I've disclosed it below.
- [x] The code is efficient, to the best of my ability, and does not waste computer resources.
- [x] The code is stable and I have tested it myself, to the best of my abilities.
- [ ] If the code introduces new aliases, I provide a valid use case for all plugin users down below.

## Changes:

- Fix the array name so the zsh >= 5.1 branch appends to `reserved_words` rather than creating an unused `reserved_word` global.

## Other comments:

AI-assisted: I've been using Oh My Zsh for years and wanted to contribute something back, so I used Claude to help audit the tree for bugs. This was one of the things it turned up. I've read the surrounding code, confirmed the behaviour myself on zsh 5.9.2, and can explain the change.


## PR #14032: fix(cli): keep completion flag when loading multiple plugins

- URL: https://github.com/ohmyzsh/ohmyzsh/pull/14032
- Author: mxtymoshyk
- Merged: 2026-08-30T17:11:31Z (created: 2026-08-30T08:50:26Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 2 | Comments: 1
- Linked issues: none

### Description

Inside the plugin loop, `has_completion` is assigned rather than accumulated:

```zsh
has_completion=$(( $#comp_files > 0 ))
```

Each iteration overwrites what the previous one concluded, so when the loop ends the flag reflects only the last plugin named on the command line.

`omz plugin load z docker` is enough to show it. `plugins/z/_z` sets the flag to 1 on the first iteration, then `plugins/docker/` — which has no top-level `_*` file, since its completions live in a `completions/` subdirectory — resets it to 0. `compinit` never runs, `_z` ends up in `$fpath` unregistered, and pressing Tab after `z ` does nothing with no error to explain why. Reversing the argument order makes it work, which is the tell that ordering matters when it shouldn't.

`(( has_completion )) || ...` short-circuits once the flag is set, so a later plugin without completions can no longer clear it. I kept it strictly 0/1 rather than summing, since it's consumed as a boolean by the `(( has_completion ))` test further down. Loading a single plugin is unaffected — with one iteration there's nothing to overwrite.

Simulating a load of one plugin with completions followed by one without:

```
before:  has_completion=0    (compinit skipped, _z never registered)
after:   has_completion=1
```

This might be related to #10412, but that one is about the startup `$fpath` path rather than `omz plugin load`, so I don't think this closes it.

## Standards checklist:

- [x] The PR title is descriptive.
- [x] The PR doesn't replicate another PR which is already open.
- [x] I have read the contribution guide and followed all the instructions.
- [x] The code follows the code style guide detailed in the wiki.
- [x] The code is mine or it's from somewhere with an MIT-compatible license.
- [x] If I used AI tools (ChatGPT, Claude, Gemini, etc.) to assist with this contribution, I've disclosed it below.
- [x] The code is efficient, to the best of my ability, and does not waste computer resources.
- [x] The code is stable and I have tested it myself, to the best of my abilities.
- [ ] If the code introduces new aliases, I provide a valid use case for all plugin users down below.

## Changes:

- Accumulate `has_completion` across the loop instead of overwriting it, so `compinit` re-runs whenever any loaded plugin ships completions.

## Other comments:

AI-assisted: I've been using Oh My Zsh for years and wanted to contribute something back, so I used Claude to help audit the tree for bugs. This was one of the things it turned up. I've read the surrounding code, confirmed the behaviour myself on zsh 5.9.2, and can explain the change.


## PR #14033: fix(git): restore `git_develop_branch` fallback in `gbds`

- URL: https://github.com/ohmyzsh/ohmyzsh/pull/14033
- Author: mxtymoshyk
- Merged: 2026-08-30T17:12:19Z (created: 2026-08-30T08:50:28Z)
- Stats: +3 -2, 1 files
- Labels: none
- Reviews: 2 | Comments: 0
- Linked issues: none

### Description

```zsh
local default_branch=$(git_main_branch)
(( ! $? )) || default_branch=$(git_develop_branch)
```

In zsh the exit status of `local var=$(cmd)` is the status of the `local` builtin, not of the command substitution — `local` succeeded, so `$?` is 0. The test therefore always passes, the `||` always short-circuits, and the `git_develop_branch` fallback is dead code.

That matters because `git_main_branch` doesn't simply fail when it finds nothing. Lines 47-49 have it guess and report that it guessed:

```zsh
# If no main branch was found, fall back to master but return error
echo master
return 1
```

So in a repository whose default branch is `develop` or `dev`, with no `master` or `main` anywhere, `default_branch` is left as the string `master` — a branch that doesn't exist. Every `git merge-base master $branch` then fails, nothing is ever identified as squash-merged, and `gbds` deletes nothing and reports nothing. For a command whose job is deleting branches, silently doing nothing is a fairly unhelpful failure mode.

Splitting the declaration from the assignment makes the status meaningful again. I used `||` directly rather than keeping the `$?` test, since that removes the need to reason about what `$?` refers to at that point — which is the trap the original fell into.

Verified with a stub that mimics `git_main_branch`'s echo-`master`-and-return-1 behaviour:

```
before:  master     (fallback never ran)
after:   develop
```

and with a stub that succeeds, confirming the success path still short-circuits and doesn't call `git_develop_branch`:

```
after:   main
```

Repos that do have `main` or `master` are unaffected, so this only repairs the failing case rather than changing which branch is preferred.

One thing I noticed while here but deliberately left alone to keep this reviewable: the same `local x=$(...)` followed by a `$?` test appears elsewhere in the tree and is probably worth a grep.

## Standards checklist:

- [x] The PR title is descriptive.
- [x] The PR doesn't replicate another PR which is already open.
- [x] I have read the contribution guide and followed all the instructions.
- [x] The code follows the code style guide detailed in the wiki.
- [x] The code is mine or it's from somewhere with an MIT-compatible license.
- [x] If I used AI tools (ChatGPT, Claude, Gemini, etc.) to assist with this contribution, I've disclosed it below.
- [x] The code is efficient, to the best of my ability, and does not waste computer resources.
- [x] The code is stable and I have tested it myself, to the best of my abilities.
- [ ] If the code introduces new aliases, I provide a valid use case for all plugin users down below.

## Changes:

- Split the declaration from the assignment in `gbds` so a failing `git_main_branch` actually triggers the `git_develop_branch` fallback.

## Other comments:

AI-assisted: I've been using Oh My Zsh for years and wanted to contribute something back, so I used Claude to help audit the tree for bugs. This was one of the things it turned up. I've read the surrounding code, confirmed the behaviour myself on zsh 5.9.2, and can explain the change.


## PR #14030: fix(systemadmin): quote awk program in `webtraffic`

- URL: https://github.com/ohmyzsh/ohmyzsh/pull/14030
- Author: mxtymoshyk
- Merged: 2026-08-30T17:15:27Z (created: 2026-08-30T08:50:21Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 2 | Comments: 0
- Linked issues: none

### Description

`webtraffic` wraps its awk program in double quotes, so zsh expands `$10` before awk ever sees it. zsh supports multi-digit positional parameters (unlike POSIX sh), so `$10` is read as the function's tenth argument, which is always unset. What awk actually receives is:

```
{sum+=} END {print sum/1024/1024/1024}
```

so the function has never printed a number — only:

```
awk: syntax error at source line 1
 context is
        >>> {sum+=} <<<
awk: illegal statement at source line 1
```

Single-quoting the program lets `$10` reach awk as a field reference, which is what was intended. This also matches the rest of the file: the awk one-liners on lines 134, 146 and 151 already use single quotes, and lines 118-119 use the escaped `\$6` form.

Tested against a two-line fixture whose 10th field is `1073741824` on each row, so a correct program has to print `2`:

```
before:  awk: syntax error ... >>> {sum+=} <<<     (exit 2)
after:   2                                          (exit 0)
```

## Standards checklist:

- [x] The PR title is descriptive.
- [x] The PR doesn't replicate another PR which is already open.
- [x] I have read the contribution guide and followed all the instructions.
- [x] The code follows the code style guide detailed in the wiki.
- [x] The code is mine or it's from somewhere with an MIT-compatible license.
- [x] If I used AI tools (ChatGPT, Claude, Gemini, etc.) to assist with this contribution, I've disclosed it below.
- [x] The code is efficient, to the best of my ability, and does not waste computer resources.
- [x] The code is stable and I have tested it myself, to the best of my abilities.
- [ ] If the code introduces new aliases, I provide a valid use case for all plugin users down below.

## Changes:

- Use single quotes for the `webtraffic` awk program so `$10` is interpreted by awk instead of zsh.

## Other comments:

AI-assisted: I've been using Oh My Zsh for years and wanted to contribute something back, so I used Claude to help audit the tree for bugs. This was one of the things it turned up. I've read the surrounding code, confirmed the behaviour myself on zsh 5.9.2, and can explain the change.


## PR #14029: fix(updater): silence git version check output

- URL: https://github.com/ohmyzsh/ohmyzsh/pull/14029
- Author: mxtymoshyk
- Merged: 2026-08-30T17:16:07Z (created: 2026-08-30T08:50:18Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 2 | Comments: 0
- Linked issues: none

### Description

The guard clause in `check_for_upgrade.sh` that checks whether git is installed has its redirections in the wrong order:

```zsh
   || ! command git --version 2>&1 >/dev/null \
```

Redirections are applied left to right, so `2>&1` points stderr at wherever stdout currently is (the terminal), and only then does `>/dev/null` move stdout. The net result is the opposite of the intent: stdout is discarded and stderr goes to the screen.

On a system without git, that means every interactive startup prints

```
zsh: command not found: git
```

before the prompt — which is precisely what this guard exists to avoid, since it's checking for git's absence so it can quietly disable the updater. It also breaks Powerlevel10k's instant prompt, which aborts if anything writes to the terminal during init.

Worth noting the exit status is identical either way (127 in both forms), so the guard already detects a missing git correctly today. This only changes whether it does so silently.

## Standards checklist:

- [x] The PR title is descriptive.
- [x] The PR doesn't replicate another PR which is already open.
- [x] I have read the contribution guide and followed all the instructions.
- [x] The code follows the code style guide detailed in the wiki.
- [x] The code is mine or it's from somewhere with an MIT-compatible license.
- [x] If I used AI tools (ChatGPT, Claude, Gemini, etc.) to assist with this contribution, I've disclosed it below.
- [x] The code is efficient, to the best of my ability, and does not waste computer resources.
- [x] The code is stable and I have tested it myself, to the best of my abilities.
- [ ] If the code introduces new aliases, I provide a valid use case for all plugin users down below.

## Changes:

- Swap `2>&1 >/dev/null` to `>/dev/null 2>&1` so the git availability check is actually silent.

## Other comments:

AI-assisted: I've been using Oh My Zsh for years and wanted to contribute something back, so I used Claude to help audit the tree for bugs. This was one of the things it turned up. I've read the surrounding code, confirmed the behaviour myself on zsh 5.9.2, and can explain the change.

I checked #13828 — it also touches `check_for_upgrade.sh` but only from line 108 down, so there's no overlap.

