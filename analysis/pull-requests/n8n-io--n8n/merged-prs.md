# Merged PRs: n8n-io/n8n

## PR #37304: refactor(editor): Extract the frontend test helpers into `@n8n/frontend-test-utils` (no-changelog)

- URL: https://github.com/n8n-io/n8n/pull/37304
- Author: alexgrozav
- Merged: 2026-08-28T16:09:16Z (created: 2026-08-28T10:00:35Z)
- Stats: +883 -267, 57 files
- Labels: n8n team, cla-signed
- Reviews: 4 | Comments: 3
- Linked issues: none

### Description

## Summary

Adds `@n8n/frontend-test-utils`, an L1 package that holds the vue-aware test helpers every frontend package needs, and moves `otel` onto it.

**Why now.** The helpers lived behind editor-ui's `@/`, so a module package could not reach them and copied them instead. On `master`, `createComponentRenderer` had three definitions — editor-ui, otel, design-system. `mockedStore` (200+ importers here, 0 in modules) and the `defaultSettings` fixture had one each and were simply unreachable across the boundary. Every extraction adds one copy.

**Why not `@n8n/vitest-config`.** Backend packages consume it, and `@n8n/i18n` devDepends on it, so importing `vue`, `pinia` or `@n8n/i18n` there closes a cycle in the turbo graph. Nothing imports the new package back, so it can hold what the shared harness cannot — including the pinia + i18n boot that `otel` copies today.

### What went in

The renderer core, `mockedStore`/`MockedStore`, the `defaultSettings` fixture, `retry`, `waitAllPromises`, `useEmitters`, and a `@n8n/frontend-test-utils/setup` entry that boots i18n and a fresh pinia per test.

Deliberately left in editor-ui: `SETTINGS_STORE_DEFAULT_STATE` (typed `ISettingsState` from `@/Interface` — it needs the type sunk first), the mirage server fixtures, and the design-system query helpers (`getDropdownItems`, the tooltip helpers), which have no module consumer yet. `@n8n/design-system`'s own renderer is untouched: converging it would make design-system depend on a package that imports design-system.

### How the renderer splits

A shared base plus a consumer extension, not one renderer with flags. The base is i18n, pinia, `N8nPlugin`, a `RouterLink` stub and a no-op `$telemetry`. `editor-ui/src/__tests__/render.ts` keeps its path and its two export names, and passes the editor-core additions through `defineRenderer`:

```ts
export const { renderComponent, createComponentRenderer } = defineRenderer({
  plugins: [GlobalDirectivesPlugin],
  stubs: { VueJsonPretty: vueJsonPretty },
  provide: () => ({ [WorkflowDocumentStoreKey]: /* workflow document store */ }),
});
```

`provide` takes a thunk because `useWorkflowDocumentStore()` has to run per render, inside the pinia that render activated. **No test file in the shell changes** — 470 of them import that module.

The zero-config renderer is built on first use, not at import: `index.ts` re-exports it, so a test that only wants `mockedStore` imports the module too, and three tests replace `@n8n/design-system` or `@n8n/i18n` with a `vi.mock` factory that has no such export.

### Boundary

L1 — beside `@n8n/design-system` and `@n8n/i18n`, below `@n8n/stores` and `@n8n/composables`. The `paths` in its `tsconfig.json` list `@n8n/api-types`, `@n8n/i18n` and `@n8n/design-system` only, so a helper reaching up to L2 fails the typecheck here rather than in the module consuming it; `eslint.config.mjs` repeats the list with the reason in the message.

`defaults.ts` moves content-pristine, so `git blame --follow` survives.

## How to test

```bash
pnpm turbo run test --filter=@n8n/frontend-test-utils --filter=@n8n/frontend-module-otel
pnpm --filter n8n-editor-ui test
pnpm --filter n8n-editor-ui typecheck
```

Local results on this branch:

| Suite | Result |
| --- | --- |
| `@n8n/frontend-test-utils` | 6/6 pass (new) |
| `@n8n/frontend-module-otel` | 108/108 pass |
| `n8n-editor-ui` (both shards) | 1143 files, 16,287 tests pass |
| `editor-ui/vite/aliases.test.ts` | 23/23 pass — guards the alias ↔ tsconfig agreement |
| `typecheck` (new package, otel, editor-ui) | clean |
| `lint` (new package, otel, changed editor-ui files) | clean |

## Related Linear tickets, Github issues, and Community forum posts

Follow-up: the insights module package (#37030) adopts this package instead of its local renderer, `__tests__/utils.ts` copy and pinia setup.

## Review / Merge checklist

- [x] I have seen this code, I have run this code, and I take responsibility for this code.
- [x] PR title and summary are descriptive.
- [ ] [Docs updated](https://github.com/n8n-io/n8n-docs) or follow-up ticket created.
- [x] Tests included.
- [ ] PR Labeled with `Backport to Beta`, `Backport to Stable`, or `Backport to v1`

🤖 Generated with [Claude Code](https://claude.com/claude-code)


<!-- This is an auto-generated description by cubic. -->
<a href="https://cubic.dev/pr/n8n-io/n8n/pull/37304?utm_source=github" target="_blank" rel="noopener noreferrer" data-no-image-dialog="true"><picture><source media="(prefers-color-scheme: dark)" srcset="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://www.cubic.dev/buttons/review-in-cubic-light.svg"><img alt="Review in cubic" src="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"></picture></a>
<!-- End of auto-generated description by cubic. -->



## PR #36808: fix(editor): Keep AI Assistant step narration inside thinking blocks

- URL: https://github.com/n8n-io/n8n/pull/36808
- Author: Cadiac
- Merged: 2026-08-24T10:41:32Z (created: 2026-08-21T09:42:27Z)
- Stats: +58 -12, 2 files
- Labels: n8n team, Released, cla-signed
- Reviews: 4 | Comments: 5
- Linked issues: none

### Description

## Summary

Narration text from a model step was shown as normal answer text for a few hundred milliseconds, and then moved into the thinking block above it.

This caused the thinking traces to appear as regular agent output text while being streamed, like here

<img width="866" height="266" alt="image" src="https://github.com/user-attachments/assets/56097908-79a9-4bc9-960d-81e196b1c202" />

The timeline groups text into a thinking block when trace content (reasoning or a generic tool call) follows it. The streaming guard for the last text entry required trace content **from the same response**. A step that emits no reasoning starts with its narration text, so that response has no trace content yet. The text was rendered outside the block until the tool call of the step arrived, and then it was folded back in. The thinking block also split and merged again in the same moment.

The guard is now scoped to the run. Trace content anywhere earlier in the timeline shows that the model is in a tool loop. A first answer with no trace content at all is still rendered as text immediately.

Behaviour change: short text (200 characters or less) that follows a tool call in a step without reasoning now streams inside the thinking block, and moves out when the run ends. Steps that emit reasoning before the text already behaved this way. I tested this locally and this felt okay, and it fixed the original case reported here.

## How to test

1. Start the AI Assistant.
2. Ask a question that makes the assistant call a tool more than once, for example `What linear issues are assigned to me?` with no MCP server connected. The assistant calls `mcp-servers` for `connected`, then for `search`, then for `connect`.
3. Watch the chat while the assistant streams.
4. Confirm that the narration between the tool calls, for example `No services are connected yet. Let me check if there's a Linear server available to connect.`, stays inside the thinking block. It must not appear as normal answer text first.
5. Confirm that the final answer of the run is still rendered as normal answer text below the block.

## Related Linear tickets, Github issues, and Community forum posts

https://linear.app/n8n/issue/INS-1238

## Review / Merge checklist

- [x] I have seen this code, I have run this code, and I take responsibility for this code.
- [x] PR title and summary are descriptive. ([conventions](../blob/master/.github/pull_request_title_conventions.md))
- [ ] [Docs updated](https://github.com/n8n-io/n8n-docs) or follow-up ticket created.
- [x] Tests included.
- [ ] PR Labeled with `Backport to Beta`, `Backport to Stable`, or `Backport to v1` (if the PR is an urgent fix that needs to be backported)

🤖 PR Summary generated by AI

<!-- This is an auto-generated description by cubic. -->
<a href="https://cubic.dev/pr/n8n-io/n8n/pull/36808?utm_source=github" target="_blank" rel="noopener noreferrer" data-no-image-dialog="true"><picture><source media="(prefers-color-scheme: dark)" srcset="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://www.cubic.dev/buttons/review-in-cubic-light.svg"><img alt="Review in cubic" src="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"></picture></a>
<!-- End of auto-generated description by cubic. -->



## PR #37347: chore: Update e2e impact map

- URL: https://github.com/n8n-io/n8n/pull/37347
- Author: n8n-assistant
- Merged: 2026-08-29T03:02:58Z (created: 2026-08-29T02:57:42Z)
- Stats: +1 -1, 1 files
- Labels: automation:scheduled-update, cla-signed
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

Automated refresh of the committed E2E impact map from the latest
nightly coverage run.

PRs use this map to scope which E2E specs run; refreshing it keeps
newly-covered source→spec couplings visible so changes aren't
declared uncovered and their specs silently skipped.

_Generated by the E2E coverage nightly._

<!-- This is an auto-generated description by cubic. -->
<a href="https://cubic.dev/pr/n8n-io/n8n/pull/37347?utm_source=github" target="_blank" rel="noopener noreferrer" data-no-image-dialog="true"><picture><source media="(prefers-color-scheme: dark)" srcset="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://www.cubic.dev/buttons/review-in-cubic-light.svg"><img alt="Review in cubic" src="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"></picture></a>
<!-- End of auto-generated description by cubic. -->



## PR #37345: test: Add axe accessibility fixture for Playwright journeys

- URL: https://github.com/n8n-io/n8n/pull/37345
- Author: n8n-cat-bot
- Merged: 2026-08-29T05:14:21Z (created: 2026-08-28T22:55:04Z)
- Stats: +248 -1, 6 files
- Labels: cla-signed, Reviewers auto-assigned
- Reviews: 2 | Comments: 1
- Linked issues: none

### Description

Fixes DEVP-909

## Summary

Adds the accessibility scanning primitive for the Playwright package. No journey uses it yet — this is prep so the follow-up tickets have something to call.

**Dependencies** added to `packages/testing/playwright/package.json`:

- `@axe-core/playwright@^4.13.0` — the axe runner
- `axe-core@^4.13.0` — pinned explicitly so `Result` / `TagValue` types are a direct dependency rather than borrowed from a transitive
- `axe-html-reporter@^2.2.11` — installed now; the reporting side is deferred to the follow-ups, so nothing imports it yet

**`fixtures/a11y.ts`** (new) exposes `a11y.check(bucket, options?)`:

- Runs axe against the page held by the `n8n` fixture (`n8n.page`), scoped to the bucket's selector, and returns the violations array.
- **Never throws.** If the scan can't run — the bucket isn't on screen, axe itself fails — it logs a warning and returns `[]`. This is deliberate: an accessibility check bolted onto an existing journey must not be able to turn that journey red. The trade-off is that a missing bucket reads as "no violations", so the warning names the bucket that was skipped.
- Callers decide what to assert; the fixture makes no assertions of its own.

Buckets and their selectors:

| Bucket | Scope |
|---|---|
| `page` | whole document (no `include`, so `<html>`-level rules such as `html-has-lang` still run) |
| `canvas` | `[data-test-id="canvas-wrapper"]` |
| `ndv` | `[data-test-id="ndv"]` |
| `node-creator` | `[data-test-id="node-creator"]` |
| `sidebar` | `#side-menu` |
| `modal` | `[role="dialog"]` |

Scans default to WCAG 2.1 A + AA tags; `tags` and `disableRules` can be overridden per call.

**Wiring.** The package has no `fixtures/index.ts` — `fixtures/base.ts` is the composition point every spec imports `test` / `expect` from, so `a11yFixtures` is spread there alongside the existing fixture groups, and `A11Y_BUCKETS`, `A11yBucket`, `A11yCheckOptions` and `A11yViolation` are re-exported from it. The fixture is not `auto`, so it's only constructed for tests that name it.

**Testability.** The axe call sits behind an injectable `A11yAnalyzer` seam, so the checker's contract (scoping, tag defaults, override passthrough, non-throwing failure path) is unit-tested with vitest — no browser needed.

Also documents the fixture in the package's `AGENTS.md`.

### Assumptions

The ticket didn't enumerate the buckets or the return shape, so:

- Bucket names and selectors were derived from the existing page objects (`CanvasPage`, `NodeDetailsViewPage`, `SidebarPage`, `BaseModal`) rather than invented.
- `check` returns the raw axe `Result[]`. Adding a richer result envelope (scan metadata, HTML report) would pre-empt the deferred reporting work, so it was left out.
- `axe-html-reporter` is installed but unimported, per the ticket's split between installing deps now and wiring reporting later. There is no unused-dependency check in CI, so this doesn't fail anything.

## How to test

```bash
pnpm --filter n8n-playwright test:unit
pnpm --filter n8n-playwright typecheck
pnpm --filter n8n-playwright lint
```

In a spec, the fixture is used as:

```typescript
test('canvas is accessible', async ({ n8n, a11y }) => {
  await n8n.start.fromBlankCanvas();
  const violations = await a11y.check('canvas');
  expect(violations).toEqual([]);
});
```

## Verification

| Command | Outcome |
|---|---|
| `pnpm install --no-frozen-lockfile` | ✅ resolved; lockfile diff is 3 new specifiers + `axe-core@4.13.0` / `axe-html-reporter@2.2.11` / `@axe-core/playwright@4.13.0` entries, no other package moved |
| `pnpm install --frozen-lockfile` | ✅ clean, no drift |
| `pnpm --filter n8n-playwright typecheck` | ✅ `tsc --noEmit`, no errors |
| `pnpm --filter n8n-playwright lint` | ✅ `eslint . --quiet`, no errors |
| `pnpm --filter n8n-playwright format:check` | ✅ `biome ci .`, 871 files, no fixes needed |
| `pnpm --filter n8n-playwright test:unit` | ✅ 7 files / 44 tests passed, including the 5 new `fixtures/a11y.test.ts` cases |
| `pnpm --filter n8n-playwright janitor --file=fixtures/a11y.ts` | ✅ 0 new violations against the baseline |

The five new unit tests cover: violations passed through for a bucket; scan scoped to the bucket selector with the default WCAG tags; `page` bucket scans the whole document (`include: undefined`); tag/rule overrides forwarded; a rejected scan returns `[]` and warns instead of throwing.

## Not verified

The real-browser path — `AxeBuilder(...).analyze()` against a live n8n page — was not executed. No Playwright browser binaries are present in this environment and the directories they'd be installed to are outside the sandbox:

```
ls: cannot access '.../packages/testing/playwright/.playwright-browsers': No such file or directory
ls in '/home/runner/.cache/ms-playwright' was blocked.
```

What is covered instead: `tsc` validates the `@playwright/test` `Page` → `playwright-core` `Page` assignability that `AxeBuilder` requires, and `@axe-core/playwright` ships `AxeBuilder` as a named export in both its CJS and ESM bundles, so the import shape is sound in either module resolution. The first spec that calls `a11y.check` will exercise the live path end to end.

## Related Linear tickets, Github issues, and Community forum posts

https://linear.app/n8n/issue/DEVP-909

## Review / Merge checklist

- [x] I have seen this code, I have run this code, and I take responsibility for this code.
- [x] PR title and summary are descriptive. (scopeless `test:` — `playwright` is not in the allowed scope list; `(no-changelog)` as this is test infrastructure)
- [x] [Docs updated](https://github.com/n8n-io/n8n-docs) or follow-up ticket created. (fixture documented in `packages/testing/playwright/AGENTS.md`)
- [x] Tests included.
- [ ] PR Labeled with `Backport to Beta`, `Backport to Stable`, or `Backport to v1` (if the PR is an urgent fix that needs to be backported)


---
🐱 Opened by [cat-bot](https://github.com/n8n-io/cat-bot/actions/runs/33218037730). Review the changes; close if the approach is wrong.

<!-- This is an auto-generated description by cubic. -->
<a href="https://cubic.dev/pr/n8n-io/n8n/pull/37345?utm_source=github" target="_blank" rel="noopener noreferrer" data-no-image-dialog="true"><picture><source media="(prefers-color-scheme: dark)" srcset="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://www.cubic.dev/buttons/review-in-cubic-light.svg"><img alt="Review in cubic" src="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"></picture></a>
<!-- End of auto-generated description by cubic. -->



## PR #37357: chore: Update e2e impact map

- URL: https://github.com/n8n-io/n8n/pull/37357
- Author: n8n-assistant
- Merged: 2026-08-30T02:54:20Z (created: 2026-08-30T02:49:40Z)
- Stats: +1 -1, 1 files
- Labels: automation:scheduled-update, cla-signed
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

Automated refresh of the committed E2E impact map from the latest
nightly coverage run.

PRs use this map to scope which E2E specs run; refreshing it keeps
newly-covered source→spec couplings visible so changes aren't
declared uncovered and their specs silently skipped.

_Generated by the E2E coverage nightly._

<!-- This is an auto-generated description by cubic. -->
<a href="https://cubic.dev/pr/n8n-io/n8n/pull/37357?utm_source=github" target="_blank" rel="noopener noreferrer" data-no-image-dialog="true"><picture><source media="(prefers-color-scheme: dark)" srcset="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://www.cubic.dev/buttons/review-in-cubic-light.svg"><img alt="Review in cubic" src="https://www.cubic.dev/buttons/review-in-cubic-dark.svg"></picture></a>
<!-- End of auto-generated description by cubic. -->


