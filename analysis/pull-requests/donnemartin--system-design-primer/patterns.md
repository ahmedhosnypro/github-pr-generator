# PR Patterns: donnemartin/system-design-primer

## Corpus
- PRs analyzed: 5 (numbers: #1190, #1181, #1163, #1189, #1153)
- Caveat: the sample is extremely homogeneous in change type — all 5 PRs are dead/broken-link fixes in markdown files, 1 file changed each, at most +2/-2 lines. This reflects what currently gets merged into this repo (documentation maintenance), not necessarily the conventions for feature PRs. Author diversity is fine (5 distinct authors: freemanzMrojo, ibeckermayer, wilburhsu, rjames187, savasva), but topic homogeneity limits generalization.

## Titles
No conventional-commits types (`feat:`/`fix:`) are used; the strongest pattern is a plain descriptive phrase naming the broken link:
- `en: link fixed for push and pull CDNs` (#1190 — the only one with a scope-like prefix, lowercase `en:` language tag)
- `Fix URL for Layer 4 load balancing in README to archive` (#1181)
- `Update link for understanding latency vs throughput` (#1163)
- `en: Fix broken link to PayPal Developer Blog` (#1189)
- `Fix link for UDP vs TCP` (#1153)

Pattern: `Fix|Update link/URL for <topic>`, or `en: Fix ...` when scoping by language file. Casing is inconsistent (sentence-start capitalized verb everywhere except #1190's lowercase `link fixed`), lengths ~30–60 characters, single line, no emoji, no trailing period.

## Description structure
No section headers of any level appear in any of the 5 descriptions — no `##`/H2, no bold pseudo-headers. Every description is 1–2 short prose sentences (or a sentence plus a bare URL line):
- #1190: "This PR replaces the link for pulling/pushing CDNs" + one follow-up sentence about removing an extra char
- #1181: single sentence ("Updated the URL for Layer 4 load balancing reference to archive (existing link was dead)")
- #1163: single run-on sentence citing the exact file and line ("README-zh-Hans.md on line 437")
- #1189: single sentence ("This PR fixes the broken link to the PayPal Developer Blog in the English language version…")
- #1153: sentence + explicit old→new URL pair on one line ("http://gafferongames.com/…/udp-vs-tcp/ -> https://gafferongames.com/post/udp_vs_tcp/")

Canonical order: [which link / why it matters] → optional [old → new URL or secondary cleanup note].

## Template usage
No evidence of a repo PR template: no checklists (`- [ ]`), no boilerplate, no "How Has This Been Tested" scaffold, no unfilled prompts. Descriptions are entirely freeform and minimal. Conclusion: **freeform, no template**.

## Length & density
Extremely short — the sparsest descriptions in the corpus tier:
- #1190: ~25 words
- #1181: ~20 words
- #1163: ~25 words
- #1189: ~25 words
- #1153: ~20 words (plus two URLs)

All under ~30 words. This matches the change size (+1/-1 to +2/-2 lines): descriptions state the what (dead link) and the fix, with no elaboration — proportionate to the diff, not padded.

## Voice & tone
- Mixed voice: "This PR replaces…" / "This PR fixes…" (#1190, #1189) vs. implied-imperative past tense "Updated the URL…" (#1181) and nominal "Update link for…" (#1163). No first person ("I"/"we") anywhere.
- Informal, low-ceremony register; one description (#1163) mixes Chinese punctuation (full-width comma `，`; typographic period `。` style) into English prose, reflecting a multilingual contributor base.
- #1153's "`/` -> `"` arrow showing old vs new URL is the most concrete formatting gesture in the sample.

## Content habits
- **Linked issues**: none — 0 of 5 PRs link an issue; no "Fixes #N" anywhere. Each PR is self-contained.
- **Test plans**: none — unsurprising for markdown link fixes; no test/verification remarks at all.
- **Screenshots/images**: none.
- **Breaking-change callouts / reviewer ask-outs**: none.
- **Labels**: sparse — 3 of 5 have none; #1163 carries `incorporating-feedback`, #1153 carries `needs-review` (triage labels, not feature taxonomy).
- Diff stats (+1/-1) and single-file scope are uniform across the sample.

## Bot-generated content
None. No CodeRabbit/Copilot summary blocks, no AI footers, no structured auto-generated sections in any of the 5 descriptions. All read as quickly hand-written by the contributor.

## Notable exemplars
- **PR #1153** — https://github.com/donnemartin/system-design-primer/pull/1153 — the clearest sample: states the bug ("The original link was broken") and shows the exact old → new URL with an arrow, making the intent verifiable without opening the diff.
- **PR #1181** — https://github.com/donnemartin/system-design-primer/pull/1181 — one sentence that covers what changed, where (README), and why ("existing link was dead"); also the only PR with 2 reviews in the sample.

Note: "exemplar" here is relative — these are good *minimal* PRs for one-line link fixes, but the sample contains no substantive PR (feature, refactor, or docs addition) to evaluate richer description practice.
