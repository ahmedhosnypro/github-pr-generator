# Plan: Implement corpus-driven prompt & pipeline improvements

Package the analysis results (`analysis/recommendations.md`, backed by
`analysis/pull-requests/SYNTHESIS.md` + 94 per-repo `patterns.md`) into actual
changes to the extension's prompt layer and output pipeline.

## Invariants (do not break)

- Mandatory **Commit Coverage** stays mandatory at every diff size; tests
  assert the literal strings `"Commit Coverage"` and `"MUST cover every
  commit"` (`tests/pr-creation-prompt.ts:28`, `tests/full-coverage.ts:112`)
  and `test:coverage` enforces ≥90% coverage against a live test PR.
- Diff-hunk anchor links (`[[N]](diffhunk://...)`) remain — a differentiating
  feature; wording relaxes only for large diffs.
- `tests/prompt.ts` contains its OWN mirror of the prompt builders
  (lines ~78-137 re-implement the skeleton). Every prompt change in `src/`
  must be mirrored there, or the test suite silently tests stale prompts.
- Line-append punctuations in `SECTIONS_PROMPT` (string-array joins) — keep
  the file's existing style (strict lint: biome + oxlint + eslint sonarjs
  max-150-lines/file, max-50-lines/function).

## Phase A — Prompt wording (drop-in, from recommendations P1.1–P1.7, P2.x wording)

Edits to `src/background/prompts/common.ts`:

1. **P1.7/P2.1 wording step** — skeleton intro line (`common.ts:17`):
   "scaled to the change" instruction; small diffs → compact output (Summary +
   Testing), commits folded into Summary; commit coverage stays mandatory.
2. **P1.3** — Summary: root-cause-first for bug fixes (`common.ts:18-19`).
3. **P2.2** — add a conditional instruction: bug fixes insert `## Problem`
   between Summary and Changes when the failure mode is identifiable from the
   diff (wording-level; no new standing section).
4. **P1.1** — Testing: verbatim, re-runnable commands + quantified results +
   explicit "not verified" fallback (`common.ts:26-27`).
5. **P1.2** — remove the standing `## Breaking Changes` section from the
   skeleton; add a conditional RULES rule in `combined.ts`/`pr-prompts.ts`
   (trigger list: removed exports, renamed functions, changed contracts).
6. **P1.6** — Linked Issues: `Fixes #N` / `Closes #N` / `Part of #N` phrasing,
   no invented numbers (`common.ts:30-31`).
7. **P2.5's SYSTEM_PROMPT half** — `common.ts:1-12`: add no-fabrication rule
   (never invent CI run IDs, SHAs, issue numbers, reviewer names, checkbox
   outcomes) + "read as human-authored" persona clause.

Edits to `src/background/prompts/combined.ts` + `pr-prompts.ts` RULES blocks:

8. **P1.4** — template fidelity wording (both `combined.ts:9-10` and
   `pr-prompts.ts:39-41`): preserve headers, HTML comments, checkboxes,
   footers byte-for-byte; never alter checkbox states.
9. **P1.5** — no bot-style output (no "## Summary by …" headings, badges,
   mermaid, invented HTML comments, sign-off footers/emoji).
10. **Anti-pattern rules** — no placeholders left unfilled; never output an
    empty/near-empty description; rubber-stamped checklists forbidden.
11. **P2.3 title style** — change both title prompts + `merge-prompts.ts:28`
    from hard-required conventional commits to ordered preference: "match the
    repo's title style if inferable from the commit messages; otherwise
    conventional commits"; plus "describe the change, don't enumerate
    identifiers".
12. **P2.4** — relax the anchor rule to "every substantive claim about a
    file" / "at least the most important files" in large diffs (wording).

Edits to `src/background/prompts/merge-prompts.ts`:

13. Title style preference (as 11) + merge-description gets the no-fabrication
    and no-bot-signature rules.

## Phase B — Two-mode existing-body handling (P2.5)

- New helper in `common.ts`, e.g. `isLikelyTemplate(body: string): boolean`:
  true when body has ≥1 markdown header AND (contains `<!--`, `- [ ]`/`- [x]`,
  or ≥2 headers) — i.e. scaffolded boilerplate — vs authored prose.
- `combined.ts` / `pr-prompts.ts` branch on it: template mode → P1.4 fill-in
  instruction; authored mode → "user wrote this; only complete missing parts
  (Testing, links), do not restructure or rewrite existing sentences".
- Both handles are in `combinedPrompt`/`buildDescriptionOnlyPrompt` where
  `existingBody` is already available — no signature changes needed.

## Phase C — Corpus-derived repo profiles (beyond the recommendations)

The corpus itself becomes runtime knowledge:

1. A subagent reads all 94 `patterns.md` + the synthesis appendix and generates
   `src/background/repo-profiles.ts`: a typed map for repos with clear
   evidence only, each entry minimal:
   `{ titleStyle: "conventional" | "scope-prefix" | "imperative" | "mixed",
      length: "S" | "M" | "L", templateHeavy?: true, disclosureRequired?: true,
      note?: string }`
   for high-signal repos (e.g. freeCodeCamp: conventional + template-heavy;
   kubernetes: subsystem-scope + template; yt-dlp/ripienaar: AI-content
   restriction note; llama.cpp/immich: disclosure). Expected ≤40 entries —
   skip repos whose reports are ambiguous.
2. Prompt builders gain an optional 3rd param; handlers pass
   `data.branchContext` owner/repo (`handlers/generate.ts:54`,
   `handlers/title.ts:47`, `handlers/description.ts:50`; merge handlers too).
   When a profile matches, a short "House style" line is injected
   (e.g. "This repo uses `scope: Title` titles, keeps descriptions under
   ~50 words"). No profile → behavior identical to today.
3. `tests/prompt.ts` mirror updated accordingly.

## Phase D — Output hardening in `parse.ts` (P3.1)

- Strip LLM hallucinated bot-signature footers from generated descriptions:
  trailing "Generated/created with/by …" lines, `Co-Authored-By: ... bot`s,
  "### Summary by CodeRabbit"-style headings, badge-only lines. Conservative
  regexes, applied in `parseCombinedResponse`/`parseDescriptionOnlyResponse`
  (`src/background/parse.ts:44-83`).

## Phase E — Verification

1. `bun run typecheck && bun run lint` (and `bun run quality` if it passes
   quickly) after all edits.
2. Mirror-check: diff `tests/prompt.ts`'s prompt copy against the new
   `src/` prompt text; assert `"Commit Coverage"` / `"MUST cover every commit"`
   assertions still hold.
3. Run `bun run test:pr-creation` (needs `gh` + config: both available) to
   confirm prompt structure; attempt `bun run test:coverage` — if the
   configured LLM endpoint isn't reachable, report as unverified rather than
   faking.
4. Add one pure unit-style assertion block to `tests/pr-creation-prompt.ts`
   for the new behaviors (e.g. small-diff wording present, template-fidelity
   wording present) to guard regressions.
5. Short usage note appended to `README.md` (profile/convention awareness +
   changed description style) — the README documents prompt behavior
   nowhere in detail, so keep it to ~6 lines.

## Out of scope

- Popup UI for a brief/full mode toggle and other P3 UI items — only config-
  free behaviors ship in this round.
- A/B protocol against exemplar repos (recommendations §Validation plan) —
  requires a working LLM config; can be a follow-up once P1 lands.

## Git

No commits; working tree only.
