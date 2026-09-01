# Merged PRs: langgenius/dify

## PR #40827: refactor: pass db.session explicitly in instruction_modify_workflow (#37403)

- URL: https://github.com/langgenius/dify/pull/40827
- Author: weike-zhang
- Merged: 2026-08-30T01:13:11Z (created: 2026-08-16T10:28:58Z)
- Stats: +9 -2, 3 files
- Labels: size:XS, lgtm, refactor
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

## Summary

Part of the ongoing session-injection refactor tracked in #37403. This slice targets `LLMGenerator.instruction_modify_workflow` in `api/core/llm_generator/llm_generator.py`.

Instead of calling `db.session()` internally, the method now receives an explicit `session: Session` parameter from its caller (`InstructionGenerateApi.post` in `api/controllers/console/app/generator.py`), which already has a session available from `@with_session`.

This follows the same pattern as the example PRs #37402 and #40370.

## Changes

- `api/core/llm_generator/llm_generator.py`: add `session: Session` parameter to `instruction_modify_workflow`; drop internal `db.session()` call.
- `api/controllers/console/app/generator.py`: pass `session=session` at the call site.
- `api/tests/unit_tests/core/llm_generator/test_llm_generator.py`: update the 7 call sites to pass `session=database`.

## Verification

- `pytest tests/unit_tests/core/llm_generator/test_llm_generator.py` → 47 passed
- `pytest tests/unit_tests/controllers/console/app/test_generator_api.py` → 28 passed
- `pyrefly` on the two changed source files → clean
- `mypy` on the two changed source files → no issues
- `ruff` → all checks passed

No behavioral change; this is a pure dependency-injection refactor for testability, matching the `#37403` pattern.

## PR #41491: refactor(service_api): dep-inject app payloads with @model_validate

- URL: https://github.com/langgenius/dify/pull/41491
- Author: ShousenZHANG
- Merged: 2026-08-30T13:11:35Z (created: 2026-08-30T10:34:57Z)
- Stats: +31 -14, 4 files
- Labels: size:S, lgtm, refactor
- Reviews: 2 | Comments: 1
- Linked issues: none

### Description

## Summary

part of #36659

Moves the last three inline `Payload.model_validate(service_api_ns.payload or {})` calls in `service_api/app` onto the existing `@model_validate` decorator, completing the directory #41374 started. Claimed in [this comment](https://github.com/langgenius/dify/issues/36659#issuecomment-5467245437); the sibling `service_api/dataset` slice is #41490.

- `conversation.py` — `ConversationRenameApi.post`, `ConversationVariableDetailApi.put`
- `audio.py` — `TextApi.post`, where the parse also moves out of the handler's try/except; the `except ValueError` arm re-raised unchanged, so a malformed body reached the global handler either way

With this and #41490, every plain `service_api_ns.payload or {}` parse in `service_api` is on the decorator, apart from the sites those PRs deliberately leave alone. The `completion.py` and `workflow.py` handlers use a different shape (`omit_trace_session_id_from_payload(...)` feeds the parse) and sit inside files #39706 is reworking, so they are out of scope here too.

## Behaviour notes

As in #41374: a malformed body returns 422 with the pydantic error JSON instead of 400, and validation runs before the handlers' own `NotChatAppError` guards.

## How did you test it?

- `pytest tests/unit_tests/controllers/service_api/app/test_audio.py test_conversation.py` — **99 passed**, identical count to `main` before the change
- `ruff check` / `ruff format --check` — clean
- `pyrefly check` on both controllers — 0 diagnostics
- Enumerated every test call site of the three handlers by identity: 7 unwrapped-view calls updated (3 audio, 4 conversation), and the sibling `AudioApi` handlers verified untouched
- Runtime signature check on the three wrapped handlers and on `AudioApi.post` (unchanged)

This PR was fully generated with an AI assistant. I have reviewed the changes and run the relevant tests.


## PR #41319: fix(web): improve a11y of dataset clickable divs with native buttons

- URL: https://github.com/langgenius/dify/pull/41319
- Author: LuckTerence
- Merged: 2026-08-30T13:29:51Z (created: 2026-08-26T14:52:04Z)
- Stats: +70 -36, 4 files
- Labels: size:M, lgtm, web
- Reviews: 2 | Comments: 2
- Linked issues: none

### Description

Replace clickable `<div>` elements with native `<button>` elements in two dataset components to fix suppressed jsx-a11y violations (`no-static-element-interactions`, `click-events-have-key-events`), following the same approach as #41301.

## Changes

- `ExternalApiSelect.tsx`: convert the select trigger, dropdown options, and the add-new-API row to `<button type="button">`; add `aria-haspopup="listbox"` and `aria-expanded` on the trigger
- `template-card/operations.tsx`: convert the edit / export / delete menu items to `<button type="button">`
- Remove the corresponding entries from `oxlint-suppressions.json`
- Add accessibility tests to `ExternalApiSelect.spec.tsx` (trigger semantics, expanded state, button roles)

## Verification

- `pnpm lint:a11y` on both files: 0 warnings, 0 errors
- `pnpm test ExternalApiSelect.spec`: 12/12 passed
- `pnpm type-check`: 0 errors

## PR #41490: refactor(service_api): dep-inject dataset payloads with @model_validate

- URL: https://github.com/langgenius/dify/pull/41490
- Author: ShousenZHANG
- Merged: 2026-08-30T15:32:51Z (created: 2026-08-30T10:28:12Z)
- Stats: +75 -58, 8 files
- Labels: size:M, lgtm, refactor
- Reviews: 2 | Comments: 1
- Linked issues: none

### Description

## Summary

part of #36659

Moves the remaining inline `Payload.model_validate(service_api_ns.payload or {})` calls in `service_api/dataset` onto the existing `@model_validate` decorator, the same change #41374 made for the four `service_api/app` and `dataset/metadata` handlers. Claimed in [this comment](https://github.com/langgenius/dify/issues/36659#issuecomment-5467245437).

Nine sites across four files:

- `dataset.py` — `DatasetApi.patch` and the five tag endpoints (`DatasetTagsApi` post/patch/delete, `DatasetTagBindingApi.post`, `DatasetTagUnbindingApi.post`)
- `metadata.py` — `DocumentMetadataEditServiceApi.post`, the one site #41374 left
- `document.py` — `DocumentBatchDownloadZipApi.post`
- `rag_pipeline/rag_pipeline_workflow.py` — `DatasourceNodeRunApi.post`

## Deliberately left alone

`DatasetListApi.post`, the `_create/_update_document_by_text` module helpers, `PipelineRunApi.post`, and all of `segment.py` — open PRs (#40902, #39950, #41081, #39706) have hunks on or beside those, and `SegmentApi.post` additionally has a locally-asserted `{"error": ...}, 400` contract that the decorator would change.

## Behaviour notes

As in #41374, two things shift for the converted handlers:

- validation runs before the handlers' own `NotFound`/`Forbidden` guards, so a request that is both malformed and unauthorised now reports the malformed body
- a malformed body returns 422 with the pydantic error JSON instead of 400

`DatasetTagsApi.delete` is a DELETE: the decorator reads `request.args` first and falls back to the JSON body when the query string is empty, which is the shape this endpoint is called with.

## How did you test it?

- `pytest tests/unit_tests/controllers/service_api/dataset/` — **350 passed**, identical count to `main` before the change
- `ruff check` / `ruff format --check` on all 8 changed files — clean
- `pyrefly check` on the four controllers — 0 diagnostics
- Enumerated every test call site of the nine handlers by identity rather than by grep pattern: the 8 that invoke the unwrapped view now pass the validated model in the injected position; of the 7 that go through the full decorator stack, the four `*_forbidden` tests already supply a JSON body and are unchanged, and the three rag-pipeline tests move their payload from a `service_api_ns` mock into `test_request_context(json=...)` so the live decorator injects it; `DocumentBatchDownloadZipApi` has no handler-invocation test
- Runtime signature check on all nine wrapped handlers (injected model is the first parameter after `self`, annotation matches) and on the two deliberately untouched handlers (signatures unchanged)

This PR was fully generated with an AI assistant. I have reviewed the changes and run the relevant tests.


## PR #41493: revert(web): revert dataset button a11y changes

- URL: https://github.com/langgenius/dify/pull/41493
- Author: lyzno1
- Merged: 2026-08-30T16:07:46Z (created: 2026-08-30T14:04:16Z)
- Stats: +36 -70, 4 files
- Labels: size:M, lgtm, web
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## Summary

- fully revert #41319 and restore the previous dataset interaction implementation
- remove the invalid listbox assertions added by that PR
- restore the corresponding a11y lint suppressions until the controls are fixed through their owning primitives

## Rationale

#41319 changed the DOM and accessibility contracts without verifying the final widgets:

- `ExternalApiSelect` declares `aria-haspopup="listbox"`, but renders no `listbox`, `option`, selected state, or listbox keyboard model
- the template card actions render native buttons inside a Base UI `Menu.Popup` instead of `DropdownMenuItem`, so they are not registered as menu items and do not receive the menu keyboard/focus contract
- the added tests assert ARIA strings and native button roles without testing the actual popup role hierarchy, selection state, focus movement, or keyboard interaction

This revert intentionally restores the previous known behavior. A correct accessibility change should be submitted separately using the Dify UI Select/Menu owners, with label, focus, keyboard, and real product-state verification.

Related review: https://github.com/langgenius/dify/pull/41319#issuecomment-5469044355

## Verification

- `vp test run --project unit app/components/datasets/external-knowledge-base/create/__tests__/ExternalApiSelect.spec.tsx` (8 passed)
- `git diff HEAD^ HEAD --check`
