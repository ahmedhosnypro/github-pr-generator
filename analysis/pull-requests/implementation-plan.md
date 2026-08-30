# Plan: Implement corpus-driven prompt & pipeline improvements

**Refined Implementation Plan** - Based on analysis of 470 merged PRs from 94 top-starred GitHub repositories

## Overview

This plan translates corpus study findings into concrete improvements for the extension's prompt layer and output pipeline. The goal is to close the gap between current prompt behavior and real-world merged PR patterns, focusing on prompt wording and structure only. The P1.x/P2.x/P3.x numbering used throughout comes from `analysis/recommendations.md`.

## Source Material & Corpus Caveats

**Inputs to this plan**: `analysis/pull-requests/SYNTHESIS.md` (cross-repo synthesis), `analysis/recommendations.md` (prioritized recommendation catalog), 94 per-repo reports at `analysis/pull-requests/<owner>--<repo>/patterns.md`, and the SYNTHESIS appendix (94-row per-repo index of dominant pattern / template? / length bucket). Corpus: 470 merged PRs, 5 per repo, across 94 repos (6 of the original top-100 list excluded: awesome-selfhosted, deepseek-ai/deepseek-harness, DigitalPlatDev/FreeDomain, massgravel/Microsoft-Activation-Scripts, and torvalds/linux have zero merged PRs; golang/go had only one trivial merged PR).

**Known biases** (SYNTHESIS.md "Sample") — treat every count in this plan as directional, not absolute:
- **5-PR share**: n=5 per repo; several reports flag single-author dominance (v2rayN, ollama, openai/codex, hello-algo are all 5/5 one author), same-day merge batches, and narrow time windows.
- **Recency skew**: samples are recently-merged PRs, mostly 2026; some repos instead surfaced 2015-2024 drive-bys (Vue, airbnb, getify, jlevy).
- **Top-starred skew**: ~20 repos are curated lists/docs (awesome-*, free-programming-books, CS-Notes, JavaGuide, etc.) whose PRs are one-line submissions — they anchor the S bucket but should not set the bar for code repos.
- **Change-type skew**: huge repos' merged streams are bot-dominated (microsoft/generative-ai-for-beginners 5/5 bot; Chalarangelo/30-seconds-of-code 4/5 Dependabot; flutter 4/5 autoroller; nilbuild/developer-roadmap 4/5 sync bot), thinning the human-writing signal.
- **Language mix**: English-dominant, with Chinese-heavy clusters (clash-verge-rev, CS-Notes, justjavac, JavaGuide, Python-100-Days, 996icu) and one bilingual-template repo (farion1231/cc-switch). Chinese-language repos run systematically shorter in word counts but remain information-dense.

**Methodological note**: the synthesis' "excellent PR" traits are correlational, not causal — we observe what merged, not what caused merging. But in repos with near-zero review, the description was often the only thing a maintainer read before merging, which is suggestive. Every Phase below mitigates this by validating against real merged exemplars (Phase E3), not just corpus statistics.

## Key Insights from Corpus Analysis

### Three PR Cultures (Critical Implementation Focus)
1. **Evidence-driven engineering** (minority): Summary/Problem → Changes → Verification arc with quoted commands, pass counts, honest scope limits
2. **Template-gated compliance** (30 repos enforce, 10 more have-but-bypass): freeCodeCamp, Kubernetes, llama.cpp, PowerToys, open-webui, yt-dlp, ripienaar - description is boilerplate + short authored core; quality hinges on how honestly authors fill the scaffold
3. **Title-only pragmatism** (nearly half the corpus; 54 template-free repos, 34 of them genuinely freeform): HelloGitHub (3/5 empty), CS-Notes (4/5), 996icu (4/5), yangshun (3/5) - merged bodies routinely one line or empty

### Critical Length Distribution
- **S (<50 words)**: 42/94 repos - current 7-section skeleton forces inflation
- **M (50-200)**: 37/94 repos - sweet spot for most authored content
- **L (>200)**: 11/94 repos - v2rayN, ECC, anthropics/skills, garrytan/gstack, Graphify, langflow, hermes-agent, superpowers, ohmyzsh, openclaw, open-webui (SYNTHESIS "Description length"; PowerToys sits in M per the appendix)
- **BOT**: 3 repos - 30-seconds-of-code (Dependabot), microsoft/generative-ai-for-beginners (bot stream), nilbuild/developer-roadmap (sync bots)

**No diff-size↔length correlation**: the corpus shows description length tracks *risk, complexity, and author role* rather than diff size — next.js merged −5,139 lines with one paragraph, hello-algo documented a 180-file change in 85 words, kubernetes mounted +4,879/−13,225 with ~15 words (`/kind` labels carried it), getify accepted a 6,675-line translation with one sentence, while v2rayN's longest PR is only +82/−2 (a risky helper). Phase A1's scaling instruction must therefore stay a soft preference keyed to small diffs, not a hard size gate.

**Author-role gradient** (recurs in ≥8 repos: excalidraw, react, shadcn-ui, transformers, langchain, ComfyUI, immich, vscode-adjacent): maintainers merge their own PRs with one line while external contributors write the full packet — description effort substitutes for trust. This is the corpus basis for Phase B's never-overwrite-authored-prose rule.

### Repository-Specific Patterns (High Impact)
- **kubernetes**: `subsystem: verb` titles, mandatory template with `/kind` slash-commands, extremely terse prose
- **ohmyzsh**: strict Conventional Commits, template + root-cause prose, AI disclosure required
- **PowerToys**: `[Area]`/`area:` prefix titles, 4-section template, evidence tables with build IDs
- **yt-dlp**: `[area]` bracket titles, mandatory anti-AI template, PRs without template get CLOSED
- **nodejs**: `subsystem: verb`, freeform prose, AI disclosure common
- **react/react-native**: `[version]` prefix, 3-section template

### Title Convention Distribution (SYNTHESIS.md "Title conventions")

Dominant convention per repo, all 94 repos counted — the basis for A8's ordered-preference title rule:

| Convention family | Repos | Example repos | Representative titles |
|---|---|---|---|
| True Conventional Commits `type(scope):` | **30** | v2rayN, freeCodeCamp, excalidraw, n8n, ohmyzsh, electron, shadcn-ui, immich | `fix(hysteria2): default the port to 443 when the share URI omits it` |
| Plain imperative, no prefix | **26** | scrcpy, bootstrap, public-apis, rust-lang, godot ("Fix X" style) | `Add flex display support (resizable virtual display)` |
| Mixed / no dominant convention | **26** | airbnb, huggingface/transformers, vercel/next.js, d3, vuejs/vue | CC and plain titles coexist in the same repo |
| Scope/area prefix, no type (`subsystem:`) | **7** | nodejs, kubernetes, llama.cpp, vscode, PowerToys, three.js, ollama | `zlib: avoid waiting for paused ZIP iterators` |
| Bracketed area/version prefix `[Area]` | **5** | react, react-native (`[0.86]`), tensorflow (`[XLA:CPU]`), youtube-dl, yt-dlp | `[DOM] Copy \`source\` onto the synthetic toggle event` |

Correlations worth exploiting: CC dominance clusters in repos whose release notes are generated from titles (electron, immich, n8n, excalidraw); scope-only prefixes cluster where the PR title becomes the squash-merge commit message (nodejs, llama.cpp, vscode, kubernetes). Chinese-language titles appear in ~6 repos. Only microsoft/generative-ai-for-beginners and nilbuild/developer-roadmap have fully machine-generated title streams.

### Section Frequency Across the Corpus (SYNTHESIS.md "Section-name frequency")

Normalized header families, repo counted once when the header recurs — the corpus-ranked priority for which sections our skeleton keeps vs. gates:

| Section family | Repos | Notable variants |
|---|---|---|
| Summary / Overview / What changed | **29** | vscode `## What changed`; PowerToys `## Summary of the Pull Request`; kubernetes `#### What this PR does / why we need it:` |
| Test plan / Testing / Validation / Verification | **27** | ECC `## Validation`; openclaw `## Evidence`; anthropics/skills `## How we know it works`; immich `## How Has This Been Tested?` |
| Checklist (template checkboxes as a section) | **27** | freeCodeCamp; ohmyzsh `## Standards checklist:`; ripienaar `## Requirements`; AutoGPT `### Checklist`; PowerToys `## PR Checklist` |
| Problem / Why / Motivation / Root cause | **16** | langflow `## Problem` → `## Root cause`; vercel/next.js `### Why?`; ponytail `## Problem`/`## Root Cause` |
| Scope / Non-goals / Limitations / "not tested" | **12** | markitdown `## Deliberately not changed`; rustdesk `## Known limitations`; openclaw `## What was not tested`; n8n `## Not verified` |
| Type-of-change selector | **6** | kubernetes `#### What type of PR is this?` + `/kind`; vue checkboxes; ytdl-org `What is the purpose…` |
| Prior-art / supersession notes | **5** | obra/superpowers `## Existing PRs`; hermes-agent `salvage #N` in titles; ComfyUI `A PR like #8464` |
| Changelog / Release notes entry | **4** | electron `#### Release Notes` + clerk `Notes:` trailer; react-native `## Changelog:`; n8n `(no-changelog)` trailer |
| Screenshots / Demo / Visual proof | **4** | open-webui `### Screenshots or Videos` Before/After tables; immich `## Screenshots`; openclaw `## Visual proof` |
| Breaking-change callout | **3** | open-webui `### Breaking Changes` (usually N/A); vue checkbox; react-native `[BREAKING]` slot (unexercised in sample) |

Standout: hand-written `## Summary` is effectively the universal opener when no template exists — but "Summary" means radically different things per repo (3-word bullets in openai/codex; a 3-paragraph causal narrative in langflow).

### Template Landscape (SYNTHESIS.md "Template usage")

- **Repo template present and broadly used: 30 repos** — electron, freeCodeCamp, llama.cpp, github/gitignore, transformers, immich, PowerToys, n8n, ohmyzsh, openclaw, open-webui, public-apis, ripienaar/free-for-dev, obra/superpowers, TheAlgorithms, ytdl-org, yt-dlp, bootstrap, flutter, AUTOMATIC1111, godot, kubernetes, vue, sindresorhus/awesome, and more.
- **Template exists but bypassed/thinly filled: 10 repos** — ECC, anthropics/claude-code, cc-switch, spec-kit, ComfyUI, react, project-based-learning, ultraworkers/claw-code, labuladong, getify.
- **No repo template: 54 repos**, of which **20 have strong author-level scaffolds** (anomalyco/opencode, mattpocock/skills, vscode, langflow, dify, Graphify, hermes-agent, gstack, hello-algo, three.js, shadcn-ui's universal `### Description`, …) and **34 are genuinely freeform** (including the 3 bot-stream-dominated repos).

Canonical template skeleton across repos (target shape for A6 fill behavior):

```
## Summary / Description            <- what this PR does
## (What problem / Why / Motivation) <- optional in small PRs
## How Has This Been Tested? / Validation / Test plan
## Screenshots (UI repos; often Before/After)
## Checklist:                        <- read CONTRIBUTING; tested locally; code style;
   - [x] no unrelated changes; docs updated; (increasingly:) AI-use disclosure
Closes #XXXXX
```

Boilerplate a generator must preserve byte-for-byte (drives A6 and Phase D's "never strip real templates"):
- **Invisible HTML-comment instructions left in merged PRs**: kubernetes, bootstrap, nodejs, rust-lang, f--prompts.chat, open-webui — distinguish rendered content from comment scaffold.
- **Attestation checkboxes**: freeCodeCamp (`I have tested these changes…`), n8n (`I have seen this code, I have run this code, and I take responsibility for this code`), openclaw (mandated AI line), llama.cpp (`AI usage disclosure: YES/NO`), immich (mandatory "to which degree, if any, an LLM was used" section), ohmyzsh (AI-tool disclosure checkbox), spec-kit (`## AI Disclosure`), electron (`I have reviewed and verified the changes` linking `policy/ai.md`), obra/superpowers (metadata table demanding model + harness + human reviewer).
- **Hard anti-AI stances**: yt-dlp (`NO AI / NO LLM POLICY` checkbox; "PRs without the template will be CLOSED"; permanent-block threats) and ripienaar/free-for-dev ("written using AI… we will close it without reviewing" + an "LLMs tick this box" honeypot left unchecked).
- **Release-note contracts**: electron clerk-enforced `Notes:` trailer; react-native `[CATEGORY] [TYPE] - …` changelog line; n8n `(no-changelog)` title trailer; kubernetes fenced `release-note` block plus prow slash-commands (`/kind`, `/sig`, `/cc`).
- **Thin fills tolerated**: vue and transformers merge near-empty template fills; gitignore merged visible `_TODO_` placeholders — templates constrain structure, not authored depth.

### Bot & AI Landscape (SYNTHESIS.md "Bot-generated descriptions")

Three distinct phenomena a generator must not blunder into:
1. **Appended AI-summary blocks kept verbatim (8 repos)**: f--prompts.chat (CodeRabbit 5/5), build-your-own-x (2/5, as the entire body), x1xhlol (4/5), langflow (3/5), rustdesk (CodeRabbit + Greptile with confidence scores and mermaid, 4/5), n8n (cubic badge 5/5), superpowers (1), firecrawl (`## Summary by cubic` IS the description in 4/5). Uniform structure: HTML comment marker → `## Summary by …` → category bullets (`**Bug Fixes**`, `**Documentation**`) → footer/badge. Maintainers almost never edit them out.
2. **Fully machine-authored PRs (13 repos)**: Dependabot, Renovate, backport bots (electron trop `Backport of #N.`), google copybara (tensorflow: bodies literally `Automated Code Change`), GitHub-Actions syncs, flutter autoroller, n8n cat-bot, openclaw roboclaw-bot, openai/codex copyberry pipeline (identical Why/What-changed/Testing triads, 1-2 minute merges, `<!-- copyberry-projection-id -->` footers).
3. **Disclosed AI-assisted human submissions (~12 repos)**: nodejs (`Assisted-by:` trailers), dify, MoneyPrinterTurbo, mattpocock/skills, gstack, ponytail, spec-kit, ohmyzsh, n8n, openclaw, awesome-llm-apps, langchain — all merged with disclosure intact; several templates make disclosure mandatory (llama.cpp, immich, ohmyzsh, spec-kit, openclaw, superpowers, electron).

Competitive bar, verbatim from the synthesis: matching CodeRabbit's category-bullets wins nothing in evidence-driven repos — the merged-as-praised artifacts contain root cause in one line, reproduction commands, quantified before/after evidence, and explicit what-was-not-done sections. Two repos hard-reject AI text outright (yt-dlp, ripienaar), and ripienaar's template contains a honeypot designed to catch it.

## Priority Matrix

| Priority | Impact | Effort | Risk | Focus Area |
|----------|--------|--------|------|-------------|
| **P0** | High | Low | Low | Commit coverage preservation, skeleton scaling |
| **P1** | High | Low | Medium | Prompt wording changes (P1.1-P1.7) |
| **P2** | Medium | Medium | Medium | Structural changes (P2.1-P2.6) |
| **P3** | High | High | High | Feature-level enhancements (out of scope) |

## Invariants (DO NOT BREAK)

- **Commit Coverage** stays mandatory at every diff size; tests assert the literal strings `"Commit Coverage"` and `"MUST cover every commit"` (`tests/pr-creation-prompt.ts:28`, `tests/full-coverage.ts:112`) and `test:coverage` enforces ≥90% coverage against a live test PR.
- **Diff-hunk anchor links** (`[[N]](diffhunk://...)`) remain — a differentiating feature; wording relaxes only for large diffs.
- **`tests/prompt.ts`** contains its OWN mirror of the prompt builders (lines ~78-137 re-implement the skeleton). Every prompt change in `src/` must be mirrored there, or the test suite silently tests stale prompts.
- **Line-append punctuations** in `SECTIONS_PROMPT` (string-array joins) — keep the file's existing style (strict lint: biome + oxlint + eslint sonarjs max-150-lines/file, max-50-lines/function).

## Success Metrics

- **Quality**: Generated PR descriptions match real-world patterns for target repositories
- **Coverage**: ≥90% commit coverage maintained on all test PRs
- **Template fidelity**: HTML comments, checkboxes, and boilerplate preserved byte-for-byte
- **Length appropriateness**: Small diffs produce concise output (<50 words), complex diffs get comprehensive coverage
- **Evidence quality**: Testing sections include verifiable commands and counts where possible
- **Title convention fit**: generated titles follow the repo's dominant convention family when inferable from commit messages (corpus split: 30 CC / 26 plain-imperative / 26 mixed / 7 scope-prefix / 5 bracketed — see Title Convention Distribution)

## Phase A — Prompt wording (P1.1-P1.7) - HIGH PRIORITY, LOW EFFORT

**Goal**: Implement corpus-aligned prompt wording changes based on 15 exemplars and 94-repo patterns

### Tasks:

#### A1. P1.7/P2.1 - Scale skeleton for small diffs (CRITICAL)
**File**: `src/background/prompts/common.ts:17`
**Change**: 
```typescript
// From:
"Use these sections (omit sections that would be empty):\n\n",
// To:
"Use these sections, scaled to the change: omit sections that would be empty, and for small diffs (a handful of files or ~50 changed lines) prefer a compact output — Summary plus Testing when verifiable, with commits folded into Summary — over a long scaffold. Commit Coverage remains mandatory in all sizes, even if rendered as one sentence.\n\n",
```
**Evidence**: 42/94 repos prefer S-length; airbnb#2620, immich#31080, shadcn#11715 exemplars. Guardrail: corpus shows NO diff-size↔length correlation (next.js merged −5,139 lines in one paragraph; kubernetes did +4,879/−13,225 in ~15 words) — the "+50 lines" heuristic is a soft preference, and Phase E3 must confirm complex-but-small-diff PRs keep depth.

#### A2. P1.3 - Root cause first for bug fixes (HIGH IMPACT)
**File**: `src/background/prompts/common.ts:18-19`
**Change**:
```typescript
// From:
"## Summary\n",
"A 2-4 sentence overview of what this PR does and why the change is needed.\n\n",
// To:
"## Summary\n",
"2-4 sentences. For bug fixes, open with the root cause in one line — the observable symptom, then the mechanism that caused it — before describing the fix. For features or chores, state what the PR does and why it's needed. Reference concrete identifiers from the diff, not generic descriptions.\n\n",
```
**Evidence**: ohmyzsh#14033, nodejs/node#65406, v2rayN#10027 exemplars; 16 repos with Problem sections

#### A3. P1.2 - Convert Breaking Changes to conditional rule
**Files**: `src/background/prompts/common.ts:28-29` (remove), `src/background/prompts/combined.ts` and `pr-prompts.ts` (add rule)
**Change**:
- Remove `## Breaking Changes` section from skeleton
- Add rule: `"Only if the diff genuinely breaks API/behavior (removed exports, renamed functions, changed contracts), add a ## Breaking Changes section with diff hunk references; otherwise do not create the section. When the diff proves there are no behavior changes, you may state that in one sentence inside Summary instead.\n"`
**Evidence**: Only open-webui/vue have breaking changes; most repos reassure "no behavior change"

#### A4. P1.1 - Enhanced Testing section (EVIDENCE-DRIVEN)
**File**: `src/background/prompts/common.ts:26-27`
**Change**:
```typescript
// From:
"## Testing\n",
"How a reviewer can test or verify these changes. Include specific steps if inferable from the diff.\n\n",
// To:
"## Testing\n",
"How a reviewer can verify these changes. Prefer exact, copy-pasteable commands a reviewer can re-run (test commands, build commands, CLI invocations) over prose claims — infer them from the diff only when a script/test file in the diff makes them concrete. When counts or before/after results are knowable from the diff, state them. If verification cannot be inferred from the diff, say so in one sentence rather than inventing commands, and state explicitly what was NOT verified.\n\n",
```
**Evidence**: PowerToys#50230 ("40/40 passed"), hello-algo#1959 ("56/56 tests"), langflow quantified results

**Optional extension** (synthesis trait #3, "prove the test can fail"): when the diff adds a regression test, the strongest merged PRs also show red-before/fail-first runs — v2rayN#10026 (failing-then-passing), spec-kit#4340 ("Verified the test fails without the fix"), ECC#2693 (RED then GREEN run), openclaw#128223 ("Red-before on current main: 1 failed, 17 passed"), langflow#14834 (adversarially deleting the key). Keep this out of the base wording until E3 confirms it doesn't inflate small-PR output.

#### A5. P1.6 - Improved issue linking (CONVENTION AWARE)
**File**: `src/background/prompts/common.ts:30-31`
**Change**:
```typescript
// From:
"## Linked Issues\n",
"List any issue references from the commit messages. Omit if none.\n\n",
// To:
"## Linked Issues\n",
"If commit messages reference issues or PRs, surface them as a single closing line in standard GitHub form ('Fixes #123', 'Closes #123', or 'Part of #123' when the commit does not fully resolve it) rather than a bare list. Omit if none — do not invent issue numbers.\n\n",
```
**Evidence**: freeCodeCamp template bakes `Closes #N`; kubernetes prefers "Part of"; 67 repos show zero closing keywords

#### A6. P1.4 - Strengthen template fidelity (TEMPLATE-GATED REPOS)
**Files**: `src/background/prompts/combined.ts:9-10`, `src/background/prompts/pr-prompts.ts:39-41`
**Change**:
```typescript
// From:
"Respect its structure — keep its headers, fill in its sections, and do not remove any existing content:\n\n"
// To:
"Respect its structure completely — keep every header, HTML comment (<!-- ... -->), checkbox, footer, and boilerplate sentence byte-for-byte; only fill in the sections. Do not delete, reorder, or reword template text. Output the full template with all existing content preserved, plus your additions:\n\n"
```
**Evidence**: Kubernetes, llama.cpp, yt-dlp preserve ALL boilerplate; yt-dlp closes PRs without template

#### A7. P1.5 - Forbid bot signatures (ANTI-AI PROTECTION)
**Files**: Add to RULES blocks in `combined.ts` and `pr-prompts.ts`
**Change**: Add rule: `"Do NOT imitate bot output: no 'Summary by <tool>' headings, badge images, mermaid diagrams, confidence scores, HTML comment markers like <!-- ... --> you invented, or sign-off footers. No emoji unless the existing template uses them.\n"`
**Evidence**: 8 repos accept bot blocks; 2 repos (yt-dlp, ripienaar) ban AI text outright

#### A8. P2.3 - Flexible title style (REPO-SPECIFIC CONVENTIONS)
**Files**: `src/background/prompts/combined.ts:16`, `src/background/prompts/pr-prompts.ts:14-16`, `src/background/prompts/merge-prompts.ts:28`
**Change**: Replace hard conventional commit requirement: `"Match the repo's title style if inferable from commit messages in this prompt (e.g. 'subsystem: verb', '[Area]', conventional commits); otherwise default to conventional commits."`
**Evidence**: Only 30/94 repos use strict CC — full split: CC 30, plain-imperative 26, mixed 26, scope/area-prefix 7 (nodejs, kubernetes, llama.cpp, vscode, PowerToys, three.js, ollama), bracketed 5 (react, react-native, tensorflow, youtube-dl, yt-dlp). CC dominance concentrates in repos whose release notes are title-generated (electron, immich, n8n, excalidraw); scope prefixes cluster where the PR title becomes the squash-merge commit (nodejs, llama.cpp, vscode, kubernetes).

#### A9. P2.4 - Scale anchor usage (DIFF-SIZE AWARE)
**Files**: Update RULES blocks in `combined.ts` and `pr-prompts.ts`
**Change**: Modify anchor requirement: `"For large diffs (many files), focus on substantive claims about files and include anchors for the most important files only. For small diffs, maintain the current 'every file mentioned' rule."`
**Evidence**: Prevents anchor spam on 30-file PRs; maintains differentiator while reducing noise

#### A10. P2.5 - No fabrication rule (ANTI-HALLUCINATION)
**File**: `src/background/prompts/common.ts:1-12`
**Change**: Add to SYSTEM_PROMPT: `"Never fabricate CI run IDs, SHAs, reviewer names, reviewers' checklist outcomes, or issue numbers. When filling templates, only mark checkboxes checked if the diff provides evidence."`
**Evidence**: Prevents rubber-stamped checklists (AutoGPT/x1xhlol anti-pattern)

## Phase B — Two-mode existing-body handling (P2.5) - MEDIUM PRIORITY, MEDIUM EFFORT

**Goal**: Distinguish between template boilerplate and authored content to avoid overwriting user prose

**Corpus basis**: the author-role gradient — maintainers merge their own one-liners while external contributors write full packets (excalidraw, react, shadcn-ui, transformers, langchain, ComfyUI, immich). Overwriting a maintainer's one-liner with a 7-section essay is a regression, which is why detection (B1) must be conservative and default to light-touch completion when unsure.

### Tasks:

#### B1. Create template detection helper (SMART DETECTION)
**File**: `src/background/prompts/common.ts`
**Add function**:
```typescript
export function isLikelyTemplate(body: string): boolean {
  return /(^|\n)#{1,6}\s+/.test(body) && // Has markdown headers
         (body.includes('<!--') || // Has HTML comments
          body.includes('- [ ]') || body.includes('- [x]') || // Has checkboxes
          (body.match(/^#{1,6}\s+/gm) || []).length >= 2); // Or multiple headers
}
```
**Evidence**: Template repos carry invisible HTML comments (kubernetes, bootstrap, nodejs, rust-lang, f--prompts.chat, open-webui), checkboxes (freeCodeCamp, yt-dlp, PowerToys), and multi-header scaffolds — corpus split: 30 template-gated, 10 bypassed, 54 no-template (20 with author-level scaffolds, 34 freeform)

#### B2. Implement conditional body handling (REPO-SPECIC LOGIC)
**Files**: `src/background/prompts/combined.ts`, `src/background/prompts/pr-prompts.ts`
**Change**: Modify existing body handling logic:
```typescript
if (existingBody && existingBody.trim().length > 0) {
  const isTemplate = isLikelyTemplate(existingBody);
  prompt += "## Existing Content in Description Field\n";
  if (isTemplate) {
    prompt += "The user has provided a PR template. Fill in its sections completely while preserving all existing content including HTML comments, checkboxes, and boilerplate text.\n\n";
  } else {
    prompt += "The user has written custom content. Only complete missing parts (Testing section, issue links) - do not restructure or rewrite existing sentences.\n\n";
  }
  prompt += existingBody + "\n\n";
}
```
**Evidence**: ohmyzsh has template + authored prose; PowerToys has template + checklist filling

#### B3. Update test mirror (COMPREHENSIVE COVERAGE)
**File**: `tests/prompt.ts`
**Change**: Add test cases for:
- Template detection with various repo patterns (kubernetes, yt-dlp, freeCodeCamp)
- Conditional handling logic for template vs authored content
- Edge cases (minimal templates, mixed content)

## Phase C — Corpus-derived repo profiles (P2.6 extension) - MEDIUM PRIORITY, HIGH EFFORT

**Goal**: Leverage corpus data to provide repo-specific guidance without requiring user configuration

### Tasks:

#### C1. Generate repo profiles from corpus (DATA-DRIVEN)
**File**: Create `src/background/repo-profiles.ts`
**Process**: 
- Seed from the SYNTHESIS appendix (94-row per-repo index: dominant pattern / template? / length bucket)
- Subagent reads all 94 `patterns.md` files + synthesis appendix
- Promote a repo to a profile only where the per-repo `patterns.md` confirms the appendix row (guards against the n=5 sampling bias)
- Generates typed map for repos with clear evidence only
- Profile structure:
```typescript
interface RepoProfile {
  owner: string;
  repo: string;
  // Maps to the SYNTHESIS title families: conventional (30), imperative (26),
  // mixed (26), scope-prefix/area-prefix (7), bracket-prefix (5)
  titleStyle: "conventional" | "imperative" | "mixed" | "scope-prefix" | "area-prefix" | "bracket-prefix";
  length: "S" | "M" | "L";
  templateHeavy?: boolean;
  disclosureRequired?: boolean;
  note?: string;
}
```
**Key Profiles** (based on exemplars and the SYNTHESIS appendix rows):
- `kubernetes`: `{ titleStyle: "scope-prefix", length: "S", templateHeavy: true }`
- `ohmyzsh`: `{ titleStyle: "conventional", length: "L", disclosureRequired: true }`
- `PowerToys`: `{ titleStyle: "area-prefix", length: "M", templateHeavy: true }`
- `yt-dlp`: `{ titleStyle: "bracket-prefix", length: "S", templateHeavy: true, disclosureRequired: true }`
- `nodejs`: `{ titleStyle: "scope-prefix", length: "M" }`
- `immich`: `{ titleStyle: "conventional", length: "S", templateHeavy: true, disclosureRequired: true }` (mandatory "degree of LLM use" section)
- `ripienaar/free-for-dev`: `{ titleStyle: "imperative", length: "S", templateHeavy: true, disclosureRequired: true }` (anti-AI honeypot: never tick the honeypot box)

#### C2. Integrate profiles into prompt builders (CONTEXT-AWARE)
**Files**: Update `src/background/prompts/combined.ts`, `pr-prompts.ts`, `merge-prompts.ts`
**Change**: Add optional 3rd parameter to prompt builders:
```typescript
interface PromptContext {
  branchContext?: { owner: string; repo: string };
  // ... existing params
}
```
When profile matches, inject house style note:
```typescript
if (profile) {
  prompt += `House style: This repo uses ${profile.titleStyle} titles and ${profile.length}-length descriptions.\n`;
  if (profile.templateHeavy) {
    prompt += "Template fidelity is critical - preserve all boilerplate.\n";
  }
  if (profile.disclosureRequired) {
    prompt += "AI usage disclosure is required.\n";
  }
}
```

#### C3. Update handlers to pass context (BRANCH AWARENESS)
**Files**: `src/background/handlers/generate.ts:54`, `handlers/title.ts:47`, `handlers/description.ts:50`
**Change**: Pass `branchContext.owner/repo` to prompt builders
**Evidence**: Extract from existing `summary.ts:5-19` branch context

#### C4. Update test mirror (PROFILE COVERAGE)
**File**: `tests/prompt.ts`
**Change**: Add profile-based context tests for key exemplar repos

## Phase D — Output hardening in `parse.ts` (P3.1) - MEDIUM PRIORITY, LOW EFFORT

**Goal**: Strip LLM-hallucinated bot signatures from generated descriptions

### Tasks:

#### D1. Implement bot signature detection and removal (COMPREHENSIVE PATTERNS)
**File**: `src/background/parse.ts`
**Change**: Update `parseCombinedResponse` and `parseDescriptionOnlyResponse` functions
**Add regex patterns** based on corpus analysis:
```typescript
const BOT_SIGNATURE_PATTERNS = [
  // CodeRabbit/cubic patterns (8 repos)
  /(?:## Summary by|Generated by|Created with|Co-Authored-By).*?(?:CodeRabbit|cubic|GitHub Copilot|AI assistant)/gi,
  // Category bullet patterns (firecrawl, rustdesk, n8n)
  /(?:\*\*Bug Fixes\*\*|\*\*Documentation\*\*|\*\*Features\*\*).*/gi,
  // Bot footer badges
  /(?:## Screenshots by|### Analysis by).*/gi,
  // General AI signatures
  /(?:Generated with|Created by).*?(?:LLM|AI|bot)/gi,
  // Rubber-stamped checklists (AutoGPT, x1xhlol anti-patterns)
  /(?:^\s*[-*]\s+\[.\]\s+.*?(?:tested|verified)\s*$)+/gm
];
```

**Corpus anatomy** (SYNTHESIS "Bot-generated descriptions") — what these regexes target: appended AI-summary blocks share a uniform structure of HTML comment marker → `## Summary by <tool>` → category bullets (`**Bug Fixes**`, `**Documentation**`) → footer/badge, seen verbatim in f--prompts.chat, build-your-own-x, x1xhlol, langflow, rustdesk (CodeRabbit + Greptile confidence scores and mermaid), n8n (cubic), superpowers, firecrawl. Additional machine artifacts worth a pattern: copyberry `<!-- copyberry-projection-id -->` footers (openai/codex), trop `Backport of #N` bodies (electron), copybara `Automated Code Change` (tensorflow). Scope limit: strip only hallucinated blocks from LLM output — never strip real template boilerplate, which is exactly what P1.4/B1 protect.

#### D2. Apply conservative stripping (PRESERVATION LOGIC)
**Implementation**: Apply patterns in `parseDescriptionOnlyResponse` after existing logic
```typescript
let description = originalDescription;
for (const pattern of BOT_SIGNATURE_PATTERNS) {
  description = description.replace(pattern, '').trim();
}
// Remove empty trailing lines that were part of signatures
description = description.replace(/\n{2,}$/, '\n');
// Preserve template content (HTML comments, etc.)
if (isLikelyTemplate(originalDescription)) {
  description = preserveTemplateContent(description, originalDescription);
}
```

#### D3. Add tests for signature removal (ANTI-PATTERN COVERAGE)
**File**: `tests/parse.ts`
**Add test cases** for:
- CodeRabbit signatures (`## Summary by CodeRabbit`)
- Cubic badges (`**Bug Fixes**` bullets)
- General AI footers (`Generated with Claude`)
- Template preservation (kubernetes HTML comments)
- Anti-patterns (AutoGPT checklists, x1xhlol unchecked boxes)

## Phase E — Verification and Quality Assurance - HIGH PRIORITY, MEDIUM EFFORT

**Goal**: Ensure all changes work correctly and maintain backward compatibility

### Tasks:

#### E1. Automated verification (SAFETY NET)
**Commands** (after each change):
- `bun run typecheck && bun run lint` (and `bun run quality` if quick)
- Mirror check: diff `tests/prompt.ts` against `src/` prompt text
- Run `bun run test:pr-creation` to confirm prompt structure
- Attempt `bun run test:coverage` — report unverified if LLM endpoint unreachable

#### E2. Regression testing (COVERAGE ASSERTIONS)
**File**: `tests/pr-creation-prompt.ts`
**Add assertions** for new behaviors:
- Small-diff wording present (A1)
- Template fidelity wording present (A6)
- Bot signature stripping works (D1)
- Title style flexibility works (A8)
- Root cause first for bug fixes (A2)

#### E3. Exemplar validation (CORPUS-DRIVEN TESTING)
**Manual testing** with 3 key exemplars from corpus:
1. **kubernetes/kubernetes#141500** - Template fidelity test
   - Verify template preservation (HTML comments, checkboxes)
   - Check subsystem-prefix title generation
   - Confirm extremely terse prose for large diffs

2. **ohmyzsh/ohmyzsh#14033** - Root cause + small PR test
   - Verify root cause first instruction
   - Check AI disclosure requirement
   - Confirm template + prose handling

3. **microsoft/PowerToys#50230** - Evidence + large PR test
   - Verify evidence-based testing section
   - Check area-prefix title generation
   - Confirm comprehensive validation tables

**Scoring criteria**:
- Treatment reproduces real PR's evidence style
- Length within ~1.5× of real body for repo's length bucket
- Template case: zero boilerplate bytes lost
- Anchors resolve and commit coverage maintained

**Proportionality spot-check** (SYNTHESIS "small but perfect" runners-up): for tiny diffs, additionally compare output against public-apis#7112, airbnb/javascript#3229, mrdoob/three.js#34144, EbookFoundation/free-programming-books#13422 — treatment should land in the S bucket without dropping Commit Coverage. This directly exercises A1's scaling instruction.

#### E4. Anti-pattern validation (REGRESSION PREVENTION)
**Test against corpus anti-patterns**:
- Empty descriptions (12 repos): ensure we don't generate empty output
- Unfilled templates (15 repos): ensure we fill placeholders appropriately
- Bot signatures (7 repos): ensure we strip hallucinated content
- Sloppy titles (6 repos): ensure we generate clean titles

#### E5. Documentation update (USER GUIDANCE)
**File**: `README.md`
**Add**: Brief usage note (~6 lines) about:
- Profile/convention awareness
- Changed description style (shorter for small diffs)
- Template preservation
- Evidence-based testing

## Risk Assessment & Mitigation

### High-Risk Items (Corpus-Validated)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Template content loss** | Medium | High | Conservative regex patterns; extensive testing with kubernetes/llama.cpp/yt-dlp templates; preserve all HTML comments and checkboxes |
| **Commit coverage regression** | Low | High | Maintain ≥90% test gate; explicit assertions in test suite; corpus shows this is a key differentiator |
| **Title convention mismatch** | Medium | Medium | Fallback to conventional commits; gradual rollout with exemplar testing; 30/94 repos use strict CC |
| **Token bloat** | Medium | Medium | Profile-based length scaling; monitor for large template echo (kubernetes template is 400+ words) |

### Medium-Risk Items (Evidence-Based)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **LLM hallucination** | Medium | Medium | Explicit fallbacks; evidence-based testing with real diffs; corpus shows 27/94 repos use verifiable commands |
| **Breaking change detection** | Low | Medium | Clear trigger list; manual review of ambiguous cases; only 3 repos actually have breaking changes |
| **Anchor spam** | Low | Medium | Contextual anchor usage based on diff size; corpus shows anchor links are a differentiating feature |
| **Template misclassification** | Medium | Medium | Sophisticated detection logic; test against 30 template repos vs 54 freeform repos |

### Corpus-Bias Risks (SYNTHESIS.md "Sample" caveats)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Small-n overfit** | Medium | Medium | n=5 per repo; treat all counts as directional; a repo enters Phase C profiles only when its `patterns.md` confirms the appendix row |
| **Recency skew** | Medium | Low | Samples are mostly 2026 merges with some 2015-2024 drive-bys; conventions drift — spot-check house style before shipping a profile |
| **Top-starred skew** | Medium | Medium | ~20 repos are curated lists/docs whose one-line PRs anchor the S bucket; weight code repos higher when calibrating length expectations |
| **Bot-stream skew** | Low | Medium | Huge repos' merged streams can be bot-dominated (generative-ai-for-beginners 5/5, flutter autoroller); exclude bot PRs from human-style calibration |
| **Diff-size heuristic misfire** | Medium | Medium | Corpus shows no diff-size↔length correlation (next.js −5,139 lines in one paragraph; v2rayN's longest PR is +82/−2); A1's small-diff rule is a preference, and E3 validates depth survives on small-but-risky diffs |
| **Language-barrel miss** | Low | Low | ~6 Chinese-title repos and one bilingual template (cc-switch); prompt wording stays language-neutral and mirrors commit-message language |

### Quality Gates (Corpus-Aligned)

- **Automated**: All existing tests must pass, typecheck/lint clean
- **Manual**: Exemplar testing against 3 key repositories from corpus
- **Performance**: No significant increase in token usage for typical cases
- **Compatibility**: Existing behavior preserved for repos without profiles
- **Template fidelity**: Zero bytes lost for kubernetes/llama.cpp/yt-dlp templates

### Anti-Pattern Prevention (Based on 15+ Anti-Patterns)

| Anti-Pattern | Repos Affected | Prevention Strategy |
|--------------|----------------|-------------------|
| Empty descriptions | 12 repos | Never output empty or one-word descriptions |
| Unfilled templates | 15 repos | Replace every placeholder with real content or explicit N/A |
| Bot signatures | 7 repos | Strip hallucinated bot content while preserving real templates |
| Rubber-stamped checklists | AutoGPT/x1xhlol | Only mark checkboxes checked if diff provides evidence |
| Sloppy titles | 6 repos | Clean titles under 72 chars, no duplicate words |

### Repository-Specific Risk Mitigation

| Repository | Risk | Mitigation |
|------------|------|------------|
| **kubernetes** | Template complexity | Test with full template including `/kind` slash-commands |
| **yt-dlp** | Anti-AI policy | Strict bot signature removal; template preservation |
| **ohmyzsh** | AI disclosure requirement | Enforce disclosure in prompts |
| **PowerToys** | Evidence tables | Support validation tables with build IDs/SHAs |
| **nodejs** | Freeform prose | Maintain flexibility for non-template content |
| **immich** | Mandatory LLM-usage disclosure section | Never strip the disclosure prompt from the template; leave the answer to the user |
| **ripienaar** | Anti-AI honeypot checkbox ("LLMs tick this box") | Never check the honeypot; preserve template byte-for-byte |

## Timeline & Resource Estimates

### Phase A (Prompt wording) - 3-5 days
- **A1-A4**: 1-2 days (low-risk, drop-in changes based on 15 exemplars)
- **A5-A10**: 2-3 days (medium-risk, require testing against 94-repo patterns)

### Phase B (Two-mode handling) - 2-3 days
- Template detection logic: 0.5 days (sophisticated pattern matching)
- Integration and testing: 1.5-2.5 days (30 template vs 54 freeform repos)

### Phase C (Repo profiles) - 4-6 days
- Profile generation: 2-3 days (subagent work on 94 repos)
- Integration: 1-2 days (context-aware prompt building)
- Testing: 1 day (key exemplar validation)

### Phase D (Output hardening) - 1-2 days
- Regex development: 0.5 days (comprehensive bot signature patterns)
- Integration and testing: 0.5-1.5 days (anti-pattern prevention)

### Phase E (Verification) - 3-4 days
- Automated testing: 0.5 days
- Manual exemplar testing: 2-3 days (3 key repositories from corpus)
- Documentation: 0.5 days

### Total Estimated Time: 13-20 days

### Resource Requirements
- **Primary**: 1 developer familiar with the codebase
- **Secondary**: Access to GitHub API for testing
- **Tools**: Existing test suite, exemplar PR repositories, corpus data
- **Reference Materials**: 94 repo patterns, 15 exemplars, anti-pattern catalog

### Success Criteria (Corpus-Aligned)
- All automated tests pass
- Manual validation against 3 exemplars from corpus
- No regression in commit coverage (≥90% maintained)
- Template fidelity maintained for key repositories (kubernetes, yt-dlp, ohmyzsh)
- Token usage within acceptable bounds (no bloat for large templates)
- Evidence-based testing sections for 27/94 repos that require them
- Flexible title generation matching 94-repo conventions

### Implementation Order (Risk-Adjusted)
1. **Phase A1, A4, A6** (Low risk, high impact - skeleton scaling, testing, template fidelity)
2. **Phase A2, A8, A10** (Medium impact - root cause, title flexibility, anti-hallucination)
3. **Phase B** (Template handling - medium complexity)
4. **Phase D** (Output hardening - low complexity)
5. **Phase C** (Repo profiles - high complexity, can be iterative)
6. **Phase E** (Comprehensive verification)

## Out of scope

- Popup UI for a brief/full mode toggle and other P3 UI items — only config-free behaviors ship in this round
- A/B protocol against exemplar repos (recommendations §Validation plan) — requires a working LLM config; can be a follow-up once P1 lands
- Real-time LLM endpoint configuration UI — remains in existing settings
- Advanced corpus analysis (sentiment analysis, change impact scoring) — beyond prompt scope
