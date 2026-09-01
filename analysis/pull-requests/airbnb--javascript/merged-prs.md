# Merged PRs: airbnb/javascript

## PR #3153: docs: add note about ESLint --ext for .jsx files (see eslint/eslint#1402)

- URL: https://github.com/airbnb/javascript/pull/3153
- Author: prateekbisht23
- Merged: 2026-04-16T06:06:27Z (created: 2025-08-22T10:08:25Z)
- Stats: +19 -0, 2 files
- Labels: editorial
- Reviews: 3 | Comments: 1
- Linked issues: Fixes #1402

### Description

By default, ESLint only lints `.js` files. This PR updates the README(s) to note
that users need to pass `--ext .js,.jsx` (or `.tsx` for TypeScript) when running
ESLint so that rules like `react/jsx-filename-extension` are applied correctly.

Also updated package.json scripts to demonstrate this usage.

Fixes #1402

## PR #2389: Update ARIA roles link

- URL: https://github.com/airbnb/javascript/pull/2389
- Author: gabrielslach
- Merged: 2026-04-16T18:28:56Z (created: 2021-02-17T08:08:53Z)
- Stats: +1 -1, 1 files
- Labels: editorial, react
- Reviews: 2 | Comments: 1
- Linked issues: none

### Description

deprecated link

## PR #2620: fix: allow block comments with multiple *

- URL: https://github.com/airbnb/javascript/pull/2620
- Author: bertho-zero
- Merged: 2026-04-16T18:40:50Z (created: 2022-07-27T12:46:11Z)
- Stats: +1 -1, 1 files
- Labels: semver-patch: loosen/fix/document rules
- Reviews: 3 | Comments: 0
- Linked issues: none

### Description

Allow comments like:

```js
/**
 * Bla bla bla
 **/
```

## PR #3229: fix: use single quotes in nested ternary bad example (section 15.6)

- URL: https://github.com/airbnb/javascript/pull/3229
- Author: eduardbar
- Merged: 2026-04-16T19:24:11Z (created: 2026-02-21T22:49:25Z)
- Stats: +2 -2, 1 files
- Labels: editorial
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## Summary

Related to #3152

While investigating the semicolon consistency reported in issue #3152, I found a separate but related inconsistency: the `// bad` example in section **15.6 (Nested Ternaries)** uses double-quoted string literals (`"bar"`, `"baz"`), which contradicts section **6.1** of this same guide that requires single quotes for strings.

## Change

```diff
- const foo = maybe1 > maybe2
-   ? "bar"
-   : value1 > value2 ? "baz" : null;
+ const foo = maybe1 > maybe2
+   ? 'bar'
+   : value1 > value2 ? 'baz' : null;
```

The `// good` and `// better` examples immediately below already use single-quoted strings (`'baz'`, `'bar'`) consistently. This fixes the `// bad` example to match.

## Why

- Section 6.1 states: *"Use single quotes `''` for strings."* eslint: `quotes`
- The `// bad` example should demonstrate bad practice for the **one** specific rule being illustrated (nested ternaries), not introduce a separate unrelated violation (wrong quote style)
- Mixing double and single quotes in adjacent examples within the same section is confusing

## Scope

This is a two-line documentation fix. No logic changes, no new content.

## PR #17: stray character 'i'

- URL: https://github.com/airbnb/javascript/pull/17
- Author: ryun
- Merged: 2012-11-07T03:17:48Z (created: 2012-11-07T02:38:16Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

(empty)
