# PR Patterns: rust-lang/rust

## Corpus
- PRs analyzed: 5 (numbers: #161967, #161977, #161902, #162004, #162009)
- Caveats: all 5 PRs were merged in the same bors batch on 2026-08-30, and #162009 is a **rollup PR containing the other four**, so the sample is one tight temporal cluster, not independent draws. Authors are diverse (Walnut356, malezjaa, Zalathar, Kobzol, JonathanBrouwer for the rollup), but all PRs are compiler/testsuite work (labels: `T-compiler` on 3 of 5, `A-testsuite`/`A-compiletest`/`A-LLVM` on others) — no rustdoc, cargo, or library PRs are represented. Sample is too homogeneous to generalize repo-wide.

## Titles
No Conventional Commits (`feat:`/`fix:`) usage. Titles are short imperative/descriptive phrases, no emoji, no trailing period:
- `Rerun `tests/debuginfo` tests if repr data has changed` (#161967) — inline backticks around a path inside the title
- `update target-cpus test` (#161977) — fully lowercase, casual
- `coverage: Rename the three main coverage-info structs` (#161902) — the only scope-prefix (`coverage:`) title
- `Remove unneeded clone in macro deriving` (#162004) — capitalized imperative
- `Rollup of 4 pull requests` (#162009) — fixed bors/rollup-tooling formula

Casing is inconsistent (capitalized in 3 of 5, all-lowercase in #161977). Lengths ~30–60 characters.

## Description structure
No markdown section headers appear in **any** of the 5 descriptions — a sharp contrast with template-driven repos. Structure per PR:
- #161967: 3 prose paragraphs (issue link → scope/context → deferred follow-up), then bare `r?`/`cc` lines
- #161977: a single line — `Fixes rust-lang/rust#133919`
- #161902: prose intro, then a fenced ` ```text ` block giving the exact rename mapping (`CoverageInfoHi => CoverageEarlyInfo // collected early…`), then 2 more prose paragraphs ending with "There should be no change to compiler behaviour."
- #162004: 2 informal prose paragraphs, then `r? nnethercote`
- #162009 (rollup): fixed structure — `Successful merges:` heading line + bulleted list of `rust-lang/rust#NNNNNN (<title>)` entries, then an HTML-comment block with `r? @ghost` and a "[Create a similar rollup](https://bors.rust-lang.org/queue/…)" link

Prose dominates; bullets appear only in the tooling-generated rollup. Code fences are used for concrete before/after mappings (#161902) rather than code snippets.

## Template usage
The repo has a real PR template, but it is an **invisible HTML-comment scaffold** wrapped in `<!-- homu-ignore:start --> … <!-- homu-ignore:end -->`, containing: an LLM-usage policy/disclosure notice ("If you used an LLM to generate any part of this PR, including the PR description, please disclose that…"), a tracking-issue prompt, and instructions for reviewer assignment (`r? <reviewer name>`) plus a note that the description becomes part of the bors merge commit message. It appears verbatim in #161967 and #161977 (left in place, invisible when rendered); #161902 and #162004 omit it entirely (regulars evidently delete it); the rollup #162009 keeps only its own small homu-ignore block. No checklists, no "How Has This Been Tested" scaffolds, no unfilled prompts in the visible text. Conclusion: **comment-based guidance template + freeform visible description**.

## Length & density
Visible body word counts (excluding the HTML-comment template): #161967 ≈ 102 words, #161902 ≈ 105, #162004 ≈ 82, #162009 ≈ 34, #161977 = 2 words (just the `Fixes` line). All descriptions fit in 2–105 words; the norm is 2–4 short paragraphs that assume the reader can read the diff. The one-line "Fixes #N" body of #161977 is acceptable and mergeable here.

## Voice & tone
Conversational first person throughout the human PRs — "I can rename the `lldb_input` directory" (#161967), "I found a few other places where we clone unnecessarily" (#162004), "an old TODO of mine" (#161902). Tone is informal and opinionated: "it should probably be its own PR", "which is a shame — it should be more powerful!" (#162004, critiquing the `redundant_clone` Clippy lint). No marketing voice, no self-congratulation; hedges are common ("There **should** be no change to compiler behaviour").

## Content habits
- **Linked issues**: 2 of 5 link an issue, in different styles — #161967 writes "Resolves https://github.com/rust-lang/rust/issues/161138" (full URL), #161977 writes "Fixes rust-lang/rust#133919".
- **Reviewer workflow is in-band**: `r? @jieyouxu , @Kobzol` + `cc @Mark-Simulacrum` (#161967), `r? nnethercote` (#162004). Reviewer assignment is a first-class description element, unique to bors-based repos.
- **Cross-referencing prior work**: #161967 links PR #160377 and a specific review-discussion URL; it explicitly scopes deferred work ("In a followup, I can rename the `lldb_input` directory… higher priority though atm").
- **No-change assurances**: #161902 closes with "There should be no change to compiler behaviour" — a common signal for pure refactors.
- **Not observed anywhere**: screenshots/images, test-plan enumerations (despite `A-testsuite` labels), checklists, breaking-change callouts.
- **Labels**: rust-specific taxonomy — team labels (`T-compiler`, `T-bootstrap`), area labels (`A-LLVM`, `A-code-coverage`), and status label `S-waiting-on-bors` on every PR (all merges go through bors).

## Bot-generated content
- **Rollup PR #162009** is machine/toll-generated (via bors rollup tooling, authored by JonathanBrouwer): a fixed `Successful merges:` list of the 4 constituent PRs plus a homu-ignore block with `r? @ghost` and a "[Create a similar rollup](https://bors.rust-lang.org/queue/rust?prs=162004,161902,161967,161977)" link. This formulaic structure is a standing repo convention, not incidental.
- The homu-ignore template block in #161967/#161977 is also effectively boilerplate, kept verbatim by authors.
- No CodeRabbit/Copilot "Summary by …" blocks appear. Notably, the repo's own template explicitly demands **disclosure of LLM-generated PR text** ("LLM contributions are not banned, but are held to a higher standard of review and correctness") — the repo governs AI-assisted descriptions by policy rather than exhibiting bot-authored ones.

## Notable exemplars
- **PR #161902** — https://github.com/rust-lang/rust/pull/161902 — the strongest: an exact old→new name mapping table in a fenced block, rationale ("keep the three structs distinct, while also avoiding the historical inconsistency"), and an explicit no-behavior-change guarantee — a complete reviewer story in ~105 words.
- **PR #161967** — https://github.com/rust-lang/rust/pull/161967 — best context hygiene: resolves the issue with a full URL, explains why extra handling is harmless, defers non-essential work to a named follow-up, and wires up reviewers (`r?`/`cc`) explicitly.
