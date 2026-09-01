# Merged PRs: github/gitignore

## PR #1493: Merge the two Python ignore files

- URL: https://github.com/github/gitignore/pull/1493
- Author: gsnedders
- Merged: 2015-04-30T00:17:51Z (created: 2015-04-28T18:44:47Z)
- Stats: +1 -2, 2 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

There's only one `C.gitignore` instead of one for each of GCC/Clang/MSVC, so similarly there should be one `Python.gitignore` instead of one for each of CPython/Jython.

This adds the relevant ignore to `Python.gitignore` for Jython compiled Python files, and gets rid of `Jython.gitignore` (which hasn't been touched since it was added).


## PR #4860: Remove empty line in C++.gitignore

- URL: https://github.com/github/gitignore/pull/4860
- Author: bac0id
- Merged: 2026-05-15T23:06:05Z (created: 2026-05-10T09:14:46Z)
- Stats: +0 -1, 1 files
- Labels: none
- Reviews: 3 | Comments: 0
- Linked issues: none

### Description

Remove an empty line in `C++.gitignore`

## PR #4700: Add FreeCAD.gitignore file

- URL: https://github.com/github/gitignore/pull/4700
- Author: G0rocks
- Merged: 2026-05-21T23:49:32Z (created: 2025-08-06T10:13:55Z)
- Stats: +5 -0, 1 files
- Labels: feedback given
- Reviews: 4 | Comments: 15
- Linked issues: none

### Description

### Reasons for making this change

_TODO_
<!---
Please provide some background for this change.
--->
I was making a repository for a project in FreeCAD and didn't see a gitignore template for it so I'm suggesting it to be added :)

### Links to documentation supporting these rule changes

_TODO_

<!---
Link to the project docs, any existing .gitignore files that project may have in it's own repo, etc
--->
I only found [this](https://forum.freecad.org/viewtopic.php?t=58418) but it's for the developers of FreeCAD it seems so it's not made for 3D modeling project but for developing FreeCAD the program.

### If this is a new template

Link to application or project’s homepage: TODO
https://www.freecad.org/

### Merge and Approval Steps
- [x] Confirm that you've read the [contribution guidelines](https://github.com/github/gitignore/tree/main?tab=readme-ov-file#contributing-guidelines) and ensured your PR aligns
- [ ] Ensure CI is passing
- [ ] Get a review and Approval from one of the maintainers


## PR #4873: Updates missing .phpunit.cache dir for newer laravel

- URL: https://github.com/github/gitignore/pull/4873
- Author: lissy93
- Merged: 2026-07-23T16:06:45Z (created: 2026-06-18T10:20:22Z)
- Stats: +1 -0, 1 files
- Labels: none
- Reviews: 2 | Comments: 1
- Linked issues: none

### Description

### Link to the application or project's homepage

https://laravel.com/

### Reasons for making this change

laravel moved the default location for test results and coverage cache back in 2023, to just  `.phpunit.cache`.
The old `.phpunit.result.cache` is still useful for projects using PHPUnit 9 or below, so I didn't touch that.

### Links to documentation supporting these rule changes
Official Laravel `.gitignore`: https://github.com/laravel/laravel/blob/master/.gitignore#L11
(added in https://github.com/laravel/laravel/pull/6052, during the PHPUnit 10 upgrade)


### Merge and Approval Steps

- [X] I have read the [contribution guidelines](https://github.com/github/gitignore/tree/main?tab=readme-ov-file#contributing-guidelines) and understand my PR will be closed if it doesn't meet these guidelines


## PR #4741: Julia: ignore *.jl.*.mem and CondaPkg's project-local environment

- URL: https://github.com/github/gitignore/pull/4741
- Author: sundowatch
- Merged: 2026-08-25T17:02:50Z (created: 2025-10-04T05:58:47Z)
- Stats: +4 -0, 1 files
- Labels: none
- Reviews: 3 | Comments: 4
- Linked issues: none

### Description

Two rules for `Julia.gitignore`. The PR has been rescoped since it was opened — the earlier editor/OS and shared-library rules have been dropped, as those belong in `Global/` under the contributing guidelines.

### Reasons for making this change

**1. `*.jl.*.mem` — the existing `--track-allocation` rule matches nothing**

Julia writes allocation logs with the process ID embedded in the name: `<source>.jl.<pid>.mem`. The template currently only lists `*.jl.mem`, which does not match that. So the rule as written never ignores the files Julia actually produces.

The adjacent `--code-coverage` section already gets this right — it lists both `*.jl.cov` and `*.jl.*.cov`, because coverage output is named the same way. This change makes the allocation section symmetric with it.

Both filenames come from the same function in Julia's runtime, [`src/coverage.c`](https://github.com/JuliaLang/julia/blob/master/src/coverage.c):

```c
// jl_write_coverage_data
snprintf(stm, sizeof(stm), ".%d.cov", uv_os_getpid());
write_log_data(&coverageData, stm);

// jl_write_malloc_log
snprintf(stm, sizeof(stm), ".%d.mem", uv_os_getpid());
write_log_data(&mallocData, stm);
```

`write_log_data` appends that extension to the source path, so `foo.jl` becomes `foo.jl.51234.mem`. `jl_write_malloc_log` is the only place in the runtime that emits `.mem` files, and it always embeds the PID.

Reproducing it against the current template:

```console
$ curl -sO https://raw.githubusercontent.com/github/gitignore/main/Julia.gitignore
$ mv Julia.gitignore .gitignore
$ touch foo.jl.mem foo.jl.51234.mem foo.jl.cov foo.jl.51234.cov
$ git check-ignore -v foo.jl.51234.cov
.gitignore:3:*.jl.*.cov    foo.jl.51234.cov
$ git check-ignore -v foo.jl.51234.mem
$ echo $?
1     # not ignored
```

`foo.jl.51234.mem` is the file `julia --track-allocation=user` actually leaves behind, and it is currently untracked-but-not-ignored, so it shows up in `git status` and gets committed by accident.

**2. `.CondaPkg/` — a machine-specific Conda environment inside the project directory**

CondaPkg creates this directory in the active project and installs a full Conda environment into it. From [`src/resolve.jl`](https://github.com/JuliaPy/CondaPkg.jl/blob/main/src/resolve.jl):

```julia
# find the topmost env in the load_path which depends on CondaPkg
top_env = _resolve_top_env(load_path)
STATE.meta_dir = meta_dir = joinpath(top_env, ".CondaPkg")
...
conda_env = joinpath(meta_dir, "env")
```

The contents are downloaded binaries and absolute host paths — the same category as the `deps/usr/` and `deps/downloads/` rules already in this template. It is never correct to commit, and it is reconstructed by `CondaPkg.resolve()` on any machine.

This is not a niche package: 89 packages in the General registry depend on CondaPkg directly, and another 148 depend on PythonCall, which pulls it in. It is the standard mechanism for Python interop in Julia. CondaPkg's own repository [ignores it](https://github.com/JuliaPy/CondaPkg.jl/blob/main/.gitignore), as do [Flux.jl](https://github.com/FluxML/Flux.jl/blob/master/.gitignore), [Plots.jl](https://github.com/JuliaPlots/Plots.jl/blob/master/.gitignore) and [PythonCall.jl](https://github.com/JuliaPy/PythonCall.jl/blob/main/.gitignore). Because nothing else produces a `.CondaPkg` directory, the rule is inert for projects that don't use it.

### Links to documentation supporting these rule changes

- Julia manual, [`--track-allocation` / command-line options](https://docs.julialang.org/en/v1/manual/command-line-interface/#command-line-interface)
- Julia manual, [Profiling — memory allocation analysis](https://docs.julialang.org/en/v1/manual/profile/#Memory-allocation-analysis)
- Julia runtime source for both filenames: [`src/coverage.c`](https://github.com/JuliaLang/julia/blob/master/src/coverage.c)
- [`JuliaLang/julia/.gitignore`](https://github.com/JuliaLang/julia/blob/master/.gitignore) — carries both `*.jl.mem` and `*.jl.*.mem`
- CondaPkg.jl: [repository](https://github.com/JuliaPy/CondaPkg.jl) and [`.CondaPkg` creation in `src/resolve.jl`](https://github.com/JuliaPy/CondaPkg.jl/blob/main/src/resolve.jl)

### Scope

- One template only (`Julia.gitignore`), 4 added lines.
- Both rules go into a section describing the tool that generates them: `*.jl.*.mem` into the existing `--track-allocation` section, `.CondaPkg/` into a new section alongside the other package-generated rules.
- No duplicate rules. Neither pattern is matched by anything already in the template — verified with `git check-ignore` above.
- No editor, OS, or shared-library rules.

Happy to split this into two PRs, or to drop `.CondaPkg/` and land only the `*.jl.*.mem` fix, if either would be easier to review.

### Merge and Approval Steps
- [x] Confirm that you've read the [contribution guidelines](https://github.com/github/gitignore/tree/main?tab=readme-ov-file#contributing-guidelines) and ensured your PR aligns
- [x] Ensure CI is passing
- [ ] Get a review and Approval from one of the maintainers

