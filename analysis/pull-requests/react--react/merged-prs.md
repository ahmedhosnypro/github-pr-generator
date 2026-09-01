# Merged PRs: react/react

## PR #37251: [DOM] Treat omitted Fragment Event listener options same as `capture: false`

- URL: https://github.com/react/react/pull/37251
- Author: teamleaderleo
- Merged: 2026-08-26T11:09:32Z (created: 2026-08-08T22:15:43Z)
- Stats: +42 -1, 2 files
- Labels: CLA Signed
- Reviews: 2 | Comments: 2
- Linked issues: none

### Description

## Summary

`FragmentInstance` tracks its event listeners so they can be applied to children added later, and matches them by a normalized options identity. Omitted options currently normalize to a different identity than an explicit `false` or `{capture: false}`, even though both mean `capture: false` per the `EventTarget` contract, where listener identity is the tuple of type, callback, and capture flag. As a result, a listener added without an options argument cannot be removed with an explicit capture-false value (or the reverse).

This change normalizes omitted options to the same capture-false identity as `false` and `{capture: false}`. The first commit adds a test to the FragmentRef suite characterizing the current behavior; the second commit contains the fix and the updated assertions.

## How did you test this change?

- added test characterizing the bug in the first commit

## PR #37384: [test] Remove the custom `toThrow` override for legacy V8 error messages

- URL: https://github.com/react/react/pull/37384
- Author: eps1lon
- Merged: 2026-08-26T17:24:59Z (created: 2026-08-26T10:10:14Z)
- Stats: +9 -61, 5 files
- Labels: CLA Signed, React Core Team
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description


The custom `toThrow` override in `scripts/jest/matchers/toThrow.js` wrapped the built-in matcher to rewrite the pre-Node-17 V8 error message format ("Cannot read property 'x' of undefined") into the modern one ("Cannot read properties of undefined (reading 'x')"), so the test suite could run on Node 12 to 16. 

On the Node versions this repo runs on (20 per `.nvmrc`, 24 in CI), V8 only ever produces the modern format, so the override is a passthrough.

Mostly removing this because the custom matcher deep-imports `expect/build/toThrowMatchers`, which no longer resolves on Jest 30 because each Jest package is now bundled into a single file, so this removal unblocks the Jest 30 upgrade stacked on top.


## PR #37389: [DOM] Copy `source` onto the synthetic toggle event

- URL: https://github.com/react/react/pull/37389
- Author: lazerg
- Merged: 2026-08-26T19:45:30Z (created: 2026-08-26T12:49:44Z)
- Stats: +37 -0, 2 files
- Labels: CLA Signed
- Reviews: 1 | Comments: 1
- Linked issues: Fixes #37387

### Description

## Summary

`ToggleEvent` carries a `source` property pointing at the control that opened or closed a popover, but `ToggleEventInterface` only lists `newState` and `oldState`, so the synthetic event never copies it. An `onToggle` handler reads `event.source` as `undefined` even when the native event has it.

Adding `source` to the interface copies it off the native event the same way `newState` and `oldState` are copied.

Fixes #37387

## How did you test this change?

Added a test to the SimpleEventPlugin suite that dispatches a `ToggleEvent` with a `source` and asserts the synthetic event exposes it. It fails on main and passes with the fix. Also ran `yarn test packages/react-dom/src/events`, `yarn lint`, `yarn prettier-check`, and `yarn flow dom-node`.


## PR #37382: [test] Bump Jest to 30.4

- URL: https://github.com/react/react/pull/37382
- Author: eps1lon
- Merged: 2026-08-28T11:06:48Z (created: 2026-08-26T09:17:08Z)
- Stats: +1669 -1281, 61 files
- Labels: CLA Signed, React Core Team
- Reviews: 3 | Comments: 2
- Linked issues: none

### Description


Bumps Jest to latest 30.x

The `resolutions` pin that kept jsdom at 22.1.0 is removed, so the test environment now runs the jsdom version that jest-environment-jsdom declares (26.1.0 on Jest 30).

The matcher aliases that Jest 30 deleted are replaced with their canonical forms across the test suites: `toBeCalled`, `toBeCalledTimes`, `toBeCalledWith`, and `lastCalledWith` become the corresponding `toHaveBeenCalled*` matchers, and `toThrowError` becomes `toThrow`. The custom `toThrow` matcher override is removed in the PR below this one.

Jest 30 activates the `node` export condition for CommonJS requires in every test environment, so in the jsdom-based Flight suites `react-server-dom-webpack/client` now resolves to the Node build (which requires an options argument) instead of the browser build. Those suites now map the client entry to `client.browser` explicitly, matching the existing mocks for the `server` and `static` entries, and the Turbopack Node test uses `jest.requireActual` because `client` and `client.node` now resolve to the same file, which otherwise made the mock factory recurse. For the same reason `react-dom/static` resolves to the lazily-initialized Node entry in source mode, so its version-mismatch test is gated to build mode like the other server-entry tests.

The obsolete `prettierPath` override is dropped from the base Jest config because Jest 30 works with Prettier 3 for inline snapshots, which also fixes `yarn test -u` crashing on the repo's Prettier 3-only hermes plugin, and the now unused `prettier-2` alias dependency is removed with it. Snapshot files are regenerated for Jest 30's updated snapshot header and formatting. One test now passes a number instead of a string to `jest.advanceTimersByTime`, which fake-timers v13 no longer coerces.



## PR #37087: [FlightReply] Performance improvements when decoding

- URL: https://github.com/react/react/pull/37087
- Author: eps1lon
- Merged: 2026-07-21T15:21:32Z (created: 2026-07-21T15:19:19Z)
- Stats: +100 -89, 24 files
- Labels: CLA Signed, React Core Team
- Reviews: 3 | Comments: 1
- Linked issues: none

### Description

This fixes security vulnerabilities in Server Functions.
