# PR Patterns: openai/codex

## Corpus
- PRs analyzed: 5 (numbers: #41660, #41666, #41673, #41683, #41700)
- Caveat: this sample is extremely homogeneous — all 5 PRs are by the same author (`copyberry`), all created and merged on the same day (2026-08-30) within minutes of creation (merge latency 1–2 minutes each), all with 0 reviews, 0 comments, no labels, and no linked issues. Every description ends with an identical-form HTML comment (`<!-- copyberry-projection-id: … -->`). This strongly suggests automated/bot-authored PRs rather than human maintainer PRs, so the sample reflects one automated pipeline's output, not repo-wide human convention.

## Titles
All 5 titles are plain imperative sentences with no conventional-commit prefix, no scope, no emoji, no trailing period:
- `Preserve Guardian authorization across history compaction` (#41660)
- `Approve the first Node REPL execution without a Guardian wait` (#41666)
- `Repair cursor-style rendering on older JediTerm terminals` (#41673)
- `Set working directories for environment MCP tests` (#41683)
- `Support package-style MCP server names` (#41700)

Pattern: `<Capitalized imperative verb> <object> <qualifier>`. Initial cap, sentence-style casing thereafter (only proper nouns like `Node REPL`, `JediTerm`, `MCP` capitalized mid-title). Lengths ~37–56 characters. Notably, each description's first line repeats the title verbatim (e.g. #41660's body opens with "Preserve Guardian authorization across history compaction").

## Description structure
Descriptions use `##` (H2) section headers drawn from a fixed set of three: `## Why`, `## What changed`, `## Testing`, always in that order when present. The body opens with the title restated as a plain first line before the first header.

- PR #41660: title line → `## Why` (2-sentence prose) → `## What changed` (3 bullets) → `## Testing` (1 prose sentence)
- PR #41666: title line → `## Why` (1 sentence) → `## What changed` (3 bullets) → `## Testing` (1 sentence)
- PR #41673: title line → `## Why` (1 sentence) → `## What changed` (3 bullets) → `## Testing` (1 sentence)
- PR #41683: title line → `## Why` (1 sentence) → `## What changed` (2 bullets) — **no Testing section**
- PR #41700: title line → `## What changed` (3 bullets) → `## Testing` (2 bullets) — **no Why section**

`## Why` is prose only; `## What changed` is always a bulleted list (2–3 items, each 1–3 wrapped lines); `## Testing` is prose in 3 PRs and bullets in #41700. Canonical order: [title restatement] → Why → What changed → Testing.

## Template usage
No evidence of a repo-enforced PR template: no `- [ ]` checklists, no "How Has This Been Tested"-style scaffold, no boilerplate instructions or unfilled prompts. However, the Why / What changed / Testing triad repeats with near-mechanical consistency (4 of 5 have all or most of it in identical order), and every PR carries the hidden `<!-- copyberry-projection-id: … -->` marker. Conclusion: **freeform in name, but effectively a generated fixed-structure format** — the uniformity comes from the authoring automation, not from a repo template file.

## Length & density
Uniformly short:
- #41660: ~110 words
- #41666: ~85 words
- #41673: ~90 words
- #41683: ~60 words (shortest)
- #41700: ~75 words

All under ~110 words, each fitting on one screen. Density is high: bullets pack technical specifics (e.g. #41673: "Handle skipped cells, wide glyphs, and single-column viewports without corrupting content or causing scrolling"), with no filler, greetings, or sign-offs. Change sizes are modest (+47 to +281 additions), matching the terse descriptions.

## Voice & tone
- Imperative mood throughout — titles and bullets: "Track a host-owned user-message revision…", "Apply the normal Guardian review policy…", "Quote non-bare server names in generated `config.toml` recovery hints…".
- Third-person/neutral; no first person ("I"/"we") anywhere in the 5 descriptions.
- Formal, terse, precise engineering register; heavy use of inline code formatting for identifiers (`DECSCUSR`, `mcp add`, `cwd`, `npm:@modelcontextprotocol/server-sequential.thinking`).
- Rationale is stated factually, not persuasively (#41666: "The first REPL execution should proceed while its initial asynchronous Guardian classification is still pending.").

## Content habits
- **Linked issues**: none — 0 of 5 reference any issue (`Linked issues: none` on all). No "Fixes #N" lines.
- **Test plans**: a `## Testing` section in 4 of 5 PRs describing added coverage categorically ("Added coverage that cached Guardian authorization survives compaction…", #41660) — no verbatim commands, build output, or pass counts.
- **Screenshots/images**: none, though #41673 is a terminal-rendering change where a before/after capture would be plausible.
- **Breaking-change callouts / reviewer ask-outs**: none.
- **Process metadata**: 0 reviews and 0 comments on all 5; merged 1–2 minutes after creation — consistent with an automated merge pipeline with no human review discussion in the sample.

## Bot-generated content
The entire sample appears bot-generated: the author `copyberry`, the per-PR `<!-- copyberry-projection-id: <64-hex-char> -->` footer, sub-2-minute merge latency, and zero review activity all point to an automated authoring/merge pipeline (likely an AI-agent workflow internal to openai/codex). Unlike third-party summarizer bots (CodeRabbit, Copilot), which append a recognizable "Summary" block to human PRs, here the *entire* description is machine-structured — the Why/What-changed/Testing triad *is* the bot's output format. For an AI PR-description generator, this is the key competitive signal: the repo's own automation already produces concise, structured, imperative descriptions; there is no leftover human-authored freeform to improve upon in this sample. (Caveat: with 5 same-author same-day PRs, we cannot say whether human contributors to openai/codex write differently.)

## Notable exemplars
- **PR #41673** — https://github.com/openai/codex/pull/41673 — the most complete sample: a crisp one-line root cause ("Older JediTerm versions can print the space intermediate in `DECSCUSR`"), three outcome-focused change bullets including edge cases (wide glyphs, single-column viewports), and a test-coverage summary — full context in ~90 words.
- **PR #41700** — https://github.com/openai/codex/pull/41700 — best specificity: the change bullets name the exact surface area (`mcp add`, `get`, `list`, `remove`, OAuth credential lookup) and give a concrete example name (`npm:@modelcontextprotocol/server-sequential.thinking`), making scope unambiguous without reading the diff.
