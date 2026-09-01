# PR Patterns: 2dust/v2rayN

## Corpus
- PRs analyzed: 5 (numbers: #10026, #10015, #10017, #10027, #10054)
- Caveat: all 5 PRs are by the same author (aleksandr-miheichev), all created 2026-08-22 → 2026-08-28 and merged within ~24 hours (2026-08-28 → 2026-08-29). Every PR has 0 reviews, 0 comments, no labels, and no linked issues. This is one contributor's PR style (apparently merged without recorded review discussion), not evidence of repo-wide convention — the sample is too small and homogeneous to generalize.

## Titles
All 5 titles strictly follow Conventional Commits with a scope:
- `fix(hysteria2): default the port to 443 when the share URI omits it` (#10026)
- `i18n(ru): translate newly added UI strings` (#10015)
- `test: cover the share-URI round trip for the remaining protocols` (#10017)
- `fix(fmt): stop share-URI query values from being decoded twice or dropped` (#10027)
- `ci: run the test job on pushes to master` (#10054)

Pattern: `<type>(<scope>): <lowercase imperative description>`. Types observed: `fix` (2×), `i18n`, `test`, `ci`. Scope is a module/area (`hysteria2`, `ru`, `fmt`); omitted for #10017 (repo-wide test coverage) and #10054 (`ci` is self-scoping). All-lowercase after the colon, no capitalization, no emoji, no trailing period, no PR-number suffixes. Lengths ~45–75 characters — longer than typical one-liners because the subject carries the full claim ("stop share-URI query values from being decoded twice or dropped").

## Description structure
Descriptions are long-form technical essays built from `##` (H2) section headers, mixing prose paragraphs, code fences, and tables. Per PR (headers quoted exactly, in order):

- #10026: prose preamble (URI-spec citation + diff block), then `## Testing`
- #10015: 3 prose paragraphs, no section headers at all
- #10017: prose preamble, `## Round trips` (table), `## Guard against the next protocol`, `## What a round trip cannot prove`, `## Fixtures`, `## Testing` (command + mutation table)
- #10027: one-line preamble ("Two defects in the same place, both on the import side, both silent."), `## The value is unescaped twice`, `## A value containing `=` is dropped`, `## The change` (two diff blocks), `## One behaviour change worth naming`, `## Testing`
- #10054: pure prose, 3 paragraphs, no headers

Common placement when headers exist: defect/mechanism analysis sections first, `## Testing` last (#10026, #10017, #10027). Prose dominates over bullets; bullets appear only for enumerating concrete cases (#10027's two dropped-value examples, #10054's two CI gaps). Tables are used for structured mappings (test → fields pinned; mutation → test that caught it). Inline `` `code` `` is used heavily for identifiers (`Hysteria2Fmt.Resolve`, `url.Port`, `ProtocolShares`).

## Template usage
No evidence of a repo PR template: no `- [ ]` checklists, no "How Has This Been Tested"-style scaffold, no boilerplate instructions, no unfilled prompts. There is also no repeated self-imposed structure across PRs beyond a closing `## Testing` section (present in 3 of 5) — section titles are bespoke per PR (`## What a round trip cannot prove`, `## One behaviour change worth naming`). Conclusion: **freeform**, authored fresh each time.

## Length & density
Substantially long, high-density descriptions (approximate body word counts):
- #10026: ~330 words + diff + test output
- #10015: ~200 words (the shortest)
- #10017: ~520 words + 2 tables + command output
- #10027: ~560 words + 2 diff blocks + test output
- #10054: ~150 words (short, matching its 11-line CI change)

Median ~330 words; #10017 and #10027 are effectively mini design/risk documents. Density is high: nearly every sentence carries technical content (root cause, boundary conditions, or evidence) — no greetings, thanks, or filler. Description length correlates with risk, not diff size: #10027 (+82/-2) gets the longest treatment because it changes a 36-call-site shared helper.

## Voice & tone
- Descriptive/analytical register, written like a code-review argument: claims are stated, then bounded ("Only well-formed sequences are affected, which is exactly why this is hard to notice").
- The only first person in the corpus appears in #10027, deliberately, to defer a scoping decision to the maintainer: "collapsing them touches 36 call sites, so that seemed better as your call than mine" and "It is the only input class I found where the previous behaviour gave the better result."
- Precise and formal but not stiff; occasional aphoristic lines: "A test that has never failed is not evidence" (#10017), "Two defects in the same place, both on the import side, both silent" (#10027).
- External authority is cited with links: the Hysteria2 URI scheme spec (#10026), RFC 3986 sub-delimiter rules (#10027).
- Second person absent except in the maintainer-directed note above; no imperative "please review" phrasing.

## Content habits
- **Linked issues**: none — 0 of 5 PRs reference or close an issue; all appear to be proactively found defects/gaps. Cross-references are to prior PRs instead ("Since #9888 the allow-insecure flag is spelled per protocol" in #10017).
- **Test plans**: the dominant habit. 4 of 5 PRs give explicit verification evidence. Three paste raw `dotnet test` output including *failing-then-passing* runs to prove the tests detect the bug ("The tests were written first and fail on `master`", #10026; failure output shown in Russian-locale `сбой …` lines). #10017 goes further with documented **mutation testing**: a 7-row table mapping deliberate code sabotage ("`TuicFmt` writes `allowInsecure` instead of `allow_insecure`") to the test that turned red, "Nine failures for seven mutations… and every mutation reverted afterwards." #10015 records Release builds of both heads plus 69/69 unit tests and runtime satellite-assembly key resolution.
- **Control tests**: twice the author explicitly calls out controls that must pass *before and after* to pin a boundary (`ResolveConfig_WithExplicitZeroPort_ShouldNotApplyTheDefault` in #10026; the "decoded exactly once" control in #10027).
- **Behavior-change disclosure**: #10027 dedicates a section ("## One behaviour change worth naming") to the one input class where the old code behaved better — proactively surfacing a regression-shaped trade-off.
- **Scope-deferral to maintainer**: #10027 explicitly keeps a refactor out of scope and hands the decision over ("so that seemed better as your call than mine").
- **Screenshots/images**: none — consistent with a code/CLI-oriented change set (protocol parsing, tests, i18n resources, CI).
- **Breaking-change callouts / reviewer ask-outs**: none, beyond the single scoping deferral noted above.
- **Labels, reviewers, assignees**: none on any PR; merge happened with no recorded review conversation.

## Bot-generated content
No bot-generated content in any of the 5 descriptions — no CodeRabbit "Summary" blocks, no Copilot-generated walkthroughs, no AI-attribution footers. The descriptions' idiosyncratic structure (bespoke section titles, mutation-testing tables, Russian-locale test output pasted verbatim, a boundary-punning "both silent" opener) reads as human-authored. Caveat: the polish and uniformity of register across 5 PRs in one week is consistent with AI-*assisted* drafting, but there is no structural signature of it, and nothing maintainers would have needed to strip.

## Notable exemplars
- **PR #10027** — https://github.com/2dust/v2rayN/pull/10027 — the strongest sample: two root-caused silent defects, minimal two-line diffs, an honest "one behaviour change worth naming" regression analysis, an explicit scope deferral to the maintainer, and fail-first test evidence with a both-directions control.
- **PR #10017** — https://github.com/2dust/v2rayN/pull/10017 — best verification methodology in the corpus: a round-trip coverage table, wire-format assertions that a round trip alone cannot prove, and a documented mutation-testing table proving every new test can actually fail.
