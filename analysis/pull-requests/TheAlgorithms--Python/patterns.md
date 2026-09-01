# PR Patterns: TheAlgorithms/Python

## Corpus
- PRs analyzed: 5 (numbers: #15083, #15120, #15109, #15121, #14745)
- Authors: Clear20-22, priya-sundaram-dev (2×: #15120, #15121), cclauss, changsheng0804-blip — reasonably diverse (4 distinct authors), though the sample is only 5 PRs and all merged within a 3-month window (2026-05-31 → 2026-08-30), so repo-wide generalization is still limited. One PR (#14745) sat open ~3 months before merge, unlike the others (merged same week).

## Titles
Mixed conventions; no single enforced format:
- `Add suffix automaton` (#15083) — bare "Add X" form, no scope prefix
- `quantum: modernize QFT to Qiskit 2.x and re-enable its test` (#15120) — `scope: lowercase-verb` Conventional-Commits-style, scoped to the directory
- `Add uv-pre-commit` (#15109) — bare "Add X"
- `docs: add AGENTS.md with contribution rules for AI agents` (#15121) — `type:` + lowercase verb, classic Conventional Commit flavour
- `Add type hints to pancake_sort function` (#14745) — bare "Add X"

Pattern: 3 of 5 are plain `Add …` titles; 2 of 5 use a `<scope-or-type>:` prefix with lowercase verb. Lengths ~25–60 chars, no emoji, no trailing period. Casing after a colon is lowercase when the prefix form is used; unprefixed titles are capitalized. No `fix:`/`feat:` types observed — the repo does not enforce Conventional Commits.

## Description structure
Every PR uses the same scaffold: a `### Describe your change:` H3 header, free-form body, a change-type checkbox list (`* [x] Add an algorithm?` etc.), then a `### Checklist:` H3 header with a compliance checklist. Body structure varies by PR:
- #15083: one-sentence summary, definitional paragraph ("A Suffix Automaton is the minimal Deterministic Finite Automaton (DFA)…"), then a bolded list `**Key features implemented:**` with 4 bullets citing complexity bounds in LaTeX-ish notation ($O(N)$).
- #15120: context paragraph ("Follow-up to #15118 and the ask in #15081"), root-cause paragraph ("imported `Aer` and `execute` from `qiskit` — both **removed in the Qiskit 1.0 API break**"), 3 detailed bullets on the port, a CI-status paragraph ("**CI is green:** `build` and `build_docs` both pass"), and a scope-limitation paragraph.
- #15109: two bare lines ("Add https://github.com/astral-sh/uv-pre-commit to pre-commit to keep `uv.lock` up to date"; "Helps with https://github.com/TheAlgorithms/Python/security/dependabot").
- #15121: three prose paragraphs explaining motivation ("the one that keeps closing bot PRs: **`algorithms-keeper` closes any PR whose 'Describe your change' section has no checked box**") and filename rationale.
- #14745: one-sentence summary, `Changes made:` plain-text label with 2 short bullets, then the closing keyword "Fixes #14737".

Canonical order: `Describe your change:` body → change-type checkboxes → `Checklist:` compliance items. Heading level is H3 (template-authored); prose bodies use bold-labeled bullets rather than further headers.

## Template usage
Strong, unambiguous repo template. All 5 PRs contain the identical boilerplate: `### Describe your change:`, the change-type checklist ("* [ ] Add an algorithm? / Fix a bug or typo in an existing algorithm? / Add or change doctests?… / Documentation change?"), and `### Checklist:` with up to 11 verbatim items ("* [x] I have read [CONTRIBUTING.md](…)", "* [x] This pull request is all my own work -- I have not plagiarized.", "* [x] All new algorithms include at least one URL that points to Wikipedia…"). Variations are editing artefacts, not freeform: #15109 and #15121 leave most checklist boxes unchecked or pruned (e.g. #15121 keeps only 4 items, all checked); #14745's final item mangles the prompt ("includes Fixes #\."); #15109 adds a fifth change-type option ("* [ ] Change pre-commit tests") absent in others, suggesting a slightly different template revision. Notably, #15121's body confirms the template is machine-enforced: "**`algorithms-keeper` closes any PR whose 'Describe your change' section has no checked box**". Conclusion: **mandatory template, minimally edited — authors tick boxes but rarely delete inapplicable items**.

## Length & density
Wide spread, driven by author rather than change size:
- #15109: ~15 words of body (+920/-530 — the largest diff, nearly empty description)
- #14745: ~40 words (+6/-1)
- #15083: ~90 words (+177/-0)
- #15121: ~120 words (+62/-0)
- #15120: ~230 words (+36/-20) — by far the densest, a full motivation/root-cause/verification narrative

Template boilerplate dominates every description (the two checklists alone are ~150 words), so actual authored content is a minority of each page. Pattern: most contributors write the bare minimum above the template; one author (priya-sundaram-dev) writes essay-length justifications.

## Voice & tone
- Mixed person by author: #14745 and #15109 are neutral/telegraphic ("Added type hints…", "Add uv-pre-commit…"); #15120 uses first-person plural-adjacent but mostly declarative ("This ports it to the current API"); #15121 uses explicit first person ("I used the vendor-neutral `AGENTS.md` filename").
- Titles and #15083's feature bullets skew imperative/descriptive ("implements", "Add"). 
- Tone is informal-to-technical; #15120 borders on conversational with asides ("the old `{'00': 2500, ...}` doctest was statistically impossible and only 'passed' because it was ignored").
- Heavy jargon and precise numerals where authors do write: complexity bounds ($O(N)$, $O(|pattern|)$) in #15083, CI job names (`build`, `build_docs`) in #15120.

## Content habits
- **Linked issues**: only 1 of 5 uses a proper closing keyword — #14745 has "Fixes #14737" (matching its listed linked issue). #15120 closes an issue informally ("Closes the quantum half of #8818") and references 4 prior PRs/issues inline (#15118, #15081, #15119, Qiskit/qiskit-aer#2378). #15109 links to the Dependabot security page rather than an issue. #15083 and #15121 link none.
- **Test plans**: no dedicated test-plan sections; testing is covered implicitly by the template item "All functions have doctests that pass the automated testing" and, in #15120, by a prose CI report ("**CI is green:** `build` and `build_docs` both pass on the repo's Python 3.14 interpreter").
- **Screenshots/images**: none — consistent with a code-only algorithms repo.
- **Breaking-change callouts**: #15120 calls out an upstream API break ("both **removed in the Qiskit 1.0 API break**") as motivation, not as a change it introduces. No repo-level breaking-change announcements.
- **Reviewer ask-outs**: none explicitly; #15120 acknowledges prior review context ("as suggested by @cclauss in #15119" — actually #15121; #15120 credits "the ask in #15081").
- **Labels**: used loosely — #15083 carries `tests are failing` yet was merged; #15109 is labeled `documentation` for a pre-commit/lockfile change.

## Bot-generated content
No bot-authored description bodies (no CodeRabbit "Summary" tables, no Copilot-generated prose) in any of the 5 PRs. However, bots shape the content indirectly: #15121 documents that the repo's own **`algorithms-keeper`** bot auto-closes PRs with unchecked template boxes, and #15120 notes its predecessor "#15119 (auto-closed by the keeper bot for the draft's unchecked template)". So the strongest automation signal is a gatekeeper enforcing the human template, not an AI summarizer — human-authored descriptions inside a machine-policed scaffold.

## Notable exemplars
- **PR #15120** — https://github.com/TheAlgorithms/Python/pull/15120 — the strongest sample: full causal chain (root cause → fix → why the new doctest is statistically sound) plus a CI verification report and explicit scope limits, all within the required template.
- **PR #15109** — https://github.com/TheAlgorithms/Python/pull/15109 — instructive counterexample: a ~15-word description (with the change-type box left unchecked — technically closable by the keeper bot's own rule) for a +920/-530 diff, showing the template alone doesn't guarantee substantive descriptions.
