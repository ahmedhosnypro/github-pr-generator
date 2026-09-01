# Merged PRs: krahets/hello-algo

## PR #1943: Simplify generated exercise page sources

- URL: https://github.com/krahets/hello-algo/pull/1943
- Author: krahets
- Merged: 2026-07-18T23:19:43Z (created: 2026-07-18T23:18:41Z)
- Stats: +1391 -113, 71 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary

- remove generated-file banners from localized chapter exercise pages
- keep all 14 Traditional Chinese exercise pages as persistent source files
- align the Traditional Chinese chapter navigation with the current source

## Validation

- `conda run -n hello-algo python utils/exercises/render_review.py --check`
- `conda run -n hello-algo python utils/zensical/build_zensical.py --langs=zh,zh-hant,en,ja,ru --clean_site=True --clean_zensical_cache=True`
- verified 14 exercise pages for each of zh, zh-hant, en, ja, and ru


## PR #1951: Refine Zensical callout backgrounds

- URL: https://github.com/krahets/hello-algo/pull/1951
- Author: krahets
- Merged: 2026-07-22T09:38:56Z (created: 2026-07-22T09:35:45Z)
- Stats: +46 -0, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary

- use a stronger tint for callout title bars
- use a lighter tint for callout bodies
- preserve the Python Tutor callout styling

## Validation

- exercise pages: 56 checked
- zh-hant conversion: 1438 files checked
- review freeze record: current


## PR #1953: Remove Warp sponsorship and refine endorsement cards

- URL: https://github.com/krahets/hello-algo/pull/1953
- Author: krahets
- Merged: 2026-07-24T07:31:39Z (created: 2026-07-24T07:30:50Z)
- Stats: +30 -145, 11 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary

- remove the ended Warp sponsorship from multilingual READMEs and landing pages
- restyle landing-page endorsements as rounded cards

## Validation

- five-language Zensical build
- missing_files=0 and missing_symbols=0 for all languages
- exercise, OpenCC, and review-render checks passed
- locally reviewed and approved for deployment

## PR #1958: Fix multilingual content typos

- URL: https://github.com/krahets/hello-algo/pull/1958
- Author: krahets
- Merged: 2026-08-17T19:08:24Z (created: 2026-08-17T18:56:33Z)
- Stats: +289 -271, 201 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary
- fix reviewed factual, wording, and code typos across five languages
- synchronize generated Japanese, Russian, and Traditional Chinese code trees
- keep generated documentation aligned with the reviewed source

## Validation
- five-language Zensical build: missing_files=0, missing_symbols=0
- OpenCC check: 1438 files
- exercise publication and review checks passed
- language code-generation consistency checks passed
- Ruby, JavaScript, and Swift regressions passed

## PR #1959: Add multilingual exercise code

- URL: https://github.com/krahets/hello-algo/pull/1959
- Author: krahets
- Merged: 2026-08-17T20:57:57Z (created: 2026-08-17T20:49:37Z)
- Stats: +5795 -230, 180 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary

- replace three Python-only exercise snippets with source-backed tabs for the 13 visible programming languages
- keep Zig out of scope
- localize reader-facing code comments by site language, including Python docstrings
- regenerate the zh, zh-hant, en, ja, and ru exercise sources

## Validation

- language-specific formatting, compilation, and behavioral checks available on the development machine
- 56/56 isolated workspace tests
- 136 code-link mappings and 56 generated exercise pages validated
- five-language candidate build: missing_files=0, missing_symbols=0
- reviewed docs and site candidate trees frozen before this PR
