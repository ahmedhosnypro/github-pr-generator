# Merged PRs: Shubhamsaboo/awesome-llm-apps

_5 merged PRs collected._

## PR #1122: fix: update Browser Use meme agent

- URL: https://github.com/Shubhamsaboo/awesome-llm-apps/pull/1122
- Author: MagMueller
- Merged: 2026-08-30T06:00:43Z (created: 2026-08-27T21:14:01Z)
- Stats: +2790 -1144, 4 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## What changed

- update `browser-use` from 0.1.26 to 0.13.8, the current PyPI and GitHub release
- replace LangChain chat objects with Browser Use's native OpenAI, Anthropic, and Google adapters
- replace the nonexistent `gemini-3.6-flash` model name with `gemini-3-flash-preview`
- remove the redundant direct LangChain and Playwright dependencies and refresh the uv lockfile

## Why

Browser Use 0.13.8 expects its chat model interface. The old LangChain objects do not expose `provider`, so Claude, DeepSeek, Gemini, and OpenAI all fail before the browser opens.

## Tests

- `uv lock --check`
- no-network constructor, Agent handoff, and result parsing check for all four model choices
- headless Browser Use Chromium launch and navigation
- Python compile
- Streamlit root and health endpoints return HTTP 200
- `git diff --check`
- exact-diff secret scan


## PR #1097: fix(advisor-orchestrator-worker): specify high effort for Gemini workers

- URL: https://github.com/Shubhamsaboo/awesome-llm-apps/pull/1097
- Author: labrikg
- Merged: 2026-08-30T06:00:54Z (created: 2026-08-14T22:13:17Z)
- Stats: +3 -2, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary

  - Add `--effort high` to the `agy` worker invocation.
  - Document why the explicit effort setting is required.

  ## Problem

  With `agy` 1.1.13, selecting `gemini-3.7-flash` without an effort level causes every worker dispatch to fail before
  reaching the model:

  ```text
  Error: invalid model selection (--model "gemini-3.7-flash" --effort ""):
  --model gemini-3.7-flash requires --effort
  (available: low, medium, high)

  ## Fix

  Update the worker command to include:

  agy --dangerously-skip-permissions \
    --model "gemini-3.7-flash" \
    --effort high

  ## Validation

  Tested with agy 1.1.13 by dispatching three isolated Gemini 3.7 Flash workers concurrently. All workers completed
  successfully, returned valid JSON, and passed exact jq assertions.

  Without the flag: 3/3 dispatches failed locally.
  With --effort high: 3/3 dispatches passed.

## PR #1126: Fix renamed/transferred repo URLs across template docs

- URL: https://github.com/Shubhamsaboo/awesome-llm-apps/pull/1126
- Author: Shyboy0499
- Merged: 2026-08-30T06:03:03Z (created: 2026-08-29T10:27:51Z)
- Stats: +11 -11, 5 files
- Labels: none
- Reviews: 0 | Comments: 2
- Linked issues: none

### Description

## Summary

Updates 5 repositories whose URLs moved (renamed/transferred), referenced across the README and template docs.

| Old | New |
| --- | --- |
| `accomplish-ai/openwork` | `accomplish-ai/coworker` |
| `chopratejas/headroom` | `headroomlabs-ai/headroom` |
| `EvoAgentX/EvoAgentX` | `ANative-Lab/EvoAgentX` |
| `joaomdmoura/crewAI` | `crewAIInc/crewAI` |
| `mendableai/firecrawl-mcp-server` | `firecrawl/firecrawl-mcp-server` |

Each new location confirmed as the canonical `nameWithOwner` via the GitHub API. Pure URL swaps; no prose content changed.

## PR #1106: Add AI x402 Paying Agent — pays a local seller you run yourself (testnet, vendor-free rework of #1028)

- URL: https://github.com/Shubhamsaboo/awesome-llm-apps/pull/1106
- Author: GTCC777
- Merged: 2026-08-30T06:29:37Z (created: 2026-08-17T05:15:35Z)
- Stats: +355 -0, 5 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

Reworked resubmission of #1028, following your guidance there exactly. Thanks for the clear steer.

**What changed from #1028**
- All commercial endpoints are gone. The demo now pays a **seller the reader runs locally**: `seller.py`, a complete pay-per-call x402 API in ~60 lines of FastAPI with two toy endpoints (paid fortune, paid dice roll).
- Payments settle in **testnet USDC on Base Sepolia** through the public `x402.org` facilitator (the SDK default). The buyer wallet is funded from Circle's free faucet, and the seller address is the reader's own second address — so following along costs nothing and routes money to nobody but yourself, while still exercising the real 402 → signed payment → on-chain settlement loop.
- No vendor links anywhere; the only external references are x402.org and Coinbase's docs for the production-wallets note.

**Unchanged**
- The agent itself: Claude tool-use loop, automatic 402 payment via the `x402` SDK, hard per-call budget cap (`MAX_PRICE_USDC`), and a no-LLM `--direct` mode to see the payment flow in isolation.

**Tested end to end before submitting**: local seller returns a correct 402 challenge; the agent signs and pays; the facilitator settles; the data comes back 200; and the exact quoted amount (1000 atomic units = $0.001 testnet USDC) is confirmed on-chain in the seller wallet on Base Sepolia.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## PR #1059: Add AI Codebase Migration Agent (LangGraph HITL + parallel Send() fan-out)

- URL: https://github.com/Shubhamsaboo/awesome-llm-apps/pull/1059
- Author: Aryan-Pardeshi
- Merged: 2026-08-30T07:42:00Z (created: 2026-08-03T16:19:32Z)
- Stats: +1111 -0, 5 files
- Labels: none
- Reviews: 0 | Comments: 4
- Linked issues: none

### Description

Follow-up to #1056, which was closed on novelty overlap — three deep-research agents already exist. Per that feedback, this keeps the LangGraph architecture and applies it to a use case the repo doesn't cover.

### What this adds

A multi-agent **codebase migration planner**. You give it a repo target and a migration goal ("migrate Pydantic v1 → v2", "Flask 2 → 3", "JS → TS"); it produces a file-by-file plan with per-file risk ratings, pauses for your approval, then fans out parallel workers to generate the diffs.

```
START → query_validator → planner → approval (interrupt)
      → refactor_worker fan-out (Send()) → aggregator → END
```

### Why this domain

The two LangGraph primitives worth teaching here are `interrupt()` plan approval and `Send()` fan-out. In a research agent, approving a plan is a UX nicety. Here it's a safety property: the plan describes rewrites to N source files, and reviewing it before execution is the whole point. The risk matrix (Low/Medium/High/Critical per file, with reasoning) is what you're actually approving.

The revision path matters too — feedback like *"also include tests/test_billing.py"* routes back to the planner and re-interrupts, rather than being a one-shot yes/no gate.

### Verification

Tested end-to-end against a live OpenAI-compatible endpoint, not just imports:

- validator → planner → `interrupt()` pauses correctly with a populated plan
- revision path: natural-language feedback → replan → second interrupt
- approve → 6 workers fanned out in parallel, 6/6 succeeded, 0 errors
- aggregator synthesized a 29k-char report with an embedded matplotlib risk chart

Also covered by a stubbed graph test asserting node set, interrupt firing, worker count, and result accumulation — runs with no API key.

### Notes

- Defaults to `gpt-5-mini` (planning/workers) and `gpt-5.5` (synthesis), matching model IDs already used elsewhere in this repo. Any OpenAI-compatible endpoint works via `LLM_BASE_URL`.
- `.env.example` is one required key plus commented optional overrides.
- Chart code from the LLM runs through an import allowlist and a wall-clock timeout.

### Run it

```bash
cd awesome-llm-apps/advanced_ai_agents/multi_agent_apps/ai_codebase_migration_agent
pip install -r requirements.txt
streamlit run app.py
```

