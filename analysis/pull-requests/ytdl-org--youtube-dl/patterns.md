# PR Patterns: ytdl-org/youtube-dl

## Corpus
- PRs analyzed: 5 (numbers: #33109, #33189, #33198, #33216, #33227)
- Caveat: all 5 PRs are by the same author (dirkf, the de facto maintainer), spanning 2025-04 → 2025-11. Four of five were merged with 0 reviews and 0 comments (#33216 has 9 comments, #33227 has 1 review) — i.e. maintainer self-merges. This sample documents one maintainer's PR style only, not a contributor-wide convention, and since he authored the repo's PR template practice, it may not reflect how external contributors write.

## Titles
Titles use a bracketed scope-prefix convention, **not** Conventional Commits (no `fix:`/`feat:` colon format; brackets instead of parens):
- `[YouTube] Update extractor for 2025-04, etc` (#33109)
- `[YouTube, misc] Back-ports from yt-dlp for broken YT player \`2b83d2e0\` and later` (#33189)
- `[YouTube] Rework alert handling, etc` (#33198)
- `[YouTube,etc]` (#33216)
- `[YouTube] YouTube etc, pt 2` (#33227)

Pattern: `[Component(, misc)] <imperative-ish summary>`. Scope is always `YouTube` dominant (5/5), sometimes augmented (`misc`, `etc`). Notably sloppy at the edges: two titles end in a dangling "etc" (#33109, #33198), one is just `[YouTube,etc]` with no summary at all (#33216 — later edited? The body is detailed), one is "YouTube etc, pt 2" (#33227). Title casing is sentence-case, no emoji, no trailing period, lengths from 12 to 75 chars. The single most descriptive title embeds an opaque player hash in backticks (\`2b83d2e0\`).

## Description structure
Every description has two zones: a collapsed `<details>` block containing the repo's PR-template boilerplate, then a freeform body under the template's own header `### Description of your *pull request* and other information` (H3). Per PR body (post-template):

- PR #33109: opening prose paragraph ("The main object of this PR is to update the Youtube extractor to handle the latest players and improve compatibility with _yt-dlp_:"), then a nested bullet changelog with component tags as bullet prefixes — `* [cache]`, `* [JSInterp]` with `- ` sub-bullets ("unary operator handling is improved, now supporting \`!\`"), then a second section "Rolled in are these changes:" with more `[compat]`/`[utils]`/`[core]` tagged bullets, closing with "Thx to relevant contributors per commit messages."
- PR #33189: prose opener ("This PR primarily addresses the problem of #33186. It includes a version of the interim fix from yt-dlp/yt-dlp#14398 (fixes #33187): thx @seproDev."), then a flat bullet list "The PR also includes these changes:" with per-bullet cross-repo citations and thanks.
- PR #33198: three bare bullets ("* Reworks alert handling: fixes #33196", "* Corrects some latent typos from #33189", "* Modernises and simplifies some traversals."), then a prose paragraph about CI/dependency breakage.
- PR #33216: prose opener, an informal "Under the hood" plain-text label (not a markdown header), a long bullet list of compat/traversal additions and sub-bulleted YT fixes, closing with two bare lines "Resolves #33200." / "Resolves #33212."
- PR #33227: two lines only — "See commit text." / "Fixes #33226."

No consistent section headers beyond the template's own; sub-structure within the body is ad hoc (`Under the hood` is not even a heading). Bullets dominate over prose 4:1.

## Template usage
Strong evidence of an enforced repo PR template, used in 5/5 PRs. The verbatim checklist appears in every description:
- "### Before submitting a *pull request* make sure you have:" with `[x]` items — searched the bugtracker, read the extractor tutorial, read coding conventions, "Covered the code with tests (note that PRs without tests will be REJECTED)", "Checked the code with flake8".
- "### In order to be accepted and merged into youtube-dl each piece of code must be in public domain or released under [Unlicense]…" — a legal/licensing checkbox pair where the author edits the option text inline (e.g. #33109: "I am the original author of this code, except for portions from_yt-dlp_ for which this or the below have already been asserted"; #33189 checks *both* boxes, appending ": code from yt-dlp under Unlicense").
- "### What is the purpose of your *pull request*?" checkbox set (Bug fix / Improvement / New extractor / New feature).

The author's signature habit: he wraps the whole template in `<details><summary>Boilerplate: <hand-written recap></summary>` where the summary itself summarizes the checked options — e.g. "Boilerplate: own+yt-dlp code/bug fix+improvement" (#33109), "Boilerplate: yt-dlp+own code, bug fix+new features" (#33189). Template fidelity is imperfect: #33189 has a duplicated "## Please follow the guide below" line and its `<details>` tag opens *after* the first heading (a copy-paste glitch left in the merged description). Conclusion: **template — fully enforced and always filled, but habitually collapsed and partly mangled**.

## Length & density
Counting only the freeform body after the boilerplate:
- #33109: ~200 words (longest; two bullet-change sections)
- #33189: ~170 words
- #33198: ~75 words
- #33216: ~180 words
- #33227: ~5 words ("See commit text. Fixes #33226.")

Density is high: bullets are dense change-log entries with backticked identifiers (`compat_os_makedirs()`, `available_at`, `--no-list-formats`) rather than narrative. But boilerplate is huge relative to content — in #33227 the description is >95% collapsed template and ~5 words of substance. Pattern: concise-and-dense, with the tails (very long vs "See commit text") showing no minimum-length norm.

## Voice & tone
- Mostly descriptive/declarative third person about the PR itself: "The main object of this PR is to update…" (#33109), "This PR primarily addresses the problem of #33186" (#33189), "This PR updates the YT extractor to use different clients…" (#33216). Bullets often switch to terse imperative-ish changelog verbs: "Reworks", "Corrects", "Modernises", "adds", "aligns", "fixes".
- Minimal first person; the one personal register is wry asides: "Perhaps too long delayed, the program version is updated." (#33109); "and now we have to run the Windows stuff in Windows Server 2022, which apparently still supports our Py3.4 build." (#33189); "(presumably) undependable dependencies caused the previously functional commit workflow to break" (#33198). British spellings ("Modernises").
- Pervasive credit-giving: "thx @seproDev", "thx @bashonly" (×4 in #33189), "thx yt-dlp devs severally", "Thx to relevant contributors per commit messages." Informal, collegial, low-formality engineering register.

## Content habits
- **Linked issues**: 4 of 5 PRs link issues, always with `fixes`/`Resolves` keywords — inline in bullets ("Reworks alert handling: fixes #33196", #33198), mid-sentence ("(fixes #33187)", #33189), or as bare closing lines ("Resolves #33200.\nResolves #33212.", #33216; "Fixes #33226." as the entire rationale, #33227).
- **Cross-repo references**: a defining habit — citations of yt-dlp PRs in `owner/repo#N` form appear constantly: "yt-dlp/yt-dlp#14398", "yt-dlp/yt-dlp#14081", "yt-dlp/yt-dlp#13659", "yt-dlp/yt-dlp#13411", "yt-dlp/yt-dlp#14078", "yt-dlp/yt-dlp#13665", "yt-dlp/yt-dlp#14378", "yt-dlp/yt-dlp#14157", "yt-dlp/yt-dlp#13665". Back-porting from yt-dlp is the dominant PR genre here.
- **Test plans**: no dedicated test-plan section in any PR; testing is asserted only via the template's `[x] Covered the code with tests` checkbox. New tests are mentioned as change bullets ("add new signature tests", #33109) not as verification evidence.
- **Screenshots/images**: none — expected for a CLI extractor codebase.
- **Breaking-change callouts / reviewer ask-outs**: none. CI/infra notes (Windows Server 2022, wheel/setuptools pinning) are mentioned as asides, not callouts.
- **Labels**: none on any of the 5 PRs.

## Bot-generated content
None observed. No CodeRabbit/Copilot summary blocks, no AI-generation disclaimers, no bot-authored sections in any of the 5 descriptions. The only automation artifact is the human-filled repo template itself, and the author actively fights it — collapsing it into `<details>` and replacing the visible summary with his own one-line recap ("Boilerplate: …"), which is a maintainer manually doing the job a summary bot would do.

## Notable exemplars
- **PR #33189** — https://github.com/ytdl-org/youtube-dl/pull/33189 — the strongest sample: opens with the root-cause issue, attributes the interim fix to its yt-dlp source with author credit, enumerates every rolled-in change with a per-bullet upstream citation and thanks, and closes each functional fix with the issue it resolves.
- **PR #33109** — https://github.com/ytdl-org/youtube-dl/pull/33109 — best-organized body: a stated objective, component-tagged bullet changelog (`[JSInterp]`, `[YouTube]`, `[compat]`) with two nesting levels, and an explicit "Rolled in are these changes:" separation between the main goal and bundled extras.

Counterpoint: **#33227** ("See commit text. Fixes #33226.") and **#33216** (title `[YouTube,etc]`, no summary) show the same author at his least disciplined — merged anyway, since these are self-merges with zero review.

Overall this repo is a mixed case for PR-writing quality: a strict enforced template with legal/licensing rigor, excellent cross-repo attribution habits, and dense informative changelogs — but also self-merged PRs with placeholder titles and one-line bodies. Exemplar of attribution/credit culture; counterexample of title discipline and review hygiene.
