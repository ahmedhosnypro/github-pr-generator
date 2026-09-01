# Merged PRs: twbs/bootstrap

## PR #42877: Remove the breadcrumb bottom margin

- URL: https://github.com/twbs/bootstrap/pull/42877
- Author: mdo
- Merged: 2026-08-28T19:28:23Z (created: 2026-08-28T19:11:57Z)
- Stats: +1 -1, 1 files
- Labels: css, v6
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

- Remove the `--breadcrumb-margin-bottom` token and set `margin-bottom: 0` on `.breadcrumb`.
- A breadcrumb added a bottom margin of its own, which fought the spacing utility or layout gap around it. Clearing the browser default on the list leaves spacing to the page.


## PR #42876: Keep a nonmodal dialog centered

- URL: https://github.com/twbs/bootstrap/pull/42876
- Author: mdo
- Merged: 2026-08-28T19:30:23Z (created: 2026-08-28T19:11:21Z)
- Stats: +5 -5, 1 files
- Labels: css, v6
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

- Fix a nonmodal dialog that opens off center. `show()` does not use the top layer, so `.dialog-nonmodal` positions itself, and it centered with `transform: translate(-50%, -50%)`. The open state sets `transform: none` to end the entry animation, which removed that centering.
- Center with `inset: 0` plus the `margin: auto` already on `.dialog`, and add `height: fit-content` so the block axis centers too. The centering no longer depends on `transform`.


## PR #42875: Tighten theme mix, shades, and border docs

- URL: https://github.com/twbs/bootstrap/pull/42875
- Author: mdo
- Merged: 2026-08-28T19:30:36Z (created: 2026-08-28T19:10:42Z)
- Stats: +88 -71, 5 files
- Labels: docs, css, v6
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

- Switch `$color-mix-space` from `lab` to `oklch` so tints and shades hold a more even lightness across the palette.
- Pull the `950` and `975` shades back from 76%/88% to 70%/76%. The darkest steps had collapsed together.
- Mix the dark mode `--border-subtle` from `gray-800` and `gray-900`. Plain `gray-900` sat too close to the dark body background to read as a border.
- Let an active `.nav-pills` link follow `--theme-bg` and `--theme-contrast`, falling back to the existing pill tokens, so a theme utility on a pill nav takes effect.
- Fix `Swatch.astro`, which split `light-dark()` on the first comma and fell back to the raw string whenever a nested `color-mix()` contained one. It now matches parens and unwraps `var(--token)` for display.
- Document the border tokens that already shipped (`bg`, `body`, `white`, `black`) and drop two unused arrays from the theme page.


## PR #42879: docs: fix modal JS examples, list numbering, and typos

- URL: https://github.com/twbs/bootstrap/pull/42879
- Author: minirang
- Merged: 2026-08-29T07:50:55Z (created: 2026-08-29T06:22:17Z)
- Stats: +11 -9, 3 files
- Labels: docs, v5
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

### Description

<!-- Describe your changes in detail -->
- Corrects the broken JavaScript modal example by properly fetching the modal instance via `bootstrap.Modal.getInstance()` and listening to the correct event (`hidden.bs.modal`).
- Fixes sequential list numbering in the Vite getting-started guide (from 3, 4 to 2, 3).
- Fixes minor typos and casing in the migration documentation (e.g., `LibSass` and `.rounded-lg`).

### Motivation & Context

<!-- Why is this change required? What problem does it solve? -->
The previous JavaScript example for destroying a modal used an incorrect, non-existent event (`shown.bs.hidden`) and attempted to call `.hide()` and `.dispose()` in a way that would fail or cause unintended behavior. Updating this with `getInstance` and the proper event lifecycle ensures users can successfully copy-paste working code.

The list numbering and typos were also corrected to improve the overall clarity and professionalism of the documentation.

### Type of changes

<!-- What types of changes does your code introduce? Put an `x` in all the boxes that apply. -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Refactoring (non-breaking change)
- [ ] Breaking change (fix or feature that would change existing functionality)

### Checklist

<!-- Go over all the following points, and put an `x` in all the boxes that apply. -->
<!-- If you’re unsure about any of these, don’t hesitate to ask. We’re here to help! -->

- [x] I have read the [contributing guidelines](https://github.com)
- [x] My code follows the code style of the project _(using `npm run lint`)_
- [x] My change introduces changes to the documentation
- [x] I have updated the documentation accordingly
- [ ] I have added tests to cover my changes
- [ ] All new and existing tests passed

#### Live previews

<!-- Please add direct links where your modifications can be seen in the documentation -->

- <https://deploy-preview-{your_pr_number}--twbs-bootstrap.netlify.app/>

### Related issues

<!-- Please link any related issues here. -->
None. This was found while reviewing the documentation.


## PR #42874: Add an accordion-gap modifier

- URL: https://github.com/twbs/bootstrap/pull/42874
- Author: mdo
- Merged: 2026-08-29T21:58:48Z (created: 2026-08-28T19:09:51Z)
- Stats: +70 -1, 2 files
- Labels: docs, feature, css, v6
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

- Add an `.accordion-gap` modifier that spaces accordion items apart as separate rounded cards.
- Put the space in a flex `gap` on the accordion rather than a margin on the panel. A flex gap does not join the `block-size` transition, so adjacent items no longer jump while a panel opens.
- Clip item overflow and keep a full border radius on every item, so corners do not retarget mid-transition.
- Add the `--accordion-gap` token, defaulting to `0` and to `--spacer-2` under `.accordion-gap`.
- Swap the item `margin-top` for the logical `margin-block-start`.
- Document the modifier with an example and a `ScssDocs` block.

