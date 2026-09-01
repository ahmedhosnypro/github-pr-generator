# Merged PRs: kubernetes/kubernetes

## PR #140572: apimachinery: add k8s-label-key format validation for Condition.Type

- URL: https://github.com/kubernetes/kubernetes/pull/140572
- Author: darshansreenivas
- Merged: 2026-08-28T19:02:06Z (created: 2026-07-14T23:17:14Z)
- Stats: +164 -33, 32 files
- Labels: area/test, sig/network, sig/scheduling, area/apiserver, lgtm, sig/storage, sig/node, sig/api-machinery, sig/cluster-lifecycle, sig/autoscaling
- Reviews: 6 | Comments: 41
- Linked issues: none

### Description

/kind feature
/sig api-machinery

  #### What this PR does / why we need it:

   Migrates `metav1.Condition.Type` validation to Declarative Validation.

   This PR:
   - Adds a declarative validation tag to `Condition.Type`: `+k8s:format=k8s-label-key`
   - Marks the corresponding handwritten validation as covered by declarative validation
   - Adds declarative validation test coverage for invalid `Type` format values
   - Regenerates validation code and generated declarative validation tests

   #### Which issue(s) this PR is related to:

Part of #139638

Closes https://github.com/kubernetes/kubernetes/pull/139897


co-author @thesauravpoddar

## PR #141658: Bump containerd API 1.12.0-rc.0

- URL: https://github.com/kubernetes/kubernetes/pull/141658
- Author: liggitt
- Merged: 2026-08-28T20:54:04Z (created: 2026-08-28T18:16:42Z)
- Stats: +4879 -13225, 139 files
- Labels: sig/network, area/kubelet, kind/cleanup, sig/scheduling, area/kube-proxy, area/apiserver, area/kubectl, lgtm, area/cloudprovider, sig/storage
- Reviews: 0 | Comments: 5
- Linked issues: none

### Description

#### What type of PR is this?

/kind dependency
/kind cleanup

#### What this PR does / why we need it:

Updates containerd, drops unwanted dependencies and links

```release-note
NONE
```

/cc @dims

## PR #141500: apiextensions: report why the test server's healthz wait failed

- URL: https://github.com/kubernetes/kubernetes/pull/141500
- Author: krishhna24
- Merged: 2026-08-28T22:04:04Z (created: 2026-08-20T11:13:29Z)
- Stats: +21 -7, 1 files
- Labels: lgtm, sig/api-machinery, size/S, kind/flake, release-note-none, approved, cncf-cla: yes, ok-to-test, needs-priority, needs-triage
- Reviews: 2 | Comments: 15
- Linked issues: none

### Description

#### What type of PR is this?
/kind flake

#### What this PR does / why we need it:

When the embedded apiextensions-apiserver doesn't come up, `StartTestServer` gives you
this and nothing else:

    failed to wait for /healthz to return ok: timed out waiting for the condition

The status code, the response body and the request error all get thrown away. /healthz
lists the checks that haven't passed yet in its body, so the one thing that would tell
you what the server was stuck on is exactly the thing that gets dropped.

It now keeps the last probe that actually finished and prints it alongside the timeout.
Real output from a run where I pointed the probe at a bad path on purpose:

    failed to wait for /healthz to return ok: context deadline exceeded (last status 404,
    last error the server could not find the requested resource, last body "{\n  \"paths\":
    [\n    \"/apis\",\n ... \"/healthz/poststarthook/crd-informer-synced\", ...")

The probe that runs into the poll deadline gets aborted halfway and has nothing useful in
it, so it's skipped in favour of the previous one. My first version didn't do that and
printed `last status 0, last body ""` every time, which is how the guard ended up there.

While I was in here I swapped `wait.Poll` for `PollUntilContextTimeout`. `wait.Poll` is
deprecated ("This method does not return errors from context, use PollUntilContextTimeout"
in wait/poll.go) and it ignored the server context, so a teardown racing startup still
burned the full minute. `immediate` is false to keep the old sleep-first behaviour. The
`context.TODO()` on the probe goes away with it.

To be clear about what this is: it does not fix #141178. The conversion tests will keep
flaking. It just means the next failure says something. The triage on that issue had to
work backwards from four different symptoms that all look identical in the log, because
they all end at the same line.

The same wait.Poll pattern is in the kube-apiserver, kube-scheduler, kube-controller-manager
and cloud-provider test servers. I left those alone so this stays in one SIG. Happy to do
them separately if that's wanted.

#### Which issue(s) this PR is related to:

Related to #141178

#### Special notes for your reviewer:

No test change. This is the error path of a test helper, and every apiextensions
integration test goes through it - ./test/integration/conversion/ passes unchanged. To see
the new message I temporarily pointed the probe at /healthz-nope and ran
`go test ./test/integration/ -run TestMultipleRegistration`, which is where the output
above came from, then put it back.

I used AI assistance while working on this.

#### Does this PR introduce a user-facing change?

```release-note
NONE
```

/sig api-machinery
/assign @jpbetz
/cc @jefftree

## PR #141081: Unify code for PodGroups and CompositePodGroups in workloadForest

- URL: https://github.com/kubernetes/kubernetes/pull/141081
- Author: macsko
- Merged: 2026-08-28T10:56:04Z (created: 2026-07-31T15:30:54Z)
- Stats: +1001 -1693, 24 files
- Labels: kind/cleanup, sig/scheduling, lgtm, sig/node, size/XXL, release-note-none, approved, cncf-cla: yes, needs-priority, needs-triage
- Reviews: 23 | Comments: 23
- Linked issues: none

### Description

<!--  Thanks for sending a pull request!  Here are some tips for you:

1. If this is your first time, please read our contributor guidelines: https://git.k8s.io/community/contributors/guide/first-contribution.md#your-first-contribution and developer guide https://git.k8s.io/community/contributors/devel/development.md#development-guide
2. Please label this pull request according to what type of issue you are addressing, especially if this is a release targeted pull request. For reference on required PR/issue labels, read here:
https://git.k8s.io/community/contributors/devel/sig-release/release.md#issuepr-kind-label
3. Ensure you have added or ran the appropriate tests for your PR: https://git.k8s.io/community/contributors/devel/sig-testing/testing.md
4. If you want *faster* PR reviews, read how: https://git.k8s.io/community/contributors/guide/pull-requests.md#best-practices-for-faster-reviews
5. If the PR is unfinished, see how to mark it: https://git.k8s.io/community/contributors/guide/pull-requests.md#marking-unfinished-pull-requests
-->

#### What type of PR is this?

<!--
Add one of the following kinds:
/kind bug
/kind dependency
/kind cleanup
/kind documentation
/kind feature

Optionally add one or more of the following kinds if applicable:
/kind api-change
/kind deprecation
/kind failing-test
/kind flake
/kind regression
-->

/kind cleanup

#### What this PR does / why we need it:

This PR unifies handling of PodGroup and CompositePodGroup objects in scheduling queue (including workload forest) using a new AbstractPodGroup type that abstracts both objects.

#### Which issue(s) this PR is related to:
<!--
Please link relevant issues to help with tracking.

To automatically close the linked issue(s) when this PR is merged,
add the word "Fixes" before the issue number or link.
Do not use "Fixes" if the PR is of kind `failing-test` or `flake`.

Reference KEPs when applicable in addition to specific issues.

Examples:
Fixes #<issue number>
<issue link> (issue in a different repository)
KEP: https://github.com/kubernetes/enhancements/issues/<kep-issue-number>

If there is no associated issue, then write "N/A".
-->

#### Special notes for your reviewer:

Generative AI was used in the PR preparation. Changes were carefully reviewed before pushing.

#### Does this PR introduce a user-facing change?
<!--
If no, just write "NONE" in the release-note block below.
If yes, a release note is required:
Enter your extended release note in the block below. If the PR requires additional action from users switching to the new release, include the string "action required".

For more information on release notes see: https://git.k8s.io/community/contributors/guide/release-notes.md
-->
```release-note
NONE
```

#### Additional documentation e.g., KEPs (Kubernetes Enhancement Proposals), usage docs, etc.:

<!--
This section can be blank if this pull request does not require a release note.

When adding links which point to resources within git repositories, like
KEPs or supporting documentation, please reference a specific commit and avoid
linking directly to the master branch. This ensures that links reference a
specific point in time, rather than a document that may change over time.

See here for guidance on getting permanent links to files: https://help.github.com/en/articles/getting-permanent-links-to-files

Please use the following format for linking documentation:
- [KEP]: <link>
- [Usage]: <link>
- [Other doc]: <link>
-->
```docs

```

## PR #140779: enable commentstart check on extensions API group

- URL: https://github.com/kubernetes/kubernetes/pull/140779
- Author: liyuerich
- Merged: 2026-08-27T07:09:16Z (created: 2026-07-21T13:18:05Z)
- Stats: +527 -530, 40 files
- Labels: lgtm, sig/api-machinery, size/L, kind/api-change, release-note-none, approved, cncf-cla: yes, area/code-generation, needs-priority, needs-triage
- Reviews: 0 | Comments: 6
- Linked issues: none

### Description

<!--  Thanks for sending a pull request!  Here are some tips for you:

1. If this is your first time, please read our contributor guidelines: https://git.k8s.io/community/contributors/guide/first-contribution.md#your-first-contribution and developer guide https://git.k8s.io/community/contributors/devel/development.md#development-guide
2. Please label this pull request according to what type of issue you are addressing, especially if this is a release targeted pull request. For reference on required PR/issue labels, read here:
https://git.k8s.io/community/contributors/devel/sig-release/release.md#issuepr-kind-label
3. Ensure you have added or ran the appropriate tests for your PR: https://git.k8s.io/community/contributors/devel/sig-testing/testing.md
4. If you want *faster* PR reviews, read how: https://git.k8s.io/community/contributors/guide/pull-requests.md#best-practices-for-faster-reviews
5. If the PR is unfinished, see how to mark it: https://git.k8s.io/community/contributors/guide/pull-requests.md#marking-unfinished-pull-requests
-->

#### What type of PR is this?

<!--
Add one of the following kinds:
/kind bug
/kind dependency
/kind cleanup
/kind documentation
/kind feature

Optionally add one or more of the following kinds if applicable:
/kind api-change
/kind deprecation
/kind failing-test
/kind flake
/kind regression
-->
/kind api-change

#### What this PR does / why we need it:
Ensure comments start with the serialized version of the field name.

#### Which issue(s) this PR is related to:
<!--
Please link relevant issues to help with tracking.

To automatically close the linked issue(s) when this PR is merged,
add the word "Fixes" before the issue number or link.
Do not use "Fixes" if the PR is of kind `failing-test` or `flake`.

Reference KEPs when applicable in addition to specific issues.

Examples:
Fixes #<issue number>
<issue link> (issue in a different repository)
KEP: https://github.com/kubernetes/enhancements/issues/<kep-issue-number>

If there is no associated issue, then write "N/A".
-->
Relates to https://github.com/kubernetes/kubernetes/issues/134671

#### Special notes for your reviewer:

#### Does this PR introduce a user-facing change?
<!--
If no, just write "NONE" in the release-note block below.
If yes, a release note is required:
Enter your extended release note in the block below. If the PR requires additional action from users switching to the new release, include the string "action required".

For more information on release notes see: https://git.k8s.io/community/contributors/guide/release-notes.md
-->
```release-note
NONE
```

#### Additional documentation e.g., KEPs (Kubernetes Enhancement Proposals), usage docs, etc.:

<!--
This section can be blank if this pull request does not require a release note.

When adding links which point to resources within git repositories, like
KEPs or supporting documentation, please reference a specific commit and avoid
linking directly to the master branch. This ensures that links reference a
specific point in time, rather than a document that may change over time.

See here for guidance on getting permanent links to files: https://help.github.com/en/articles/getting-permanent-links-to-files

Please use the following format for linking documentation:
- [KEP]: <link>
- [Usage]: <link>
- [Other doc]: <link>
-->
```docs
NONE
```
