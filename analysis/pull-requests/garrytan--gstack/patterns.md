# PR Patterns: garrytan/gstack

## Corpus
- PRs analyzed: 5 (numbers: #2700, #2691, #2710, #2721, #2722)
- Caveat: all 5 PRs are by the same author (garrytan, the repo owner), all merged within a 3-day window (2026-08-27 → 2026-08-29) with 0 recorded reviews, and every description carries a "🤖 Generated with Claude Code" footer plus a Conductor workspace link. This sample measures one maintainer's AI-driven `/ship` workflow output, not organic community PR style — generalization to other contributors is impossible from this corpus.

## Titles
Every title prefixes a semver version and then a conventional-commit-style type or a custom scope:
- `v1.70.1.0 fix: ship names the /document-release subagent at every decision point (tripwire + gate E2E)` (#2700)
- `v1.71.0.0 feat: token-load reduction — preamble runtime scripts, gated onboarding, 20 skill carves, CLAUDE.md trim` (#2691)
- `v[IP_REDACTED] feat: Aside recommended driver for third-party web actions` (#2710)
- `v[IP_REDACTED] test/CI overhaul: green means green, suites restructured for speed` (#2721)
- `v1.75.0.0 feat: ponytail import wave — simplification review lens, arm benchmark, reuse ladder, instruction-tier digest` (#2722)

Pattern: `vX.Y.Z.0 <type>: <summary>` where the version has four segments (`v1.75.0.0`) and the type is `feat:` (3×), `fix:` (1×), or a bespoke scope (`test/CI overhaul:`). Titles are long (roughly 75–115 characters), sentence-case, no emoji, no trailing period. Two titles use an em-dash + comma list to pack in 3–4 headline items. Notable inconsistency: #2721's title says `v[IP_REDACTED]` but its description opens with `## v1.73.0.0 — test/CI overhaul…`, revealing the body was drafted before the release-queue rebump.

## Description structure
4 of 5 PRs follow an identical, heavily structured H2-only scaffold. The canonical order observed in #2700, #2691, and #2722 is:

1. `## Summary` — bold-led thematic groups (`**Fix — Step 18 visibility restored…**`, `**Tests — …**`), dense bullets with inline code paths
2. `## Test Coverage` — prose plus an ASCII coverage map in a fenced block, e.g. #2700's `COVERAGE: 11/11 changed paths (100%) | GAPS: 0` and #2722's tree with `[★ TESTED]` / `[→EVAL]` per-branch annotations
3. `## Pre-Landing Review` — findings tally by specialist ("24 findings (2 critical, 22 informational) from 4 specialists…" #2691)
4. `## Design Review` — boilerplate "No frontend files changed — design review skipped." in all 4
5. `## Eval Results` — exact pass/fail with costs ("89 pass / 0 fail, ~$11.60 total" #2710)
6. `## Scope Drift` — ritualized `Scope Check: CLEAN` + Intent/Delivered pair
7. `## Plan Completion` — accounting against a pre-approved plan ("48 plan items: 46 DONE, 1 CHANGED…" #2700)
8. `## Verification Results` — usually a documented skip ("Skipped: no dev server (CLI/skill repo)")
9. `## TODOS` — follow-ups filed with priorities (P1/P2/P3)
10. `## Documentation` — doc-diff preview with commit SHAs; optional `### Documentation Debt` sub-list with ⚠️ entries (#2700, #2710, #2722)
11. `## Test plan` — `- [x]` checklist, every box pre-checked

Deviations are additive: #2691 inserts `## The receipt` (before/after table) and `## Greptile Review`; #2710 inserts `## Adversarial Review` and `## Environment notes (for reviewers)`; #2722 appends `## Decisions taken autonomously (Conductor cloud session, no operator mid-run)`. The exception is #2721, which abandons the scaffold entirely: one H2 heading (`## v1.73.0.0 — test/CI overhaul…`) with H3 sections (`### What green means now (fixed + tripwired)`, `### Speed / structure`, `### Verification`, `### Parity → cutover (follow-up PR)`, `### Deliberate deviations from the approved plan`) and no Test plan checklist.

## Template usage
Not a repo `.github/PULL_REQUEST_TEMPLATE.md` scaffold — there are no "How Has This Been Tested"-style prompts or unfilled placeholders. Instead the near-verbatim section sequence, ritual lines that repeat word-for-word across PRs ("Scope Check: CLEAN", "No frontend files changed — design review skipped."), and the uniform footer are the signature of the project's own `/ship` automation (the body even credits it: descriptions reference the `/ship` skill, plan items, and review army). Conclusion: **machine-generated template** — the structurally strongest and most consistent in this corpus family; effectively a ship-report receipt rather than a hand-written description.

## Length & density
Extremely long for merged-PR descriptions — approximate word counts per description body:
- #2700: ~1,170 words
- #2691: ~1,450 words
- #2710: ~1,070 words
- #2721: ~620 words (the short outlier, yet still dense)
- #2722: ~2,160 words

Density is maximal: nearly every line carries a concrete number, file path, commit SHA, or receipt ("skeleton byte cap 91,600 → 92,300 (measured 91,764)" #2700; "298 timeout literals → 5 tiers" #2721). Zero filler; the trade-off is sheer reading time — these are audit documents, not skimmable summaries.

## Voice & tone
- Declarative/descriptive past-and-present tense, not imperative ("dispatch matching the Step 18 prompt markers appears", "consent gates fire in interactive sessions only"). Imperative survives only in the conventional-commit title types.
- Almost no first person; the one human-authorial intrusion is #2722's "Decisions taken autonomously" section, where the AI agent explains its own judgment calls ("Decision logged to the ledger. Trivially amendable pre-merge if you want a different level.") — written in the tool's voice, addressed to the owner.
- Register is self-auditing and evidence-obsessed: failures are admitted with receipts rather than hidden ("that coverage is missing on this ship, not clean" #2700; "documented gap, NOT a clean bill" #2722).

## Content habits
- **Linked issues:** none — all 5 PRs have "Linked issues: none", no "Fixes #N", no cross-PR references. Context is carried by version numbers and the CHANGELOG instead.
- **Test plans:** systematic and quantified — every PR ends with a fully-checked `- [x]` list citing exact suites and counts ("3,843 + 903 + 37 tests across shards, exit 0" #2722), plus paid-vs-free tier breakdowns and dollar costs ("~$11.60 total" #2710).
- **Screenshots/images:** none — expected, since this is a CLI/skill corpus with no UI; every "Design Review" section is a skip note.
- **Breaking-change callouts:** no dedicated section, but behavioral reversals are flagged inline ("Supersedes the v1.65.0.0 de-Aside stance by explicit user directive (2026-08-27)" #2710).
- **Reviewer ask-outs:** none in the conventional sense (0 reviews recorded); instead reviewers get structured aids — `## Environment notes (for reviewers)` (#2710), pre-reviewed finding tallies, and filed follow-up TODOs. Labels: none on any PR.
- **Merge ordering quirks are surfaced openly**: #2691 notes "main queue-advanced to v1.70.1.0 before this landed", and #2722's body explains the v1.74.0.0 catch-up/re-bump.

## Bot-generated content
The entire corpus is bot-generated. Every description ends with the verbatim footer:

> 🤖 Generated with [Claude Code](https://claude.com/claude-code)
> <!-- conductor-workspace-link -->
> [Open workspace in Conductor](https://app.conductor.build/workspace/…)

The maintainer keeps this structure intact — the boilerplate is the ship pipeline's own output and is clearly the point of the repo (gstack is an AI-agent skill toolkit). Additionally, #2691 contains a `## Greptile Review` section ("No Greptile comments."), showing a second bot integration whose output is folded into the body rather than posted as a PR comment. For a PR-description generator, this repo is the *most extreme* competitor sample in the corpus: the "description" is a full ship receipt with coverage maps, eval ledgers, and review-army tallies that a generic summarizer cannot reproduce without the pipeline's data.

## Notable exemplars
- **PR #2700** — https://github.com/garrytan/gstack/pull/2700 — the most disciplined sample: a one-bug fix narrated as root cause ("the wiring survived, the visibility didn't"), a 100%-coverage ASCII map, and an explicit remediation ledger for 14 review findings; completeness even extends to admitting missing cross-model coverage.
- **PR #2721** — https://github.com/garrytan/gstack/pull/2721 — the counterexample worth studying: it drops the rigid scaffold for five tight H3 sections and delivers a CI overhaul story in ~620 words, making it the only genuinely skimmable PR in the set (despite its description header carrying the stale v1.73.0.0 version).
