# PR Patterns: Graphify-Labs/graphify

## Corpus
- PRs analyzed: 5 (numbers: #512, #583, #648, #1366, #1737)
- Caveat: 5 PRs by 5 different authors (alacasse, Bichalla, rrangraj, RelywOo, TPAteeq) across ~5.5 weeks (2026-05-01 → 2026-07-08). Diverse authorship makes this a reasonable cross-section of contributor style, but 5 samples is still small; conclusions about edge-case habits (breaking changes, UI PRs) are weakly grounded. All PRs share identical metadata traits: no labels, 0 review comments recorded, and only #512 (>1 day cycle, 10 comments) shows extended discussion.

## Titles
All 5 titles follow strict Conventional Commits: `type[(scope)]: summary`.
- `fix(skill): pin extraction source_file + root the full build so --update stops duplicating` (#1366)
- `feat: add Kilo Code support` (#512)
- `refactor: decompose extract.py and __main__.py into focused modules` (#1737)
- `feat(detect): add hidden path allowlist` (#583)
- `feat: add VB.NET (.vb) language support via tree-sitter` (#648)

Pattern: exact types `feat` (3×), `fix` (1×), `refactor` (1×); scopes appear in 2 of 5 (`skill`, `detect`) and are lowercase single-word paths/areas when present. Everything after the colon is lowercase, includes the concrete artifact being changed (`extract.py and __main__.py`, `.vb`, `.graphifyinclude` via "hidden path allowlist"), with no emoji and no trailing period. Length varies widely: ~30 chars (#512) up to ~95 chars (#1366), which packs two sub-fixes into one title (`+` separator).

## Description structure
All 5 use `##` (H2) headers with bulleted lists; no two PRs use identical header sets, but a `## Summary`-first pattern recurs. Per PR:

- #1366: `## Problem` (numbered gap list) → `## Fix (engine build.py unchanged)` (3 bullets) → `## Test` (one paragraph). Ends with a dependency line: "Builds on #1344 and #1361 (same bug family)."
- #512: one-line "Closes #477" preamble + "Added support for Kilo Code." then `## Summary` (5 bullets).
- #1737: short preamble paragraph, then `## Why` (prose) → `## Size impact` (markdown table: file / before / after with **bold** deltas like "**4,740** (−72%)") → `## What moved (one subsystem per commit)` (nested bullets) → `## Why it's safe` (bolded claims: "**Verbatim.**", "**No import cycles.**") → `## Left as-is (intentionally)`.
- #583: `## Summary` (4 bullets) → `## Verification` (exact commands: `uv run --with pytest python -m pytest tests/test_detect.py -q` → 30 passed) → `## Context` (one sentence of motivation).
- #648: no headers at all — a prose opening paragraph, then per-file labeled lists: `graphify/detect.py:`, `graphify/extract.py:`, `pyproject.toml:`, `tests/fixtures/sample.vb:`, `tests/test_languages.py:`, `README.md:`, each with indented bullets of exactly what changed.

Canonical shape: brief context/Summary first, verification/test evidence near the end. Header diversity (Problem/Fix, Why/Size impact, Summary/Verification/Context) suggests authors choose sections to fit the change rather than filling a fixed scaffold.

## Template usage
No PR template in evidence. Zero checklists (`- [ ]`), zero "How Has This Been Tested"-style scaffold questions, zero boilerplate instructions or leftover unfilled prompts. The `## Summary` header shared by #512 and #583 is the only repeated header, but the surrounding content is fully authored. Conclusion: **freeform**, with a strong personal-convention bias toward H2 sections and bullets.

## Length & density
Medium-to-long, information-dense descriptions; the shortest is still substantive:
- #512: ~60 words (lean — 5 Summary bullets), but the PR is +1100 lines, so this is the corpus's low-density outlier.
- #583: ~95 words.
- #1366: ~260 words.
- #648: ~300 words (file-by-file walkthrough).
- #1737: ~370 words plus a size-impact table (largest PR at +19,477/−19,060, and the description does the most work to justify it).

Pattern: density scales with risk. The giant refactor (#1737) and the subtle bug fix (#1366) get the longest, most argument-structured descriptions; the features (#512, #648) are itemized rather than argued.

## Voice & tone
- Predominantly declarative/imperative engineering register, third person, no first-person "I"/"we" anywhere. #648 opens "This commit adds full VB.NET language support…" (commit-as-actor).
- Technical and precise, heavy on bold for key terms: e.g. "**verbatim moves only**" (#1737), "**different `source_file` bases for the same file**" (#1366), "leaving `changed` in `prune_sources` would **delete the freshly re-extracted nodes**" (#1366).
- Concrete numbers throughout: "25 to 26" languages (#648), "3036 passed, 29 skipped" (#1737), "36 → 1 canonical node" style drift counts in #1366 ("leaves 3 nodes… collapses to 1 canonical node").
- Slightly adversarial/audit-ready tone in the bigger PRs: sections explicitly preempt objections (`## Why it's safe`, `## Left as-is (intentionally)`).

## Content habits
- **Linked issues**: 1 of 5 (#512: "Closes #477" as opening line). The rest link **prior PRs** as lineage instead: #1366 cites "#1344", "#1361", and closes with "Builds on #1344 and #1361 (same bug family)"; #1737 cites "(continues the `MIGRATION.md` / #1212 effort)". PR-to-PR linking is the dominant cross-reference habit.
- **Test evidence is near-universal**: 4 of 5 include exact commands and/or pass counts — #583 quotes the full pytest invocations (`→ 30 passed`, `→ 443 passed`), #1737 states "3036 passed, 29 skipped" and lists `ruff check` / `skillgen --check` as clean, #1366 names the new test (`test_build_merge_root_collapses_convention_drift`) and suite result (35 passed), #648 enumerates 13 new tests by scenario. Only #512 omits explicit results (mentions tests were "Extended" without counts).
- **Tables**: 1 of 5 (#1737's before/after LOC table).
- **Screenshots/images**: none — consistent with a CLI/headless tool with no UI surface.
- **Breaking-change callouts / reviewer ask-outs**: none. The closest is defensive framing in #1737 ("Nothing to update downstream", "byte-identity checks").
- **Labels**: none on any PR in the sample.

## Bot-generated content
No bot-signature content observed: no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot walkthroughs, no AI-disclaimer footers. That said, the style is AI-adjacent: perfectly formatted H2 + bullet scaffolds, exhaustive per-file enumerations (#648 lists every function added, e.g. "`_import_vbnet()`, `_vbnet_extra_walk()`, `_VBNET_CONFIG`"), and three PRs contain literal `\r\n` line endings visible in the exported body, consistent with description text produced outside the GitHub editor and pasted in. If AI tools are assisting, they produce the same structure a maintainer would hand-craft — the distinguishing bot markers (named attribution, auto-tables of changed files) are absent.

## Notable exemplars
- **PR #1737** — https://github.com/Graphify-Labs/graphify/pull/1737 — the strongest: a +19k refactor de-risked in ~370 words with a size-impact table, per-subsystem move list, an explicit safety argument (verbatim moves, no import cycles, downstream compatibility), test counts, and an honest "left as-is" section — a model recipe for landing a huge diff.
- **PR #1366** — https://github.com/Graphify-Labs/graphify/pull/1366 — best bug report: the `## Problem` section chains evidence from two prior PRs (#1344, #1361), names the two exact gaps, explains why a plausible fix (leaving `changed` in `prune_sources`) would regress, and closes with a lineage line. Full causal narrative without padding.
