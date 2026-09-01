# Merged PRs: react/react-native

## PR #57712: Enable npm trusted publishing on 0.85

- URL: https://github.com/react/react-native/pull/57712
- Author: cipolleschi
- Merged: 2026-07-28T11:24:25Z (created: 2026-07-28T09:26:09Z)
- Stats: +560 -300, 20 files
- Labels: CLA Signed, p: Facebook, Partner
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Summary
- consolidate release, nightly, and bumped-package publication in `publish-npm.yml` with npm OIDC trusted publishing
- validate canonical repository metadata for every public package before Maven or npm publication
- add the missing popup-menu repository metadata and canonicalize the two SSH repository entries
- use the canonical GitHub API owner for release-asset uploads
- run post-publish, changelog, Podfile.lock, and draft-release jobs after a successful release publish
- backport Nicola Corti's Sonatype staging profile fix

This is stacked on #57711 and should be retargeted to `0.85-stable` after that PR merges. No post-release recovery/resume path is included.

## Changelog:
[Internal] - Migrate to trusted publishing.

## Test plan
- `node scripts/releases-ci/validate-npm-package-metadata.js` (24 packages)
- focused publisher, validator, and release-asset uploader Jest suites
- targeted ESLint and Prettier checks
- YAML parse and trusted-publishing/post-release job-graph assertions
- runtime syntax checks and `git diff --check`

Flow could not start locally because the installed Flow binary does not support `experimental.pattern_matching` and `casting_syntax` from this branch's `.flowconfig`.

## PR #58057: [0.86] Use macOS 26 runners for iOS E2E tests

- URL: https://github.com/react/react-native/pull/58057
- Author: cipolleschi
- Merged: 2026-08-21T13:17:16Z (created: 2026-08-21T12:57:29Z)
- Stats: +90 -42, 4 files
- Labels: CLA Signed, p: Facebook, Partner, Pick Request
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Summary:
Backports #57993 to `0.86-stable`.

Moves the RNTester and template app iOS E2E jobs from `macos-15-large` to `macos-26-large`, which provides the Xcode 26 environment now required by `idb-companion`. The workflows use the image default Xcode so the hosted simulator platform is available.

The Maestro runner now discovers an available iPhone Pro simulator from the newest installed runtime and boots it by UDID instead of depending on the `iPhone 16 Pro` device name. Since this stable branch predates the Maestro flow-runner refactor from `main`, the conflict was resolved by preserving its existing retry behavior and adding a focused simulator-selection test.

## Changelog:

[INTERNAL] [FIXED] - Run iOS E2E tests on macOS 26 runners with Xcode 26.

Test Plan:
- `git diff --check origin/0.86-stable...HEAD`
- `node --check .github/workflow-scripts/maestro-ios.js`
- Prettier check for the four changed files
- Ruby YAML parse for both changed workflows
- `yarn jest .github/workflow-scripts/__tests__/maestro-ios-test.js --runInBand --config '{"testEnvironment":"node","transform":{}}'`


## PR #58058: [0.87] Use macOS 26 runners for iOS E2E tests

- URL: https://github.com/react/react-native/pull/58058
- Author: cipolleschi
- Merged: 2026-08-21T13:17:44Z (created: 2026-08-21T12:57:42Z)
- Stats: +90 -42, 4 files
- Labels: CLA Signed, p: Facebook, Partner, Pick Request
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Summary:
Backports #57993 to `0.87-stable`.

Moves the RNTester and template app iOS E2E jobs from `macos-15-large` to `macos-26-large`, which provides the Xcode 26 environment now required by `idb-companion`. The workflows use the image default Xcode so the hosted simulator platform is available.

The Maestro runner now discovers an available iPhone Pro simulator from the newest installed runtime and boots it by UDID instead of depending on the `iPhone 16 Pro` device name. Since this stable branch predates the Maestro flow-runner refactor from `main`, the conflict was resolved by preserving its existing retry behavior and adding a focused simulator-selection test.

## Changelog:

[INTERNAL] [FIXED] - Run iOS E2E tests on macOS 26 runners with Xcode 26.

Test Plan:
- `git diff --check origin/0.87-stable...HEAD`
- `node --check .github/workflow-scripts/maestro-ios.js`
- Prettier check for the four changed files
- Ruby YAML parse for both changed workflows
- `yarn jest .github/workflow-scripts/__tests__/maestro-ios-test.js --runInBand --config '{"testEnvironment":"node","transform":{}}'`


## PR #58051: [0.86] Bump Hermes V1 to 250829098.0.17

- URL: https://github.com/react/react-native/pull/58051
- Author: cipolleschi
- Merged: 2026-08-24T10:24:58Z (created: 2026-08-21T11:40:18Z)
- Stats: +3 -3, 3 files
- Labels: CLA Signed, p: Facebook, Partner, Pick Request
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary:

Bump the Hermes V1 version used by React Native 0.86 from `250829098.0.16` to `250829098.0.17` across the compiler package, source tag, and engine version properties.

## Changelog:

[INTERNAL] [CHANGED] - Bump Hermes V1 to 250829098.0.17.

## Test Plan:

- `git diff --check origin/0.86-stable...HEAD`
- CI on this PR.

## PR #58052: [0.87] Bump Hermes V1 to 250829098.0.17

- URL: https://github.com/react/react-native/pull/58052
- Author: cipolleschi
- Merged: 2026-08-26T10:19:43Z (created: 2026-08-21T12:04:40Z)
- Stats: +3 -3, 3 files
- Labels: CLA Signed, p: Facebook, Partner, Pick Request
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary:

Bump the Hermes V1 version used by React Native 0.87 from `250829098.0.16` to `250829098.0.17` across the compiler package, source tag, and engine version properties.

## Changelog:

[INTERNAL] [CHANGED] - Bump Hermes V1 to 250829098.0.17.

## Test Plan:

- `git diff --check origin/0.87-stable...HEAD`
- CI on this PR.
