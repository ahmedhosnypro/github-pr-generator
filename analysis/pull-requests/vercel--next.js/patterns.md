# PR Patterns: vercel/next.js

## Corpus
- PRs analyzed: 5 (numbers: #98030, #97480, #97753, #97987, #97968)
- Authors are 5 different maintainers (devjiwonchoi, lukesandberg, eps1lon, styfle, icyJoseph), so author homogeneity is not a problem; however n=5 is still a very thin slice of a repo merging dozens of PRs daily, and none of these are RFC-sized changes. Conclusions describe this sample, not repo policy.
- Notably, **no PR has labels** and **no PR has a repository-linked issue in its metadata**, even where the body says "Closes: …".

## Titles
Titles are heterogeneous — three distinct conventions coexist across just 5 PRs:
- Plain imperative, no prefix: "Honor non-interactive mode in upgrade codemod prompts" (#98030), "Store keys in key order in SST blocks that omit hashes" (#97480) — capitalized first word.
- Conventional-Commits with type (+scope), lowercase after the colon: "test: add test for local font with deployment id" (#97987), "docs(examples): document env var handling in the Docker examples" (#97968).
- Bracketed scope: "[ci] Remove the popular workflow and its action" (#97753).

No emoji, no trailing periods, lengths ~45–70 characters, single line. The split between bare imperative, `type:`/`type(scope):`, and `[scope]` shows the title format is left to author taste (2 conventional-commit style, 2 plain imperative, 1 bracketed).

## Description structure
There is no shared skeleton; each PR is structured differently:

- PR #98030: `### Why?` — one prose paragraph ("`@next/codemod upgrade --yes` accepts defaults for the upgrade command's prompts, but `next-request-geo-ip` asked its own deployment question inside `runTransform`…"), then `### How?` — one prose paragraph. Question-form headers, prose only, no lists.
- PR #97480: `## What` → `## Why this is safe` → `## Benchmarks`. Prose paragraphs under What/Why, then three benchmark subsections ("**Lookups**", "**Commits**", "**Compaction**") each rendered as a markdown table of configs vs. percentage change ("-30.4%", "+3.3%").
- PR #97753: a single ~60-word paragraph, no headers at all ("The `popular` workflow posted weekly Slack digests of the most-reacted issues… so this PR deletes the workflow along with its backing `next-repo-actions` action…").
- PR #97987: flat bullet lists of PR URLs under two plain-text lead-ins — "Follow up to a previous PR:" (2 links) and "Closes:" (1 link). No headers.
- PR #97968: two lines total: a one-sentence summary ("Improve with-docker example env var usage documentation.") + "Closes: https://github.com/vercel/next.js/issues/97959".

Order generalization: state-the-change first, then justification/context; linkage ("Closes") always sits at the bottom when present.

## Template usage
No repo PR template is in evidence: zero checklists (`- [ ]`), zero boilerplate instruction text, zero "How Has This Been Tested"-style scaffolds, and no two PRs share the same section headers. The `### Why?` / `### How?` pairing (#98030) is a known informal next.js maintainer habit but appears in only 1 of 5 samples here. Conclusion: **freeform**, with per-author mini-conventions.

## Length & density
- #98030: ~75 words across two sections — compact.
- #97480: ~380 words plus three benchmark tables — by far the densest; every claim is quantified ("roughly ten hashes per lookup", "16 `static_sorted_file_lookup` configurations improved", "Six of thirteen write configurations came out as noise (p >= 0.05) and are omitted").
- #97753: ~60 words, one paragraph.
- #97987: ~15 words + 3 URLs.
- #97968: ~12 words + 1 link.

Bimodal pattern: substantive code changes get real prose (anecdote → mechanism → trade-offs), while test-only and docs-only changes get near-empty descriptions leaning on links. Description length tracks the *risk* of the change, not its diff size (#97753 removes 5,139 lines but needs only one paragraph of explanation).

## Voice & tone
- Mixed imperative/descriptive: titles are imperative ("Honor", "Store", "Remove", "add", "document"); bodies are descriptive present-tense ("The geo/IP transform skips its deployment prompt…", "That reporting is now handled by the Next.js maintainer agent").
- Mostly third-person/impersonal. No bare "I"; #98030 comes closest with neutral framing. No exclamation marks, no marketing tone — uniformly dry engineering register.
- Technical terms are wrapped in backticks liberally (`runTransform`, `min_hash`/`max_hash`, `next repo-actions`), and numerals are preferred over words ("≤ 32 bytes", "10 files").

## Content habits
- **Linked issues**: 2 of 5 PRs close something, always via a bare URL behind a `Closes:` prefix (#97987 closes a *PR*, #97968 closes issue #97959) — never the shorthand `Fixes #N` form. Follow-up chains reference previous PRs as bullet lists of URLs (#97987 lists #82488, #82384).
- **Test plans / benchmarks**: only #97480 has an explicit verification section — three benchmark tables measured "against `canary`, baseline and comparison run back to back on the same machine", including the honest admission that "Six of thirteen write configurations came out as noise (p >= 0.05) and are omitted". The other 4 PRs contain no test-plan text at all.
- **Risk/trade-off callouts**: #97480 stands out with a dedicated `## Why this is safe` section arguing invariants ("Hash-based routing is unchanged… the AMQF, and compaction's coverage model all work exactly as before") and explicitly pricing the regression ("Adds a small cost to writing… a double cost to compaction").
- **Screenshots/images**: none.
- **Breaking-change callouts / reviewer ask-outs**: none observed.
- **Metadata hygiene**: zero labels and zero linked issues in GitHub metadata across all 5 PRs — linkage lives only in free-text body lines.

## Bot-generated content
None. No CodeRabbit/Copilot "Summary" blocks, no AI footers, no generated-release-notes scaffolding in any of the 5 descriptions. The writing has an unmistakably human, first-person-revision flavor (e.g. #97480's "reproduced at +10.2%" parenthetical and #98030's causal "Because the non-interactive state was not forwarded…"). Interesting counter-signal: #97753 *references* automation — "That reporting is now handled by the Next.js maintainer agent" — the repo uses AI agents as workflow tooling, but their PR bodies are still hand-written.

## Notable exemplars
- **PR #97480** — https://github.com/vercel/next.js/pull/97480 — the strongest sample: a What/Why-safe/Benchmarks structure with quantified before/after tables, an explicit safety argument, and honest reporting of regressed and noise-level configurations; the 14-review count reflects the rigor it invites.
- **PR #98030** — https://github.com/vercel/next.js/pull/98030 — best minimal shape: `### Why?`/`### How?` in ~75 words, with a precise root-cause sentence, proving small PRs can still carry full context.
