# PR Patterns: anomalyco/opencode

## Corpus
- PRs analyzed: 5 (numbers: #46077, #46221, #46278, #46279, #46281)
- Caveat: 3 of 5 PRs (#46278, #46279, #46281) are by the same author (rekram1-node) and all 5 were merged on a single day (2026-08-30). The sample reflects a narrow time window and one dominant contributor's style; it is too homogeneous to characterize repo-wide conventions with confidence.
- All 5 PRs show **0 reviews and 0 comments** (review metadata), yet #46077 waited ~35 hours while the single-author PRs merged within ~1 hour — descriptions here serve as self-justifying audit trails rather than discussion threads.

## Titles
All 5 titles use Conventional Commits-style type prefixes:
- `fix(ai): use unique Gemini block ids` (#46279)
- `feat(ai): add native Mistral provider` (#46278)
- `fix(ai): reject truncated bedrock frames` (#46281)
- `refactor(core): bind standalone skill activation to Session` (#46077)
- `fix: remove Hy3 Free docs and correct Go chart rendering` (#46221)

Pattern: `<type>(<scope>): <lowercase imperative/verb phrase>`. Types observed: `fix` (3), `feat` (1), `refactor` (1). Scope is optional (absent in #46221); observed scopes are package-name-like tokens (`ai` ×3, `core` ×1). Everything after the colon is lowercase except proper nouns ("Gemini", "Mistral", "Session", "Hy3 Free", "Go"). Lengths ~35–60 characters, single line, no emoji, no trailing period. #46221 packs two unrelated changes into one title joined by `and`.

## Description structure
All descriptions use `##` (H2) headers — except #46221, which has no headers at all. Per PR:

- PR #46279: `## Summary` (four prose paragraphs) → `## Testing` (2 command bullets)
- PR #46278: `## Summary` (6 bullets) → `## Model behavior` (4 bullets) → `## Testing` (10 bullets) → plain-text `Fixes #43199` trailer (not a header)
- PR #46281: `## Summary` (3 bullets) → `## Testing` (4 bullets: `bun test…`, `bun typecheck`, `bunx prettier --check…`, `git diff --check`)
- PR #46077: `## Why` (prose) → `## What Changes` (prose + a 6-row behavior-preservation markdown table) → `## Scope` (explicit boundaries and follow-up linkage) → `## Verification` (fenced `sh` block of commands plus several prose paragraphs with bolded pass counts)
- PR #46221: two bare bullets ("Remove Hy3 Free from Zen documentation across all locales. / Fix Go chart color flashing and clipped bonus labels."), no headers, no testing section

Canonical order for the dominant author: `Summary` → [optional domain-specific section, e.g. `Model behavior`] → `Testing`. `## Summary` + `## Testing` appear in 4 of 5 PRs. `Summary` is prose in one PR (#46279) and bullets in the other two.

## Template usage
No evidence of a repo-enforced PR template: no `- [ ]` checklists, no boilerplate instructions, no "How Has This Been Tested" scaffold, no leftover template prompts. However, the recurring `## Summary` / `## Testing` pairing across all three rekram1-node PRs functions as a stable personal convention, and #46077's `Why` / `What Changes` / `Scope` / `Verification` skeleton shows a second author's consistent structure. Conclusion: **freeform, with strong author-level structural conventions** (two distinct personal templates visible in the sample).

## Length & density
Highly bimodal:
- #46221: ~20 words (two bullets, no test plan)
- #46281: ~80 words
- #46279: ~180 words (prose-heavy summary)
- #46278: ~250 words (bullet-dense, lists 10 distinct test invocations)
- #46077: ~700+ words — by far the longest, including a table, a fenced command block, and a commit-by-commit verification narrative

Pattern: length tracks risk and authorship, not change size. #46278 (+2063 lines) is denser but shorter than #46077 (+220). Bullet bodies are outcome statements with inline backticked identifiers (`recorded native Mistral text/usage, reasoning replay, and tool-loop cassettes`); prose is technical and clause-heavy.

## Voice & tone
- Bullets use imperative lowercase verbs: `add`, `preserve`, `accumulate`, `normalize`, `route`, `retain`, `validate`, `fail`. Summary prose uses present-tense descriptive voice ("Gemini reused common-event IDs after a text or reasoning block completed").
- Third-person/neutral throughout; no first person (`I`/`we`) anywhere in the 5 descriptions. #46077 refers to its own effort impersonally: "Three simplify passes reviewed the complete diff…".
- Formal, precise, engineer-to-engineer register; numbers are used for credibility ("110 passed, 0 failed, 455 assertions", "3,977 passed… 79,563 assertions across 225 files (191.25 seconds)").
- Occasional emoji-free bold for metrics: `**110 passed, 0 failed**` in #46077.

## Content habits
- **Test plans**: systematic in 4 of 5 PRs — a `## Testing` or `## Verification` section listing exact commands (`bun test test/provider/gemini.test.ts`, `bun typecheck`, `git diff --check`), sometimes with recorded-fixture runs (`RECORDED_PROVIDER=mistral bun test… (4 pass)`). The outlier is #46221, which has no test evidence despite touching 19 files.
- **Linked issues**: 1 of 5 (`Fixes #43199` in #46278, placed as a trailer at the bottom, not the top). Cross-PR linkage is more common than issue linkage: #46077 references #46019, #46075, #46083; anchors also fine-grained ("bind … to Session", "follow-up to #46019").
- **Screenshots/images**: none in any PR — notable for #46221, which claims to fix chart rendering visuals.
- **Breaking-change callouts / reviewer ask-outs**: none observed. #46077 instead uses a behavior-preservation table (columns `Activation` / `Preserved behavior`) to prove non-regression.
- **Commit-hash anchoring**: unique to #46077 — verification results are pinned to specific SHAs (`at 135fe3bd97`, `171947787c`, `8c55494b11`, `009477ebcd`), treating the PR body as a reproducible evidence log.
- **Labels**: absent on the 3 single-author PRs; `contributor` on #46077 and #46221.

## Bot-generated content
No bot-generated description content observed — no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot summaries, no AI-disclaimer footers. Notably, #46077 *does* surface machine/human-assisted process signals in plain prose ("Three simplify passes reviewed the complete diff for reuse, quality, and efficiency") without attributing them to any named bot; the structure and wording read as deliberately authored. From an AI-PR-description standpoint this repo is a counterexample to bot-generated descriptions: the bodies are human-curated, evidence-dense writeups that bots would need to be carefully steered to reproduce.

## Notable exemplars
- **PR #46077** — https://github.com/anomalyco/opencode/pull/46077 — the strongest sample: separates motivation (`## Why`) from mechanics (`## What Changes`), proves non-regression with a behavior table, fences exact verification commands, and pins every claim to a commit SHA; a complete, audit-ready record for a risky refactor.
- **PR #46278** — https://github.com/anomalyco/opencode/pull/46278 — best large-feature writeup: a 2,063-line addition compressed into scoped summary bullets, a `## Model behavior` decision record, and a 10-item test list covering fixtures, typechecks, builds, and diff hygiene, closed by `Fixes #43199`.
