# Merged PRs: electron/electron

## PR #53312: build: update PGO profiles

- URL: https://github.com/electron/electron/pull/53312
- Author: electron-pgo-updater
- Merged: 2026-08-30T04:03:56Z (created: 2026-08-30T04:02:44Z)
- Stats: +7 -7, 7 files
- Labels: semver/none, no-backport, 46-x-y
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

Updates the PGO profile state files to the profiles generated and
uploaded by [this workflow run](https://github.com/electron/electron/actions/runs/33288252166).

Notes: none

## PR #53294: fix: crash in webRequest proxy for redirected CORS preflights and frameless factories

- URL: https://github.com/electron/electron/pull/53294
- Author: MarshallOfSound
- Merged: 2026-08-29T05:50:56Z (created: 2026-08-28T23:58:11Z)
- Stats: +76 -1, 5 files
- Labels: semver/patch, new-pr 🌱, merged/43-x-y, merged/44-x-y, 46-x-y, merged/45-x-y
- Reviews: 1 | Comments: 4
- Linked issues: none

### Description

#### Description of Change

- Returning `{ redirectURL }` from a `session.webRequest.onBeforeRequest` listener for a CORS preflight request crashed the main process; the preflight now fails instead (redirecting a preflight is not supported), matching the upstream extensions implementation this code is derived from.
- With an extension that has the `webRequest` permission loaded and no `session.webRequest` listeners registered, `net.fetch()` / `net.request()` from the main process crashed because the frameless URL loader factory was handed to the extensions WebRequest layer as a navigation factory. Main-process factories now stay on Electron's own proxy.
- Adds a crash-case fixture for each.

#### Checklist

- [x] PR description included
- [x] `npm test` passes
- [x] tests are [changed or added](https://github.com/electron/electron/blob/main/docs/development/testing.md)

#### Release Notes

Notes: Fixed crashes in the main process when a `webRequest.onBeforeRequest` listener redirected a CORS preflight request, and when calling `net.fetch()` with a `webRequest`-permission extension loaded.


## PR #53304: fix: crash in webRequest proxy for redirected CORS preflights and frameless factories

- URL: https://github.com/electron/electron/pull/53304
- Author: trop
- Merged: 2026-08-30T09:14:53Z (created: 2026-08-29T05:51:27Z)
- Stats: +76 -1, 5 files
- Labels: backport, semver/patch, 43-x-y
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

Backport of #53294

See that PR for details.


Notes: Fixed crashes in the main process when a `webRequest.onBeforeRequest` listener redirected a CORS preflight request, and when calling `net.fetch()` with a `webRequest`-permission extension loaded.


## PR #53174: fix: preload SwiftShader before the GPU sandbox locks down again

- URL: https://github.com/electron/electron/pull/53174
- Author: codebytere
- Merged: 2026-08-26T08:43:58Z (created: 2026-08-25T11:39:48Z)
- Stats: +47 -0, 2 files
- Labels: semver/patch, merged/42-x-y, merged/43-x-y, merged/44-x-y, 45-x-y
- Reviews: 3 | Comments: 5
- Linked issues: none

### Description

#### Description of Change

Fixes https://github.com/electron/electron/issues/52700

On Windows the GPU process turns on `MITIGATION_FORCE_MS_SIGNED_BINS` once its sandbox is up, so any of our own DLLs it needs later have to be loaded before that. `vk_swiftshader.dll` used to be preloaded there unconditionally; [CL 7636200](https://chromium-review.googlesource.com/c/chromium/src/+/7636200) (Chromium 148, so Electron 42 and later) made it conditional on SwiftShader being asked for on the command line. WebGPU's fallback adapter on Windows is SwiftShader over Vulkan (Dawn's D3D backends return no adapters for `forceFallbackAdapter`; WARP is only the software path for GL), and `WebGPUDecoderImpl` still asks for it when no D3D12 adapter is usable or a page passes `forceFallbackAdapter`, so that load is now rejected by Code Integrity (event 3033). For a normal install that just means no fallback adapter; for AppX/MSIX packages the loader treats it as package tampering, kills the GPU process and marks the package as needing repair, which is what #52700 and the linked reports describe. 41 is unaffected because its Chromium predates the CL.

This reverts that CL's `gpu_init.cc` change so the DLL is preloaded unconditionally again, as in 41; a narrower condition is proposed upstream at https://chromium-review.googlesource.com/c/chromium/src/+/8286976 and the patch goes away once that or an equivalent lands.

Verified on Windows 11 arm64 with an MSIX-installed Electron 42.9.2 app: `navigator.gpu.requestAdapter()` alone produces the 3033 and kills the GPU process with 0x060C201E (package goes to `Modified, NeedsRemediation`); the same build unpackaged logs the 3033 but survives; Electron 41.10.7 never loads the DLL late; and forcing the preload on 42 (`--enable-unsafe-swiftshader`) makes the events and the crash go away.

#### Checklist

- [x] I have filled out the PR description
- [x] [I have reviewed and verified the changes](https://github.com/electron/governance/blob/main/policy/ai.md)
- [x] [PR release notes](https://github.com/electron/clerk/blob/main/README.md) describe the change in a way relevant to app developers, and are [capitalized, punctuated, and past tense](https://github.com/electron/clerk/blob/main/README.md#examples).

#### Release Notes

Notes: Fixed the GPU process being terminated in AppX/MSIX packaged apps on Windows when WebGPU fell back to SwiftShader.




## PR #53199: fix: preload SwiftShader before the GPU sandbox locks down again

- URL: https://github.com/electron/electron/pull/53199
- Author: trop
- Merged: 2026-08-30T16:50:28Z (created: 2026-08-26T08:44:27Z)
- Stats: +47 -0, 2 files
- Labels: backport, semver/patch, 42-x-y
- Reviews: 3 | Comments: 2
- Linked issues: none

### Description

Backport of #53174

See that PR for details.


Notes: Fixed the GPU process being terminated in AppX/MSIX packaged apps on Windows when WebGPU fell back to SwiftShader.


