# Merged PRs: rust-lang/rust

## PR #161967: Rerun `tests/debuginfo` tests if repr data has changed

- URL: https://github.com/rust-lang/rust/pull/161967
- Author: Walnut356
- Merged: 2026-08-30T15:27:02Z (created: 2026-08-29T09:38:13Z)
- Stats: +21 -4, 1 files
- Labels: A-testsuite, T-bootstrap, S-waiting-on-bors, A-compiletest
- Reviews: 2 | Comments: 2
- Linked issues: none

### Description

<!-- homu-ignore:start -->
<!--
Please read our [LLM policy] before opening a PR,
If you used an LLM to generate any part of this PR, including the PR description, please disclose that according to our [guidelines][disclosure guidelines].
LLM contributions are not banned, but are held to a higher standard of review and correctness.

[LLM policy]: https://forge.rust-lang.org/policies/llm-usage.html
[disclosure guidelines]: https://rustc-dev-guide.rust-lang.org/llm-guidance/writing.html#disclosure-guidelines

If this PR is related to an unstable feature or an otherwise tracked effort,
please link to the relevant tracking issue here. If you don't know of a related
tracking issue or there are none, feel free to ignore this.

This PR will get automatically assigned to a reviewer. In case you would like
a specific user to review your work, you can assign it to them by using

    r? <reviewer name>

When merged, your PR's description becomes part of the commit message of a merge commit.
If you do not want certain parts of it (such as your LLM disclosure) to show up in the permanent git history,
surround them with a pair of HTML comments containing `homu-ignore:start` and `homu-ignore:end`.
-->
<!-- homu-ignore:end -->

Resolves https://github.com/rust-lang/rust/issues/161138

This also includes the necessary checking for GDB's data even though none exists atm (https://github.com/rust-lang/rust/pull/160377 will contain the first set). The extra handling doesn't hurt anything since we have to account for all the other tests that don't have repr data anyway.

In a followup, I can rename the `lldb_input` directory to something else (see: https://github.com/rust-lang/rust/pull/160137#discussion_r3748288184). Doing so requires me to touch a bunch of other places where the name is used, so it should probably be it's own PR. Making sure the tests rerun when the data changes is higher priority though atm.

r? @jieyouxu , @Kobzol 

cc @Mark-Simulacrum 



## PR #161977: update target-cpus test

- URL: https://github.com/rust-lang/rust/pull/161977
- Author: malezjaa
- Merged: 2026-08-30T15:27:02Z (created: 2026-08-29T13:33:54Z)
- Stats: +1 -6, 2 files
- Labels: T-compiler, S-waiting-on-bors
- Reviews: 0 | Comments: 3
- Linked issues: none

### Description

<!-- homu-ignore:start -->
<!--
Please read our [LLM policy] before opening a PR,
If you used an LLM to generate any part of this PR, including the PR description, please disclose that according to our [guidelines][disclosure guidelines].
LLM contributions are not banned, but are held to a higher standard of review and correctness.

[LLM policy]: https://forge.rust-lang.org/policies/llm-usage.html
[disclosure guidelines]: https://rustc-dev-guide.rust-lang.org/llm-guidance/writing.html#disclosure-guidelines

If this PR is related to an unstable feature or an otherwise tracked effort,
please link to the relevant tracking issue here. If you don't know of a related
tracking issue or there are none, feel free to ignore this.

This PR will get automatically assigned to a reviewer. In case you would like
a specific user to review your work, you can assign it to them by using

    r? <reviewer name>

When merged, your PR's description becomes part of the commit message of a merge commit.
If you do not want certain parts of it (such as your LLM disclosure) to show up in the permanent git history,
surround them with a pair of HTML comments containing `homu-ignore:start` and `homu-ignore:end`.
-->
<!-- homu-ignore:end -->
Fixes rust-lang/rust#133919


## PR #161902: coverage: Rename the three main coverage-info structs

- URL: https://github.com/rust-lang/rust/pull/161902
- Author: Zalathar
- Merged: 2026-08-30T15:27:02Z (created: 2026-08-28T06:33:10Z)
- Stats: +91 -92, 15 files
- Labels: A-LLVM, T-compiler, S-waiting-on-bors, A-code-coverage
- Reviews: 1 | Comments: 7
- Linked issues: none

### Description

This PR renames the three main structures used to carry per-function coverage info through different stages of compilation:
```text
- CoverageInfoHi       => CoverageEarlyInfo   // collected early, at the THIR/MIR boundary during MIR building
- FunctionCoverageInfo => CoverageMirInfo     // collected during the main MIR instrumentation pass
- CoverageIdsInfo      => CoverageCodegenInfo // collected during codegen, after MIR opts
```

The new names should hopefully help to keep the three structs distinct, while also avoiding the historical inconsistency of the previous names.

The renaming also resolves an old TODO of mine about `coverage_ids_info` no longer making sense as a name.

There should be no change to compiler behaviour.

## PR #162004: Remove unneeded clone in macro deriving

- URL: https://github.com/rust-lang/rust/pull/162004
- Author: Kobzol
- Merged: 2026-08-30T15:27:02Z (created: 2026-08-30T10:47:47Z)
- Stats: +3 -4, 1 files
- Labels: T-compiler, S-waiting-on-bors
- Reviews: 1 | Comments: 9
- Linked issues: none

### Description

Found this while looking at the parser and macro expansion. Note that `newitem` is already an owned `Box<Item>`, so there is no need to clone it.

I found a few other places where we clone unnecessarily before dropping a value, but they were all in diagnostics code and the clone was very cheap, so it isn't IMO worth the churn. None of them were detected by the `redundant_clone` Clippy lint, which is a shame - it should be more powerful!

r? nnethercote


## PR #162009: Rollup of 4 pull requests

- URL: https://github.com/rust-lang/rust/pull/162009
- Author: JonathanBrouwer
- Merged: 2026-08-30T15:27:02Z (created: 2026-08-30T11:54:56Z)
- Stats: +116 -106, 19 files
- Labels: A-LLVM, A-testsuite, T-compiler, T-bootstrap, merged-by-bors, rollup, A-compiletest
- Reviews: 0 | Comments: 8
- Linked issues: none

### Description

Successful merges:

 - rust-lang/rust#162004 (Remove unneeded clone in macro deriving)
 - rust-lang/rust#161902 (coverage: Rename the three main coverage-info structs)
 - rust-lang/rust#161967 (Rerun `tests/debuginfo` tests if repr data has changed)
 - rust-lang/rust#161977 (update target-cpus test)

<!-- homu-ignore:start -->
r? @ghost

[Create a similar rollup](https://bors.rust-lang.org/queue/rust?prs=162004,161902,161967,161977)
<!-- homu-ignore:end -->


