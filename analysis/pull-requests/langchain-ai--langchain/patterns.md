# PR Patterns: langchain-ai/langchain

## Corpus
- PRs analyzed: 5 (numbers: #39978, #39942, #38355, #40022, #40023)
- Caveat: 5 PRs by 4 authors — 3 internal/maintainer (mdrxy; ccurme ×2) and 2 external new contributors (HuzaifaChaudary, Sourav1331). Small sample, but it usefully shows a clear internal-vs-external style split. 4 of 5 are `size: XS`/`size: S` fixes, so the sample under-represents large features.

## Titles
All 5 titles follow Conventional Commits with a parenthesized scope: `<type>(<scope>): <lowercase description>`.
- `docs(groq): remove duplicate `method` block from `with_structured_output` docstring` (#39978)
- `chore(langchain): bump vcrpy test dependency minimum to `>=8.2.0`` (#39942)
- `fix(langchain): include model destination in agent tool routing` (#38355)
- `fix(core): avoid mutation in bedrock converse standard content` (#40022)
- `fix(core): avoid mutation in google-genai standard content` (#40023)

Types observed: `fix` (3×), `docs` (1×), `chore` (1×). Scopes are package/component names: `core`, `langchain`, `groq`. Description text after the colon is entirely lowercase in 5/5, imperative or gerund-free phrasing ("remove", "bump", "include", "avoid"), no emoji, no trailing period. Lengths range ~45–80 chars. Backtick-quoted code symbols appear in 2 titles (`method`, `with_structured_output`, `>=8.2.0`), reinforcing the precision habit.

## Description structure
No markdown headings are used anywhere in the 5 descriptions — structure is prose paragraphs plus occasional plain-text pseudo-labels.

- #39978: "Closes #39977" opener, `---` rule, then 5 prose paragraphs: symptom ("the `method` argument documented twice, and the two blocks disagree with each other"), root-cause narrative, fix statement ("This removes the stale block…"), "No behaviour changes, docstring only.", test justification ("It fails on the current `master` and passes with this change"), `---`, AI-assistance disclaimer.
- #39942: single prose paragraph stating the version bump and cross-package alignment ("aligning them with `langchain-openai` (`>=8.2.0`) and `langchain-tests` (`>=8.2.1`)"), then an agent-attribution line.
- #38355: "Fixes #38351" opener, one prose paragraph on the bug ("caused LangGraph to raise `KeyError(\"model\")`"), then plain-text scaffold labels — `Changes:` (2 bullets), `Test:` (1 bullet with exact pytest command), `Result:` (`Passed`) — none of these are markdown headers. Note: the body uses `\r\n` line endings, inconsistent with the others.
- #40022: one line — "Resolves https://github.com/langchain-ai/langchain/issues/39821"
- #40023: one line — "Resolves https://github.com/langchain-ai/langchain/issues/40001."

## Template usage
No evidence of a repo PR template: no `- [ ]` checklists, no boilerplate prose, no section scaffolds, no unfilled prompts. The `bypass-issue-check` label on #39978 hints at automation that normally requires a linked issue, but not a description template. External contributors self-organize (#38355's `Changes:`/`Test:`/`Result:` scaffold is handwritten, not boilerplate). **Conclusion: freeform.**

## Length & density
- #39978: ~200 words (longest — external contributor, full narrative)
- #39942: ~55 words
- #38355: ~115 words
- #40022: ~3 words
- #40023: ~3 words

Clear split: external `new-contributor` descriptions are 100–200 words with narrative depth, while internal maintainer descriptions collapse to a single issue link (ccurme's #40022/#40023) or one intentional paragraph (mdrxy's #39942). The repo tolerates — and merges — one-line maintainer descriptions.

## Voice & tone
- Imperative or neutral declarative; present tense. Titles are imperative ("avoid mutation", "remove duplicate").
- First person appears only in #39978's disclaimer ("I reviewed the change, verified the reproduction…"). Elsewhere no "I/we".
- Formal, dense, technical register. Heavy backtick usage for symbols: `with_structured_output`, `loop_entry_node`, `model_to_tools_destinations`, `vcrpy`.
- #38355 uses the impersonal "This PR fixes…" framing. No pleasantries, greetings, or thanks anywhere.

## Content habits
- **Linked issues**: 4 of 5. Formats vary: "Closes #39977" (#39978), "Fixes #38351" (#38355), and full URLs — "Resolves https://github.com/…39821" (#40022, #40023). No keyword convention is enforced.
- **Test plans**: present in 2 of 5, and only from external contributors: #38355 gives the verbatim command (`uv run --group test pytest tests/unit_tests/.../test_framework.py::test_create_agent_synthetic_tool_messages_reroute_to_model`) plus "Result: Passed"; #39978 describes the test's before/after behavior in prose. Internal maintainer PRs have no test plan in the description.
- **No-behaviour-change callouts**: #39978 explicitly states "No behaviour changes, docstring only."
- **Cross-package alignment**: #39942 justifies the change by citing the sibling packages' versions (`langchain-openai` `>=8.2.0`, `langchain-tests` `>=8.2.1`).
- **Screenshots**: none. **Breaking-change callouts**: none. **Reviewer ask-outs**: none.
- **Labels** (uniform and machine-applied): every PR has `size: XS|S` plus `internal`/`external`; external PRs also get `new-contributor`; topic labels match title scope (`groq`, `core`, `dependencies`).

## Bot-generated content
This sample is notable for **explicit AI-agent involvement disclosures**, though not CodeRabbit/Copilot summary blocks:
- #39942 ends with "Made by [Open SWE](https://openswe.vercel.app/agents/…)" — a full agentic coding tool attribution; the paragraph reads agent-composed but is kept verbatim by maintainers.
- #39978 includes an explicit disclaimer: "this contribution was prepared with the assistance of an AI agent. I reviewed the change, verified the reproduction from the issue against `master`, and ran the package unit tests and `ruff` locally before opening it." — a human-accountability wrapper around AI assistance, framed as a `---`-delimited footer.
No CodeRabbit "Summary" sections or Copilot auto-descriptions observed; the disclosures above suggest the community has settled on labeled AI assistance rather than bot-authored descriptions.

## Notable exemplars
- **PR #39978** — https://github.com/langchain-ai/langchain/pull/39978 — the strongest sample: explains the visible symptom, the historical root cause, exactly what moved where ("that warning moves up rather than being dropped"), a falsifiable test claim ("fails on the current `master`"), and an honest AI-assistance disclosure.
- **PR #38355** — https://github.com/langchain-ai/langchain/pull/38355 — the best bug-fix template in the set: linked issue, failing symptom (`KeyError("model")`), bulleted changes, and a copy-pasteable test command with its result.
