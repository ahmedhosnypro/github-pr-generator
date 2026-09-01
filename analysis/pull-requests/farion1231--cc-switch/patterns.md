# PR Patterns: farion1231/cc-switch

## Corpus
- PRs analyzed: 5 (numbers: #6810, #6472, #6779, #6831, #6941)
- Note on sample diversity: each PR has a different author (SailingLoong, ISuuuu, YUZHEthefool, SaladDay, htyvista), so this is a community-contributor cross-section rather than one maintainer's style — a better basis for repo-wide inference than a single-author sample, but still only 5 data points, all merged 2026-08-26 → 2026-08-29. All 5 are fixes; no `feat:` PRs observed.

## Titles
All 5 titles strictly follow Conventional Commits `fix(<scope>): <lowercase description>`:
- `fix(prompts): keep unmanaged prompt files intact when a restore enables none` (#6810)
- `fix(ci): run WSL2 contract tests via prebuilt binaries` (#6472)
- `fix(provider): always project edits to live configuration` (#6779)
- `fix(codex-oauth): align identity tests with JWT parsing` (#6831)
- `fix(proxy): preserve mid-conversation system messages for prefix cache` (#6941)

Observed rules: type always `fix` (5/5); scope always present and kebab-cased or single-word (`prompts`, `ci`, `provider`, `codex-oauth`, `proxy`); description starts lowercase, no trailing period, no emoji, ~50–70 characters. Scopes mirror the repo's technical surfaces (Rust backend areas + CI). Labels loosely correlate with scope: #6810 `backend`, #6472 `actions`, #6779/#6831/#6941 `backend, proxy`.

## Description structure
Uniform H2 (`##`) section headers with bulleted lists; ordering follows a Summary → (Problem/Changes) → Tests arc, though header names vary by author:

- PR #6810: one-line casual preamble ("Hi 👋 Another one from the open-issue pile…"), `Fixes #6778`, then `## Problem` (prose paragraph) → `## Fix` (bullets) → `## Tests` (bullets with exact test names) → `## Checklist / 检查清单` → closing offer ("Happy to adjust —")
- PR #6472: `## Summary` → `## Scope` → `## Related` → `## Checklist` (3 checkboxes about CI reviews)
- PR #6779: `## Summary` → `## Changes` (6 bullets) → `## Review follow-up` (provenance of the split-from-#6187 change, co-author credit) → `## Verification`
- PR #6831: `## Summary` (3 bullets) → `## Scope` (explicit non-goals: "does not add signature, issuer, or audience verification") → `## Testing` (commands + "two independent blind review passes")
- PR #6941: fully bilingual English/Chinese headers — `## Summary / 概述` → `## Background / 背景` → `## Related Issue / 关联 Issue` → `## Screenshots / 截图` → `## Validation / 验证` → `## Checklist / 检查清单`

Common denominator: a `Summary`/`Problem` opening, an explicit scope-limitation section (`## Scope` in 2 of 5), a verification section listing concrete commands (4 of 5), and a checklist section (3 of 5). Prose is used for cause analysis (#6810's Problem paragraph traces the call chain `run_post_import_sync` → `sync_all_to_live` → `project_prompt_set_to_path`); bullets carry the change lists.

## Template usage
Strong evidence of a repo PR template, adopted partially. The identical bilingual checklist block in #6810 and #6941 is near-verbatim boilerplate:

```
- [x] `pnpm typecheck` passes / 通过 TypeScript 类型检查
- [x] `pnpm format:check` passes / 通过代码格式检查
- [x] `cargo clippy` passes (if Rust code changed) / 通过 Clippy 检查（如修改了 Rust 代码）
- [x] Updated i18n files if user-facing text changed / 如修改了用户可见文本，已更新国际化文件
```

#6941 keeps the same scaffold but edits unchecked items into explanations ("`pnpm typecheck` was not run; this is a Rust-only change / 未运行；本次仅修改 Rust 后端代码") — i.e., the template prompts are being answered in place rather than deleted. The bilingual `## ... / 中文` headers in #6941 also look template-derived. #6472's `## Checklist` is a hand-rolled variant (CI-specific items), and #6779/#6831 drop checklists entirely but keep the section skeleton. Conclusion: **partial template adoption** — a bilingual (EN/中文) template exists; contributors keep its checklist but freely restyle the section headers.

## Length & density
Medium-length descriptions, longer than terse maintainer-note styles:
- #6810: ~330 words (longest English-only body; full problem narrative + safety argument)
- #6472: ~150 words
- #6779: ~200 words
- #6831: ~100 words (shortest)
- #6941: ~280 words, but roughly half is the duplicated Chinese translation (~150 unique words)

Density is high: bullets reference concrete identifiers (`normalize_openai_system_messages`, `proxy_config.enabled`, `restored_prompt_projection_preserves_the_live_file_when_none_are_enabled`). Length correlates with risk/explanation need, not diff size — #6779 is the biggest diff (+442/−130) with a mid-length body; #6810 is +16/−9 with the longest body.

## Voice & tone
- Descriptive/imperative mix: titles and change bullets are imperative ("Drop the clear-on-nothing-enabled branch", "Centralize provider-to-live synchronization…"); problem statements are past/observational ("was only ever reachable from restore paths").
- First person is rare and confined to pleasantry: #6810 opens "Hi 👋" and closes "Happy to adjust — e.g. if you'd rather surface a note…, I can add that on top." The other 4 contain no first person.
- Tone is careful, evidence-forward engineering prose — authors preemptively justify safety ("The interactive behavior is unchanged…", "This is safe because that branch was only ever reachable from restore paths") and enumerate non-goals.
- The repo operates bilingually in practice: #6941 is fully EN/中文 parallel text, and the template checklist is bilingual.

## Content habits
- **Linked issues**: "Fixes #N" used where an issue exists (#6810 → "Fixes #6778"; #6941 → "Fixes #6789"); otherwise references are to related PRs/issues by design ("Related to #6428." #6472; "the backend half of closed PR #6187" #6779; "the identity-fixture follow-up suggested after #6780" #6831). All 5 PRs connect to prior work somehow.
- **Test plans**: systematic. Verification sections quote exact commands: `cargo fmt --all -- --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --lib`, `pnpm typecheck`. #6831 adds process evidence ("two independent blind review passes"); #6472 lists "two independent reviews with no P0, P1, or P2 findings". Known-unrelated failures are disclosed rather than hidden (#6779: "except two pre-existing Windows symlink tests that require the SeCreateSymbolicLink privilege"); #6810 notes its regression test was "Revert-verified: it fails on `main`."
- **Screenshots/images**: 1 of 5 (#6941 embeds a `user-attachments` image in `## Screenshots / 截图`).
- **Breaking-change callouts**: none; instead, explicit compatibility reassurances ("The interactive behavior is unchanged" #6810; "does not… change OAuth routing or account state" #6831).
- **Reviewer ask-outs**: one — #6810's closing "Happy to adjust —" offer.

## Bot-generated content
No bot-authored description blocks observed: no CodeRabbit "Summary by CodeRabbit" scaffolds, no Copilot-generated sections, no AI-disclaimer footers in any of the 5 bodies. AI tooling appears only as *review infrastructure*: #6472's checklist cites "Final diff received two independent reviews with no P0, P1, or P2 findings" and #6831 lists "two independent blind review passes" — phrasing consistent with AI-assisted review passes summarized by the author, not pasted bot output. #6810 also reads as human-authored (emoji greeting, inline negotiation offer). Direct conclusion: in this sample, bot/AI review output is digested by authors into their own summaries rather than pasted verbatim — these descriptions are human-curated, which is a useful (if indirect) signal for what an AI PR-description generator would compete with.

## Notable exemplars
- **PR #6810** — https://github.com/farion1231/cc-switch/pull/6810 — the strongest sample: a 16-line diff backed by a full causal trace of the bug (call-chain diagram in prose), a "why this is safe" argument, an renamed-and-inverted regression test that is "Revert-verified: it fails on `main`", and a template checklist — a complete audit trail.
- **PR #6941** — https://github.com/farion1231/cc-switch/pull/6941 — best-structured community submission: fully bilingual EN/中文 sections with screenshot evidence and honest unchecked-box annotations ("`pnpm typecheck` was not run; this is a Rust-only change"), showing the repo's bilingual template used at its best.
