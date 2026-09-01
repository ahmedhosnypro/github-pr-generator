# Merged PRs: nodejs/node

## PR #65278: zlib: avoid waiting for paused ZIP iterators

- URL: https://github.com/nodejs/node/pull/65278
- Author: trivikr
- Merged: 2026-08-30T12:30:00Z (created: 2026-08-14T03:57:31Z)
- Stats: +26 -4, 2 files
- Labels: zlib, author ready, needs-ci
- Reviews: 2 | Comments: 8
- Linked issues: #65277

### Description

Fixes: https://github.com/nodejs/node/issues/65277

Track file-backed contentIterator() reads only while I/O is active. This lets ZipFile.close() finish when an iterator is paused after yielding a chunk, while still waiting for reads in flight.

---

Assisted-by: codex:gpt-5.6-sol

## PR #65406: node-api: enter env context for async callbacks

- URL: https://github.com/nodejs/node/pull/65406
- Author: codebytere
- Merged: 2026-08-30T15:52:09Z (created: 2026-08-19T20:53:55Z)
- Stats: +109 -0, 2 files
- Labels: c++, node-api
- Reviews: 1 | Comments: 7
- Linked issues: none

### Description

`AsyncResource::CallbackScope` has to be opened with the resource's environment context entered; `InternalCallbackScope` otherwise asserts that `Environment::GetCurrent(isolate)` is that environment. `uvimpl::Work::AfterThreadPoolWork()` and the thread-safe function's `DispatchOne()` and `Finalize()` opened it with only a `HandleScope`, while `CallFinalizer()` beside them enters `context()` first. With one Environment per isolate that never shows, since the loop runs with that context entered. With two Environments on one isolate sharing a loop, an addon's `napi_async_work` completion or thread-safe function call aborts the process whenever the other Environment's context is the current one when the loop gets to it:

```
#  Node.js[216]: node::InternalCallbackScope::InternalCallbackScope(...) at ../../src/api/callback.cc:108
#  Assertion failed: (Environment::GetCurrent(isolate)) == (env)
```

This enters the node-api env's context at those three sites, the same way the zlib and WebCrypto thread pool callbacks do. In `Finalize()` the scope covers only the finalizer call rather than the whole function: `context()` returns a handle onto the env's persistent, and `MaybeDelete()` at the end can drop the last reference and free the env, so a function-wide scope would exit through a dead handle (`test_threadsafe_function_shutdown` covers that).

The node-api env's own context is used rather than `node_env()->context()`; they are the same today since addons only load in the principal realm.

**Tests:** new cctest `NodeApiTest.AsyncCallbacksEnterOwnContext` creates two Environments on one isolate, queues async work and a thread-safe function call from an addon in the first with the second's context entered, runs the loop, and checks that the complete callback, `call_js` and the thread-safe function's finalizer each ran in the addon's context; it hits the assertion above on `main` and passes here. cctest, node-api, js-native-api and async-hooks suites pass.

---

Disclosure: the code, test and this description were written by Claude Code, directed and reviewed by @codebytere.


## PR #65622: src: add missing vector include

- URL: https://github.com/nodejs/node/pull/65622
- Author: panva
- Merged: 2026-08-30T16:32:43Z (created: 2026-08-28T16:26:58Z)
- Stats: +1 -0, 1 files
- Labels: fast-track, author ready, needs-ci, dependencies
- Reviews: 4 | Comments: 5
- Linked issues: #65620

### Description

Fixes: https://github.com/nodejs/node/issues/65620

## PR #61415: async_hooks: add trackPromises option to createHook()

- URL: https://github.com/nodejs/node/pull/61415
- Author: joyeecheung
- Merged: 2026-01-28T11:25:24Z (created: 2026-01-17T22:35:29Z)
- Stats: +145 -9, 9 files
- Labels: semver-minor, async_hooks, needs-ci, commit-queue-squash
- Reviews: 9 | Comments: 7
- Linked issues: none

### Description

This adds a trackPromises option that allows users to completely opt out of the promise hooks that are installed whenever an async hook is added. For those who do not need to track promises, this avoids the excessive hook invocation and the heavy overhead from it.

This option was previously already implemented internally to skip the noise from promise hooks when debugging async operations via the V8 inspector. This patch just exposes it.

Refs: https://github.com/nodejs/node/pull/57148

<!--
Before submitting a pull request, please read:

- the CONTRIBUTING guide at https://github.com/nodejs/node/blob/HEAD/CONTRIBUTING.md
- the commit message formatting guidelines at
  https://github.com/nodejs/node/blob/HEAD/doc/contributing/pull-requests.md#commit-message-guidelines

For code changes:
1. Include tests for any bug fixes or new features.
2. Update documentation if relevant.
3. Ensure that `make -j4 test` (UNIX), or `vcbuild test` (Windows) passes.

If you believe this PR should be highlighted in the Node.js CHANGELOG
please add the `notable-change` label.

Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
-->


## PR #65618: doc: clarify DEP0207 scope

- URL: https://github.com/nodejs/node/pull/65618
- Author: aduh95
- Merged: 2026-08-30T18:44:07Z (created: 2026-08-28T14:00:37Z)
- Stats: +12 -6, 3 files
- Labels: author ready, commit-queue-failed, dont-land-on-v22.x, dont-land-on-v24.x, dont-land-on-v26.x
- Reviews: 5 | Comments: 4
- Linked issues: none

### Description

Refs: https://github.com/nodejs/node/pull/63249

