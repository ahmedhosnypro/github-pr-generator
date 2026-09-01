# PR Patterns: github/gitignore

## Corpus
- PRs analyzed: 5 (numbers: #1493, #4700, #4741, #4860, #4873)
- Caveat: 5 different authors (gsnedders, G0rocks, sundowatch, bac0id, lissy93) spanning 2015–2026 — a wide time range but a tiny sample. The repo's PR template postdates #1493 (2015), so template behavior can only be assessed on the 3 recent PRs that used it (#4700, #4741, #4873). All PRs are small diffs (+0/-1 to +5/-2), typical of a data-file repo; conclusions may not hold for large or controversial PRs.

## Titles
No Conventional-Commits types (`feat:`/`fix:`), no emoji, no trailing periods. Two formats observed:
- Plain imperative sentence, short (most common):
  - `Merge the two Python ignore files` (#1493)
  - `Remove empty line in C++.gitignore` (#4860)
  - `Add FreeCAD.gitignore file` (#4700)
- Non-imperative / scope-prefixed variants:
  - `Updates missing .phpunit.cache dir for newer laravel` (#4873) — third-person verb `Updates`, lowercase `laravel`
  - `Julia: ignore *.jl.*.mem and CondaPkg's project-local environment` (#4741) — `<scope>: <lowercase imperative>` prefix form

Lengths ~30–65 characters; casing inconsistent sentence-case; template filenames are routinely named verbatim in the title (`FreeCAD.gitignore`, `C++.gitignore`).

## Description structure
Structure is bimodal — freeform mini-essays vs. the repo's `###`-headed template:

- #1493 (pre-template, 2015): two short prose paragraphs, no headers. Opens with an analogy argument ("There's only one `C.gitignore` instead of one for each of GCC/Clang/MSVC, so similarly there should be one `Python.gitignore`…"), then states what the diff does.
- #4860: a single sentence restating the title — "Remove an empty line in `C++.gitignore`".
- #4700 (template order): `### Reasons for making this change` → `### Links to documentation supporting these rule changes` → `### If this is a new template` → `### Merge and Approval Steps`
- #4873 (template order): `### Link to the application or project's homepage` → `### Reasons for making this change` → `### Links to documentation supporting these rule changes` → `### Merge and Approval Steps`
- #4741: one freeform preamble paragraph ("Two rules for `Julia.gitignore`. The PR has been rescoped since it was opened…"), then `### Reasons for making this change` → `### Links to documentation supporting these rule changes` → `### Scope` (custom section) → `### Merge and Approval Steps`

Canonical template order observed: Reasons → Links to documentation → (new-template fields) → Merge and Approval Steps. All headers are `###` (H3). Lists are used inside "Links to documentation" and "Scope"; prose dominates "Reasons".

## Template usage
Strong evidence of a repo PR template. The same headers and HTML-comment prompts recur verbatim across #4700, #4873, and #4741:
- `### Reasons for making this change` with the hidden prompt `<!--- Please provide some background for this change. --->` (left visible in the submitted body of #4700)
- `### Links to documentation supporting these rule changes` with prompt "Link to the project docs, any existing .gitignore files that project may have in it's own repo, etc"
- `### Merge and Approval Steps` checklist, e.g. `- [x] Confirm that you've read the [contribution guidelines](…#contributing-guidelines) and ensured your PR aligns` / `- [ ] Ensure CI is passing` / `- [ ] Get a review and Approval from one of the maintainers`

Fill quality varies: #4700 leaves two unfilled `_TODO_` placeholders (under "Reasons" and "Links") and a literal `Link to application or project's homepage: TODO` line; #4741 checks 2 of 3 boxes, leaving "Get a review and Approval from one of the maintainers" unchecked; #4873 skips the "If this is a new template" section entirely (correctly, as it modifies an existing template). Pre-template #1493 and trivial #4860 use no template. Conclusion: **mandatory-in-practice template, often only partially filled**, with maintainers merging despite leftover TODOs and unchecked boxes.

## Length & density
- #4860: ~7 words — the extreme low end
- #1493: ~60 words (2 paragraphs)
- #4873: ~90 words (template sections, 1–2 sentences each)
- #4700: ~120 words including boilerplate (~60 of actual content)
- #4741: ~600 words — a clear outlier: two evidence-heavy subsections, two fenced code blocks, a 5-item doc link list, and a scope section

Median is very short; the pattern is "say why the rule change is correct, cite a source, done." Length scales with evidentiary burden, not diff size (#4741 is +4 lines but the longest description in the sample).

## Voice & tone
- Titles imperative except #4873 (`Updates…`).
- First person is common in the template era, unlike maintainer-authored repos: "I'm suggesting it to be added :)" (#4700), "so I didn't touch that" (#4873), "Happy to split this into two PRs…" (#4741).
- Tone ranges from casual/enthusiastic (emoticon `:)` in #4700) to precise and argumentative ("the rule as written never ignores the files Julia actually produces", #4741).
- #4741 uses bolded numbered points (`**1. \`*.jl.*.mem\` — the existing … rule matches nothing**`) as sub-structure inside a section.

## Content habits
- **Linked issues**: none — all 5 PRs have `Linked issues: none`; no `Fixes #N` lines anywhere. Justification is via external documentation, not internal issue tracking.
- **External evidence links**: the dominant habit. #4873 cites "Official Laravel `.gitignore`: https://github.com/laravel/laravel/blob/master/.gitignore#L11" plus the upstream PR that added it; #4741 links Julia manual pages, the runtime source `src/coverage.c`, CondaPkg's repo, and four other projects' `.gitignore` files as precedent ("CondaPkg's own repository ignores it, as do Flux.jl, Plots.jl and PythonCall.jl").
- **Reproduction steps**: #4741 includes a runnable `git check-ignore -v` transcript demonstrating the rule currently fails ("`foo.jl.51234.mem` is the file `julia --track-allocation=user` actually leaves behind, and it is currently… not ignored").
- **Code blocks**: only #4741 (C source from Julia runtime, shell repro, Julia source from CondaPkg).
- **Reviewer ask-outs**: #4741 explicitly offers to split or descope ("Happy to split this into two PRs, or to drop `.CondaPkg/` and land only the `*.jl.*.mem` fix, if either would be easier to review"). #4741 also preemptively documents scoping decisions in a dedicated `### Scope` section ("No editor, OS, or shared-library rules").
- **Screenshots/images**: none — unsurprising for a text-config repo.
- **Labels**: 4 of 5 have none; #4700 carries `feedback given` (matching its 15-comment review thread).
- **Breaking-change callouts**: none observed.

## Bot-generated content
No bot-generated content in any of the 5 PRs — no CodeRabbit/Copilot summary blocks, no AI-attribution footers. All descriptions read as human-written (including the human imperfections: leftover `_TODO_` placeholders and visible HTML comment prompts in #4700).

## Notable exemplars
- **PR #4741** — https://github.com/github/gitignore/pull/4741 — the standout: falsifiable claim, runnable `git check-ignore` reproduction, upstream source-code citations, ecosystem precedent links, an explicit scope/defense section, and a reviewer-friendly offer to split — a model evidence-driven PR description for a config-rule change.
- **PR #4873** — https://github.com/github/gitignore/pull/4873 — best concise template fill: homepage, one-paragraph rationale with historical context ("moved the default location… back in 2023"), preservation note for legacy behavior, and the exact upstream file + PR as evidence, all in ~90 words.
