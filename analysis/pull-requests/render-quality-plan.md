# Plan: Render-quality upgrade for generated PR descriptions

**Trigger**: the siraj#119 generated description covers everything but is unreadable — prose walls, zero `diffhunk://` anchor links, no steps/checks, no fences/tables. This plan is grounded in an exhaustive 3-round swarm analysis of the full corpus (100 repos / 470 merged PRs in `analysis/pull-requests/`).

**Research executed** (all swarm passes read-only):
- Round 1 — 14 agents: formatting inventory per repo (sections, fences, tables, checkboxes, details, density).
- Round 2 — 14 agents: deep presentation analysis (opening hook, rhythm, emphasis, callouts, visuals, evidence form, progressive disclosure, navigation, sign-off; per-repo `best_move` + `beauty_score` 1–5).
- Round 3 — 3 meta agents: anatomy dissection of the 12 best-rendered bodies; a 16-item anti-pattern catalog; a template-fidelity rulebook for template-heavy repos.
- Raw swarm outputs are preserved in session tool-results; a distilled doc ships as `analysis/pull-requests/PRESENTATION.md` (F6).

---

## 1. What the corpus proves (synthesis)

### Composite anatomy of the best bodies (PowerToys #50230, v2rayN #10017, next.js #97480, langflow #14832, openclaw #120900, ECC #2693, electron #53174, anthropics/skills #1557, open-webui #29037, scrcpy #6772, MoneyPrinterTurbo #1263, ponytail #601)

Canonical order: **thesis → cause → change → measured evidence → verification → honesty ledger → sign-off**.

Size budgets by class:
- **Small** (≤30 rendered lines): 4 sections max, ≤1 fence, tables only if the evidence is a number, one-line closer.
- **Medium** (35–60 lines): opener + 3–6 H2s, 1–2 tables ≤7 rows each with bold verdict captions, verdict line as closer.
- **Huge** (100–180 lines): same skeleton; extra length is spent only on evidence (tables with run IDs, transcripts, reviewer guide), never on longer prose.

### Rules all top-12 bodies obey
1. First screenful carries the thesis (bold one-liner, measured table, or the runnable commands) — never boilerplate.
2. Tables carry numbers; prose carries argument; fenced blocks carry verbatim artifacts. Roles never mix.
3. Every table gets a bold one-line verdict caption above it.
4. Honesty has its own named section ("What a round trip cannot prove", "Trade-offs", "deliberately not in this PR") — not hedged inline.
5. Checked checkboxes earn the check (command + result stated); unchecked carry `N/A — reason`.
6. UI evidence uses captioned images (`**What this shows:** …`) or Before/After tables — never naked screenshots.
7. Superseded/bulky artifacts go under `<details>`, never deleted.
8. The body ends on an artifact: verdict line, `Closes #N`, reviewer guide, or scope accounting — never "please review".

### Anti-pattern catalog → countermeasures (top 8; all 16 in PRESENTATION.md)
| # | Anti-pattern (evidence) | Countermeasure in prompt |
|---|---|---|
| 1 | Empty/stub bodies (react #37087: 7 words on +100/−89) | minimum-content floor (≥1 problem + 1 change + 1 verification sentence; A1 scaling softened) |
| 4 | Checklist-only bodies; malformed `- [x ]` boxes (freeCodeCamp #69799, open-webui #29247) | exact `- [x]`/`- [ ]` syntax; checklist is a footer, never the body |
| 5 | Unlabeled stacked log dumps (A1111 #13535) | ≤10 salient lines per log; `### Before (fails)`/`### After (passes)` labels; counts over dumps |
| 7 | Prose walls (our failure — siraj#119) | one idea per paragraph, ≤3 sentences; >120-word bodies need ≥2 headings |
| 8 | Unlabeled bullet soup (ollama #18056) | bold-label bullets; group under H3 beyond 4 items |
| 13 | Anchor-less file mentions (our failure) | every named file carries `[[N]](diffhunk://…)` |
| 15 | Title-verbatim opener (openai/codex) | first sentence must add info beyond the title |
| 14 | Duplicate facts across sections (hermes #98628) | one fact, one place |

### Template-fidelity ladder (template repos)
fidelity/de-emphasis ladder: (1) HTML comments always kept → (2) row deletion only if the template itself instructs → (3) positional de-emphasis (content first, form last) → (4) `<details open>` folding with informative `<summary>` where repo precedent exists → (5) anything more = never. Checkbox rules: exact syntax; check only what the diff supports; unchosen radio options stay visible; every placeholder filled or explicitly `N/A — reason`; machine trailers (`Notes:`, `` ```release-note `` fences, `/kind` commands, bot sentinel blocks) byte-exact.

---

## 2. Implementation

### P1 — Rewrite the skeleton (`src/background/prompts/common.ts` `SECTIONS_PROMPT`)

Keep section names + commit-coverage invariant strings (`Commit Coverage`, `MUST cover every commit`). New text:

- **Summary**: "≤4 sentences, no bullets. First sentence states the change in user-visible terms and must add information not present in the title (motivation, user-visible symptom, or blast radius) — never restate the title. One optional scale line in bold (e.g. **61 files, +1.6k/−1.3k**)."
- **Changes**: "Group by area under `###` subsections. Every bullet: `- **Bold label** — one concrete statement of ≤25 words; identifiers/paths in backticks; exactly one idea per bullet. Every file you name carries a diff-hunk link `[[N]](diffhunk://…)`. When evidence is numeric, prefer a markdown table with a bold verdict caption over bullets."
- **Walkthrough**: "One line per file: `- \`path\` — what changed [[N]](diffhunk://…)`. Anchor links are mandatory for every named file. Beyond ~10 files, group by area under `###` and wrap the list in `<details><summary>File-by-file walkthrough (N files)</summary>…</details>`."
- **Testing**: "Numbered steps (`1.` `2.`…) a reviewer can run, each with its expected outcome. All commands go in fenced ```bash blocks — never inline. For ≥2 comparable results (suites, platforms, before/after) use a markdown table with a bold verdict caption. State counts when known. Close with `Not verified: …` when anything is unverifiable; if nothing is verifiable from the diff, say so in one sentence instead of inventing commands."
- **Linked Issues** — unchanged (A5 wording).

### P2 — Formatting contract (`FORMATTING_RULE` const in common.ts; referenced by combined + description-only + mirror)

One compact block (~10 lines): fences for all commands/logs/diffs with a state label; tables for ≥2-row comparisons with bold verdict captions; one-line ≤25-word bullets grouped beyond 4 items; H2 for sections / H3 only inside them / never bold-text pseudo-headers; ≤3 sentences per paragraph, one idea each; balanced fences only; checklist footer-only with exact `- [x]`/`- [ ]` syntax and `N/A — reason` for untrue items; every fact told once; end the body on a verdict line, `Closes #N`, or scope accounting — never "please review".

### P3 — Template-path etiquette (`buildExistingContentSection` template branch + `buildTemplateFillBlock`)

Extend template instructions with the corpus ladder: keep every HTML comment and sentinel block verbatim; fill every placeholder or annotate `N/A — reason`; check boxes only when the diff proves them, unchecked boxes may carry `N/A — reason`; keep unchosen options visible unless the template text instructs removal; add subsections only inside free-text slots and never restyle template headers; machine trailers kept byte-exact.

### P4 — Anchor guard (parse layer)

`countDiffAnchors(text)` helper; `parseCombinedResponse`/`parseDescriptionOnlyResponse` take an optional `{ expectAnchors: boolean }` — handlers pass it when `buildAnchorsSection` output was non-empty. Zero anchors despite expecting them → `logMsg` warning in the in-page log panel (no rewriting). Also add to the Anchors section header in `summary-anchors.ts`: "Only the files listed above have anchors — never invent `[[N]]` links for other files."

### P5 — Tests (all offline)
- `tests/prompt-mirror.ts`: mirror the new wording (drift test enforces parity).
- `tests/prompt-logic.ts`: assertions for formatter contract lines (fences, verdict-caption tables, bullet cap, heading discipline, numbered testing steps, title ≠ opener, details-collapse, checkbox syntax, N/A annotation, closing-artifact rule), template-etiquette wording, and anchor-mandatory wording; all existing assertions kept.
- `tests/parse.ts`: `countDiffAnchors` unit tests + expectAnchors warning behavior.
- New `tests/format-live.ts` + `package.json` script `test:format` (documented live-only, NOT in the `bun run test` chain): calls the configured local LLM with a small synthetic changes summary and asserts ≥1 fenced block, a numbered Testing step list, ≥N anchor links, no paragraph >3 sentences, body ends on an artifact — a repeatable acceptance gate for exactly the siraj#119 failure class. Failure prints a diff-style report.

### P6 — Docs
- Write `analysis/pull-requests/PRESENTATION.md`: distilled research (anatomy, size budgets, top-12 dissections summary, full 16-item anti-pattern catalog, template-fidelity ladder) so the reasoning is in-repo, not just in chat logs.
- `README.md`: update the "Description Style" bullets (formatting contract, live template discovery already covered).

### File touch list
`src/background/prompts/common.ts`, `combined.ts`, `pr-prompts.ts`, `merge-prompts.ts` (no change), `src/background/parse.ts`, `src/background/bot-artifacts.ts` or parse-local helper, `src/background/summary-anchors.ts`, `src/background/handlers/{generate,title,description,merge}.ts`, `src/types.ts` (parse opts type if needed), `tests/prompt-mirror.ts`, `tests/prompt-logic.ts`, `tests/parse.ts`, new `tests/format-live.ts`, `package.json`, `README.md`, `analysis/pull-requests/PRESENTATION.md`.

## 3. Verification

1. `bun run lint` + `check:duplicates` + `check:unused` clean (user WIP `stream.ts` files untouched and excluded from claims).
2. `bun run test:logic && bun run test:style && bun run test:parse` green with the new assertions.
3. `bun run test:pr-creation` (gh-only) green.
4. `bun run test:format` against the local LLM endpoint — the actual readability acceptance gate; iterate wording once if it fails.
5. Manual: re-generate for the existing fixture react#37382 via `test:full` and eyeball the produced description against the 8 golden rules.

## 4. Risks
- Prompt token growth: the contract adds ~150 tokens; acceptable vs. quality win.
- Over-formatting small PRs: mitigated by keeping A1's scaling rule first and the size budgets in section text.
- Template repos: P3 rules are additive inside slots only; byte-preservation invariants from the previous round (and their tests) stay green.
- Anchors can only be demanded when the diff provided them — the P4 warning surfaces the gap instead of fabricating links.
