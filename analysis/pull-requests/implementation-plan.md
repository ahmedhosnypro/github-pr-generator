# Plan: Implement corpus-driven prompt & pipeline improvements

**Refined Implementation Plan** — Based on comprehensive analysis of 470 merged pull requests from 94 top-starred GitHub repositories (`analysis/pull-requests/SYNTHESIS.md`), per-repo pattern reports (`patterns.md`), and prioritized architectural recommendations (`analysis/recommendations.md`).

---

## Overview

This plan translates corpus study findings into concrete improvements for the extension's prompt layer, template handling mechanics, and output parsing pipeline. The goal is to close the gap between current prompt behavior and real-world merged PR patterns, focusing on prompt wording and structure only. The P1.x/P2.x/P3.x numbering used throughout comes from `analysis/recommendations.md`.

Real-world merged PRs are significantly more evidence-dense, proportional in length, respectful of upstream templates, and resistant to bot boilerplate than naive LLM outputs.

---

## Source Material & Corpus Caveats

**Inputs to this plan**: `analysis/pull-requests/SYNTHESIS.md` (cross-repo synthesis), `analysis/recommendations.md` (prioritized recommendation catalog), 94 per-repo reports at `analysis/pull-requests/<owner>--<repo>/patterns.md`, and the SYNTHESIS appendix (94-row per-repo index of dominant pattern / template? / length bucket). Corpus: 470 merged PRs, 5 per repo, across 94 repos (6 of the original top-100 list excluded: `awesome-selfhosted/awesome-selfhosted`, `deepseek-ai/deepseek-harness`, `DigitalPlatDev/FreeDomain`, `massgravel/Microsoft-Activation-Scripts`, and `torvalds/linux` have zero merged PRs; `golang/go` had only one trivial merged PR).

**Known biases** (SYNTHESIS.md "Sample") — treat every count in this plan as directional, not absolute:
- **5-PR share**: $n=5$ per repo; many reports flag single-author dominance (`2dust/v2rayN`, `ollama/ollama`, `openai/codex`, `krahets/hello-algo` are all 5/5 one author), same-day merge batches, and narrow time windows.
- **Recency skew**: samples are recently-merged PRs, mostly 2026; some repos instead surfaced 2015–2024 drive-bys (`vuejs/vue`, `airbnb/javascript`, `getify/You-Dont-Know-JS`, `jlevy/the-art-of-command-line`).
- **Top-starred skew**: $\sim 20$ repos are curated lists/docs (`awesome-*`, `free-programming-books`, `CS-Notes`, `JavaGuide`, etc.) whose PRs are one-line submissions — they anchor the S bucket but should not set the bar for code repos.
- **Change-type skew**: huge repos' merged streams are bot-dominated (`microsoft/generative-ai-for-beginners`: 5/5 bot; `Chalarangelo/30-seconds-of-code`: 4/5 Dependabot; `flutter/flutter`: 4/5 autoroller; `nilbuild/developer-roadmap`: 4/5 sync bot), thinning the human-writing signal.
- **Language mix**: English-dominant, with Chinese-heavy clusters (`clash-verge-rev`, `CS-Notes`, `justjavac`, `JavaGuide`, `Python-100-Days`, `996icu`) and one bilingual-template repo (`farion1231/cc-switch`). Chinese-language repos run systematically shorter in word counts but remain information-dense.

**Methodological note**: the synthesis' "excellent PR" traits are correlational, not causal — we observe what merged, not what caused merging. But in repos with near-zero review, the description was often the only thing a maintainer read before merging, which is suggestive. Every Phase below mitigates this by validating against real merged exemplars (Phase E3), not just corpus statistics.

---

## Key Insights from Corpus Analysis

```
                                 ┌────────────────────────────────────────────────────────┐
                                 │       94 GitHub Repositories (470 Merged PRs)          │
                                 └──────────────────────────┬─────────────────────────────┘
                                                            │
                     ┌──────────────────────────────────────┼──────────────────────────────────────┐
                     ▼                                      ▼                                      ▼
     ┌───────────────────────────────┐      ┌───────────────────────────────┐      ┌───────────────────────────────┐
     │  Evidence-Driven Engineering  │      │   Template-Gated Compliance   │      │    Title-Only Pragmatism      │
     │      (Minority of Repos)      │      │     (30 Enforced, 10 Bypass)  │      │     (54 Repos / ~45% Total)   │
     ├───────────────────────────────┤      ├───────────────────────────────┤      ├───────────────────────────────┤
     │ • Root cause in one line      │      │ • Rigid checklist / scaffold  │      │ • 1-line or empty bodies      │
     │ • Exact runnable commands     │      │ • Critical boilerplate tokens │      │ • Minimalist descriptions     │
     │ • Quantified pass/fail counts │      │ • Preserves HTML comments     │      │ • Trust substitutes for prose │
     │ • Explicit scope limits       │      │ • Anti-AI & disclosure rules  │      │ • Common in list/doc repos    │
     └───────────────────────────────┘      └───────────────────────────────┘      └───────────────────────────────┘
```

### Three PR Cultures (Critical Implementation Focus)
1. **Evidence-driven engineering** (minority): Summary/Problem $\rightarrow$ Changes $\rightarrow$ Verification arc with quoted commands, pass counts, and honest scope limits.
2. **Template-gated compliance** (30 repos enforce, 10 more have-but-bypass): `freeCodeCamp`, `kubernetes`, `llama.cpp`, `PowerToys`, `open-webui`, `yt-dlp`, `ripienaar/free-for-dev` — description is boilerplate plus short authored core; quality hinges on how honestly authors fill the scaffold.
3. **Title-only pragmatism** (nearly half the corpus; 54 template-free repos, 34 of them genuinely freeform): `521xueweihan/HelloGitHub` (3/5 empty), `CyC2018--CS-Notes` (4/5), `996icu/996.ICU` (4/5), `yangshun/tech-interview-handbook` (3/5) — merged bodies routinely one line or empty.

---

### Critical Length Distribution
- **S (<50 words)**: 42/94 repos — current 7-section skeleton forces inflation (`airbnb/javascript`, `shadcn-ui/ui`, `mrdoob/three.js`, `public-apis/public-apis`, `immich-app/immich`, `kubernetes/kubernetes`, `vuejs/vue`).
- **M (50–200 words)**: 37/94 repos — sweet spot for most authored content (`microsoft/PowerToys`, `microsoft/vscode`, `ggml-org/llama.cpp`, `nodejs/node`, `Genymobile/scrcpy`, `electron/electron`, `langgenius/dify`).
- **L (>200 words)**: 11/94 repos — `2dust/v2rayN`, `affaan-m/ECC`, `anthropics/skills`, `garrytan/gstack`, `Graphify-Labs/graphify`, `langflow-ai/langflow`, `NousResearch/hermes-agent`, `obra/superpowers`, `ohmyzsh/ohmyzsh`, `openclaw/openclaw`, `open-webui/open-webui` (SYNTHESIS "Description length"; `microsoft/PowerToys` sits in M per the appendix).
- **BOT**: 3 repos — `Chalarangelo/30-seconds-of-code` (Dependabot), `microsoft/generative-ai-for-beginners` (bot stream), `nilbuild/developer-roadmap` (sync bots).

**No diff-size $\leftrightarrow$ length correlation**: the corpus shows description length tracks *risk, complexity, and author role* rather than diff size — `vercel/next.js` merged $-5,139$ lines with one paragraph, `krahets/hello-algo` documented a 180-file change in 85 words, `kubernetes/kubernetes` mounted $+4,879 / -13,225$ with $\sim 15$ words (`/kind` labels carried it), `getify/You-Dont-Know-JS` accepted a 6,675-line translation with one sentence, while `2dust/v2rayN`'s longest PR is only $+82 / -2$ (a risky helper). Phase A1's scaling instruction must therefore stay a soft preference keyed to small diffs, not a hard size gate.

**Author-role gradient** (recurs in $\ge 8$ repos: `excalidraw/excalidraw`, `react`, `shadcn-ui/ui`, `huggingface/transformers`, `langchain-ai/langchain`, `Comfy-Org/ComfyUI`, `immich-app/immich`, `microsoft/vscode`-adjacent): maintainers merge their own PRs with one line while external contributors write the full packet — description effort substitutes for trust. This is the corpus basis for Phase B's never-overwrite-authored-prose rule.

**Template-heavy bimodal word counts**: Template repos exhibit bimodal length — $\sim 400-460$ words of boilerplate scaffold enfolding $10-120$ words of authored content (`transformers`, `ripienaar/free-for-dev`, `TheAlgorithms/Python`). Prompts must size only the authored core when evaluating length appropriateness.

---

### Repository-Specific Patterns (High Impact)
- **kubernetes**: `subsystem: verb` titles, mandatory template with `/kind` slash-commands, extremely terse prose.
- **ohmyzsh**: strict Conventional Commits, template + root-cause prose, AI disclosure required.
- **PowerToys**: `[Area]`/`area:` prefix titles, 4-section template, evidence tables with build IDs and SHAs.
- **yt-dlp**: `[area]` bracket titles, mandatory anti-AI template, PRs without template get CLOSED.
- **ripienaar/free-for-dev**: plain imperative titles, mandatory anti-AI template containing an `"LLMs tick this box"` honeypot checkbox that must remain unchecked.
- **nodejs**: `subsystem: verb`, freeform prose, AI disclosure common (`Assisted-by:` trailers).
- **react/react-native**: `[version]` or `[Area]` prefix, 3-section template, changelog lines.
- **electron**: Conventional Commits, mandatory clerk `Notes:` release trailer, `policy/ai.md` attestation.

---

### Title Convention Distribution (SYNTHESIS.md "Title conventions")

Dominant convention per repo, all 94 repos counted — the basis for A8's ordered-preference title rule:

| Convention Family | Syntax Pattern | Repos | Example Repositories | Representative Real Titles |
|---|---|---|---|---|
| **True Conventional Commits** | `type(scope): description` | **30** | `v2rayN`, `freeCodeCamp`, `excalidraw`, `n8n`, `ohmyzsh`, `electron`, `shadcn-ui`, `immich`, `Graphify`, `AutoGPT`, `dify`, `langflow`, `firecrawl`, `anomalyco/opencode`, `clash-verge-rev`, `cc-switch`, `langchain`, `openclaw`, `rustdesk`, `spec-kit`, `ponytail`, `trekhleb`, `hermes-agent`, `ui-ux-pro-max`, `open-webui`, `gstack`, `claw-code` | `fix(hysteria2): default the port to 443 when the share URI omits it`<br>`perf(backend): cache redundant active-subscription lookups`<br>`refactor(editor): Extract frontend test helpers into @n8n/frontend-test-utils (no-changelog)` |
| **Plain Imperative Sentence** | `Verb [target] [context]` (No prefix) | **26** | `scrcpy`, `bootstrap`, `public-apis`, `vinta/awesome-python`, `ripienaar/free-for-dev`, `awesome-go`, `build-your-own-x`, `system-design-primer`, `free-programming-books`, `jwasham`, `521xueweihan`, `ossu`, `godot` ("Fix X" style), `openai/codex`, `rust-lang/rust`, `markitdown`, `anthropics/skills` | `Add flex display support (resizable virtual display)`<br>`Remove the breadcrumb bottom margin`<br>`Add Aquanode API`<br>`Fix crash when setting the root Viewport's World3D to null` |
| **Mixed / No Dominant Convention** | Coexisting CC and Plain sentences | **26** | `airbnb/javascript`, `huggingface/transformers`, `vercel/next.js`, `d3/d3`, `TheAlgorithms/Python`, `vuejs/vue`, `ComfyUI`, `kubernetes`-independent cases, `A1111`, `Shubhamsaboo`, `Snailclimb/JavaGuide`, `agency-agents`, `MoneyPrinterTurbo` | `fix: flash-attn fallback failing on torch2.13` merges next to `Avoid print to stdout that fails the job...` in the same repo |
| **Scope / Area Prefix (No Type)** | `subsystem: verb` or `area: description` | **7** | `nodejs/node`, `kubernetes/kubernetes`, `ggml-org/llama.cpp`, `microsoft/vscode`, `microsoft/PowerToys`, `mrdoob/three.js`, `ollama/ollama` | `zlib: avoid waiting for paused ZIP iterators`<br>`ggml : fix ggml_backend_buft_get_alloc_size() guard`<br>`sessions: Show chat status on its own row` |
| **Bracketed Area / Version Prefix** | `[Area] Description` or `[version] Description` | **5** | `react`, `react-native` (`[0.86]`), `tensorflow` (`[XLA:CPU]`), `ytdl-org/youtube-dl`, `yt-dlp/yt-dlp` | `[DOM] Copy \`source\` onto the synthetic toggle event`<br>`[ie/applepodcasts] Fix token caching`<br>`Roll Skia from 3ae8e3d1e335 to ce359c7fbfe6 (1 revision)` |

Correlations worth exploiting: Conventional Commits correlates strongly with repos whose release notes are generated from titles (`electron`, `immich`, `n8n`, `excalidraw`). Scope-only prefixes cluster in repos where the PR title becomes the squash-merge commit message (`nodejs`, `llama.cpp`, `vscode`, `kubernetes`). Chinese-language titles appear in $\sim 6$ repos. Only `microsoft/generative-ai-for-beginners` and `nilbuild/developer-roadmap` have fully machine-generated title streams.

---

### Section Frequency Across the Corpus (SYNTHESIS.md "Section-name frequency")

Normalized header families, repo counted once when the header recurs ($\ge 2$ PRs or dominant scaffold) — the corpus-ranked priority for which sections our skeleton keeps vs. gates:

| Section Family | Repos | Notable Variants & Example Repositories |
|---|---|---|
| **Summary / Overview / What Changed / What This PR Does** | **29** | `anomalyco/opencode` (`## Summary`), `cc-switch`, `microsoft/vscode` (`## What changed`), `n8n`, `langflow`, `mattpocock/skills`, `hello-algo`, `openai/codex` (`## What changed`), `tensorflow` community PRs, `PowerToys` (`## Summary of the Pull Request`), `kubernetes` (`#### What this PR does / why we need it:`), `excalidraw`, `flutter` (`## Summary`), `hermes-agent` |
| **Test Plan / Testing / Validation / Verification / How Has This Been Tested** | **27** | `2dust/v2rayN` (`## Testing`), `ECC` (`## Validation`), `cc-switch`, `langgenius/dify` (`## Verification`), `ohmyzsh`, `openclaw` (`## Evidence`), `open-webui` (`## Testing`), `immich` (`## How Has This Been Tested?`), `ultraworkers/claw-code` (`## Verification`), `microsoft/vscode` (`## Validation`), `anthropics/skills` (`## How we know it works`) |
| **Checklist (Template Checkboxes as a Section)** | **27** | `freeCodeCamp`, `ohmyzsh` (`## Standards checklist:`), `public-apis`, `ripienaar/free-for-dev` (`## Requirements`), `yt-dlp`, `ytdl-org`, `TheAlgorithms/Python`, `vinta/awesome-python`, `AutoGPT` (`### Checklist 📋`), `PowerToys` (`## PR Checklist`), `open-webui`, `immich`, `avelino/awesome-go`, `vue` |
| **Problem / Why / Motivation / Root Cause** | **16** | `DietrichGebert/ponytail` (`## Problem`/`## Root Cause`), `Graphify`, `trekhleb`, `langflow` (`## Problem` $\rightarrow$ `## Root cause`), `awesome-llm-apps`, `ultraworkers/claw-code`, `vercel/next.js` (`### Why?`), `tensorflow` community PRs (`## Problem`), `spec-kit`, `d3`, `MoneyPrinterTurbo`, `anthropics/skills` (`## Why now`) |
| **Scope / Non-Goals / Limitations / "Not Changed / Not Tested"** | **12** | `markitdown` (`## Deliberately not changed`), `rustdesk` (`## Known limitations`), `dify` (`## Deliberately left alone`), `openclaw` (`## What was not tested`), `n8n` (`## Not verified`), `Graphify` (`## Left as-is (intentionally)`), `v2rayN` (`## One behaviour change worth naming`), `github/gitignore` (`### Scope`) |
| **Type-of-Change Selector** | **6** | `kubernetes` (`#### What type of PR is this?` + `/kind`), `vue` (`What kind of change does this PR introduce?` checkboxes), `transformers` (`## Before submitting`), `ytdl-org` (`What is the purpose...` checkboxes), `f--prompts.chat` (`## Type of Change`), `avelino/awesome-go` (submission-class items) |
| **Prior-Art / Supersession Notes** | **5** | `obra/superpowers` (`## Existing PRs` duplicate-search evidence), `NousResearch/hermes-agent` (`salvage #N` in titles), `yt-dlp`, `youtube-dl` (`yt-dlp` backport citations), `ComfyUI` (`A PR like #8464`), `public-apis` duplicate checks |
| **Changelog / Release Notes Entry** | **4** | `electron` (`#### Release Notes` + clerk `Notes:` trailer), `open-webui` (Keep-a-Changelog `### Added/### Fixed/### Breaking Changes`), `react-native` (`## Changelog:` `[INTERNAL] [FIXED] - ...`), `n8n` (`(no-changelog)` trailer convention) |
| **Screenshots / Demo / Visual Proof** | **4** | `open-webui` (`### Screenshots or Videos` + Before/After tables), `immich` (`## Screenshots`, Before/After H3s), `AUTOMATIC1111` (`## Screenshots/videos:`), `openclaw` (`## Visual proof` with `**What this shows:**` captions) |
| **Breaking-Change Callout** | **3** | `open-webui` (`### Breaking Changes`, usually N/A), `vue` (`Does this PR introduce a breaking change?` checkbox), `react-native` (changelog `[BREAKING]` slot — not exercised in sample) |

**Standout**: hand-written `## Summary` is effectively the universal opener when no template exists — but "Summary" means radically different things per repo (3-word bullets in `openai/codex`; a 3-paragraph causal narrative in `langflow`).

---

### Template Landscape (SYNTHESIS.md "Template usage")

- **Repo template present and broadly used (30 repos)**: `electron`, `freeCodeCamp`, `ggml-org/llama.cpp`, `github/gitignore`, `huggingface/transformers`, `immich`, `microsoft/PowerToys`, `n8n`, `ui-ux-pro-max`, `ohmyzsh`, `openclaw`, `open-webui`, `avelino/awesome-go`, `f--prompts.chat`, `public-apis`, `react-native`, `ripienaar/free-for-dev`, `obra/superpowers`, `TheAlgorithms/Python`, `vinta/awesome-python`, `ytdl-org/youtube-dl`, `yt-dlp`, `bootstrap`, `flutter`, `AUTOMATIC1111`, `godot`, `kubernetes`, `vuejs/vue`, `sindresorhus/awesome`.
- **Template exists but is bypassed / ignored / minimally filled (10 repos)**: `ECC`, `anthropics/claude-code`, `cc-switch`, `spec-kit`, `ComfyUI`, `react`, `project-based-learning`, `ultraworkers/claw-code`, `labuladong/fucking-algorithm`, `getify/You-Dont-Know-JS`.
- **No repo template (54 repos)**:
  - **20 show strong recurring personal/author-level scaffolds**: `anomalyco/opencode`, `anthropics/skills`, `mattpocock/skills`, `microsoft/vscode`, `DietrichGebert/ponytail`, `langflow`, `dify`, `Graphify`, `hermes-agent`, `garrytan/gstack`, `hello-algo`, `three.js`, `msitarzewski/agency-agents`, `multica`, `Shubhamsaboo`, `trekhleb`, `justjavac`, `MoneyPrinterTurbo`, `EbookFoundation/free-programming-books` (compliance/disclosure convention), `shadcn-ui/ui` (universal `### Description`).
  - **34 are genuinely freeform** (including the 3 bot-stream-dominated repos).

#### Canonical Template Skeleton Across Repos:
```markdown
## Summary / Description            <- what this PR does
## (What problem / Why / Motivation) <- optional in small PRs
## How Has This Been Tested? / Validation / Test plan
## Screenshots (UI repos; Often Before/After)
## Checklist:                        <- read CONTRIBUTING; tested locally; code style;
   - [x] no unrelated changes; docs updated; (increasingly:) AI-use disclosure
Closes #XXXXX
```

#### Boilerplate a Generator Must Preserve Byte-for-Byte:
- **Invisible HTML-comment instructions are routinely left in** (`kubernetes`, `bootstrap`, `nodejs`, `rust-lang`, `f--prompts.chat`, `open-webui`) — a generator must distinguish rendered content from comment scaffold.
- **Attestation checkboxes**: `freeCodeCamp` (`I have tested these changes...`), `n8n` (`I have seen this code, I have run this code, and I take responsibility for this code`), `openclaw` (mandated AI line: `AI-assisted (Claude Code and Codex); I have read and understand the change.`), `llama.cpp` (`AI usage disclosure: YES/NO`), `immich` (mandatory "to which degree, if any, an LLM was used" section), `ohmyzsh` (AI-tool disclosure checkbox), `spec-kit` (`## AI Disclosure`), `electron` (`I have reviewed and verified the changes` linking to `policy/ai.md`), `obra/superpowers` (metadata table demanding model + harness + human reviewer).
- **Hard anti-AI stances**: `yt-dlp` (`NO AI / NO LLM POLICY` checkbox, "PRs without the template will be CLOSED", threats of a permanent block), `ripienaar/free-for-dev` ("If you open a Pull Request that was written using AI... we will close it without reviewing it" + an "LLMs tick this box" honeypot left unchecked).
- **Release-note contracts**: `electron`'s clerk-enforced `Notes:` trailer; `react-native`'s `[CATEGORY] [TYPE] - ...` changelog line; `n8n`'s `(no-changelog)` title trailer; `kubernetes`' fenced `release-note` block plus prow slash-commands (`/kind`, `/sig`, `/cc`).
- **Good forms punished when ignored**: `vue`'s and `transformers`' merged PRs prove maintainers tolerate near-empty template fills; `github/gitignore` merged a body with visible `_TODO_` placeholders.

---

### Bot & AI Landscape (SYNTHESIS.md "Bot-generated descriptions")

Three distinct phenomena a generator must account for:
1. **Appended AI-summary blocks kept verbatim (8 repos)**: `f--prompts.chat` (CodeRabbit on 5/5), `codecrafters-io/build-your-own-x` (2/5, as the *entire* body), `x1xhlol` (4/5), `langflow` (3/5, below the human body), `rustdesk` (CodeRabbit + Greptile with confidence scores and mermaid diagrams, 4/5), `n8n` (cubic badge on 5/5), `superpowers` (1, old era), `firecrawl` (`## Summary by cubic` IS the description in 4/5 PRs, merged as-is). Uniform structure: HTML comment marker $\rightarrow$ `## Summary by ...` $\rightarrow$ category bullets (`**Bug Fixes**`, `**Documentation**`) $\rightarrow$ footer/badge. Maintainers almost never edit them out.
2. **Fully machine-authored PRs (13 repos)**: Dependabot (`30-seconds-of-code` 4/5, `microsoft/generative-ai-for-beginners` 4/5), Renovate (`three.js` 2/5, `immich`), backport bots (`electron`'s trop "Backport of #N. See that PR for details.", `immich`'s push-o-matic), google copybara (`tensorflow` 4/5, incl. two bodies that are literally `Automated Code Change`), GitHub-Actions syncs (`developer-roadmap`), `flutter`'s autoroller, `n8n`'s cat-bot, `openclaw`'s roboclaw-bot, and `openai/codex`'s copyberry pipeline (identical Why/What-changed/Testing triads, 1–2-minute merges, `<!-- copyberry-projection-id -->` footers).
3. **Disclosed AI-assisted human submissions (~12 repos)**: `nodejs/node`, `langgenius/dify`, `MoneyPrinterTurbo`, `mattpocock/skills`, `garrytan/gstack`, `DietrichGebert/ponytail`, `spec-kit`, `ohmyzsh`, `n8n`, `openclaw`, `awesome-llm-apps`, `langchain` — all merged with the disclosure intact; several repos make disclosure mandatory via template (`llama.cpp`, `immich`, `ohmyzsh`, `spec-kit`, `openclaw`, `superpowers`, `electron`).

**Competitive bar, verbatim from the synthesis**: matching CodeRabbit's category-bullets wins nothing in evidence-driven repos — the merged-as-praised artifacts contain *root cause in one line, reproduction commands, quantified before/after evidence, and explicit what-was-not-done sections*. Two repos hard-reject AI text outright (`yt-dlp`, `ripienaar`), and `ripienaar`'s template contains a honeypot designed to catch it. Conversely, in high-velocity repos (`firecrawl`, `openai/codex`, `n8n`) machine-written descriptions are already the de facto reader-facing artifact and nobody cleans them up.

---

### Traits of Excellent Merged PRs (10 Core Habits)

These recurred across the strongest descriptions in the corpus (correlational, verified through exemplar testing):

1. **Root cause first, then fix**: Symptom $\rightarrow$ mechanism $\rightarrow$ fix. `nodejs/node#65406` pastes actual assertion failure before fix; `ohmyzsh#14033` quotes buggy line and explains silent zsh exit-status trap; `v2rayN#10027` opens with "Two defects in the same place, both on the import side, both silent."
2. **Verifiable evidence, not claims**: Exact commands plus quantified outcomes: `hello-algo#1959`'s "56/56 isolated workspace tests / missing_files=0", `PowerToys#50230`'s "40/40 passed across two OSes, 198/198 in Azure", `hermes#98628`'s real-transcript A/B ("19 $\rightarrow$ 1 aux calls, 196.5s $\rightarrow$ 39.6s").
3. **Prove the test can fail (fail-first / red-before)**: `v2rayN#10026` pastes failing-then-passing runs; `spec-kit#4340` "Verified the test fails without the fix"; `openclaw#128223` records "Red-before on current main: 1 failed, 17 passed"; `ECC#2693` embeds the full RED then GREEN run; `langflow#14834` describes adversarially deleting the key to watch both assertions fail; `langchain#39978`: "It fails on the current `master`".
4. **Honest scope statements ("what was deliberately not changed/not tested")**: `next.js#97480` "Six of thirteen write configurations came out as noise (p >= 0.05) and are omitted"; `n8n#37345`'s `## Not verified` ("No Playwright browser binaries are present in this environment"); `rustdesk#15830`'s `## Known limitations`; `dify#41490`'s `## Deliberately left alone` listing four conflicting open PRs; `kubernetes#141500` "it does not fix #141178".
5. **User-visible-behavior deltas surfaced neutrally**: `v2rayN#10027`'s `## One behaviour change worth naming`; `dify`'s "Behaviour notes" (422 vs 400); `open-webui#29037` names the commit that introduced the regression and why the naive revert would fail.
6. **Self-correction is a strength, not a weakness**: `MoneyPrinterTurbo#1263` writes "I initially wrote that the final mux truncates the narration... That is wrong... I want to withdraw it"; `gitignore#4741`'s "Happy to split this into two PRs..." disarms review friction.
7. **File-path precision and "why not the alternative"**: Node/Graphify/ECC reference `file.py:123` identifiers and treat rejected alternatives as part of the record (`ollama#18056`: "We are not adding a lease... We accept and document that narrow edge case").
8. **Proportionality**: Excellent small PRs are tiny but complete — `airbnb#2620` (one sentence + one code block), `immich#31080` (~40 words naming the wrong behavior and the rule fix), `shadcn#11715` (one sentence with root cause "the `new-york-v4` path 404s"), `public-apis#7112` (the qualification facts a reviewer needs, nothing else).
9. **Attribution and lineage**: `ytdl-org#33189` credits each back-ported commit to its yt-dlp author; `ECC#2869` preserves credit through consolidations; `agency-agents` closes with co-author lines; `Hack-with-Github#235` credits the original author of a cherry-pick.
10. **Help the reviewer navigate**: `PowerToys#50230`'s `## Reviewer guide` (suggested file order), `Graphify#1737`'s per-subsystem move list proving "verbatim moves, no import cycles", `trekhleb#2181`'s per-file role list, `kubernetes`'s `#### Special notes for your reviewer:` slot.

---

### Top 15 Corpus Exemplars & Runners-Up

1. [electron/electron#53174](https://github.com/electron/electron/pull/53174) — forensic root-cause narrative: regressing upstream Chromium CL, a packaged/unpackaged behavior matrix, hex error codes, and a stated exit plan, inside the standard template.
2. [openclaw/openclaw#130993](https://github.com/openclaw/openclaw/pull/130993) — 3,280-word forensic dossier: lettered root-cause subsections A–G, "Why previous fixes did not fix these failures", live-deployment proof (7/7), plus "What was not tested" and "Known follow-ups".
3. [langflow#14832](https://github.com/langflow-ai/langflow/pull/14832) — quantified Problem (per-flow measurement table), Trade-offs section, and an honest admission of its own regression ("The first push failed five shards... That was this PR's doing").
4. [vercel/next.js#97480](https://github.com/vercel/next.js/pull/97480) — What/Why-safe/Benchmarks with back-to-back measurement protocol and noise-level disclosures; invited 14 reviews.
5. [kubernetes#141500](https://github.com/kubernetes/kubernetes/pull/141500) — quotes the useless old error, shows the improved output, declares scope limits, and gives the exact verification command — inside the standard template.
6. [n8n-io/n8n#37304](https://github.com/n8n-io/n8n/pull/37304) — architecture-decision record in PR form: "Why now"/"Why not" counters, boundary section, quantified results table.
7. [Genymobile/scrcpy#6772](https://github.com/Genymobile/scrcpy/pull/6772) — a big feature as a living design doc: usage examples first, demo videos, named glitches, an 18-iteration PR history, and Supersedes/Fixes trailers.
8. [ohmyzsh#14033](https://github.com/ohmyzsh/ohmyzsh/pull/14033) — $+1 / -1$ shell fix with quoted code, the exit-status trap explained, two-path stub verification, and an explicit scope boundary.
9. [ggml-org/llama.cpp#26500](https://github.com/ggml-org/llama.cpp/pull/26500) — Goal/Bug/Fix/Test in $\sim 130$ words with a runnable reproduction gist and `Fixes` linkage.
10. [github/gitignore#4741](https://github.com/github/gitignore/pull/4741) — falsifiable claim proven with a runnable `git check-ignore -v` transcript, upstream source citations, ecosystem precedent, an explicit Scope section, and a split offer.
11. [obra/superpowers#1995](https://github.com/obra/superpowers/pull/1995) — full agent-aware template: submitter model/harness/human-reviewer metadata, alternatives considered, clean-room acceptance transcript, and a human-review attestation.
12. [nodejs/node#65406](https://github.com/nodejs/node/pull/65406) — mechanism-first prose (why the bug needs two Environments per isolate), named test and suites, and an explicit AI-authorship disclosure.
13. [rustdesk#15978](https://github.com/rustdesk/rustdesk/pull/15978) — root-cause-first with quantified waste ("$\sim 2900$ fork/exec per refresh... every 500 ms"), zero boilerplate.
14. [harry0703/MoneyPrinterTurbo#1263](https://github.com/harry0703/MoneyPrinterTurbo/pull/1263) — measurement table cross-checked with `ffprobe`, impact ranking, load-bearing regression test, and a public self-correction.
15. [microsoft/PowerToys#50230](https://github.com/microsoft/PowerToys/pull/50230) — every checklist item answered with N/A-rationale, validation tables with build IDs and SHAs, and a closing Reviewer guide for a $+3,519$-line change.

**Strong "small but perfect" runners-up worth imitating for tiny changes**:
- [public-apis/public-apis#7112](https://github.com/public-apis/public-apis/pull/7112)
- [airbnb/javascript#3229](https://github.com/airbnb/javascript/pull/3229)
- [mrdoob/three.js#34144](https://github.com/mrdoob/three.js/pull/34144)
- [EbookFoundation/free-programming-books#13422](https://github.com/EbookFoundation/free-programming-books/pull/13422)

---

### Anti-Patterns (Merged Anyway; Do Not Imitate)

- **Empty or near-empty descriptions merged (12 repos)**: `521xueweihan/HelloGitHub` (3/5 empty), `996icu` (4/5), `CS-Notes` (4/5), `yangshun` (3/5), `jlevy` (2/5), `jackfrued` (2/5), `ComfyUI` (2/5, both by the repo owner), `excalidraw` (2/5, both by a maintainer), `ollama` (1/5), `nilbuild/developer-roadmap` (the only human PR), `getify/You-Dont-Know-JS` (3-word bodies), `tensorflow` (2 copybara PRs whose body is literally `Automated Code Change`). Extremes: `jwasham#11`'s entire body is "Oops."; `open-webui` merged a PR whose body accidentally contains another PR's pasted title.
- **Unfilled/broken templates merged (15 repos)**: `AUTOMATIC1111` ("Nope." as the additional-notes answer, `[OS]` placeholders kept), `github/gitignore` (`_TODO_` placeholders visible), `f--prompts.chat` (#1230: 100% unfilled), `labuladong` (template untouched in #1610), `getify` (#1859 all fields blank, "I already searched" prompt ignored), `vue` (#13216: zero authored words), `TheAlgorithms` (#15109: 15 words for $+920 / -530$, unchecked type box that the keeper bot nominally gates on), `open-webui` (unfilled instructional prose kept), `PowerToys` (#50210: empty Detailed Description + leftover Closes placeholder), `kubernetes` (empty `Special notes` sections), `transformers` (#14276: only `Fixes #14268` inside $\sim 460$ words of scaffold), `three.js` (unfilled `Related issue: -`), `bootstrap` (Netlify `{your_pr_number}` placeholder), `vinta` (empty "Explain:"), `ui-ux-pro-max` (unchecked feature-branch box).
- **Pure bot bodies accepted as the whole description (7 repos)**: `firecrawl` (cubic in 4/5), `build-your-own-x` (CodeRabbit is the description in 2/5), `x1xhlol` (CodeRabbit = the substantive text in #476), `30-seconds-of-code` (Dependabot only), `microsoft/generative-ai-for-beginners` (5/5 bot), `nilbuild` (4/5 sync bots that never say what content changed), `tensorflow` (2/5 `Automated Code Change`).
- **Sloppy or duplicated titles merged (6 repos)**: `transformers` (duplicate word "job" in title), `codecrafters/build-your-own-x` ("unavalible" typo), `multica` (grammar slip kept), `AUTOMATIC1111` (89-char title stuffed with identifiers), `ytdl-org` (`[YouTube,etc]` with no summary; trailing "etc" x2), and exact-duplicate titles from fast iteration: `firecrawl` ("proxy more routes" x2) and `nilbuild` (two identical "chore: sync ... - r").
- **Unchecked test evidence merged**: `AutoGPT` merged PRs with the "tested my changes" items unchecked; `x1xhlol` merged unchecked test-plan boxes; `Hack-with-Github`'s checklist is a future-tense promise ("verify the next scheduled run") rather than evidence.

---

## Priority Matrix

| Priority | Impact | Effort | Risk | Focus Area |
|----------|--------|--------|------|-------------|
| **P0** | High | Low | Low | Commit coverage preservation, skeleton scaling |
| **P1** | High | Low | Medium | Prompt wording changes (P1.1-P1.7) |
| **P2** | Medium | Medium | Medium | Structural changes (P2.1-P2.6) |
| **P3** | High | High | High | Feature-level enhancements (out of scope) |

---

## Invariants (DO NOT BREAK)

- **Commit Coverage** stays mandatory at every diff size; tests assert the literal strings `"Commit Coverage"` and `"MUST cover every commit"` (`tests/pr-creation-prompt.ts:28`, `tests/full-coverage.ts:112`) and `test:coverage` enforces ≥90% coverage against a live test PR.
- **Diff-hunk anchor links** (`[[N]](diffhunk://...)`) remain — a differentiating feature; wording relaxes only for large diffs.
- **`tests/prompt.ts`** contains its OWN mirror of the prompt builders (lines ~78-137 re-implement the skeleton). Every prompt change in `src/` must be mirrored there, or the test suite silently tests stale prompts.
- **Line-append punctuations** in `SECTIONS_PROMPT` (string-array joins) — keep the file's existing style (strict lint: biome + oxlint + eslint sonarjs max-150-lines/file, max-50-lines/function).

---

## Success Metrics

- **Quality**: Generated PR descriptions match real-world patterns for target repositories.
- **Coverage**: ≥90% commit coverage maintained on all test PRs.
- **Template fidelity**: HTML comments, checkboxes, and boilerplate preserved byte-for-byte.
- **Length appropriateness**: Small diffs produce concise output (<50 words), complex diffs get comprehensive coverage.
- **Evidence quality**: Testing sections include verifiable commands and counts where possible.
- **Title convention fit**: Generated titles follow the repo's dominant convention family when inferable from commit messages (corpus split: 30 CC / 26 plain-imperative / 26 mixed / 7 scope-prefix / 5 bracketed — see Title Convention Distribution).

---

## Phase A — Prompt wording (P1.1-P1.7) - HIGH PRIORITY, LOW EFFORT

**Goal**: Implement corpus-aligned prompt wording changes based on 15 exemplars and 94-repo patterns.

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
**Evidence**: 42/94 repos prefer S-length; `airbnb#2620`, `immich#31080`, `shadcn#11715` exemplars. Guardrail: corpus shows NO diff-size $\leftrightarrow$ length correlation (`next.js` merged $-5,139$ lines in one paragraph; `kubernetes` did $+4,879 / -13,225$ in $\sim 15$ words) — the "+50 lines" heuristic is a soft preference, and Phase E3 must confirm complex-but-small-diff PRs keep depth.

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
**Evidence**: `ohmyzsh#14033`, `nodejs/node#65406`, `v2rayN#10027` exemplars; 16 repos with Problem sections.

#### A3. P1.2 - Convert Breaking Changes to conditional rule
**Files**: `src/background/prompts/common.ts:28-29` (remove), `src/background/prompts/combined.ts` and `src/background/prompts/pr-prompts.ts` (add rule)
**Change**:
- Remove `## Breaking Changes` section from skeleton
- Add rule: `"Only if the diff genuinely breaks API/behavior (removed exports, renamed functions, changed contracts), add a ## Breaking Changes section with diff hunk references; otherwise do not create the section. When the diff proves there are no behavior changes, you may state that in one sentence inside Summary instead.\n"`
**Evidence**: Only `open-webui` and `vue` have breaking change template fields (both usually N/A); most repos reassure "no behavior change".

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
**Evidence**: `PowerToys#50230` ("40/40 passed"), `hello-algo#1959` ("56/56 tests"), `langflow` quantified results.

**Optional extension** (synthesis trait #3, "prove the test can fail"): when the diff adds a regression test, the strongest merged PRs also show red-before/fail-first runs — `v2rayN#10026` (failing-then-passing), `spec-kit#4340` ("Verified the test fails without the fix"), `ECC#2693` (RED then GREEN run), `openclaw#128223` ("Red-before on current main: 1 failed, 17 passed"), `langflow#14834` (adversarially deleting the key). Keep this out of the base wording until E3 confirms it doesn't inflate small-PR output.

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
**Evidence**: `freeCodeCamp` template bakes `Closes #N`; `kubernetes` prefers "Part of"; 67 repos show zero closing keywords.

#### A6. P1.4 - Strengthen template fidelity (TEMPLATE-GATED REPOS)
**Files**: `src/background/prompts/common.ts:11`, `src/background/prompts/combined.ts:9-10`, `src/background/prompts/pr-prompts.ts:39-41`
**Change**:
```typescript
// From:
"Respect its structure — keep its headers, fill in its sections, and do not remove any existing content:\n\n"
// To:
"Respect its structure completely — keep every header, HTML comment (<!-- ... -->), checkbox, footer, and boilerplate sentence byte-for-byte; only fill in the sections. Do not delete, reorder, or reword template text. Output the full template with all existing content preserved, plus your additions:\n\n"
```
**Evidence**: `kubernetes`, `llama.cpp`, `yt-dlp` preserve ALL boilerplate; `yt-dlp` closes PRs without template.

#### A7. P1.5 - Forbid bot signatures (ANTI-AI PROTECTION)
**Files**: Add to RULES blocks in `src/background/prompts/combined.ts` and `src/background/prompts/pr-prompts.ts`
**Change**: Add rule: `"Do NOT imitate bot output: no 'Summary by <tool>' headings, badge images, mermaid diagrams, confidence scores, HTML comment markers like <!-- ... --> you invented, or sign-off footers. No emoji unless the existing template uses them.\n"`
**Evidence**: 8 repos accept bot blocks; 2 repos (`yt-dlp`, `ripienaar/free-for-dev`) ban AI text outright.

#### A8. P2.3 - Flexible title style (REPO-SPECIFIC CONVENTIONS)
**Files**: `src/background/prompts/combined.ts:16`, `src/background/prompts/pr-prompts.ts:14-16`, `src/background/prompts/merge-prompts.ts:28`
**Change**: Replace hard conventional commit requirement: `"Match the repo's title style if inferable from commit messages in this prompt (e.g. 'subsystem: verb', '[Area]', conventional commits); otherwise default to conventional commits. Under 72 characters. No quotes, no markdown, no prefix like 'Title:'.\n"`
**Evidence**: Only 30/94 repos use strict CC — full split: CC 30, plain-imperative 26, mixed 26, scope/area-prefix 7 (`nodejs`, `kubernetes`, `llama.cpp`, `vscode`, `PowerToys`, `three.js`, `ollama`), bracketed 5 (`react`, `react-native`, `tensorflow`, `youtube-dl`, `yt-dlp`). CC dominance concentrates in repos whose release notes are title-generated (`electron`, `immich`, `n8n`, `excalidraw`); scope prefixes cluster where the PR title becomes the squash-merge commit (`nodejs`, `llama.cpp`, `vscode`, `kubernetes`).

#### A9. P2.4 - Scale anchor usage (DIFF-SIZE AWARE)
**Files**: Update RULES blocks in `src/background/prompts/combined.ts` and `src/background/prompts/pr-prompts.ts`
**Change**: Modify anchor requirement: `"For large diffs (many files), focus on substantive claims about files and include anchors for the most important files only. For small diffs, maintain the current 'every file mentioned' rule."`
**Evidence**: Prevents anchor spam on 30-file PRs; maintains differentiator while reducing noise.

#### A10. P2.5 - No fabrication rule (ANTI-HALLUCINATION)
**File**: `src/background/prompts/common.ts:1-12`
**Change**: Add to `SYSTEM_PROMPT`: `"Never fabricate CI run IDs, SHAs, reviewer names, reviewers' checklist outcomes, or issue numbers. When filling templates, only mark checkboxes checked if the diff provides evidence."`
**Evidence**: Prevents rubber-stamped checklists (`AutoGPT`/`x1xhlol` anti-pattern).

#### A11. P2.2 - Explicit Scope & Non-Goals Statements (Trait #4)
**Files**: RULES blocks in `src/background/prompts/combined.ts` and `src/background/prompts/pr-prompts.ts`
**Change**: Add rule: `"- When relevant, explicitly state what was deliberately NOT changed, left as-is, or not verified (e.g. 'Not verified: integration tests requiring external credentials') to establish clear review boundaries.\n"`
**Evidence**: 12 repos systematically name non-goals (`markitdown`, `dify`, `n8n`, `Graphify`, `openclaw`, `rustdesk`).

#### A12. Anti-Pattern Guardrails (Anti-Empty, Anti-Placeholder, Anti-Identifier Sprawl)
**Files**: RULES blocks in `src/background/prompts/combined.ts` and `src/background/prompts/pr-prompts.ts`
**Change**: Add rules:
```typescript
"- Never output an empty description or leave template placeholders (like '_TODO_', '{your_pr_number}', or empty stubs) in the output. Replace every placeholder with real content or an explicit 'N/A: <reason>'.\n",
"- Titles must describe the intent of the change, not enumerate raw file names or lists of identifiers.\n"
```
**Evidence**: Eliminates the 5 major anti-patterns documented across 15+ corpus repos.

---

## Phase B — Two-mode existing-body handling (P2.5) - MEDIUM PRIORITY, MEDIUM EFFORT

**Goal**: Distinguish between template boilerplate and authored content to avoid overwriting user prose.

**Corpus basis**: the author-role gradient — maintainers merge their own one-liners while external contributors write full packets (`excalidraw`, `react`, `shadcn-ui`, `transformers`, `langchain`, `ComfyUI`, `immich`). Overwriting a maintainer's one-liner with a 7-section essay is a regression, which is why detection (B1) must be conservative and default to light-touch completion when unsure.

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
**Evidence**: Template repos carry invisible HTML comments (`kubernetes`, `bootstrap`, `nodejs`, `rust-lang`, `f--prompts.chat`, `open-webui`), checkboxes (`freeCodeCamp`, `yt-dlp`, `PowerToys`), and multi-header scaffolds — corpus split: 30 template-gated, 10 bypassed, 54 no-template (20 with author-level scaffolds, 34 freeform).

#### B2. Implement conditional body handling (REPO-SPECIFIC LOGIC)
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
**Evidence**: `ohmyzsh` has template + authored prose; `PowerToys` has template + checklist filling.

#### B3. Update test mirror (COMPREHENSIVE COVERAGE)
**File**: `tests/prompt.ts`
**Change**: Add test cases for:
- Template detection with various repo patterns (`kubernetes`, `yt-dlp`, `freeCodeCamp`).
- Conditional handling logic for template vs authored content.
- Edge cases (minimal templates, mixed content).

---

## Phase C — Corpus-derived repo profiles (P2.6 extension) - MEDIUM PRIORITY, HIGH EFFORT

**Goal**: Leverage corpus data to provide repo-specific guidance without requiring user configuration.

### Tasks:

#### C1. Generate repo profiles from corpus (DATA-DRIVEN)
**File**: Create `src/background/repo-profiles.ts`
**Process**: 
- Seed from the SYNTHESIS appendix (94-row per-repo index: dominant pattern / template? / length bucket).
- Subagent reads all 94 `patterns.md` files + synthesis appendix.
- Promote a repo to a profile only where the per-repo `patterns.md` confirms the appendix row (guards against the $n=5$ sampling bias).
- Generates typed map for repos with clear evidence only.
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
**Files**: Update `src/background/prompts/combined.ts`, `src/background/prompts/pr-prompts.ts`, `src/background/prompts/merge-prompts.ts`
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
**Files**: `src/background/handlers/generate.ts:54`, `src/background/handlers/title.ts:47`, `src/background/handlers/description.ts:50`
**Change**: Pass `branchContext.owner/repo` to prompt builders.
**Evidence**: Extract from existing `summary.ts:5-19` branch context.

#### C4. Update test mirror (PROFILE COVERAGE)
**File**: `tests/prompt.ts`
**Change**: Add profile-based context tests for key exemplar repos.

---

## Phase D — Output hardening in `parse.ts` (P3.1) - MEDIUM PRIORITY, LOW EFFORT

**Goal**: Strip LLM-hallucinated bot signatures from generated descriptions.

### Tasks:

#### D1. Implement bot signature detection and removal (COMPREHENSIVE PATTERNS)
**File**: `src/background/parse.ts`
**Change**: Update `parseCombinedResponse` and `parseDescriptionOnlyResponse` functions.
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

**Corpus anatomy** (SYNTHESIS "Bot-generated descriptions") — what these regexes target: appended AI-summary blocks share a uniform structure of HTML comment marker $\rightarrow$ `## Summary by <tool>` $\rightarrow$ category bullets (`**Bug Fixes**`, `**Documentation**`) $\rightarrow$ footer/badge, seen verbatim in `f--prompts.chat`, `build-your-own-x`, `x1xhlol`, `langflow`, `rustdesk` (CodeRabbit + Greptile confidence scores and mermaid), `n8n` (cubic), `superpowers`, `firecrawl`. Additional machine artifacts worth a pattern: copyberry `<!-- copyberry-projection-id -->` footers (`openai/codex`), trop `Backport of #N` bodies (`electron`), copybara `Automated Code Change` (`tensorflow`). Scope limit: strip only hallucinated blocks from LLM output — never strip real template boilerplate, which is exactly what P1.4/B1 protect.

#### D2. Apply conservative stripping (PRESERVATION LOGIC)
**Implementation**: Apply patterns in `parseDescriptionOnlyResponse` after existing logic.
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
- CodeRabbit signatures (`## Summary by CodeRabbit`).
- Cubic badges (`**Bug Fixes**` bullets).
- General AI footers (`Generated with Claude`).
- Template preservation (`kubernetes` HTML comments).
- Anti-patterns (`AutoGPT` checklists, `x1xhlol` unchecked boxes).

---

## Phase E — Verification and Quality Assurance - HIGH PRIORITY, MEDIUM EFFORT

**Goal**: Ensure all changes work correctly and maintain backward compatibility.

### Tasks:

#### E1. Automated verification (SAFETY NET)
**Commands** (after each change):
- `bun run typecheck && bun run lint` (and `bun run quality` if quick).
- Mirror check: diff `tests/prompt.ts` against `src/` prompt text.
- Run `bun run test:pr-creation` to confirm prompt structure.
- Attempt `bun run test:coverage` — report unverified if LLM endpoint unreachable.

#### E2. Regression testing (COVERAGE ASSERTIONS)
**File**: `tests/pr-creation-prompt.ts`
**Add assertions** for new behaviors:
- Small-diff wording present (A1).
- Template fidelity wording present (A6).
- Bot signature stripping works (D1).
- Title style flexibility works (A8).
- Root cause first for bug fixes (A2).

#### E3. Exemplar validation (CORPUS-DRIVEN TESTING)
**Manual testing** with 3 key exemplars from corpus:
1. **kubernetes/kubernetes#141500** - Template fidelity test
   - Verify template preservation (HTML comments, checkboxes).
   - Check subsystem-prefix title generation.
   - Confirm extremely terse prose for large diffs.

2. **ohmyzsh/ohmyzsh#14033** - Root cause + small PR test
   - Verify root cause first instruction.
   - Check AI disclosure requirement.
   - Confirm template + prose handling.

3. **microsoft/PowerToys#50230** - Evidence + large PR test
   - Verify evidence-based testing section.
   - Check area-prefix title generation.
   - Confirm comprehensive validation tables.

**Scoring criteria**:
- Treatment reproduces real PR's evidence style.
- Length within $\sim 1.5\times$ of real body for repo's length bucket.
- Template case: zero boilerplate bytes lost.
- Anchors resolve and commit coverage maintained (≥90% maintained).

**Proportionality spot-check** (SYNTHESIS "small but perfect" runners-up): for tiny diffs, additionally compare output against `public-apis#7112`, `airbnb/javascript#3229`, `mrdoob/three.js#34144`, `EbookFoundation/free-programming-books#13422` — treatment should land in the S bucket without dropping Commit Coverage. This directly exercises A1's scaling instruction.

#### E4. Anti-pattern validation (REGRESSION PREVENTION)
**Test against corpus anti-patterns**:
- Empty descriptions (12 repos): ensure we don't generate empty output.
- Unfilled templates (15 repos): ensure we fill placeholders appropriately.
- Bot signatures (7 repos): ensure we strip hallucinated content.
- Sloppy titles (6 repos): ensure we generate clean titles.

#### E5. Documentation update (USER GUIDANCE)
**File**: `README.md`
**Add**: Brief usage note ($\sim 6$ lines) about:
- Profile/convention awareness.
- Changed description style (shorter for small diffs).
- Template preservation.
- Evidence-based testing.

---

## Risk Assessment & Mitigation

### High-Risk Items (Corpus-Validated)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Template content loss** | Medium | High | Conservative regex patterns; extensive testing with `kubernetes`/`llama.cpp`/`yt-dlp` templates; preserve all HTML comments and checkboxes |
| **Commit coverage regression** | Low | High | Maintain ≥90% test gate; explicit assertions in test suite; corpus shows this is a key differentiator |
| **Title convention mismatch** | Medium | Medium | Fallback to conventional commits; gradual rollout with exemplar testing; 30/94 repos use strict CC |
| **Token bloat** | Medium | Medium | Profile-based length scaling; monitor for large template echo (`kubernetes` template is 400+ words) |

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
| **Small-n overfit** | Medium | Medium | $n=5$ per repo; treat all counts as directional; a repo enters Phase C profiles only when its `patterns.md` confirms the appendix row |
| **Recency skew** | Medium | Low | Samples are mostly 2026 merges with some 2015–2024 drive-bys; conventions drift — spot-check house style before shipping a profile |
| **Top-starred skew** | Medium | Medium | $\sim 20$ repos are curated lists/docs whose one-line PRs anchor the S bucket; weight code repos higher when calibrating length expectations |
| **Bot-stream skew** | Low | Medium | Huge repos' merged streams can be bot-dominated (`generative-ai-for-beginners` 5/5, `flutter` autoroller); exclude bot PRs from human-style calibration |
| **Diff-size heuristic misfire** | Medium | Medium | Corpus shows no diff-size $\leftrightarrow$ length correlation (`next.js` $-5,139$ lines in one paragraph; `v2rayN`'s longest PR is $+82 / -2$); A1's small-diff rule is a preference, and E3 validates depth survives on small-but-risky diffs |
| **Language-barrel miss** | Low | Low | $\sim 6$ Chinese-title repos and one bilingual template (`cc-switch`); prompt wording stays language-neutral and mirrors commit-message language |

### Quality Gates (Corpus-Aligned)

- **Automated**: All existing tests must pass, typecheck/lint clean.
- **Manual**: Exemplar testing against 3 key repositories from corpus.
- **Performance**: No significant increase in token usage for typical cases.
- **Compatibility**: Existing behavior preserved for repos without profiles.
- **Template fidelity**: Zero bytes lost for `kubernetes`/`llama.cpp`/`yt-dlp` templates.

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

---

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
- Template fidelity maintained for key repositories (`kubernetes`, `yt-dlp`, `ohmyzsh`)
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

---

## Out of scope

- Popup UI for a brief/full mode toggle and other P3 UI items — only config-free behaviors ship in this round
- A/B protocol against exemplar repos (recommendations §Validation plan) — requires a working LLM config; can be a follow-up once P1 lands
- Real-time LLM endpoint configuration UI — remains in existing settings
- Advanced corpus analysis (sentiment analysis, change impact scoring) — beyond prompt scope

---

## Appendix: Master 94-Repository Corpus Classification Index

| Repo | Dominant pattern | Template? | Length |
|---|---|---|---|
| 2dust--v2rayN | CC titles; evidence-essay bodies | no | L |
| 521xueweihan--HelloGitHub | plain titles, mostly empty body | no | S |
| 996icu--996.ICU | mixed titles; title-only PRs | no | S |
| affaan-m--ECC | CC; audit-trail sections | partial | L |
| airbnb--javascript | mixed CC/plain; terse | no | S |
| anomalyco--opencode | CC; Summary/Testing | informal | M |
| anthropics--claude-code | mixed; Summary/Test plan scaffold | partial | M |
| anthropics--skills | "Add X skill"; fixed 4-part essays | informal | L |
| AUTOMATIC1111--stable-diffusion-webui | mixed; Description/Checklist template | yes | M |
| avelino--awesome-go | "Add X"; CI compliance checklist | yes | S |
| Chalarangelo--30-seconds-of-code | Dependabot bump PRs | no | BOT |
| clash-verge-rev--clash-verge-rev | CC; Closes + video evidence | no | S |
| codecrafters-io--build-your-own-x | plain; minimal, CodeRabbit adds | no | S |
| Comfy-Org--ComfyUI | mixed; owner-empty bodies | partial | S |
| CyC2018--CS-Notes | Chinese plain; empty bodies | no | S |
| d3--d3 | mixed; one-paragraph what/why | no | S |
| DietrichGebert--ponytail | CC; Problem→Fix→Verification | informal | M |
| donnemartin--system-design-primer | plain link-fix sentences | no | S |
| EbookFoundation--free-programming-books | "Add X" + compliance disclosure | informal | M |
| electron--electron | CC; template + `Notes:` trailer | yes | M |
| excalidraw--excalidraw | CC; maintainer-empty vs contributor-full | no | M |
| farion1231--cc-switch | CC; bilingual checklist | partial | M |
| firecrawl--firecrawl | CC; cubic bot descriptions | no | S |
| flutter--flutter | autoroller + one human template | yes | M |
| f--prompts.chat | plain; optional template + CodeRabbit | yes | S |
| freeCodeCamp--freeCodeCamp | CC; checklist + `Closes #` | yes | S |
| garrytan--gstack | version-prefixed CC; ship receipt | informal | L |
| Genymobile--scrcpy | plain imperative; depth scales | no | M |
| getify--You-Dont-Know-JS | inconsistent; tiny | partial | S |
| ggml-org--llama.cpp | `scope: fix`; Overview/Requirements | yes | M |
| github--gitignore | plain; Reasons/Links template | yes | M |
| github--spec-kit | CC; template + AI disclosure | partial | M |
| godotengine--godot | plain "Fix X"; 2-section template | yes | M |
| Graphify-Labs--graphify | CC; audit-style sections | no | L |
| Hack-with-Github--Awesome-Hacking | mixed; very terse | no | S |
| harry0703--MoneyPrinterTurbo | CC/plain; Summary+test evidence | informal | M |
| huggingface--transformers | mixed; big template, thin fills | yes | S |
| immich-app--immich | CC; template + LLM disclosure | yes | S |
| iptv-org--iptv | dated batch titles; minimal | no | S |
| jackfrued--Python-100-Days | Chinese freeform; casual | no | S |
| jlevy--the-art-of-command-line | freeform one-liners, some empty | no | S |
| justjavac--free-programming-books-zh_CN | Chinese verb-first; method+audit bullets | informal | S |
| krahets--hello-algo | plain; Summary/Validation pair | informal | M |
| kubernetes--kubernetes | `subsystem: verb`; canonical template | yes | S |
| labuladong--fucking-algorithm | mixed; before/after blockquotes | partial | S |
| langchain-ai--langchain | CC; maintainers one-liners | no | M |
| langflow-ai--langflow | CC; Problem→Fix→Trade-offs essays | informal | L |
| langgenius--dify | CC; Summary/Verification rigor | informal | M |
| mattpocock--skills | mixed; Claude Code scaffold | informal | M |
| microsoft--generative-ai-for-beginners | bot CC titles; no human PRs | no | BOT |
| microsoft--markitdown | mixed; bespoke technical prose | no | M |
| microsoft--PowerToys | `[Area]`/`area:` prefix; big template | yes | M |
| microsoft--vscode | `area:` prefix; What changed/Validation | informal | S |
| mrdoob--three.js | `Component:` prefix; link+Description | informal | S |
| msitarzewski--agency-agents | mixed; Summary/Verification + credits | informal | M |
| multica-ai--andrej-karpathy-skills | "Add X"; emergent Summary/Changes | informal | S |
| n8n-io--n8n | CC + `(no-changelog)`; 4-part template | yes | M |
| nextlevelbuilder--ui-ux-pro-max-skill | CC; What/Why/Checklist | yes | M |
| nilbuild--developer-roadmap | bot sync titles; human body empty | no | BOT |
| nodejs--node | `subsystem: verb`; freeform prose | no | M |
| NousResearch--hermes-agent | CC + salvage refs; quantified tables | informal | L |
| obra--superpowers | mixed; agent-aware mega-template | yes | L |
| ohmyzsh--ohmyzsh | CC; template + root-cause prose | yes | L |
| ollama--ollama | scope prefix or terse; freeform | no | S |
| openai--codex | plain; machine Why/What/Testing triad | informal | M |
| openclaw--openclaw | CC; enforced 4-section template | yes | L |
| open-webui--open-webui | CC type-only; heavy CLA template | yes | L |
| ossu--computer-science | plain; tiny | no | S |
| practical-tutorials--project-based-learning | plain; template optional | partial | S |
| public-apis--public-apis | "Add X"; 9-item checklist | yes | S |
| react--react-native | `[version]` prefix; 3-section template | yes | M |
| react--react | `[Area]` prefix; optional template | partial | M |
| ripienaar--free-for-dev | "Add X"; mandatory anti-AI checklist | yes | S |
| rustdesk--rustdesk | CC; freeform + bot appendix | no | M |
| rust-lang--rust | plain; comment-only template, prose | no | S |
| shadcn-ui--ui | CC; universal `### Description` | informal | S |
| Shubhamsaboo--awesome-llm-apps | mixed; what/why/validation | informal | M |
| Significant-Gravitas--AutoGPT | CC; Why/What/How + checklist | yes | M |
| sindresorhus--awesome | plain; submission checklist template | yes | S |
| Snailclimb--JavaGuide | mixed bilingual; tiny | no | S |
| tensorflow--tensorflow | `[Area]` prefix vs sync bots | no | S |
| TheAlgorithms--Python | mixed; bot-gated checklists | yes | S |
| trekhleb--javascript-algorithms | CC; problem/evidence/verification | informal | M |
| trimstray--the-book-of-secret-knowledge | "Add X"; one-line pitch | no | S |
| twbs--bootstrap | plain; contributor-facing template | yes | M |
| ultraworkers--claw-code | CC; commands-centric Verification | partial | M |
| vercel--next.js | mixed; author-specific shapes | no | M |
| vinta--awesome-python | "Add X"; tier/displacement template | yes | M |
| vuejs--vue | mixed; checkbox template, thin fills | yes | S |
| x1xhlol--system-prompts-and-models-of-ai-tools | plain; CodeRabbit-dominant | no | S |
| yangshun--tech-interview-handbook | mixed; mostly empty bodies | no | S |
| ytdl-org--youtube-dl | `[Area]` brackets; collapsed template | yes | M |
| yt-dlp--yt-dlp | `[area]` prefix; mandatory anti-AI template | yes | S |
