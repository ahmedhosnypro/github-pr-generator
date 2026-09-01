# Cross-Repo PR Description Synthesis

Across 94 of the most-starred GitHub repositories (470 recently merged PRs, 5 per repo), merged PR descriptions split into three cultures: **(1) evidence-driven engineering write-ups** — a minority of mostly code repos where a Summary/Problem → Changes → Verification arc with quoted commands, pass counts, and honest scope limits is the norm; **(2) template-gated compliance** — roughly a quarter of repos enforce a checklist/scaffold (freeCodeCamp, Kubernetes, llama.cpp, PowerToys, open-webui, yt-dlp, ripienaar/free-for-dev…) where the description is largely boilerplate plus a short authored core, and quality hinges on whether authors fill it honestly; and **(3) title-only pragmatism** — nearly half the corpus is freeform, and in content/huge-list repos merged bodies are routinely one line or empty (HelloGitHub: 3/5 empty; CS-Notes: 4/5; 996icu: 4/5; yangshun: 3/5). Bot automation is a major force at both ends: Dependabot/Renovate/backport/sync bots own entire PR streams, CodeRabbit/cubic summary blocks are merged as-is in 8 repos, and disclosed AI-authored descriptions with human attestation pass review in ~12 repos — while 2 repos (yt-dlp, ripienaar/free-for-dev) explicitly *ban* AI-written PR text in their templates. The most consistent mergeable-quality signal is not structure but evidence: everything maintainers praise and merge fast — root cause first, commands that reproduce, counts that quantify, and explicit statements of what was *not* changed or tested — compresses review into the description instead of the comment thread.

## Sample

- **94 repositories**, each with a per-repo report at `analysis/pull-requests/<owner>--<repo>/patterns.md`; **470 merged PRs** (5 per repo). Six repos are excluded: `awesome-selfhosted`, `deepseek-ai/deepseek-harness`, `DigitalPlatDev/FreeDomain`, `massgravel/Microsoft-Activation-Scripts`, `torvalds/linux` (zero merged PRs) and `golang/go` (one trivial merged PR).
- **Known biases**, reported per-repo and visible throughout:
  - *5-PR share*: n=5 per repo; many reports flag single-author dominance (e.g. v2rayN, ollama, openai/codex, hello-algo all 5/5 one author), same-day merge batches, and narrow time windows.
  - *Recency skew*: samples come from recently-merged PRs, mostly 2026; some repos instead surfaced 2015–2024 drive-bys (Vue, airbnb, getify, jlevy).
  - *Top-starred skew*: the corpus over-represents curated lists/docs repos (≈20: awesome-*, free-programming-books, CS-Notes, JavaGuide…), whose PRs are one-line submissions — versus big codebases.
  - *Change-type skew*: the merged stream of huge repos is dominated by dependency/sync bots (microsoft/generative-ai-for-beginners: 5/5 bot; Chalarangelo/30-seconds-of-code: 4/5 Dependabot; flutter: 4/5 autoroller; nilbuild/developer-roadmap: 4/5 sync bot), which thins the human-writing signal.
  - *Language mix*: English-dominant, with Chinese-heavy clusters (clash-verge-rev, CS-Notes, justjavac, JavaGuide, Python-100-Days, 996icu) and one bilingual-template repo (farion1231/cc-switch).

## Title conventions

Counting each repo by its **dominant** observed convention (94 repos):

| Convention | Repos | Example repos | Representative titles |
|---|---|---|---|
| True Conventional Commits `type(scope):` dominant | **30** | v2rayN, ECC, anomalyco/opencode, clash-verge-rev, excalidraw, cc-switch, freeCodeCamp, langchain, langflow, dify, n8n, ohmyzsh, openclaw, rustdesk, github/spec-kit, DietrichGebert/ponytail, electron, shadcn-ui/ui, trekhleb, Graphify, AutoGPT, hermes-agent, ui-ux-pro-max, firecrawl, open-webui, garrytan/gstack (version-prefixed variant), immich, ultraworkers/claw-code, microsoft/generative-ai-for-beginners (bot), nilbuild/developer-roadmap (bot) | `fix(hysteria2): default the port to 443 when the share URI omits it`; `perf(backend): cache redundant active-subscription lookups`; `refactor(editor): Extract the frontend test helpers into @n8n/frontend-test-utils (no-changelog)` |
| Plain imperative sentence, no prefix | **26** | scrcpy, bootstrap, nodejs-adjacent docs repos, public-apis, vinta/awesome-python, ripienaar/free-for-dev, awesome-go, build-your-own-x, system-design-primer, free-programming-books, jwasham, 521xueweihan, ossu, Godot ("Fix X" style), openai/codex (machine), rust-lang/rust, markitdown, anthropics/skills | `Add flex display support (resizable virtual display)`; `Remove the breadcrumb bottom margin`; `Add Aquanode API`; `Fix crash when setting the root Viewport's World3D to null` |
| Mixed / no dominant convention | **26** | airbnb, huggingface/transformers, vercel/next.js, d3, TheAlgorithms/Python, vuejs/vue, ComfyUI, kubernetes-independent cases, A1111, Shubhamsaboo, Snailclimb/JavaGuide, agency-agents, MoneyPrinterTurbo | `fix: flash-attn fallback failing on torch2.13` merges next to `Avoid print to stdout that fails the job…` in the same repo |
| Scope/area prefix, no type (`subsystem:` / `area:`) | **7** | nodejs/node, kubernetes, ggml-org/llama.cpp, microsoft/vscode, microsoft/PowerToys, mrdoob/three.js, ollama | `zlib: avoid waiting for paused ZIP iterators`; `ggml : fix ggml_backend_buft_get_alloc_size() guard`; `sessions: Show chat status on its own row` |
| Bracketed area/version prefix `[Area]` / `[version]` | **5** | react, react-native (`[0.86]`), tensorflow (`[XLA:CPU]`), ytdl-org/youtube-dl, yt-dlp | `[DOM] Copy \`source\` onto the synthetic toggle event`; `[ie/applepodcasts] Fix token caching`; `Roll Skia from 3ae8e3d1e335 to ce359c7fbfe6 (1 revision)` |

Notes: Conventional Commits correlates strongly with repos whose release notes are generated from titles (electron, immich, n8n, excalidraw). Scope-only prefixes cluster in repos where the PR title becomes the squash-merge commit message (nodejs, llama.cpp, vscode, kubernetes). Chinese-language titles appear in ~6 repos. Only microsoft/generative-ai-for-beginners and nilbuild/developer-roadmap have fully machine-generated title streams.

## Section-name frequency

Repo counted once per normalized header family when that header recurs (in ≥2 PRs or as the report's dominant scaffold):

| Normalized section family | Repos | Example repos / exact variants |
|---|---|---|
| Summary / Overview / What changed / What this PR does | **29** | anomalyco/opencode (`## Summary`), cc-switch, microsoft/vscode (`## What changed`), n8n, langflow, mattpocock/skills, hello-algo, openai/codex (`## What changed`), tensorflow community PRs, PowerToys (`## Summary of the Pull Request`), kubernetes (`#### What this PR does / why we need it:`), excalidraw, flutter (`## Summary`), hermes-agent |
| Test plan / Testing / Validation / Verification / How Has This Been Tested | **27** | 2dust/v2rayN (`## Testing`), ECC (`## Validation`), cc-switch, langgenius/dify (`## Verification`), ohmyzsh, openclaw (`## Evidence`), open-webui (`## Testing`), immich (`## How Has This Been Tested?`), ultraworkers/claw-code (`## Verification`), microsoft/vscode (`## Validation`), anthropics/skills (`## How we know it works`) |
| Checklist (template checkboxes as a section) | **27** | freeCodeCamp, ohmyzsh (`## Standards checklist:`), public-apis, ripienaar/free-for-dev (`## Requirements`), yt-dlp, ytdl-org, TheAlgorithms/Python, vinta, AutoGPT (`### Checklist 📋`), PowerToys (`## PR Checklist`), open-webui, immich, avelino/awesome-go, vue |
| Problem / Why / Motivation / Root cause | **16** | DietrichGebert/ponytail (`## Problem`/`## Root Cause`), Graphify, trekhleb, langflow (`## Problem` → `## Root cause`), awesome-llm-apps, ultraworkers/claw-code, vercel/next.js (`### Why?`), tensorflow community PRs (`## Problem`), spec-kit, d3, MoneyPrinterTurbo, anthropics/skills (`## Why now`) |
| Scope / Non-goals / Limitations / "not changed / not tested" | **12** | markitdown (`## Deliberately not changed`), rustdesk (`## Known limitations`), dify (`## Deliberately left alone`), openclaw (`## What was not tested`), n8n (`## Not verified`), Graphify (`## Left as-is (intentionally)`), v2rayN (`## One behaviour change worth naming`), github/gitignore (`### Scope`) |
| Changelog / Release notes entry | **4** | electron (`#### Release Notes` + clerk `Notes:` trailer), open-webui (Keep-a-Changelog `### Added/### Fixed/### Breaking Changes`), react-native (`## Changelog:` `[INTERNAL] [FIXED] - …`), n8n (`(no-changelog)` trailer convention) |
| Screenshots / Demo / Visual proof | **4** | open-webui (`### Screenshots or Videos` + Before/After tables), immich (`## Screenshots`, Before/After H3s), AUTOMATIC1111 (`## Screenshots/videos:`), openclaw (`## Visual proof` with `**What this shows:**` captions) |
| Breaking-change callout | **3** | open-webui (`### Breaking Changes`, usually N/A), vue (`Does this PR introduce a breaking change?` checkbox), react-native (changelog `[BREAKING]` slot — not exercised in sample) |
| Type-of-change selector | **6** | kubernetes (`#### What type of PR is this?` + `/kind`), vue (`What kind of change does this PR introduce?` checkboxes), transformers (`## Before submitting`), ytdl-org (`What is the purpose…` checkboxes), f--prompts.chat (`## Type of Change`), avelino/awesome-go (submission-class items) |
| Prior-art / supersession notes | **5** | obra/superpowers (`## Existing PRs` duplicate-search evidence), NousResearch/hermes-agent (`salvage #N` in titles), yt-dlp (no), youtube-dl (yt-dlp back-port citations), ComfyUI (`A PR like #8464`), public-apis duplicate checks |

Standout: hand-written `## Summary` is effectively the universal opener when no template exists — but "Summary" means radically different things per repo (3-word bullets in openai/codex; a 3-paragraph causal narrative in langflow).

## Template usage

Real counts over the 94 reports:

- **Repo template present and broadly used: 30 repos** — electron, freeCodeCamp, ggml-org/llama.cpp, github/gitignore, huggingface/transformers, immich, microsoft/PowerToys, n8n, ui-ux-pro-max, ohmyzsh, openclaw, open-webui, avelino/awesome-go, f--prompts.chat, public-apis, react-native, ripienaar/free-for-dev, obra/superpowers, TheAlgorithms/Python, vinta, ytdl-org, yt-dlp, bootstrap, flutter, AUTOMATIC1111, godot, kubernetes, vuejs/vue, sindresorhus/awesome.
- **Template exists but is bypassed/ignored/minimally filled: 10** — ECC, anthropics/claude-code, cc-switch, spec-kit, ComfyUI, react, project-based-learning, ultraworkers/claw-code, labuladong/fucking-algorithm, getify/You-Dont-Know-JS.
- **No repo template (54)**, of which **20 show strong recurring personal/author-level scaffolds** — anomalyco/opencode, anthropics/skills, mattpocock/skills, microsoft/vscode, DietrichGebert/ponytail, langflow, dify, Graphify, hermes-agent, garrytan/gstack, hello-algo, three.js, msitarzewski/agency-agents, multica, Shubhamsaboo, trekhleb, justjavac, MoneyPrinterTurbo, EbookFoundation/free-programming-books (compliance/disclosure convention), shadcn-ui (universal `### Description`) — and **34 are genuinely freeform** (including the 3 bot-stream-dominated repos).

The canonical template skeleton that emerges across repos:

```
## Summary / Description            <- what this PR does
## (What problem / Why / Motivation) <- optional in small PRs
## How Has This Been Tested? / Validation / Test plan
## Screenshots (UI repos; Often Before/After)
## Checklist:                        <- read CONTRIBUTING; tested locally; code style;
   - [x] no unrelated changes; docs updated; (increasingly:) AI-use disclosure
Closes #XXXXX
```

Boilerplate an AI generator should know about:
- **Invisible HTML-comment instructions are routinely left in** (kubernetes, bootstrap, nodejs, rust-lang, f--prompts.chat, open-webui) — a generator must distinguish rendered content from comment scaffold.
- **Attestation checkboxes**: freeCodeCamp (`I have tested these changes…`), n8n (`I have seen this code, I have run this code, and I take responsibility for this code`), openclaw (mandated AI line: `AI-assisted (Claude Code and Codex); I have read and understand the change.`), llama.cpp (`AI usage disclosure: YES/NO`), immich (mandatory "to which degree, if any, an LLM was used" section), ohmyzsh (AI-tool disclosure checkbox), spec-kit (`## AI Disclosure`), electron (`I have reviewed and verified the changes` linking to `policy/ai.md`), obra/superpowers (metadata table demanding model + harness + human reviewer).
- **Hard anti-AI stances**: yt-dlp (`NO AI / NO LLM POLICY` checkbox, "PRs without the template will be CLOSED", threats of a permanent block), ripienaar/free-for-dev ("If you open a Pull Request that was written using AI… we will close it without reviewing it" + an "LLMs tick this box" honeypot left unchecked).
- **Release-note contracts**: electron's clerk-enforced `Notes:` trailer; react-native's `[CATEGORY] [TYPE] - …` changelog line; n8n's `(no-changelog)` title trailer; kubernetes' fenced `release-note` block plus prow slash-commands (`/kind`, `/sig`, `/cc`).
- **Good forms punished when ignored**: vue's and transformers' merged PRs prove maintainers tolerate near-empty template fills; gitignore merged a body with visible `_TODO_` placeholders.

## Description length

Dominant bucket per repo (typical/median authored words): **S (<50 words): 42 repos**; **M (50–200): 37**; **L (>200): 11** (v2rayN, ECC, anthropics/skills, garrytan/gstack, Graphify, langflow, hermes-agent, superpowers, ohmyzsh, openclaw, open-webui); **bot-dominated bodies: 3** (Chalarangelo/30-seconds-of-code, microsoft/generative-ai-for-beginners, nilbuild/developer-roadmap).

- There is **no global correlation between diff size and description length**. Roughly half the reports explicitly note length tracks *risk, complexity, or author role* instead: v2rayN's longest PR is +82/−2 (a risky helper); next.js merged −5,139 lines with one paragraph; hello-algo documented a 180-file change in 85 words; kubernetes mounted +4,879/−13,225 with ~15 words (`/kind` labels carried it); getify accepted a 6,675-line translation with one sentence.
- **Author-role gradient** recurs in ≥8 repos (excalidraw, react, shadcn-ui, transformers, langchain, ComfyUI, immich, vscode-adjacent): maintainers merge their own PRs with one line while external contributors write the full packet — description effort substitutes for trust.
- Chinese-language repos run systematically shorter in word counts but remain information-dense (justjavac's link audits).
- Template-heavy repos have bimodal byte counts: ~400–460 words of boilerplate + 10–120 words of authored content (transformers, ripienaar, TheAlgorithms); a generator should count only the authored core when sizing.

## Content habits

Across the 94 repos (per-repo presence, at least once unless stated; "habit" = majority of sampled PRs):

| Habit | Prevalence | Notes |
|---|---|---|
| Issue linking (`Fixes #N` / `Closes` / URL "Resolves") | any in ~27/94 repos; habitual in ~12 | freeCodeCamp's template bakes `Closes #NNNNN` in (4/5 PRs comply); kubernetes prefers "Part of"/"Related to" and full URLs; Electron uses full-URL `Fixes`; many repos use PR-to-PR lineage ("Follow-up to #", "Supersedes", "salvage #N") instead of issues. The majority of repos (≈67) showed **zero** closing-keyword links. |
| Test plans / validation evidence | systematic in **27/94** repos | Norm is verbatim commands + counts: `bun test…` (opencode), `pnpm test … 43 passed, 6 skipped` (langflow), "56/56 isolated workspace tests" (hello-algo), "40/40 passed" tables (PowerToys), pactesco red-before runs (openclaw). Docs/list repos substitute URL-liveness checks ("HTTP HEAD … returns 200", project-based-learning) or link evidence. |
| Screenshots/videos | ≥1 PR in **15/94** | Standard for UI work where used: open-webui and immich Before/After tables, three.js demo videos + live-test URLs, excalidraw demo video, hermes-agent embeds generated *infographics* in 4/5 PRs; notably **absent** even for UI changes in vscode, shadcn-ui, langflow, AutoGPT, bootstrap. |
| Breaking-change callouts | almost never (open-webui + vue template fields only, both answered "No"/N/A) | Real signals arrive as "no behavior change" reassurances instead (rust-lang, markitdown, cc-switch, llama.cpp). |
| Reviewer ask-outs | scattered; ~15 repos have at least one | openclaw (security sign-off, autoreview gates), PowerToys (`## Reviewer guide`), hermes (review-order notes), gitignore ("Happy to split…"), d3/three.js maintainer pings; kubernetes codifies it as `/assign` `/cc`. |
| Checklists | 27 repos | Mostly template-derived; best practice observed: N/A-with-reason or inline justification instead of deletion (PowerToys, ui-ux-pro-max, cc-switch bilingual notes); anti-pattern: rubber-stamping or leaving everything unchecked (merged anyway in transformers, ComfyUI, TheAlgorithms). |
| Emoji | authored emoji in ~5 repos (AutoGPT 🏗️📋 section headers, jackfrued 🙏🎉, cc-switch 👋, gitignore/jlevy `:)`); bot/footer 🤖 in ~8 | Clearly the exception, not the norm. |
| AI/LLM disclosure lines | ~12 repos carry explicit disclosures | nodejs (`Assisted-by: codex:gpt-5.6-sol…`; "written by Claude Code, directed and reviewed by…"), dify ("fully generated with an AI assistant. I have reviewed the changes…"), ohmyzsh (template-forced) — see Bot section. |

## Bot-generated descriptions

Three distinct phenomena:

1. **Appended AI-summary blocks kept verbatim** (8 repos): f--prompts.chat (CodeRabbit on 5/5), codecrafters-io/build-your-own-x (2/5, as the *entire* body), x1xhlol (4/5), langflow (3/5, below the human body), rustdesk (CodeRabbit + Greptile with confidence scores and mermaid diagrams, 4/5), n8n (cubic badge on 5/5), superpowers (1, old era), firecrawl (`## Summary by cubic` IS the description in 4/5 PRs, merged as-is). Spot-checks against raw `merged-prs.md` confirmed 5 cubic blocks in firecrawl and CodeRabbit markers in prompts.chat. Structure is uniform: HTML comment marker → `## Summary by …` → category bullets (`**Bug Fixes**`, `**Documentation**`) → footer/badge. Maintainers almost never edit them out; in byox and x1xhlol the bot block *is* the effective description and merge is de-facto accepted.
2. **Fully machine-authored PRs** (13 repos): Dependabot (30-seconds-of-code 4/5, microsoft/generative-ai-for-beginners 4/5), Renovate (three.js 2/5, immich), backport bots (electron's trop "Backport of #N. See that PR for details.", immich's push-o-matic), google copybara (tensorflow 4/5, incl. two bodies that are literally `Automated Code Change`), GitHub-Actions syncs (developer-roadmap), flutter's autoroller, n8n's cat-bot, openclaw's roboclaw-bot, and openai/codex's copyberry pipeline (identical Why/What-changed/Testing triads, 1–2-minute merges, `<!-- copyberry-projection-id -->` footers).
3. **Disclosed AI-assisted human submissions** (~12 repos): nodejs, dify, MoneyPrinterTurbo, mattpocock/skills, garrytan/gstack, DietrichGebert/ponytail, spec-kit, ohmyzsh, n8n, openclaw, awesome-llm-apps, langchain — all merged with the disclosure intact; several repos make disclosure mandatory via template (llama.cpp, immich, ohmyzsh, spec-kit, openclaw, superpowers, electron).

Competitive bar for an AI PR-description tool, per the corpus: matching CodeRabbit's category-bullets wins nothing in evidence-driven repos — the merged-as-praised artifacts contain *root cause in one line, reproduction commands, quantified before/after evidence, and explicit what-was-not-done sections*. Two repos hard-reject AI text outright (yt-dlp, ripienaar), and ripienaar's template contains a honeypot designed to catch it. Conversely, in high-velocity repos (firecrawl, openai/codex, n8n) machine-written descriptions are already the de facto reader-facing artifact and nobody cleans them up.

## Traits of excellent merged PRs

These recurred across the strongest descriptions in the corpus. This is **correlational, not causal** — we observe what *merged*, not what caused merging; however in repos with near-zero review (many samples), a complete description was often the only thing a maintainer read before merging, which is suggestive.

1. **Root cause first, then fix.** The best bug-fixes open with symptom → mechanism. nodejs/node#65406 pastes the actual assertion failure before any fix; ohmyzsh#14033 quotes the buggy line and explains the zsh exit-status trap that makes it silent ("For a command whose job is deleting branches, silently doing nothing is a fairly unhelpful failure mode"); v2rayN#10027 opens with "Two defects in the same place, both on the import side, both silent."
2. **Verifiable evidence, not claims** — exact commands a reviewer can re-run plus quantified outcomes: hello-algo#1959's "56/56 isolated workspace tests / missing_files=0", PowerToys#50230's "40/40 passed across two OSes), 198/198 in Azure", hermes#98628's real-transcript A/B ("19 → 1 aux calls, 196.5s → 39.6s").
3. **Prove the test can fail** (fail-first / red-before): v2rayN#10026 pastes failing-then-passing runs; spec-kit#4340 "Verified the test fails without the fix"; openclaw#128223 records "Red-before on current main: 1 failed, 17 passed"; ECC#2693 embeds the full RED then GREEN run; langflow#14834 describes adversarially deleting the key to watch both assertions fail; langchain#39978: "It fails on the current `master`".
4. **Honest scope statements** — what was deliberately *not* changed/not tested: next.js#97480 "Six of thirteen write configurations came out as noise (p >= 0.05) and are omitted"; n8n#37345's `## Not verified` ("No Playwright browser binaries are present in this environment"); rustdesk#15830's `## Known limitations`; dify#41490's `## Deliberately left alone` listing four conflicting open PRs; kubernetes#141500 "it does not fix #141178".
5. **User-visible-behavior deltas surfaced neutrally**: v2rayN#10027's `## One behaviour change worth naming`; dify's "Behaviour notes" (422 vs 400); open-webui#29037 names the commit that introduced the regression and why the naive revert would fail.
6. **Self-correction is a strength, not a weakness**: MoneyPrinterTurbo#1263 writes "I initially wrote that the final mux truncates the narration… That is wrong… I want to withdraw it" — merged, praised in its report; gitignore#4741's "Happy to split this into two PRs…" disarms review friction.
7. **File-path precision and "why not the alternative"**: Node/Graphify/ECC exemplary PRs reference `file.py:123` identifiers and treat rejected alternatives as part of the record (ollama#18056: "We are not adding a lease… We accept and document that narrow edge case").
8. **Proportionality**: excellent small PRs are tiny but complete — airbnb#2620 (one sentence + one code block), immich#31080 (~40 words naming the wrong behavior and the rule fix), shadcn#11715 (one sentence with root cause "the `new-york-v4` path 404s"), public-apis#7112 (the qualification facts a reviewer needs, nothing else).
9. **Attribution and lineage**: ytdl-org#33189 credits each back-ported commit to its yt-dlp author; ECC#2869 preserves credit through consolidations; agency-agents closes with co-author lines; Hack-with-Github#235 credits the original author of a cherry-pick.
10. **Help the reviewer navigate**: PowerToys#50230's `## Reviewer guide` (suggested file order), Graphify#1737's per-subsystem move list proving "verbatim moves, no import cycles", trekhleb#2181's per-file role list, kubernetes's own `#### Special notes for your reviewer:` slot (empty in the sampled PRs, showing even good conventions get skipped).

## Exemplars

Top 15 across the corpus (links verified against each report's "Notable exemplars" plus cross-repo judgment):

1. [electron/electron#53174](https://github.com/electron/electron/pull/53174) — forensic root-cause narrative: regressing upstream Chromium CL, a packaged/unpackaged behavior matrix, hex error codes, and a stated exit plan, inside the standard template.
2. [openclaw/openclaw#130993](https://github.com/openclaw/openclaw/pull/130993) — 3,280-word forensic dossier: lettered root-cause subsections A–G, "Why previous fixes did not fix these failures", live-deployment proof (7/7), plus "What was not tested" and "Known follow-ups".
3. [langflow#14832](https://github.com/langflow-ai/langflow/pull/14832) — quantified Problem (per-flow measurement table), Trade-offs section, and an honest admission of its own regression ("The first push failed five shards… That was this PR's doing").
4. [vercel/next.js#97480](https://github.com/vercel/next.js/pull/97480) — What/Why-safe/Benchmarks with back-to-back measurement protocol and noise-level disclosures; invited 14 reviews.
5. [kubernetes#141500](https://github.com/kubernetes/kubernetes/pull/141500) — quotes the useless old error, shows the improved output, declares scope limits, and gives the exact verification command — inside the standard template.
6. [n8n-io/n8n#37304](https://github.com/n8n-io/n8n/pull/37304) — architecture-decision record in PR form: "Why now"/"Why not" counters, boundary section, quantified results table.
7. [Genymobile/scrcpy#6772](https://github.com/Genymobile/scrcpy/pull/6772) — a big feature as a living design doc: usage examples first, demo videos, named glitches, an 18-iteration PR history, and Supersedes/Fixes trailers.
8. [ohmyzsh#14033](https://github.com/ohmyzsh/ohmyzsh/pull/14033) — +1/−1 shell fix with quoted code, the exit-status trap explained, two-path stub verification, and an explicit scope boundary.
9. [ggml-org/llama.cpp#26500](https://github.com/ggml-org/llama.cpp/pull/26500) — Goal/Bug/Fix/Test in ~130 words with a runnable reproduction gist and `Fixes` linkage.
10. [github/gitignore#4741](https://github.com/github/gitignore/pull/4741) — falsifiable claim proven with a runnable `git check-ignore -v` transcript, upstream source citations, ecosystem precedent, an explicit Scope section, and a split offer.
11. [obra/superpowers#1995](https://github.com/obra/superpowers/pull/1995) — full agent-aware template: submitter model/harness/human-reviewer metadata, alternatives considered, clean-room acceptance transcript, and a human-review attestation.
12. [nodejs/node#65406](https://github.com/nodejs/node/pull/65406) — mechanism-first prose (why the bug needs two Environments per isolate), named test and suites, and an explicit AI-authorship disclosure.
13. [rustdesk#15978](https://github.com/rustdesk/rustdesk/pull/15978) — root-cause-first with quantified waste ("~2900 fork/exec per refresh… every 500 ms"), zero boilerplate.
14. [harry0703/MoneyPrinterTurbo#1263](https://github.com/harry0703/MoneyPrinterTurbo/pull/1263) — measurement table cross-checked with `ffprobe`, impact ranking, load-bearing regression test, and a public self-correction.
15. [microsoft/PowerToys#50230](https://github.com/microsoft/PowerToys/pull/50230) — every checklist item answered with N/A-rationale, validation tables with build IDs and SHAs, and a closing Reviewer guide for a +3,519-line change.

Strong "small but perfect" runners-up worth imitating for tiny changes: [public-apis#7112](https://github.com/public-apis/public-apis/pull/7112), [airbnb/javascript#3229](https://github.com/airbnb/javascript/pull/3229), [mrdoob/three.js#34144](https://github.com/mrdoob/three.js/pull/34144), [EbookFoundation/free-programming-books#13422](https://github.com/EbookFoundation/free-programming-books/pull/13422).

## Anti-patterns

Merged anyway; do not imitate. Counts are repos where the phenomenon appears in ≥1 of the 5 sampled PRs:

- **Empty or near-empty descriptions merged** — **12 repos**: 521xueweihan/HelloGitHub (3/5 empty), 996icu (4/5), CS-Notes (4/5), yangshun (3/5), jlevy (2/5), jackfrued (2/5), ComfyUI (2/5, both by the repo owner), excalidraw (2/5, both by a maintainer), ollama (1/5), nilbuild/developer-roadmap (the only human PR), getify/You-Dont-Know-JS (3-word bodies), tensorflow (2 copybara PRs whose body is literally `Automated Code Change`). Extremes: jwasham#11's entire body is "Oops."; open-webui merged a PR whose body accidentally contains another PR's pasted title.
- **Unfilled/broken templates merged** — **15 repos**: AUTOMATIC1111 ("Nope." as the additional-notes answer, `[OS]` placeholders kept), github/gitignore (`_TODO_` placeholders visible), f--prompts.chat (#1230: 100% unfilled), labuladong (template untouched in #1610), getify (#1859 all fields blank, "I already searched" prompt ignored), vue (#13216: zero authored words), TheAlgorithms (#15109: 15 words for +920/−530, unchecked type box that the keeper bot nominally gates on), open-webui (unfilled instructional prose kept), PowerToys (#50210: empty Detailed Description + leftover Closes placeholder), kubernetes (empty `Special notes` sections), transformers (#14276: only `Fixes #14268` inside ~460 words of scaffold), three.js (unfilled `Related issue: -`), bootstrap (Netlify `{your_pr_number}` placeholder), vinta (empty "Explain:"), ui-ux-pro-max (unchecked feature-branch box).
- **Pure bot bodies accepted as the whole description** — **7 repos**: firecrawl (cubic in 4/5), build-your-own-x (CodeRabbit is the description in 2/5), x1xhlol (CodeRabbit = the substantive text in #476), 30-seconds-of-code (Dependabot only), microsoft/generative-ai-for-beginners (5/5 bot), nilbuild (4/5 sync bots that never say what content changed), tensorflow (2/5 `Automated Code Change`).
- **Sloppy or duplicated titles merged** — **6 repos**: transformers (duplicate word "job" in title), codecrafters/build-your-own-x ("unavalible" typo), multica (grammar slip kept), AUTOMATIC1111 (89-char title stuffed with identifiers), ytdl-org (`[YouTube,etc]` with no summary; trailing "etc" x2), and exact-duplicate titles from fast iteration: firecrawl ("proxy more routes" ×2) and nilbuild (two identical "chore: sync … - r").
- **Unchecked test evidence merged**: AutoGPT merged PRs with the "tested my changes" items unchecked; x1xhlol merged unchecked test-plan boxes; Hack-with-Github's checklist is a future-tense promise ("verify the next scheduled run") rather than evidence.

## Appendix: per-repo index

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
