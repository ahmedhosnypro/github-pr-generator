# PR Patterns: yangshun/tech-interview-handbook

## Corpus
- PRs analyzed: 5 (numbers: #1, #611, #685, #732, #750)
- Caveat: very small sample, each PR by a different external contributor (rockalife, timmparsons, SniperBuddy101, eduardo-castro-quispe, Shramkoweb), spanning 2017–2026. All changes are tiny content/docs fixes (+1/-1 or +2/-2, 1–2 files), none carry labels. This reflects drive-by contribution style to a documentation repo, not an enforced maintainer convention; too small and heterogeneous to draw repo-wide conclusions.

## Titles
Titles are short (~5–12 words), single-line, no emoji, no trailing periods. Three of five use a loose conventional-commit-style prefix:
- `contents/graph: use popleft() instead of pop() in Topological sort queue` (#685 — path-ish scope, lowercase)
- `docs: update current VoIP platforms` (#750)
- `content: fix resume font size recommendation from 10 px to 10 pt` (#732)

The other two are plain descriptive: `Updated difficulty of Lowest Common Ancestor of BST` (#611, past tense, capitalized) and `Fix link` (#1, two words, imperative). No consistent casing or tense convention — the prefix habit exists but is not enforced, and even the prefixed ones diverge (`contents/graph:` vs `docs:` vs `content:`).

## Description structure
Three of five descriptions are empty (#1, #611, #685 — the majority). Only two have bodies, and they share no structure:
- **#750**: no headers at all — three bare bullet-style lines, each `` `platform` - status``, e.g. "`Skype` - shut down on May 5, 2025". Pure list, zero prose explanation.
- **#732**: H1-level section headers (not H2), in order: `# Description` (one prose sentence), `# Context` (one prose paragraph giving the px→pt reasoning), `# Related Issue` (a lone "Closes #728" line).

No common skeleton emerges; #732 is the only structured body and it uses capitalized H1 headers with a Description/Context/Related-Issue progression.

## Template usage
No evidence of a repo PR template: no checklists (`- [ ]`), no boilerplate, no "How Has This Been Tested" scaffold, no unfilled prompts. An unfilled template would normally surface as leftover prompts in small PRs; instead the majority of bodies are simply empty. #732's `# Description / # Context / # Related Issue` headers could echo a personal or borrowed template, but only one instance exists to compare. Conclusion: **freeform** (mostly blank) — the repo tolerates, and merges, zero-description PRs.

## Length & density
- #1, #611, #685: 0 words (empty)
- #750: ~25 words across 3 status lines
- #732: ~85 words across 3 sections

Even the longest description is under 100 words and stays proportionate to a +1/-1 diff. The dominant pattern is *minimal-to-absent* description where the title alone is expected to carry the change.

## Voice & tone
Where prose exists it is neutral and factual. #732 uses third-person/descriptive phrasing without first person ("Fixes the recommended minimum font size…", "Previously, the guide recommended…"), backing claims with concrete numbers ("10 px converts to roughly 7.5 pt, which is illegible… The standard minimum readability for resumes is 10 pt"). #750 is terse, telegraphic status reporting. Titles mix imperative (`docs: update`, `content: fix`, `Fix link`) with past tense (`Updated difficulty…`). Overall register: informal-contributor concise; no greetings, no sign-offs, no politeness boilerplate.

## Content habits
- **Linked issues**: 1 of 5 — #732 ends with "Closes #728" (and its metadata confirms the #728 link). The other four reference no issues.
- **Screenshots/images**: none — notable since several changes are visually checkable content edits.
- **Test plans**: none anywhere; no commands or verification steps are mentioned by any PR.
- **Breaking-change callouts / reviewer ask-outs**: none. No "please review" or @-mentions in bodies.
- **Labels**: none on any PR; review activity is minimal (0–1 reviews, 0–2 comments), with comment counts not reflected in description content.
- Wide merge latency is visible in metadata (#685 sat ~14 months, #611 ~1.9 years before merge), consistent with a low-ceremony, maintainer-merged-drive-by workflow.

## Bot-generated content
None observed — no CodeRabbit summary blocks, no Copilot descriptions, no AI-disclaimer footers in any of the 5 PRs. Bodies (where present) read as plainly human-written.

## Notable exemplars
- **PR #732** — https://github.com/yangshun/tech-interview-handbook/pull/732 — the strongest by far: structured sections, a quantified rationale for a one-character-class change (px vs pt on achievable resume readability), and a proper "Closes #728" linkage; the only PR that would teach a reader something.
- **PR #750** — https://github.com/yangshun/tech-interview-handbook/pull/750 — distant second; no prose, but its three platform-status lines with exact dates make the diff defensible on its own.

Overall this repo is a **counterexample** of good PR-culture writing: the median description is empty and merges succeed regardless; #732 shows what the repo's best looks like, but it is the exception rather than the rule.
