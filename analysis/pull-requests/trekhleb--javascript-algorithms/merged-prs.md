# Merged PRs: trekhleb/javascript-algorithms

## PR #2183: fix: correct JSDoc position range to match code validation (1-70)

- URL: https://github.com/trekhleb/javascript-algorithms/pull/2183
- Author: huizixin
- Merged: 2026-06-14T15:18:16Z (created: 2026-06-12T07:07:22Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Description

The JSDoc comment for `fibonacciClosedForm()` states the valid position range is "1 to 75", but the code validates against `topMaxValidPosition = 70`.

```javascript
// Current JSDoc (line 7)
@param {number} position - Position number of fibonacci sequence (must be number from 1 to 75).

// Actual validation (line 10)
const topMaxValidPosition = 70;
```

## Changes

- Updated JSDoc `@param` description to reflect the actual valid range (1 to 70)

## Verification

The error message in the code already correctly uses the `topMaxValidPosition` variable:
```javascript
throw new Error(`Can't handle position smaller than 1 or greater than ${topMaxValidPosition}`);
```

This PR only fixes the documentation to match the implementation.

## PR #2181: refactor: replace deprecated String.prototype.substr() with substring()

- URL: https://github.com/trekhleb/javascript-algorithms/pull/2181
- Author: fauzan171
- Merged: 2026-06-14T15:25:49Z (created: 2026-06-06T17:11:56Z)
- Stats: +5 -5, 3 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Problem

`String.prototype.substr()` is a legacy feature defined in Annex B of the ECMAScript specification and is deprecated. It may be removed from future JavaScript engine versions.

The codebase uses `substr()` in 5 places across 3 files.

## Fix

Replaced all `substr(start, length)` calls with `substring(start, start + length)`, which is the modern, standard alternative. The behavior is identical for all cases in this codebase.

### Files changed:
- `src/algorithms/string/rabin-karp/rabinKarp.js` — source code
- `src/algorithms/cryptography/polynomial-hash/__test__/SimplePolynomialHash.test.js` — test
- `src/algorithms/cryptography/polynomial-hash/__test__/PolynomialHash.test.js` — test

### Conversion pattern:
```js
// Before
text.substr(start, length)

// After
text.substring(start, start + length)
```

All 7 affected tests pass.

## PR #2174: fix(pt-BR): correções de tradução em queue, insertion-sort e linked-list

- URL: https://github.com/trekhleb/javascript-algorithms/pull/2174
- Author: guuszz
- Merged: 2026-06-14T15:29:34Z (created: 2026-05-29T20:36:39Z)
- Stats: +4 -4, 3 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## What

Quatro correções de tradução PT-BR (typos objetivos, sem mudança de conteúdo):

- **`data-structures/queue/README.pt-BR.md`** — "uma **file** FIFO" → "uma **fila** FIFO"
- **`data-structures/queue/README.pt-BR.md`** — heading `## References` → `## Referências` (era o único heading em inglês num arquivo todo em português)
- **`algorithms/sorting/insertion-sort/README.pt-BR.md`** — "que **criaa** matriz" → "que **cria a** matriz"
- **`data-structures/linked-list/README.pt-BR.md`** — "Complexidade de **Espaçø**" → "Complexidade de **Espaço**" (caractere `ø` no lugar de `o`)

All changes are PT-BR translation fixes only.


## PR #2157: feat: add Deque data structure with tests and README

- URL: https://github.com/trekhleb/javascript-algorithms/pull/2157
- Author: shahidansari311
- Merged: 2026-06-19T18:03:02Z (created: 2026-05-04T22:23:12Z)
- Stats: +371 -0, 3 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## What this PR adds

A Deque (double-ended queue) data structure backed by the existing LinkedList.

## Why it belongs here

The repo has Queue and Stack but no Deque. A Deque generalises both — 
elements can be added/removed from either end in O(1) time.

## Files added

- `src/data-structures/deque/Deque.js` — implementation
- `src/data-structures/deque/__test__/Deque.test.js` — 14 tests, 100% coverage
- `src/data-structures/deque/README.md` — explanation, complexity table, use cases, references

## Checklist

- [x] npm run lint passes (zero errors)
- [x] npm test passes (14/14 tests)
- [x] 100% code coverage
- [x] README includes Big O analysis and reference links
- [x] One PR for one data structure

## PR #916: Fix BUG in graph reverse method & Add needed tests

- URL: https://github.com/trekhleb/javascript-algorithms/pull/916
- Author: itsamirhn
- Merged: 2026-06-26T22:32:13Z (created: 2022-07-30T10:44:51Z)
- Stats: +35 -1, 2 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

This PR fix the issue in #873.

The issue was in the old reverse method, edges reversed one by one and this was making issue for graphs with cycle of length 2. For example, when graph with only two edges AB and BA was reversing, on reversing AB, BA was exist and there will be crash.
