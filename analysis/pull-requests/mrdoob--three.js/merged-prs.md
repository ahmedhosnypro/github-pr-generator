# Merged PRs: mrdoob/three.js

## PR #34396: Inspector: Support nonce and CSP compliance

- URL: https://github.com/mrdoob/three.js/pull/34396
- Author: sunag
- Merged: 2026-08-29T22:37:23Z (created: 2026-08-28T19:56:52Z)
- Stats: +94 -33, 7 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: Closes https://github.com/mrdoob/three.js/issues/34391

### Description

Closes https://github.com/mrdoob/three.js/issues/34391

**Description**

Enables `nonce` support and CSP compliance across the Inspector. 

## PR #34144: Editor: Add group selection.

- URL: https://github.com/mrdoob/three.js/pull/34144
- Author: Mugen87
- Merged: 2026-08-24T08:34:16Z (created: 2026-07-30T14:54:23Z)
- Stats: +397 -67, 7 files
- Labels: none
- Reviews: 1 | Comments: 5
- Linked issues: none

### Description

Fixed  #16276.

**Description**

The PR adds group selection similar to how Blender supports it:

- When holding "Shift", you can add/remove objects to a group of selected objects.
- The "a" key can be used to select/unselect all objects. The shortcut is configurable like all others.
- Objects can be added to a group in the viewport or via the outliner (same for removal).
- Proper history support.

https://github.com/user-attachments/assets/6eee8dce-a3cd-40f7-9d2e-d915560490e9

For testing: https://rawcdn.githack.com/mrdoob/three.js/75440962e3ae33a694e7eea495fa353422ce334b/editor/index.html

## PR #34401: Nodes: Add `updateBefore` and `updateAfter` support for compute stage

- URL: https://github.com/mrdoob/three.js/pull/34401
- Author: sunag
- Merged: 2026-08-30T13:11:27Z (created: 2026-08-29T10:41:19Z)
- Stats: +182 -79, 11 files
- Labels: none
- Reviews: 0 | Comments: 2
- Linked issues: none

### Description

Related issue: -

**Description**

This PR introduces support for `updateBefore` and `updateAfter` lifecycle hooks during compute pass execution (`renderer.compute()`), enabling nodes that require preparatory operations (such as `GaussianBlurNode`, render-to-texture passes, or nested computes) to execute before and after compute shaders.

<img width="648" height="822" alt="image" src="https://github.com/user-attachments/assets/e7b1ced2-d6d5-45a3-abb7-5acb15aec369" />

```js
const computeTexture = Fn( ( { storageTexture, inputTexture } ) => {

	const indexUV = uvec2( instanceIndex.mod( width ), instanceIndex.div( width ) );
	const uv = vec2( indexUV ).div( vec2( width, height ) );

	const texColor = gaussianBlur( texture( inputTexture ), 3 ).getTextureNode().sample( uv );

	textureStore( storageTexture, indexUV, texColor ).toWriteOnly();

} );
```


## PR #34404: chore(deps): update devdependencies (non-major)

- URL: https://github.com/mrdoob/three.js/pull/34404
- Author: renovate
- Merged: 2026-08-30T18:09:49Z (created: 2026-08-30T17:54:00Z)
- Stats: +320 -129, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

This PR contains the following updates:

| Package | Change | [Age](https://docs.renovatebot.com/merge-confidence/) | [Confidence](https://docs.renovatebot.com/merge-confidence/) |
|---|---|---|---|
| [eslint](https://eslint.org) ([source](https://redirect.github.com/eslint/eslint)) | [`10.9.0` → `10.9.1`](https://renovatebot.com/diffs/npm/eslint/10.9.0/10.9.1) | ![age](https://developer.mend.io/api/mc/badges/age/npm/eslint/10.9.1?slim=true) | ![confidence](https://developer.mend.io/api/mc/badges/confidence/npm/eslint/10.9.0/10.9.1?slim=true) |
| [eslint-plugin-html](https://redirect.github.com/BenoitZugmeyer/eslint-plugin-html) | [`8.1.4` → `8.2.0`](https://renovatebot.com/diffs/npm/eslint-plugin-html/8.1.4/8.2.0) | ![age](https://developer.mend.io/api/mc/badges/age/npm/eslint-plugin-html/8.2.0?slim=true) | ![confidence](https://developer.mend.io/api/mc/badges/confidence/npm/eslint-plugin-html/8.1.4/8.2.0?slim=true) |
| [eslint-plugin-jsdoc](https://redirect.github.com/gajus/eslint-plugin-jsdoc) | [`64.2.1` → `64.3.1`](https://renovatebot.com/diffs/npm/eslint-plugin-jsdoc/64.2.1/64.3.1) | ![age](https://developer.mend.io/api/mc/badges/age/npm/eslint-plugin-jsdoc/64.3.1?slim=true) | ![confidence](https://developer.mend.io/api/mc/badges/confidence/npm/eslint-plugin-jsdoc/64.2.1/64.3.1?slim=true) |
| [magic-string](https://redirect.github.com/Rich-Harris/magic-string) | [`1.2.2` → `1.2.3`](https://renovatebot.com/diffs/npm/magic-string/1.2.2/1.2.3) | ![age](https://developer.mend.io/api/mc/badges/age/npm/magic-string/1.2.3?slim=true) | ![confidence](https://developer.mend.io/api/mc/badges/confidence/npm/magic-string/1.2.2/1.2.3?slim=true) |
| [puppeteer](https://redirect.github.com/puppeteer/puppeteer/tree/main#readme) ([source](https://redirect.github.com/puppeteer/puppeteer)) | [`25.8.0` → `25.9.0`](https://renovatebot.com/diffs/npm/puppeteer/25.8.0/25.9.0) | ![age](https://developer.mend.io/api/mc/badges/age/npm/puppeteer/25.9.0?slim=true) | ![confidence](https://developer.mend.io/api/mc/badges/confidence/npm/puppeteer/25.8.0/25.9.0?slim=true) |
| [rollup](https://rollupjs.org/) ([source](https://redirect.github.com/rollup/rollup)) | [`4.62.5` → `4.63.1`](https://renovatebot.com/diffs/npm/rollup/4.62.5/4.63.1) | ![age](https://developer.mend.io/api/mc/badges/age/npm/rollup/4.63.1?slim=true) | ![confidence](https://developer.mend.io/api/mc/badges/confidence/npm/rollup/4.62.5/4.63.1?slim=true) |

---

### Release Notes

<details>
<summary>eslint/eslint (eslint)</summary>

### [`v10.9.1`](https://redirect.github.com/eslint/eslint/compare/v10.9.0...5c8c2417b9ff462f2dc4e54a062c59135b45b845)

[Compare Source](https://redirect.github.com/eslint/eslint/compare/v10.9.0...v10.9.1)

</details>

<details>
<summary>BenoitZugmeyer/eslint-plugin-html (eslint-plugin-html)</summary>

### [`v8.2.0`](https://redirect.github.com/BenoitZugmeyer/eslint-plugin-html/compare/v8.1.4...28a7c4c16f6152ad5412da0d3fd8cbb56925abc8)

[Compare Source](https://redirect.github.com/BenoitZugmeyer/eslint-plugin-html/compare/v8.1.4...28a7c4c16f6152ad5412da0d3fd8cbb56925abc8)

</details>

<details>
<summary>gajus/eslint-plugin-jsdoc (eslint-plugin-jsdoc)</summary>

### [`v64.3.1`](https://redirect.github.com/gajus/eslint-plugin-jsdoc/compare/v64.3.0...74476202105cae492076663d246e675e7c61b9a3)

[Compare Source](https://redirect.github.com/gajus/eslint-plugin-jsdoc/compare/v64.3.0...v64.3.1)

### [`v64.3.0`](https://redirect.github.com/gajus/eslint-plugin-jsdoc/releases/tag/v64.3.0)

[Compare Source](https://redirect.github.com/gajus/eslint-plugin-jsdoc/compare/v64.2.1...v64.3.0)

##### Features

- **`no-unnecessary-type-assertion`:** add rule for checking [@&#8203;type](https://redirect.github.com/type) assertions ([4be7b47](https://redirect.github.com/gajus/eslint-plugin-jsdoc/commit/4be7b477633838fc1b9ccad714349e3e0290fedc))

</details>

<details>
<summary>Rich-Harris/magic-string (magic-string)</summary>

### [`v1.2.3`](https://redirect.github.com/Rich-Harris/magic-string/blob/HEAD/CHANGELOG.md#123-2026-08-26)

[Compare Source](https://redirect.github.com/Rich-Harris/magic-string/compare/v1.2.2...v1.2.3)

##### Bug Fixes

- clamp negative indices below -length instead of wrapping repeatedly ([#&#8203;337](https://redirect.github.com/Rich-Harris/magic-string/issues/337)) ([9391bb7](https://redirect.github.com/Rich-Harris/magic-string/commit/9391bb73118a03eef42a0524a3d4ade3aae28915))
- guess the most common indentation in a bundle ([#&#8203;334](https://redirect.github.com/Rich-Harris/magic-string/issues/334)) ([111b030](https://redirect.github.com/Rich-Harris/magic-string/commit/111b0309846a0a3c2fa6a21ea2c47ae21abdd79d))
- handle empty matches in `replace` and `replaceAll` ([#&#8203;335](https://redirect.github.com/Rich-Harris/magic-string/issues/335)) ([b6a53f7](https://redirect.github.com/Rich-Harris/magic-string/commit/b6a53f770f2ed60ecf143175ad8f38790702c0e8))
- trim the separators between sources ([#&#8203;333](https://redirect.github.com/Rich-Harris/magic-string/issues/333)) ([1bb4cce](https://redirect.github.com/Rich-Harris/magic-string/commit/1bb4cce75efba314b1950a7cede137f85cc4d959))

</details>

<details>
<summary>puppeteer/puppeteer (puppeteer)</summary>

### [`v25.9.0`](https://redirect.github.com/puppeteer/puppeteer/releases/tag/puppeteer-v25.9.0): puppeteer: v25.9.0

[Compare Source](https://redirect.github.com/puppeteer/puppeteer/compare/puppeteer-v25.8.0...puppeteer-v25.9.0)

##### ♻️ Chores

- **puppeteer:** Synchronize puppeteer versions

##### Dependencies

- The following workspace dependencies were updated
  - dependencies
    - puppeteer-core bumped from 25.8.0 to 25.9.0

</details>

<details>
<summary>rollup/rollup (rollup)</summary>

### [`v4.63.1`](https://redirect.github.com/rollup/rollup/blob/HEAD/CHANGELOG.md#4631)

[Compare Source](https://redirect.github.com/rollup/rollup/compare/v4.63.0...v4.63.1)

*2026-08-28*

##### Bug Fixes

- Revert function return value tracking until the most recent issue is understood ([#&#8203;6490](https://redirect.github.com/rollup/rollup/issues/6490))

##### Pull Requests

- [#&#8203;6489](https://redirect.github.com/rollup/rollup/pull/6489): fix(deps): update minor/patch updates ([@&#8203;renovate](https://redirect.github.com/renovate)\[bot])
- [#&#8203;6490](https://redirect.github.com/rollup/rollup/pull/6490): Revert improve function return value tracking ([@&#8203;lukastaegert](https://redirect.github.com/lukastaegert))

### [`v4.63.0`](https://redirect.github.com/rollup/rollup/blob/HEAD/CHANGELOG.md#4630)

[Compare Source](https://redirect.github.com/rollup/rollup/compare/v4.62.5...v4.63.0)

*2026-08-25*

##### Features

- Allow to analyze function return values in many more cases ([#&#8203;6065](https://redirect.github.com/rollup/rollup/issues/6065))

##### Pull Requests

- [#&#8203;6065](https://redirect.github.com/rollup/rollup/pull/6065): feat: improve function return value tracking ([@&#8203;cyyynthia](https://redirect.github.com/cyyynthia), [@&#8203;lukastaegert](https://redirect.github.com/lukastaegert))
- [#&#8203;6482](https://redirect.github.com/rollup/rollup/pull/6482): Remove unused rendered module sources map ([@&#8203;yoominho91](https://redirect.github.com/yoominho91), [@&#8203;irontaek](https://redirect.github.com/irontaek), [@&#8203;lukastaegert](https://redirect.github.com/lukastaegert))
- [#&#8203;6483](https://redirect.github.com/rollup/rollup/pull/6483): chore(deps): update minor/patch updates ([@&#8203;renovate](https://redirect.github.com/renovate)\[bot])
- [#&#8203;6484](https://redirect.github.com/rollup/rollup/pull/6484): fix(deps): update swc monorepo (major) ([@&#8203;renovate](https://redirect.github.com/renovate)\[bot], [@&#8203;lukastaegert](https://redirect.github.com/lukastaegert))
- [#&#8203;6485](https://redirect.github.com/rollup/rollup/pull/6485): chore(deps): lock file maintenance ([@&#8203;renovate](https://redirect.github.com/renovate)\[bot], [@&#8203;lukastaegert](https://redirect.github.com/lukastaegert))
- [#&#8203;6486](https://redirect.github.com/rollup/rollup/pull/6486): chore(deps): lock file maintenance ([@&#8203;renovate](https://redirect.github.com/renovate)\[bot])

</details>

---

### Configuration

📅 **Schedule**: (in timezone Asia/Tokyo)

- Branch creation
  - "after 1am and before 7am on monday"
- Automerge
  - At any time (no schedule defined)

🚦 **Automerge**: Enabled.

♻ **Rebasing**: Whenever PR is behind base branch, or you tick the rebase/retry checkbox.

👻 **Immortal**: This PR will be recreated if closed unmerged. Get [config help](https://redirect.github.com/renovatebot/renovate/discussions) if that's undesired.

---

 - [ ] <!-- rebase-check -->If you want to rebase/retry this PR, check this box

---

This PR was generated by [Mend Renovate](https://mend.io/renovate/). View the [repository job log](https://developer.mend.io/github/mrdoob/three.js).
<!--renovate-debug:eyJjcmVhdGVkSW5WZXIiOiI0NC40OS4wIiwidXBkYXRlZEluVmVyIjoiNDQuNDkuMCIsInRhcmdldEJyYW5jaCI6ImRldiIsImxhYmVscyI6W119-->


## PR #34403: chore(deps): update github/codeql-action digest to cdf488f

- URL: https://github.com/mrdoob/three.js/pull/34403
- Author: renovate
- Merged: 2026-08-30T18:10:04Z (created: 2026-08-30T17:53:36Z)
- Stats: +3 -3, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

This PR contains the following updates:

| Package | Type | Update | Change |
|---|---|---|---|
| [github/codeql-action](https://redirect.github.com/github/codeql-action) ([changelog](https://redirect.github.com/github/codeql-action/compare/db488ddef3bf6cb639b32c2e9a7c0a7ea8271d28..cdf488f595d80d6e07e03d4674febd5ab45fa938)) | action | digest | `db488dd` → `cdf488f` |

---

### Configuration

📅 **Schedule**: (in timezone Asia/Tokyo)

- Branch creation
  - "after 1am and before 7am on monday"
- Automerge
  - At any time (no schedule defined)

🚦 **Automerge**: Disabled by config. Please merge this manually once you are satisfied.

♻ **Rebasing**: Whenever PR becomes conflicted, or you tick the rebase/retry checkbox.

🔕 **Ignore**: Close this PR and you won't be reminded about this update again.

---

 - [ ] <!-- rebase-check -->If you want to rebase/retry this PR, check this box

---

This PR was generated by [Mend Renovate](https://mend.io/renovate/). View the [repository job log](https://developer.mend.io/github/mrdoob/three.js).
<!--renovate-debug:eyJjcmVhdGVkSW5WZXIiOiI0NC40OS4wIiwidXBkYXRlZEluVmVyIjoiNDQuNDkuMCIsInRhcmdldEJyYW5jaCI6ImRldiIsImxhYmVscyI6W119-->

