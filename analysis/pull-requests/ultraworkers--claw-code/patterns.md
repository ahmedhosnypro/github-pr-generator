# PR Patterns: ultraworkers/claw-code

## Corpus
- PRs analyzed: 5 (numbers: #3237, #3263, #3180, #3253, #3280)
- Sample spans 2026-05-28 → 2026-08-06 with 4 distinct authors (hiSandog ×2, Yeachan-Heo, EmreCelenli, Einspanner123) — more heterogeneous than a single-author sample, but 5 PRs is still too small to firmly establish repo-wide convention. Two authors' PRs (#3237, #3263) share one near-identical format, suggesting personal style rather than a repo standard.

## Titles
4 of 5 titles use Conventional Commits prefixes; 1 does not:
- `fix: validate attached redirection paths` (#3237)
- `Improve command lookup normalization` (#3263 — no prefix, capitalized imperative)
- `fix: make cc2 renderer path errors concise` (#3180)
- `docs: document mlx-lm backend for Apple Silicon and known gotchas` (#3253)
- `fix(sandbox): fall back to --map-auto when root-user mapping is restricted` (#3280)

Pattern: lowercase imperative verb after the prefix, no trailing period, no emoji. Scoped prefix appears once (`fix(sandbox)`, #3280). Lengths ~35–70 characters — longer than terse repos; titles carry real detail (`fall back to --map-auto when root-user mapping is restricted`). The mix of prefixed/unprefixed titles across merged PRs suggests the convention is customary but not enforced.

## Description structure
All 5 PRs use `##` (H2) section headers; 4 of 5 use bulleted lists, with prose reserved for context. Two distinct profiles:

Profile A — Summary/Validation (#3237, #3263, #3180): `## Summary` (2–3 lowercase-ish bullets describing changes) then `## Validation` (a literal list of commands run). #3180 quotes verbatim shell invocations such as ``python3 .omx/cc2/render_board_md.py .omx/cc2/board.json /tmp/cc2-render-0200/out.md --check``. No preamble.

Profile B — richer multi-section (#3280, #3253):
- #3280: one-line preamble ("Replaces the closed #3013 (stale, conflicts with main) with a fresh rebase onto `ultraworkers:main`."), then `## Problem` (prose), `## Fix` (prose + a numbered list of candidate mappings: `1. --user --map-root-user …, 2. --user --map-root-user --map-auto …`), `**Note**:` callout, `## Verification` (3 bullets).
- #3253: `## Summary` (one prose paragraph), `## Anti-slop triage` (3 meta-bullets: Classification / Evidence / Non-destructive review result), `## Verification` (3 checked checkboxes), `## Resolution gate` (3 checked checkboxes).

No consistent header set beyond "Validation"/"Verification"-style sections, which appear in all 5 (named "Validation" ×3, "Verification" ×2).

## Template usage
No generic repo PR template is evident — no "How Has This Been Tested" boilerplate. However, #3253 contains strongly template-shaped scaffolding unique to this repo: an `## Anti-slop triage` section ("Classification: docs-only", "Evidence: verified end-to-end on a 16GB M1 Mac running `mlx_lm.server` + `claw`") and an `## Resolution gate` checklist with items like `No automation-lane merges/closes without owner approval.` — this reads like a repo contribution protocol (an anti-AI-slop / automation-governance gate) that only 1 of 5 PRs fills out. The Summary/Validation pairing in #3237/#3263 is one author's repeated habit. Conclusion: **partial template** — a governance checklist exists and is used sporadically; otherwise freeform with a strong self-imposed "verification commands" habit.

## Length & density
- #3237: ~40 words
- #3263: ~55 words
- #3180: ~60 words (mostly command lines)
- #3253: ~120 words (meta/process content inflates it)
- #3280: ~250 words (longest; full Problem/Fix/Verification narrative with a `**Note**` dependency caveat)

Median is very short (~55 words); #3280 is the outlier but stays dense — every paragraph carries technical content (EPERM behavior, setuid helpers, subuid ranges), no filler.

## Voice & tone
- Bullets are imperative/outcome-framed ("strip attached shell redirection operators before extracting path candidates", "Prioritize exact command-name matches").
- Prose sections are third-person descriptive ("As a result the sandbox silently disables itself even though a working mapping exists", #3280).
- No first person anywhere; formal, terse engineering register. #3253 is the only description with procedural/checklist voice.

## Content habits
- **Linked issues**: none of the 5 PRs links an issue ("Linked issues: none" for all). Cross-PR references are used instead: #3280 opens with "Replaces the closed #3013", and #3253 cites an upstream bug inline ("(ml-explore/mlx-lm#973)").
- **Test plans**: the defining habit — every PR enumerates exact validation commands, e.g. `python3 -m unittest tests.test_security_scope -q` (#3237), `cargo test -p runtime sandbox` (#3280), `git diff --check` (repeated in #3237, #3263, #3253).
- **Screenshots/images**: none (all changes are backend/tooling/docs, so consistent with content).
- **Breaking-change callouts / reviewer ask-outs**: none. #3280's `**Note**:` dependency caveat (needs `newuidmap`/`newgidmap` from the `uidmap` package) is the closest thing to an operational callout.
- **Labels**: none on any PR. Review activity is thin (0–2 reviews); #3280 is the most-discussed (10 comments, 2 reviews).

## Bot-generated content
- #3180 ends with a bot signature footer: `— *[repo owner's gaebal-gajae (clawdbot) 🦞]*` — a "clawdbot" attribution, apparently the repo owner's automation agent co-authoring the PR. It is kept verbatim in the merged description.
- #3253's `## Anti-slop triage` / `## Resolution gate` sections reference "automation-lane merges/closes", implying an active bot-assisted merge pipeline whose checklist the contributor filled manually.
- No CodeRabbit/Copilot "Summary by…" blocks observed. As a competitor signal: this repo has its own bot (clawdbot) generating/signing PR content, and a triage section explicitly designed to vet AI-generated contributions.

## Notable exemplars
- **PR #3280** — https://github.com/ultraworkers/claw-code/pull/3280 — the strongest sample: it supersedes a stale PR up-front, separates `## Problem` (concrete failure mode: EPERM on restricted kernels) from `## Fix` (ordered candidate mappings), documents a dependency caveat, and closes with verifiable commands including a new regression test.
- **PR #3180** — https://github.com/ultraworkers/claw-code/pull/3180 — best validation section: 7 verbatim renderer commands covering success, failure, and `--check` paths, making the error-message change trivially reproducible.
