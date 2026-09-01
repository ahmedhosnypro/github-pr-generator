# PR Patterns: ollama/ollama

## Corpus
- PRs analyzed: 5 (numbers: #18058, #18056, #18077, #17381, #18081)
- Caveat: only 3 distinct authors (ParthSareen ×2, dhiltgen ×2, hoyyeva ×1) and all merges cluster on 2026-08-27–28. The sample is too small to generalize repo-wide; the two most substantive PRs come from one author, so "structure" observations may reflect individual style rather than project convention.

## Titles
Mixed conventions — 3 of 5 use a scope prefix, 2 do not:
- `proxy: continue requests when the model catalog changes` (#18058)
- `app: synchronize macOS app handoff` (#18056)
- `app: list account cloud models for Claude` (#18077)
- `Clean up dead code` (#17381)
- `lint fix` (#18081)

Pattern where present: `<area>: <lowercase imperative/description>`, resembling Conventional Commits scopes (`proxy:`, `app:`) but never with a type (`feat:`/`fix:`) and with lowercase text after the colon. The non-scoped titles are informal and extremely terse (`lint fix`). Lengths range from 8 to ~55 characters; no emoji, no trailing periods, no PR-number suffixes.

## Description structure
No consistent structure across the sample — each of the 5 PRs uses a different shape:
- PR #18058: two short prose paragraphs, no headers ("Claude requests can refresh the model catalog before routing…", "Continue each request with the model snapshot it started with."), ending with a one-line outcome statement ("This removes the intermittent `Claude model catalog changed; try again` error.")
- PR #18056: one prose lead-in ("macOS updates can leave more than one Ollama app process running.") then 7 unlabeled bullets, each a self-contained design decision; no markdown headers
- PR #18077: the only structurally formal one — `## Summary` (3 lowercase bullets) → `## Why` (2 prose paragraphs) → `## Test plan` (2 command bullets)
- PR #17381: a single line — "Largely from the llama-server work."
- PR #18081: empty description

Only one PR uses `##` (H2) headers; the rest are headerless prose/bullets or one-liners.

## Template usage
No evidence of a repo PR template: no `- [ ]` checklists, no boilerplate instructions, no "How Has This Been Tested"-style scaffold, and no unfilled template prompts anywhere — including in the empty description (#18081), which a template would have left populated. The `## Summary` / `## Why` / `## Test plan` triad in #18077 appears only once and is not repeated by the other 4 PRs, so it reads as that author's personal structure. Conclusion: **freeform** (no template, no enforced structure, empty descriptions permitted).

## Length & density
Highly variable, skewing short:
- #18058: ~55 words
- #18056: ~170 words (longest; dense design-rationale bullets)
- #18077: ~110 words
- #17381: 6 words
- #18081: 0 words

Two of 5 descriptions are effectively absent (one-liner, empty). The longer ones (#18056, #18077) justify *why* and document decisions rather than walking through the diff — e.g. #18056 spends a bullet on a rejected alternative: "We are not adding a lease. Two launches can still race… We accept and document that narrow edge case."

## Voice & tone
- Imperative/present-tense verbs in the substantive PRs: "Continue each request…" (#18058), "include…", "continue using…", "retry…" (#18077).
- Occasional first person plural, confined to decision-framing: "We are not adding a lease… We accept and document that narrow edge case." (#18056). No "I".
- Register is terse engineering prose; sentences are short and declarative. Slightly informal where trivial ("lint fix", "Largely from the llama-server work.").

## Content habits
- **Linked issues**: none — 0 of 5 PRs link an issue (no "Fixes #N", no "Closes"), and the metadata confirms `Linked issues: none` on all 5.
- **Test plans**: only #18077 has one, as verbatim Go commands ("`go test ./app/cmd/app -count=1`", "`go test ./internal/proxy -count=1`"). The other 4 PRs — including the +577-line #18056 — show no test evidence in the description.
- **Screenshots/images**: none in any PR (though none of these are heavily visual changes either).
- **Breaking-change callouts / reviewer ask-outs**: none.
- **Labels**: none on any of the 5 PRs.
- **Design-tradeoff documentation**: a notable habit in the largest PR — #18056 explicitly documents rejected approaches and known limitations (no lease, PID-reuse guard, fail-open barrier), functioning as a mini design doc.

## Bot-generated content
No bot-generated content observed: no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot description summaries, no AI-disclaimer footers in any of the 5 PRs. (The product domain mentions Claude extensively — "Claude requests can refresh the model catalog" (#18058) — but that is product context, not PR-authoring automation.) Descriptions read as human-written; with only 5 samples, larger-scale bot usage cannot be ruled out, but there is no structural signature of it here.

## Notable exemplars
- **PR #18056** — https://github.com/ollama/ollama/pull/18056 — the strongest sample: a +577-line change backed by 7 rationale bullets that each state a decision, its failure mode, and a deliberately rejected alternative, making the review self-contained without a template.
- **PR #18077** — https://github.com/ollama/ollama/pull/18077 — the most conventionally complete: `Summary` / `Why` / `Test plan` with concrete commands and a two-paragraph causal explanation of the bug ("Claude mapping validation previously ran before that server was ready…").
