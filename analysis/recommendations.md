# Recommendations: Improving PR Generation from Real-World Patterns

## How to read this

This document translates a corpus study of **470 merged PRs from 94 top-starred GitHub repositories** (`analysis/pull-requests/SYNTHESIS.md`, plus per-repo `patterns.md` reports) into concrete changes for this extension's prompt code under `src/background/prompts/`. The scope is deliberately narrow: **prompt wording and prompt structure only**. Anything that requires new extension behavior (UI, parsing logic, modes) is noted briefly under P3 but not specified. The goal is to close the gap between what the current skeleton instructs the LLM to produce and what maintainers of real repositories actually merge — which the synthesis shows is usually shorter, more evidence-dense, and more template-respecting than our current output.

## Current prompt behavior (baseline)

- **System persona** — "expert software engineer who writes detailed, structured GitHub pull request descriptions"; descriptions promised to be accurate, structured, "concise but thorough", and actionable (`src/background/prompts/common.ts:1-12`).
- **Template-respect rule at the persona level** — when the description field already contains template headers, fill them rather than replace (`common.ts:11`).
- **Default 7-section skeleton** (`SECTIONS_PROMPT`, applied only when the description field is empty): Summary, Changes, Walkthrough, Commit Coverage, Testing, Breaking Changes, Linked Issues (`common.ts:14-32`). Sections "that would be empty" may be omitted (`common.ts:17`).
- **Summary** — "2–4 sentence overview of what this PR does and why the change is needed" (`common.ts:18-19`).
- **Changes** — grouped by category, must reference function/variable names, and every mentioned file must get at least one diff hunk anchor link (`common.ts:20-21`).
- **Walkthrough** — file-by-file list; each entry = backticked path + 1–2 sentence description + `[[N]](diffhunk://...)` link (`common.ts:22-23`).
- **Commit Coverage** — mandatory coverage of *every* commit message, grouping allowed (`common.ts:24-25`). This is a differentiating feature; the corpus supports keeping it.
- **Testing** — "How a reviewer can test or verify these changes. Include specific steps if inferable from the diff" (`common.ts:26-27`) — no instruction to use verbatim commands or quantify results.
- **Breaking Changes** — API/behavior callouts with diff anchors; omit if none (`common.ts:28-29`).
- **Linked Issues** — from commit messages only; omit if none (`common.ts:30-31`).
- **Title format** — hard-required conventional-commit form (`feat:`, `fix:`, `refactor:`…), under 72 chars, no quotes/markdown (`combined.ts:16`, `pr-prompts.ts:14-16`, `merge-prompts.ts:28`).
- **Existing-body handling** — when the description field is non-empty, its structure must be kept and sections filled; the default skeleton is then skipped entirely (`combined.ts:7-12,20-22`; `pr-prompts.ts:38-43,48-50`).
- **Shared rules** — specificity from real code entities; diff-hunk links for every file in Changes/Walkthrough with right-side line ranges; no "This PR introduces…" filler opener; no fences, no meta-commentary; fill template sections when present (`combined.ts:29-41`; duplicated in `pr-prompts.ts:51-60`; a filler/title variant in `merge-prompts.ts:74-89`).
- **Prompt inputs** — the user-message side assembles repo/branch, DOM-scraped diff anchors with hunk line ranges, commit messages, linked issues, the raw diff, per-file change list, and stats (`src/background/summary.ts:69-104`); anchor emission lives in `summary-anchors.ts:99-116`.
- **Output parsing** — combined output is split title/body on the first blank line, fences stripped, titles cleaned of quotes/`Title:`/`#`/`**` and truncated to 100 chars; description-only output has a heuristic that drops a leading title-like line (`src/background/parse.ts:44-55, 69-83`).

## Gap analysis

| Real-world dominant pattern (Synthesis ref) | Current prompt behavior | Gap |
|---|---|---|
| Bodies are short: dominant length is **S (<50 words) in 42/94 repos**, M (50–200) in 37; only 11 are long ("Description length") | Fixed 7-section skeleton pushes ≥100+ words for every PR size (`common.ts:16-32`) | Skeleton is tone-deaf to small diffs; model pads trivial changes into faux structure (e.g. an airbnb-style one-liner becomes 7 sections). |
| **"Why/Problem/Motivation"** is a recurring authored section in 16 repos and a hallmark of the **Exemplars** list (root cause first: ohmyzsh#14033, nodejs/node#65406) ("Section-name frequency", "Traits of excellent merged PRs #1") | "Why" is folded into one clause of the Summary section (`common.ts:19`); no Problem/Root-cause section exists at all | Bug-fix PRs — the most common PR kind — never get the symptom→mechanism opener reviewers praise. |
| Testing evidence means **verbatim commands + counts**: `pnpm test … 43 passed, 6 skipped` (langflow), "56/56 isolated workspace tests" (hello-algo), "40/40 passed" (PowerToys) ("Content habits") | Testing section asks for "specific steps if inferable" (`common.ts:26-27`) — no instruction for copy-pasteable commands, expected output, or red-before/green-after framing | LLM emits unverifiable prose ("tested locally") instead of the falsifiable evidence that the corpus shows merges fastest. |
| Breaking changes are **almost never** present (only open-webui/vue template fields, both answered N/A); real PRs signal "no behavior change" instead ("Content habits") | A dedicated `## Breaking Changes` heading is in the default skeleton (`common.ts:28-29`) | Structural prominence out of proportion to reality; risks the model hallucinating breaking changes to justify the heading. |
| Issue linking is habitual in only ~12 repos (e.g. freeCodeCamp 4/5 `Closes #N`); ~67 repos show zero closing keywords ("Content habits") | `## Linked Issues` section exists, sourced only from commit-message references (`common.ts:30-31`, `summary.ts:86-91`) | Roughly fine, but no guidance on opener style ("Fixes"/"Part of") or placement; the section is part of the over-scaffold problem on small PRs. |
| When a template exists, real PRs keep **all** boilerplate: HTML-comment instructions, attestation checkboxes, CLA clauses, honeypots — 30 repos template-gated, and yt-dlp/ripienaar will *close or block* PRs whose boilerplate is stripped ("Template usage", boilerplate list) | "Respect its structure — keep its headers, fill in its sections" (`common.ts:11`, `combined.ts:9-10`, `pr-prompts.ts:39-41`) | Rule protects headers but is silent on comments, checkboxes, and attestation text; an LLM told to "fill sections" frequently normalizes/drops `<!-- -->` blocks and unchecked boxes. |
| Anti-AI repos exist (yt-dlp `NO AI / NO LLM`, ripienaar honeypot) and ~12 repos carry disclosure lines that survive merge ("Template usage", "Bot-generated descriptions") | No rule about disclosing or concealing AI authorship; no rule about never emitting bot-style footers | Two failure modes: output accidentally mimicking bot signatures (CodeRabbit/cubic structure is in training data), and nothing reminding users in disclosure-mandatory repos (llama.cpp, immich, ohmyzsh). |
| Title conventions are plural: true Conventional Commits dominant in only **30/94**; 26 plain-imperative, 26 mixed, 12 use area/`[prefix]` styles ("Title conventions") | Conventional-commit format is **hard-required** in every title prompt (`combined.ts:16`, `pr-prompts.ts:14-16`, `merge-prompts.ts:28`) | On kubernetes/llama.cpp/vscode-scale repos the generated title mismatches house style (`subsystem: verb`, `ggml : fix …`, `[Area] …`). |
| Author-role gradient: maintainers merge their own one-liners; contributors write packets ("Description length") | One output size for everyone | Overwriting a user's existing one-liner description with a 7-section essay can be more harmful than helpful. We already skip the skeleton on non-empty bodies — good — but rewording guidance is absent. |

## Recommendations

### P1 — Drop-in prompt wording changes

#### P1.1 Make `## Testing` demand verbatim, re-runnable evidence

(a) Rationale: the synthesis names reproducible commands the strongest single merge signal — "Verifiable evidence, not claims" (traits #2–3): PowerToys#50230 ("40/40 passed across two OSes"), hello-algo#1959 ("56/56 isolated workspace tests"), v2rayN#10026's failing-then-passing runs. 27/94 repos systematically include validation evidence.

(b) File and wording — `src/background/prompts/common.ts:26-27`, current:

```
"## Testing\n",
"How a reviewer can test or verify these changes. Include specific steps if inferable from the diff.\n\n",
```

Replace the second line with:

```
"How a reviewer can verify these changes. Prefer exact, copy-pasteable commands a reviewer can re-run (test commands, build commands, CLI invocations) over prose claims — infer them from the diff only when a script/test file in the diff makes them concrete. When counts or before/after results are knowable from the diff, state them. If verification cannot be inferred from the diff, say so in one sentence rather than inventing commands, and state explicitly what was NOT verified.\n\n",
```

(c) Risks: hallucinated commands if the diff offers weak signals — mitigated by the explicit "say so rather than invent" fallback, which itself mirrors the corpus' praised `## Not verified` pattern (n8n#37345). Long PRs may produce longer Testing sections; acceptable, since language is additive, not a new section.

#### P1.2 Convert Breaking Changes from a standing section into a conditional rule

(a) Rationale: breaking change callouts are nearly absent in merged reality ("Content habits": only open-webui and vue template fields, both answered "No"/N/A), while real descriptions instead reassure "no behavior change" (rust-lang, markitdown, cc-switch, llama.cpp). A standing heading invites filler.

(b) File and wording — `src/background/prompts/common.ts:28-29`, current:

```
"## Breaking Changes\n",
"Any API changes, removed functions, renamed exports, or behavioral changes consumers need to know about. **Include diff hunk references for changed APIs.** Omit this section if there are none.\n\n",
```

Remove both lines from the default skeleton and add one rule line in the RULES blocks (`combined.ts` after line 35; `pr-prompts.ts` after line 57):

```
"- Only if the diff genuinely breaks API/behavior (removed exports, renamed functions, changed contracts), add a ## Breaking Changes section with diff hunk references; otherwise do not create the section. When the diff proves there are no behavior changes, you may state that in one sentence inside Summary instead.\n",
```

(c) Risks: moving it out of the skeleton slightly lowers the odds the LLM notices real breaking changes. Mitigated by the rule's explicit trigger list (removed exports, renamed functions). The Template-respect path is unaffected — templates like open-webui's still get their `### Breaking Changes` filled via P1.4.

#### P1.3 Add a "root cause first" instruction to Summary for bug-fix diffs

(a) Rationale: trait #1 of excellent merged PRs is "root cause first, then fix" — ohmyzsh#14033 explains *why* a +1/−1 shell fix matters and merged with praise; nodejs/node#65406 pastes the failing assertion before any fix. 16 repos have a recurring Problem/Why section, yet our Summary mentions "why" only glancingly (`common.ts:19`).

(b) File and wording — `src/background/prompts/common.ts:18-19`, current:

```
"## Summary\n",
"A 2-4 sentence overview of what this PR does and why the change is needed.\n\n",
```

Replace with:

```
"## Summary\n",
"2-4 sentences. For bug fixes, open with the root cause in one line — the observable symptom, then the mechanism that caused it — before describing the fix. For features or chores, state what the PR does and why it's needed. Reference concrete identifiers from the diff, not generic descriptions.\n\n",
```

(c) Risks: LLMs may manufacture a plausible-but-wrong root cause on diffs where the cause is ambiguous. The instruction is tied to "bug fixes" and the existing grounding rules ("reference actual code entities") remain; the separate "no meta-commentary" rule prevents hedged preamble. No length regression expected — still capped at 2–4 sentences.

#### P1.4 Strengthen template fidelity: keep comments, checkboxes, and attestation text

(a) Rationale: in the 30 template-gated repos, merged PRs retain *all* boilerplate — invisible HTML comments (kubernetes, bootstrap, nodejs), attestation checkboxes (freeCodeCamp, n8n, llama.cpp's mandatory AI-disclosure), CLA text (open-webui) — and two repos sanction PRs that strip it (yt-dlp closes; ripienaar's "LLMs tick this box" honeypot blocks; "Template usage"). Our rule protects "headers" and "content" but never mentions comments or footers, and "fill in its sections" invites the model to delete instructional HTML comments.

(b) File and wording — line `combined.ts:9-10` (and the identical instruction at `pr-prompts.ts:39-41`; persona sentence at `common.ts:11`), current:

```
"Respect its structure — keep its headers, fill in its sections, and do not remove any existing content:\n\n"
```

Replace with:

```
"Respect its structure completely — keep every header, HTML comment (<!-- ... -->), checkbox, footer, and boilerplate sentence byte-for-byte; only fill in the sections. Do not delete, reorder, or reword template text. Output the full template with all existing content preserved, plus your additions:\n\n"
```

(c) Risks: token cost of echoing large templates (kubernetes' template is long) and risk of the LLM wrapping preserved comments in a way parse.ts mishandles — mitigated because `parseDescriptionOnlyResponse` only strips a leading title line and fences (`src/background/parse.ts:69-83`), not body content. Watch for LLMs "helpfully" checking unchecked boxes, which violates honeypot repos: optionally append "Never check or modify checkbox states." (This line is a deliberate part of the recommendation, but validate it doesn't confuse non-template paths first.)

#### P1.5 Explicitly forbid bot-style signatures and decorative sections

(a) Rationale: bot summary blocks (CodeRabbit `## Summary by …`, cubic badges, mermaid diagrams) are merged as-is in 8 repos but are the *anti-model* — the synthesis explicitly says "matching CodeRabbit's category-bullets wins nothing in evidence-driven repos," and two repos ban AI text outright. An LLM trained on GitHub will occasionally reproduce these shapes, including `**Bug Fixes**`-style category bullets and badge footers.

(b) File and wording — add one rule line to the RULES block in `combined.ts` (after line 35) and `pr-prompts.ts` (after line 57):

```
"- Do NOT imitate bot output: no 'Summary by <tool>' headings, badge images, mermaid diagrams, confidence scores, HTML comment markers like <!-- ... --> you invented, or sign-off footers. No emoji unless the existing template uses them.\n",
```

(c) Risks: minimal. The HTML-comment clause is scoped to "you invented" so template preservation (P1.4) still passes through. Emoji ban matches the corpus (authored emoji appear in only ~5 repos).

#### P1.6 Teach the models PR-to-PR and issue-linking phrasing

(a) Rationale: issue linking is habitual in only 12 repos, but where links appear, phrasing matters: freeCodeCamp's template bakes `Closes #N` (4/5 comply), kubernetes prefers "Part of"/full URLs, and several repos use lineage language ("Follow-up to #", "Supersedes #", "salvage #N"). Our Linked Issues section just dumps references.

(b) File and wording — `src/background/prompts/common.ts:30-31`, current:

```
"## Linked Issues\n",
"List any issue references from the commit messages. Omit if none.\n\n",
```

Replace with:

```
"## Linked Issues\n",
"If commit messages reference issues or PRs, surface them as a single closing line in standard GitHub form ('Fixes #123', 'Closes #123', or 'Part of #123' when the commit does not fully resolve it) rather than a bare list. Omit if none — do not invent issue numbers.\n\n",
```

(c) Risks: choosing "Fixes" over "Part of" incorrectly auto-closes issues on merge — a real-world side effect. The "when the commit does not fully resolve it" hedge copies kubernetes' own convention; acceptable residual risk, explicit in review.

### P2 — Structural prompt changes (moderate effort)

1. **Length-adaptive section sets keyed to diff stats.** The prompt already receives `## Stats` (files/additions/deletions, `summary.ts:61-67`). Add a short instruction block to `SECTIONS_PROMPT` (or compute it in `buildCombinedPrompt`): e.g. "If the change is small (≤3 files or ≤50 changed lines), use only Summary + (Testing when verifiable); skip Walkthrough and group all commits inline." Data: 42/94 repos are S-length, and the corpus shows *no* correlation between diff size and description length (next.js merged −5,139 lines with one paragraph; hello-algo documented 180 files in 85 words) — so gate on diff size but let "small but complete" (airbnb#2620, shadcn-ui#11715) be the stated ideal for small diffs. **Preserve Commit Coverage at every size** — coverage of all commits stays mandatory (existing `test:coverage` ≥90% gate depends on it); only its *presentation* as a standalone section should be conditional.
2. **A gated Why/Problem section rather than a universal one.** Add to the skeleton instructions: "For bug fixes or behavioral changes, insert `## Problem` (or `## Root cause`) between Summary and Changes when the failure mode is identifiable from the diff." Mirrors 16 repos with recurring Problem sections and exemplar PRs (llama.cpp#26500's Goal/Bug/Fix/Test in ~130 words).
3. **Title-style hint from context instead of hard CC.** Replace the unconditional conventional-commit demand with an ordered preference: "Match the repo's title style if inferable from commit messages in this prompt (e.g. `subsystem: verb`, `[Area]`, conventional commits); otherwise default to conventional commits." Commit messages are already in the prompt (`summary.ts:28-38`), and corpus shows CC is dominant in only 30/94 repos while 12 use area/`[prefix]` conventions.
4. **Anchor-usage scaling.** Keep diff hunk links — they are a differentiator — but relax "every file you mention" to "every substantive claim about a file" for large diffs, and in Walkthrough drop the 1-link-per-entry rule to "at least for the most important files." Prevents anchor spam on 30-file PRs where the reference numbers grow unwieldy (anchors emitted per hunk can number in the dozens, `summary-anchors.ts:99-116`). Small-PR behavior unchanged.
5. **Two-mode rule for non-empty bodies.** Distinguish "existing body is boilerplate template" (headers + comments + few words → fill it, P1.4) from "existing body is authored content" (prose sentences → offer only light completion: add Testing/links, do not restructure). Currently both get the same "fill in its sections" instruction (`combined.ts:9-10`). Corpus basis: author-role gradient — overwriting a maintainer's one-liner is harmful.
6. **"No invented standard artifacts" rule consolidation.** Add to SYSTEM_PROMPT: never fabricate CI run IDs, SHAs, reviewer names, reviewers' checklist outcomes, or issue numbers. The corpus' checklists culture (27 repos) makes LLMs prone to emitting plausible-looking attestation text ("Tested locally ✓") — merged unchecked boxes are an observed anti-pattern (AutoGPT, x1xhlol).

### P3 — Feature-level ideas (out of scope for prompts)

- **Bot-signature stripping in `parse.ts`**: regex-remove `## Summary by …` blocks, badge markdown, `<!-- copyberry-projection-id -->`-style HTML comments, and "Generated with …" footers from model output before injecting into the DOM (`src/background/parse.ts:69-83`).
- **Style presets / repo profiles**: detect repo from `branchContext` (already in the prompt, `summary.ts:5-19`) and ship a small per-repo convention table (title style, template-heavy, disclosure-mandatory) so output matches kubernetes vs. freeCodeCamp vs. scrcpy without custom user config.
- **Optional screenshot placeholder hint for UI diffs**: when changed files are dominated by `.css`/component files, suggest a `## Screenshots` section with a placeholder — the corpus shows screenshots in ~15 repos and as the standard in UI repos that use them (open-webui, immich).
- **Author-vs-maintainer mode toggle** ("brief" vs "full") reflecting the observed author-role gradient.
- **Honest-size meter**: count authored words and warn when output exceeds ~200 words for small diffs, mirroring the size-proportionality ideal (trait #8).

## Anti-patterns the prompts must actively guard against

Each is stated as a prompt rule to add (all live in the shared RULES blocks of `combined.ts`/`pr-prompts.ts`):

- **Empty or near-empty descriptions** (merged in 12 repos; HelloGitHub 3/5 empty, 996icu 4/5): *"Never output an empty or one-word description. Even for trivial diffs, produce at least a one-sentence summary and, when verifiable, a one-line test instruction."*
- **Unfilled / placeholder-riddled templates** (15 repos; gitignore merged `_TODO_` placeholders, TheAlgorithms merged 15 words for +920/−530): *"Never leave template placeholders (`_TODO_`, `{your_pr_number}`, `<!-- describe -->` stubs) in the output — replace every placeholder with real content or, when unknowable, an explicit 'not applicable: <reason>' statement."* (Mirrors the corpus' praised N/A-with-reason pattern, PowerToys#50230.)
- **Bot-dump bodies** (7 repos accept pure bot output as the whole description; 2 more ban AI text): *"The description must read as authored by the human opening the PR: no tool branding, no badges, no auto-generated footers, no self-referential AI commentary."* (P1.5 extends this.)
- **Rubber-stamped checklists** (AutoGPT/x1xhlol merged unchecked "tested my changes" boxes): *"When filling a checklist, mark an item checked only if the diff provides evidence; otherwise leave it as-is. Never alter a checkbox state inside an existing template."*
- **Inflated titles / duplicated sloppy titles** (6 repos; AUTOMATIC1111's 89-char identifier-stuffed title, firecrawl's duplicate "proxy more routes"): *"Titles stay under 72 characters and must describe the change, not enumerate file names or identifiers."* (Existing rule covers length; add the "not enumerate identifiers" clause — corpus shows identifier-stuffed titles merge poorly-received.)

#### P1.7 Scale the skeleton down for small diffs (wording-only first step)

(a) Rationale: the dominant body length is S (<50 words) in 42/94 repos and M in 37 — the "small but perfect" merged PRs (airbnb#2620: one sentence; immich#31080: ~40 words; shadcn-ui#11715: one sentence with root cause) are the corpus' praised ideal for tiny diffs, while our 7-section skeleton structurally inflates them. Full length-adaptive redesign is P2.1, but a wording-only first step is cheap now.

(b) File and wording — `src/background/prompts/common.ts:17`, current:

```
"Use these sections (omit sections that would be empty):\n\n",
```

Replace with:

```
"Use these sections, scaled to the change: omit sections that would be empty, and for small diffs (a handful of files or ~50 changed lines) prefer a compact output — Summary plus Testing when verifiable, with commits folded into Summary — over a long scaffold. Commit Coverage remains mandatory in all sizes, even if rendered as one sentence.\n\n",
```

(c) Risks: the LLM may under-cover files on borderline diffs; `test:coverage`'s ≥90% gate and `test:pr-creation`'s Commit-Coverage assertion are the exact tripwires for this. Long complex PRs (the 11 L-bucket repos like v2rayN, langflow, openclaw) still get the full skeleton because the scaling instruction triggers only at explicitly small sizes.

## Validation plan

Automated checks already exist and apply directly (`package.json` scripts):

- **`bun run test`** runs the full suite; run it before and after each P1 change.
- **`bun run test:coverage`** (`tests/commit-coverage.ts`) gates commit coverage ≥90% against a real test PR — the key regression guard for P1.2/P1.6 (skeleton edits must not weaken the mandatory Commit Coverage instruction). Also `bun run test:pr-creation` (`tests/pr-creation-prompt.ts`) asserts the prompt contains "Commit Coverage" and "MUST cover every commit" — expect this to keep passing since we refine, not remove, that section.
- **`bun run test:extension`** and **`bun run test:full`** (`tests/extension-coverage.ts`, `tests/full-coverage.ts`) exercise the extension end-to-end coverage paths; use them to catch prompt-string breakage (e.g. a rule line accidentally referencing a renamed anchor format).
- **`bun run quality-gate`** for lint/type hygiene after any prompt-string edit (long template string lines can trip formatting rules).

Manual A/B procedure (per P1 change, ~30 minutes):

1. Pick the three exemplar shapes from the synthesis that span our main risk space: **kubernetes/kubernetes#141500** (canonical mandatory template + `/kind` boilerplate — exercises P1.4), **ohmyzsh/ohmyzsh#14033** (+1/−1 root-cause bug fix — exercises P1.3 and small-PR proportionality), **microsoft/PowerToys#50230** (large change with checklist + N/A-rationale culture + count-based validation — exercises P1.1 and P2 anchor-scaling).
2. For each: check out the corresponding base and head, open the PR-creation page, generate with the current prompts (control) and save output; apply the prompt change, `bun run build`, regenerate (treatment).
3. Score each output against the real merged body, not abstract criteria: (a) does the treatment reproduce the verifier's evidence style (commands, counts) seen in the real PR; (b) is total authored length within ~1.5× of the real body for that repo's length bucket (S/M/L); (c) template case only — diff the output against GitHub's template and confirm zero boilerplate bytes lost; (d) confirm anchors still resolve and every commit is still covered.
4. Front-run the riskiest single check: the P1.4 "preserve HTML comments" rule — manually verify that output round-trips through `parseDescriptionOnlyResponse` without the leading-comment heuristic (`parse.ts:72-81`) eating a template comment line (it strips a leading *title-like* line only, but `<!—` and `<!--` lines are short and colon-free, so they should survive; verify in practice).
5. Abort criteria per change: any of (a)–(c) regresses on 2 of 3 exemplars, or `bun run test` fails — revert that specific prompt line and re-negotiate wording rather than shipping a partial improvement.
