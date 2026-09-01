# PR Patterns: shadcn-ui/ui

## Corpus
- PRs analyzed: 5 (numbers: #11640, #11710, #11713, #11715, #11716)
- Caveat: 3 of 5 PRs are by the maintainer (shadcn) and the other 2 by different external contributors (ksparth12, thebuilder), all merged in a single day (2026-08-30). Also, 3 of 5 are trivial registry-directory or style tweaks (+3 to +13 additions). The sample captures a maintainer-vs-contributor style split but is too small and recent to generalize across the repo's history.

## Titles
4 of 5 titles use strict Conventional Commits with a parenthesized scope:
- `docs(registry): update @wensity URL, homepage, and description` (#11640)
- `feat(registry): add @afterglow to the registry directory` (#11710)
- `fix(docs): restore sidebar block preview on mobile` (#11715)
- `style(www): use radix-luma buttons in page headers` (#11716)

The one exception is the maintainer's own SEO PR: `Add official site SEO metadata` (#11713) — no type, no scope, capitalized imperative. Pattern: lowercase `<type>(<scope>): <lowercase description>` dominates; scopes observed are `registry` (2×), `docs`, `www`. Lengths ~35–60 characters, single line, no emoji, no trailing period, no PR-number suffixes.

## Description structure
Two distinct formats, split almost exactly along contributor vs maintainer lines:

- **Contributor long-form** — #11640 uses four `###` (H3) sections in order: `### Description` (one-paragraph preamble), `### What changed` (a 3-row Before/After markdown table), `### Why` (three bold-prefixed prose sub-paragraphs: `**URL.**`, `**Homepage.**`, `**Description.**`), `### Notes` (3 bullets). It embeds a fenced shell transcript of a real `npx shadcn@latest add …` run as proof.
- **Contributor compact-form** — #11710 uses `### Description` (one sentence + 3 bullets of facts: homepage, registry URL, logo note) followed by `## Verification` (2 bullets listing the exact commands run: `pnpm validate:registries`, `pnpm prettier --check …`). Note the inconsistent heading level jump from H3 to H2.
- **Maintainer one-liners** — #11713, #11715, #11716 each contain only a `### Description` header and a single prose paragraph, no further structure. Example (#11715): "Point mobile block screenshots at `/r/styles/new-york` (the `new-york-v4` path 404s), use the sidebar-07 shots for the sidebar docs preview, and keep typeset from letterboxing that image."

So the only universal structural element is the `### Description` header itself; everything below it varies by author.

## Template usage
No evidence of a repo PR template: no `- [ ]` checklists, no "How Has This Been Tested"-style scaffolds, no leftover boilerplate prompts, no "Type of change" sections. The shared `### Description` header across all 5 PRs could come from a minimal template or simply from convention, but since the maintainer's PRs stop at that single header while contributors add their own sections (`What changed`, `Why`, `Verification`), there is no enforced scaffold. Conclusion: **freeform** (possibly a one-header minimal template that authors extend or ignore at will).

## Length & density
Bimodal, tracking author type:
- #11640: ~200 words — the longest, with a table, prose "Why", and a shell transcript; high information density (verification claim is expressed as "payloads at both locations are byte-identical (verified by SHA-256)").
- #11710: ~55 words across two sections.
- #11713: ~45 words, single paragraph.
- #11715: ~40 words, single paragraph.
- #11716: ~20 words, single sentence: "Use radix-luma buttons in the Blocks, Charts, Colors, and Examples page headers so they match the homepage."

Maintainer PRs are terse even when the diff is sizable (#11713: +157/−14 across 14 files gets ~45 words). External contributors write more relative to smaller diffs. Nothing exceeds ~200 words; overall the repo skews concise.

## Voice & tone
- Imperative mood in titles and throughout maintainer bodies: "Point mobile block screenshots at…", "Use radix-luma buttons in…", "Adds canonical metadata…" (present-tense third-person also used).
- No first person ("I"/"we") in any of the 5 descriptions.
- Neutral, factual engineering register. The most editorial sentence in the corpus is still dry: "The previous wording led with 'AI interfaces', which is 4 of 70 items" (#11640).
- Heavy use of inline code formatting for paths, commands, and identifiers (`` `apps/v4/registry/directory.json` ``, `` `currentColor` ``, `` `pnpm validate:registries` ``).

## Content habits
- **Linked issues**: zero. Every PR reports "Linked issues: none" and no description contains `Fixes #N` / `Closes #N` — these are all standalone changes, not issue-driven fixes.
- **Labels**: none on any of the 5 PRs — labels are not part of this repo's visible PR workflow in this sample.
- **Test plans / verification**: only the two contributor PRs include explicit verification (#11640 embeds a successful `npx shadcn@latest add …` transcript; #11710 lists two `pnpm` commands under `## Verification`). Maintainer PRs state the change with no test evidence.
- **Screenshots/images**: none — notable since #11715 and #11716 are UI/visual changes (block previews, button styles).
- **Breaking-change callouts / reviewer ask-outs**: none observed. #11640 proactively addresses compatibility inside the body instead ("The old repository remains published and unchanged, so anyone who hardcoded the previous raw URL… keeps working").
- **Change-size profile**: 4 of 5 PRs are small (+3 to +13 additions); descriptions are proportionate.

## Bot-generated content
No bot-generated description content in any of the 5 PRs — no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot-generated walkthroughs, no AI-disclosure footers. The two elaborate descriptions (#11640, #11710) are authored by humans with hand-specific details (SHA-256 verification, org-migration context) and idiosyncratic structure (the `###`→`##` heading-level jump in #11710 is not something a generator produces). The maintainer's one-liners are plainly handwritten. If AI assistance exists in this repo's PR workflows, it leaves no structural trace in this sample.

## Notable exemplars
- **PR #11640** — https://github.com/shadcn-ui/ui/pull/11640 — the strongest in the sample: a Before/After table for a config change, a per-field "Why", an executed verification transcript, and a Notes section that pre-empts reviewer questions (licensing, registry shape, HTTPS resolution). ~200 words carrying an audit trail.
- **PR #11715** — https://github.com/shadcn-ui/ui/pull/11715 — best maintainer one-liner: in a single sentence it names the fix, the root cause ("the `new-york-v4` path 404s"), and a side-effect guard, showing that the terse style can still be complete.
