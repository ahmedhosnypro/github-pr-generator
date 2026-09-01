# Merged PRs: langchain-ai/langchain

## PR #39978: docs(groq): remove duplicate `method` block from `with_structured_output` docstring

- URL: https://github.com/langchain-ai/langchain/pull/39978
- Author: HuzaifaChaudary
- Merged: 2026-08-27T23:00:43Z (created: 2026-08-27T22:55:31Z)
- Stats: +9 -12, 2 files
- Labels: documentation, integration, groq, external, size: XS, new-contributor, bypass-issue-check
- Reviews: 2 | Comments: 1
- Linked issues: Closes #39977

### Description

Closes #39977

---

Anyone reading the `ChatGroq.with_structured_output` reference sees the `method` argument documented twice, and the two blocks disagree with each other.

The first block is the current one. It lists three options and matches how the sibling `langchain-openai` package documents the same argument. The second block is older. It says the argument is `'function_calling'` or `'json_mode'`, which stopped being true when `'json_schema'` support was added. A reader who stops at the second block will not know `'json_schema'` exists, and the duplicate key also breaks API reference rendering.

This removes the stale block. The one thing it said that the surviving block did not was the warning that `'json_mode'` does not support streaming responses or stop sequences, so that warning moves up rather than being dropped. Everything else in it was already covered above.

No behaviour changes, docstring only.

The added unit test asserts `method` appears once and that `json_schema` is still described. It fails on the current `master` and passes with this change.

---

Disclaimer: this contribution was prepared with the assistance of an AI agent. I reviewed the change, verified the reproduction from the issue against `master`, and ran the package unit tests and `ruff` locally before opening it.

---

## PR #39942: chore(langchain): bump vcrpy test dependency minimum to `>=8.2.0`

- URL: https://github.com/langchain-ai/langchain/pull/39942
- Author: mdrxy
- Merged: 2026-08-28T02:28:11Z (created: 2026-08-26T19:38:12Z)
- Stats: +7 -5, 6 files
- Labels: langchain, infra, dependencies, langchain-classic, internal, size: XS
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

Raises the minimum `vcrpy` version from `>=8.0.0` to `>=8.2.0` in the integration-test dependencies of `langchain-classic` and `langchain`, aligning them with `langchain-openai` (`>=8.2.0`) and `langchain-tests` (`>=8.2.1`), which already require newer versions.

Made by [Open SWE](https://openswe.vercel.app/agents/cedc18ba-0856-5697-949e-3c6616845c60)

---

## PR #38355: fix(langchain): include model destination in agent tool routing

- URL: https://github.com/langchain-ai/langchain/pull/38355
- Author: Sourav1331
- Merged: 2026-08-30T01:41:08Z (created: 2026-06-22T07:08:17Z)
- Stats: +53 -8, 3 files
- Labels: langchain, fix, external, size: S, new-contributor
- Reviews: 2 | Comments: 2
- Linked issues: Fixes #38351

### Description

Fixes #38351

This PR fixes `create_agent` conditional edge routing when middleware injects synthetic `ToolMessage` objects for already-satisfied tool calls.

Previously, `_make_model_to_tools_edge` could return the model loop entry destination, but that destination was not always included in `model_to_tools_destinations`. This caused LangGraph to raise `KeyError("model")`.

Changes:

* Include `loop_entry_node` in `model_to_tools_destinations`.
* Add a regression test covering synthetic `ToolMessage` injection through `wrap_model_call` middleware using `ExtendedModelResponse` and `Command(update={"messages": ...})`.

Test:

* `uv run --group test pytest tests/unit_tests/agents/middleware/core/test_framework.py::test_create_agent_synthetic_tool_messages_reroute_to_model`

Result:

* Passed

---

## PR #40022: fix(core): avoid mutation in bedrock converse standard content

- URL: https://github.com/langchain-ai/langchain/pull/40022
- Author: ccurme
- Merged: 2026-08-30T02:16:33Z (created: 2026-08-30T02:08:19Z)
- Stats: +90 -10, 2 files
- Labels: core, fix, internal, size: S
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

Resolves https://github.com/langchain-ai/langchain/issues/39821

---

## PR #40023: fix(core): avoid mutation in google-genai standard content

- URL: https://github.com/langchain-ai/langchain/pull/40023
- Author: ccurme
- Merged: 2026-08-30T02:44:25Z (created: 2026-08-30T02:32:52Z)
- Stats: +38 -4, 2 files
- Labels: core, fix, internal, size: XS
- Reviews: 2 | Comments: 1
- Linked issues: none

### Description

Resolves https://github.com/langchain-ai/langchain/issues/40001.

---
