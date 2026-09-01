# PR Patterns: krahets/hello-algo

## Corpus
- PRs analyzed: 5 (numbers: #1943, #1951, #1953, #1958, #1959)
- Caveat: all 5 PRs are by the same author — krahets, the repo owner — merged across ~1 month (2026-07-18 → 2026-08-17). All 5 were merged with 0 reviews and 0 comments, and none carry labels or linked issues. This reflects a single maintainer's solo-merge workflow, not a community contribution pattern; the sample is too small and homogeneous to generalize to outside contributors.

## Titles
All 5 titles are short imperative phrases with no Conventional-Commits type prefix (no `feat:`/`fix:`/`docs:`), no scope annotation, no emoji, and no trailing period:
- `Simplify generated exercise page sources` (#1943)
- `Refine Zensical callout backgrounds` (#1951)
- `Remove Warp sponsorship and refine endorsement cards` (#1953)
- `Fix multilingual content typos` (#1958)
- `Add multilingual exercise code` (#1959)

Pattern: `<Capitalized imperative verb> <object>`. Every opening verb is a capitalized action word — Simplify, Refine, Remove, Fix, Add. Lengths are ~28–48 characters; #1953 is the only compound title joining two changes with "and".

## Description structure
Every PR uses exactly the same two-section scaffold: `## Summary` (H2) followed by `## Validation` (H2), both consisting purely of bulleted lists — no prose paragraphs anywhere in the corpus.

- PR #1943: `## Summary` (3 bullets: "remove generated-file banners…", "keep all 14 Traditional Chinese exercise pages…", "align the Traditional Chinese chapter navigation…") → `## Validation` (2 verbatim commands + 1 verification bullet)
- PR #1951: `## Summary` (3 bullets) → `## Validation` (3 stat bullets: "exercise pages: 56 checked")
- PR #1953: `## Summary` (2 bullets) → `## Validation` (4 bullets, incl. "locally reviewed and approved for deployment")
- PR #1958: `## Summary` (3 bullets) → `## Validation` (5 bullets: OpenCC check, regressions)
- PR #1959: `## Summary` (4 bullets) → `## Validation` (5 bullets: "56/56 isolated workspace tests", "136 code-link mappings")

Header count and order never vary; only `### Description` (collector-added) sits above them. Summary bullets are lowercase-phrased outcome statements; Validation bullets mix raw commands (`` `conda run -n hello-algo python utils/exercises/render_review.py --check` `` only in #1943), pass counts, and zero-missing assertions.

## Template usage
No evidence of a GitHub PR template: no checklists (`- [ ]`), no instructional boilerplate, no "How Has This Been Tested"-style scaffold, no unfilled prompt text. However, the identical `## Summary` / `## Validation` pair across 5 of 5 PRs functions as an enforced personal template — wording inside the bullets is freshly authored each time, but the skeleton never deviates. Conclusion: **freeform with a rigid self-imposed two-section structure** (owner's personal convention), not a repo-configured template.

## Length & density
All descriptions are extremely short:
- #1943: ~60 words (2 sections, 5 bullets)
- #1951: ~40 words (shortest)
- #1953: ~55 words
- #1958: ~60 words
- #1959: ~85 words (longest)

Every description fits in well under 100 words despite large diffs — #1959 touches 180 files (+5795/−230) and #1958 touches 201 files (+289/−271). The pattern is maximum signal-to-length: bullets name outcomes and validation evidence, never walk through the diff file-by-file.

## Voice & tone
- Imperative/present-tense action verbs throughout, mirroring the titles: "remove", "keep", "align", "replace", "localize", "regenerate".
- Strictly third-person/neutral — zero first-person ("I"/"we") across all 5 descriptions.
- Terse, formal, engineering-register. Frequent hard numbers in lieu of prose: "14 Traditional Chinese exercise pages", "1438 files checked", "missing_files=0 and missing_symbols=0", "56/56 isolated workspace tests".
- No humor, hedging, or hedged qualifiers; #1953's "locally reviewed and approved for deployment" is the only self-approval statement.

## Content habits
- **Linked issues**: none — 0 of 5 PRs use "Fixes #N" or reference any issue; the collector recorded `Linked issues: none` for all.
- **Test plans**: the standout habit. Every PR's `## Validation` section enumerates concrete, re-runnable evidence: exact CLI invocations (#1943: full `conda run … build_zensical.py --langs=zh,zh-hant,en,ja,ru …` command), artifact counts ("56/56 isolated workspace tests", "136 code-link mappings"), and zero-defect invariants ("missing_files=0, missing_symbols=0" in #1953, #1958, #1959).
- **Screenshots/images**: none, even though #1951 and #1953 are visual/styling changes (callout tints, endorsement cards).
- **Breaking-change callouts / reviewer ask-outs**: none — consistent with owner self-merge with zero reviews/comments.
- **Labels**: none on any PR.
- Recurring domain vocabulary: "five-language Zensical build", "OpenCC check", "exercise pages" — validation is framed around the project's multilingual codegen pipeline, and #1943/#1959 explicitly name which languages were regenerated ("zh, zh-hant, en, ja, ru").

## Bot-generated content
No bot-generated content observed: no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot summaries, no AI-disclosure footers in any of the 5 descriptions. The completely uniform `Summary`/`Validation` skeleton and consistent lowercase-bullet style read as a disciplined human convention (or a consistently applied personal prompt), with no structural signature of tool-generated text to preserve or strip.

## Notable exemplars
- **PR #1959** — https://github.com/krahets/hello-algo/pull/1959 — the strongest sample: 4 Summary bullets state scope and explicit exclusion ("keep Zig out of scope") for a 180-file change, and Validation supplies four independent, quantified checks ("56/56 isolated workspace tests", "136 code-link mappings", "missing_files=0, missing_symbols=0") — a full audit trail for a huge diff in ~85 words.
- **PR #1943** — https://github.com/krahets/hello-algo/pull/1943 — best validation evidence: it pastes the two exact verbatim commands a reviewer can re-run, then states the human verification step ("verified 14 exercise pages for each of zh, zh-hant, en, ja, and ru").
