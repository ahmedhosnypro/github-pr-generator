# Merged PRs: langflow-ai/langflow

## PR #14842: fix(mcp): fail on missing server dependency (LE-2388)

- URL: https://github.com/langflow-ai/langflow/pull/14842
- Author: erichare
- Merged: 2026-08-28T22:41:33Z (created: 2026-08-28T21:51:30Z)
- Stats: +35 -4, 3 files
- Labels: bug
- Reviews: 0 | Comments: 6
- Linked issues: none

### Description

## Summary
- fail explicitly when a flow references an MCP server that is absent on the target environment
- direct operators to register the same-named server under Settings > MCP Servers
- preserve database-config and embedded-config fallback behavior

## Testing
- uv run pytest src/backend/tests/unit/components/models_and_agents/test_mcp_component.py -q (43 passed, 6 skipped)
- uv run ruff check src/lfx/src/lfx/components/models_and_agents/mcp_component.py src/backend/tests/unit/components/models_and_agents/test_mcp_component.py
- uv run ruff format --check src/lfx/src/lfx/components/models_and_agents/mcp_component.py src/backend/tests/unit/components/models_and_agents/test_mcp_component.py

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

## Summary by CodeRabbit

* **Bug Fixes**
  * Improved error handling when a configured MCP server is missing.
  * Displays an actionable message directing users to add the server under **Settings > MCP Servers** instead of silently returning no tools.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->

## PR #14843: fix(ci): address release branch regressions

- URL: https://github.com/langflow-ai/langflow/pull/14843
- Author: erichare
- Merged: 2026-08-28T23:30:17Z (created: 2026-08-28T22:57:58Z)
- Stats: +126 -51, 8 files
- Labels: bug
- Reviews: 0 | Comments: 4
- Linked issues: none

### Description

## Summary

- type the flow-creation mutation so Biome can validate its error path
- initialize multi-output nodes when stored flow data has no selected output
- preserve visible A2A input fields while keeping MCP limited to API-editable fields
- isolate the legacy-import unit test from the newer compiled-class provenance validator

## Validation

- Biome checks for the changed frontend files
- focused Jest tests: 5 passed
- frontend production build
- focused Playwright tests: A2A agent-card publishing and Tool Calling Agent default prompt (2 passed)
- Ruff checks for the changed Python files
- focused backend tests: A2A agent card, MCP schema policy, and Python 3.14 legacy-import case (6 passed)
- pre-commit hooks for all four commits

## CI triage

The deterministic failures from run 33217827991 and the first PR run are covered here. The Docker retry built and started the image successfully before the hosted runner received a shutdown signal, so this PR does not change Docker code for that infrastructure cancellation.


## PR #14832: fix(frontend): fit the canvas once the whole graph is measured

- URL: https://github.com/langflow-ai/langflow/pull/14832
- Author: keval718
- Merged: 2026-08-29T03:41:48Z (created: 2026-08-28T16:35:50Z)
- Stats: +671 -38, 12 files
- Labels: bug, lgtm
- Reviews: 3 | Comments: 5
- Linked issues: none

### Description

## Problem

Opening a flow frames the canvas around a subset of its nodes — the rest sit outside the viewport until the user presses ⌘1. The flow data and the fit machinery are both fine; only the initial computation is wrong.

Measured on 5 template flows, identical to the displayed decimal across repeated opens:

| Flow | Nodes | Zoom on open | Correct fit | Excess | Off-screen |
|---|---|---|---|---|---|
| Vector Store RAG | 7 | 74.8% | 36.8% | 2.03× | 5 of 7 |
| Text Sentiment Analysis | 8 | 57.3% | 41.4% | 1.39× | 4 of 8 |
| Basic Prompting | 6 | 97.5% | 73.6% | 1.33× | 1 of 6 |
| Simple Agent | 6 | 76.3% | 60.9% | 1.25× | 3 of 6 |
| Financial Report Parser | 5 | 49.6% | 49.6% | 1.00× | 0 (passes) |

## Root cause

`updateNodeInternals` resolves a queued `fitView` on the **first** internals batch (`@xyflow/react@12.10.2`), and `getFitViewNodes` includes a node only if `n.measured.width && n.measured.height` — an unmeasured node is dropped from the bounding box entirely, position included (`@xyflow/system@12.10.2`). Langflow's nodes are heavy and measure across several ResizeObserver batches, so the fit runs over whatever landed first and is never recomputed.

Three request sites all did this, each one-shot:

- the `fitView` prop on `<ReactFlow>` (`PageComponent/index.tsx`)
- `reactFlowInstance?.fitView()` inside one rAF (`use-apply-flow-to-canvas.ts`)
- `reactFlowInstance?.fitView({padding})` inside two rAFs (`use-apply-template-to-current-flow.ts`)

`note` nodes carry explicit width/height in the flow JSON, so they join the fit from the first frame — which is why the one flow whose bounding box is mostly defined by its note passes.

Two further gaps surfaced while fixing this:

- **In-app navigation never requested a fit.** `useLoadFlowForRoute` returns early when `currentFlowId !== ""`, so opening a flow from the list reused the mounted canvas and never reached `useApplyFlowToCanvas` — only a page reload produced a correct fit.
- **The canvas changes width mid-open.** The welcome overlay hides the sidebar in a `display:none` container, so a template is fitted against a 1920px canvas that narrows to 1640px the moment the overlay closes.

## Fix

Fits are request-driven and deferred until `useNodesInitialized` reports every non-hidden node measured, through a single `requestFitView` on the flow store:

```ts
useEffect(() => {
  if (!currentFlowId || !nodesInitialized) return;
  // …new request, or a canvas resize right after the fit
  fitView(fitViewOptionsRef.current);
  onFitted?.();
}, [currentFlowId, nodesInitialized, fitKey, canvasWidth, canvasHeight, fitView, fitViewRequest]);
```

Only an explicit request fits. A graph becoming measured is not a request — a user dropping the first component onto an empty canvas measures one too, and re-framing there moves the canvas out from under them mid-edit.

- applying a flow requests a fit, and takes a `fitView` option so the flow-events settle refresh can reload the graph into a canvas the user is already working in without re-framing it (that path also carried a fitView of its own, with the padding literal duplicated a fourth time)
- an empty flow requests nothing: there is no graph to frame, and a pending request would be answered by the first component the user drops
- the template hook hands over its `onFitted` callback instead of fitting inside two rAFs
- a canvas resize re-frames the graph at most once per request, and only while the viewport is still exactly where the fit put it — once the user has panned or zoomed, the framing is theirs

`fit-view-options.ts` becomes the single source for min/max zoom and padding, shared by the `<ReactFlow>` prop, the deferred fit and Zoom to Fit — the dropdown's duplicated padding literal is gone, and opening a flow now lands on exactly the viewport ⌘1 produces.

## Verification

Measured `.react-flow__viewport` transforms in the running app, same window, with a control run holding the fix stashed:

| Flow | Pre-fix on open | Post-fix on open | Zoom to Fit | Off-screen before → after |
|---|---|---|---|---|
| Vector Store RAG | `scale(0.98373)` | `scale(0.54396)` | `scale(0.54396)` — identical | 5/7 → 0/7 |
| Simple Agent | `scale(0.991371)` | `scale(0.793555)` | `scale(0.793555)` — identical | 3/6 → 0/6 |

Equality with Zoom to Fit was confirmed by perturbing the zoom first (to 200% / 95%) and then fitting — the viewport returns to the on-open transform to the last digit. Paths exercised: direct URL load, open from the flows list, and New Flow → template.

### Playwright shards

The first push failed five shards on pointer interception. That was this PR's doing, and it was the user-visible half of the two possibilities: the specs were right and the code was wrong.

`loop-component.spec.ts:10` run locally against the dev server:

| | Result |
|---|---|
| base `release-1.12.0` | passes |
| first push | fails — `handle-loopcomponent-shownode-item-right` blocked, `rf__node-Operations-WQG66` subtree intercepts pointer |
| after this fix | passes |

The mechanism: those specs start from a blank flow, and a blank flow left a fit request pending. The first component dropped onto the canvas made the graph "measured", the pending request fired, and every component dropped afterwards at fixed coordinates landed against a viewport that had moved — on top of the targets the spec then tried to click. Nothing about the specs encoded the old framing; they were describing a real regression, and the same jump would hit any user building a flow from scratch.

`general-bugs-tool-action-stale-update.spec.ts` and `chatInputOutputUser-shard-1.spec.ts:52` also pass locally after the fix. `chatInputOutputUser-shard-1.spec.ts:9` fails identically on the base commit here (`Flow editor autosave queue was unavailable before fixture persistence`) — local fixture, not this branch.

Tests: 116 suites / 1713 passing, including new coverage for holding the fit until measured, fitting once per request, refitting on a flow switch, refitting on the opening resize while ignoring later ones, the template hook deferring its fit, and Zoom to Fit using the shared options.

## Trade-offs

- The resize correction is gated on the viewport still being where the fit put it, rather than on a wall clock. It cannot move a viewport the user has arranged, and it fires at most once per request — a canvas that keeps resizing is no longer the flow opening.
- The settle refresh no longer re-frames the canvas at all. It used to, through two stacked fits; a background sync moving the viewport under an editing user was never the intent, and no spec asserted it.
- Building a flow from an empty canvas never auto-fits. Composing is the user's framing to keep; `adjustScreenView` / Zoom to Fit remain the way to re-frame.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

## Summary by CodeRabbit

* **Bug Fixes**
  * Improved canvas fitting so all nodes are visible after flows and templates load.
  * Delayed automatic fitting until nodes are fully measured, preventing incorrect framing.
  * Adjusted canvas framing when the inspection panel is open.
  * Improved refitting behavior when the canvas resizes during flow loading.

* **Tests**
  * Added coverage for canvas fitting, resizing, navigation, deduplicated requests, and template application.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->


## PR #14836: fix(frontend): date the UI in the language it is showing

- URL: https://github.com/langflow-ai/langflow/pull/14836
- Author: keval718
- Merged: 2026-08-30T17:53:07Z (created: 2026-08-28T18:35:01Z)
- Stats: +133 -9, 10 files
- Labels: bug, lgtm
- Reviews: 1 | Comments: 4
- Linked issues: none

### Description

## Problem

The unsaved-changes modal translates its label — "Last saved:" / "Última gravação:" — and then prints the timestamp in US English regardless of the active language:

```
Última gravação: 8/27, 4:45:21 PM
```

`FlowPage/index.tsx:371` passed a hardcoded `"en-US"` to `toLocaleString` instead of the language i18n is rendering in. A reader of `27/08, 16:45:21` gets a different date out of that string: `8/27` is the 27th to an American and the 8th to nearly everyone else. This affects all six non-English locales Langflow ships (de, es, fr, ja, pt, zh-Hans), not just Portuguese.

## Fix

One helper, `utils/format-date.ts`:

```ts
export function uiLocale(): string | undefined {
  return i18n.language || undefined;
}
```

`undefined` rather than a default language: before i18n resolves one, `Intl` should fall back to the runtime's own locale, not to a language nobody chose.

The reported call site becomes:

```diff
- new Date(updatedAt).toLocaleString("en-US", {
+ new Date(updatedAt).toLocaleString(uiLocale(), {
```

## Scope

The same hardcoding sat in four more rendered surfaces. Fixing only the modal would have left the identical bug twenty lines away in the header, so all of them are converted:

| Site | Was | Renders |
|---|---|---|
| `FlowPage/index.tsx:371` | `"en-US"` | unsaved-changes modal (reported) |
| `FlowMenu/index.tsx:193` | `"en-US"` | header "saved" tooltip |
| `FlowVersionSidebar/utils.ts` | `"en-US"` | version list timestamps |
| `deploymentsPage/step-attach-flows-version-panel.tsx` | `"en-US"` | version dates |
| `TraceComponent/traceViewHelpers.ts` | `Intl.DateTimeFormat("en-US")` at module load | trace date labels |
| `MemoriesMainContent/helpers.ts` (×2) | `undefined` | memory dates — followed the *browser*, not the language chosen in Langflow |

The trace helper built its formatter once at import, so it would have frozen whichever language the app started in even with the locale corrected; it now formats per call.

**Deliberately unchanged:** `voice-assistant/helpers/create-new-session-name.ts`. That string becomes a stored session *name*, not a rendered label — localizing it would change what past sessions are called.

## Tests

The assertions compare rendered output across languages rather than checking which argument was passed, so they fail if the wiring is reverted:

```ts
i18n.language = "en";  // → "8/27",  "Aug 27, 2026"
i18n.language = "pt";  // → "27/08", "27 de ago. de 2026"
expect(english).not.toBe(portuguese);
```

Covering `uiLocale` (including the pre-init fallback), the version-sidebar timestamp, and the trace date label. Full frontend suite: 657 suites / 7013 tests passing.

## Trade-offs

- `uiLocale()` reads i18n's language at call time rather than through `useTranslation`, so a component that renders no translated text would keep a stale format until its next render. Every call site here renders translated labels beside the date, so all of them already re-render on a language change.
- Out of scope, worth its own change: `FlowVersionSidebar/utils.ts` returns a hardcoded English `"Unknown date"` for an unparseable value — a pure util with no access to `t`.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

## Summary by CodeRabbit

* **Improvements**
  * Date and time displays now follow the app’s active language and regional settings across flow pages, menus, version panels, and save-status messages.
  * Formatting updates dynamically when the interface language changes.
  * Browser locale is used when no application language is selected.

* **Tests**
  * Added coverage for English and Portuguese date formatting, language changes, invalid dates, and locale fallback behavior.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->

## PR #14834: fix(frontend): translate the keys missing from every non-English locale

- URL: https://github.com/langflow-ai/langflow/pull/14834
- Author: keval718
- Merged: 2026-08-30T18:01:24Z (created: 2026-08-28T17:26:33Z)
- Stats: +125 -3, 9 files
- Labels: bug, lgtm
- Reviews: 1 | Comments: 4
- Linked issues: none

### Description

## Problem

Seven keys exist in `en.json` and are absent from all six shipped non-English locales (de, es, fr, ja, pt, zh-Hans). All seven are actively rendered.

`i18n.ts` sets `fallbackLng: "en"`, so no raw key is ever exposed — English text is mixed into otherwise fully translated screens, which is why nothing caught it. The most visible case is the Create Memory dialog, where two English strings sit between translated labels:

```
Criar Memória                                             <- translated
Nome *                                                    <- translated
Modelo de integração *                                    <- translated
Vector Database *                                         <- ENGLISH
Where this memory base stores vectors. Configured
providers come from DB Providers settings.                <- ENGLISH
Tamanho do lote *                                         <- translated
```

The equivalent field in Add Knowledge (`knowledge.dbProviderLabel`) is translated, so this is specific to these keys rather than a general translation backlog.

| Key | Call site | English value |
|---|---|---|
| `memory.backendLabel` | `MemoryDetails.tsx:137` | Vector store: |
| `memory.dbProviderLabel` | `createMemoryModal/index.tsx:122` | Vector Database |
| `memory.dbProviderDescription` | `createMemoryModal/index.tsx:141` | Where this memory base stores vectors… |
| `memory.dbProviderNotConfigured` | `createMemoryModal/index.tsx:142`, `useCreateMemoryModal.ts:228` | {{provider}} must be configured in DB Providers settings… |
| `model.unavailable` | `ModelTrigger.tsx:186` | Not available |
| `model.unavailableTitle` | `ModelTrigger.tsx:178` (title) and `:179` (aria-label) | This model is not available… |
| `shortcuts.modifierOnly` | `EditShortcutButton/index.tsx:100` | Add at least one non-modifier key… |

Two are worth calling out beyond the Memory Base surface: `model.unavailableTitle` is also an `aria-label`, so screen-reader users on a translated UI hear English; `shortcuts.modifierOnly` is a validation message on the Shortcuts settings page — a different feature area, which is why the fix covers all seven rather than the four on one dialog.

**Second defect, same surface and same pass.** The dialog close control was never an i18n key at all:

```tsx
content="Close"                          // tooltip
<span className="sr-only">Close</span>   // screen-reader label
```

Hardcoded literals, so no locale file could override them — in every dialog in the product. The visually hidden fallback `<DialogTitle>Dialog</DialogTitle>` two lines above had the same problem.

## Fix

- All seven keys translated in de, es, fr, ja, pt and zh-Hans, placed alphabetically inside their prefix group to match how the bundles are ordered. Terminology follows each locale's existing vocabulary — pt reuses "Provedores de banco de dados" from `settings.dbProviders.title`, ja reuses DBプロバイダー, and so on.
- `dialog.tsx` reads `t("common.close")` for both the tooltip and the `sr-only` label, and `t("common.dialog")` for the hidden fallback title. Both keys added to English **and** all six locales, so the fix does not reintroduce the defect it is fixing. `ui/sidebar.tsx` already uses `useTranslation` in this layer, so the primitive is not the first.

## Regression guard

`locales/__tests__/locale-parity.test.ts` asserts every locale carries every English key, and that each translation keeps the `{{…}}` placeholders of the string it translates — a dropped placeholder would render a literal `{{provider}}` to the user, which key-set parity alone would not catch.

Verified adversarially: deleting `memory.dbProviderLabel` from pt and renaming `{{provider}}` → `{{fornecedor}}` fails both assertions.

## Verification

Set the UI to Português in-app and reopened Create Memory: the field reads **Banco de dados vetorial \*** with **"Onde esta base de memória armazena os vetores. Os provedores configurados vêm das configurações de Provedores de banco de dados."** The dialog close tooltip and its `sr-only` label both read **Fechar**.

Key counts after the change: en 2403, each locale 2404 (zh-Hans 2403 — it alone lacks the stray `_translationNeeded.le1905EnterpriseSharing` the other five carry; that key is not in `en`, never renders, and is left untouched).

Full frontend suite: 655 suites / 7017 tests passing. The three `tsc` errors in `dialog.tsx` are pre-existing and unchanged by this PR (identical before the edit, only line numbers shift).

## Trade-offs

- Translations are authored here rather than waiting on the Globalization Pipeline, so the affected strings ship translated now; a later pipeline run can refine wording without reintroducing the gap, because the parity test fails if a key disappears.
- The parity test asserts only that keys are *present*, not that they differ from English — a locale legitimately keeping an English term (product names, "MCP") would otherwise fail.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

## Summary by CodeRabbit

- **New Features**
  - Added translated dialog titles, close-button tooltips, and screen-reader labels.
  - Added localization for memory provider settings, unavailable model messages, and shortcut validation across supported languages.
- **Accessibility**
  - Dialog controls now provide localized labels for improved accessibility in non-English languages.
- **Tests**
  - Added checks to ensure all supported language files contain required English translations and matching placeholders.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->
