# PR Patterns: nodejs/node

## Corpus
- PRs analyzed: 5 (numbers: #65278, #65406, #65622, #61415, #65618)
- Good author diversity for the sample size: 5 distinct authors (trivikr, codebytere, panva, joyeecheung, aduh95), all established Node.js collaborators. However, 4 of 5 were merged on the same day (2026-08-30); #61415 is older (merged 2026-01-28). Still only 5 samples — directional, not exhaustive.

## Titles
All 5 titles strictly follow the Node.js commit-message convention: `<subsystem>: <lowercase imperative description>` — Conventional-Commits-like but with the *subsystem* (not a type like `fix:`/`feat:`) as the prefix:
- `zlib: avoid waiting for paused ZIP iterators` (#65278)
- `node-api: enter env context for async callbacks` (#65406)
- `src: add missing vector include` (#65622)
- `async_hooks: add trackPromises option to createHook()` (#61415)
- `doc: clarify DEP0207 scope` (#65618)

Subsystems observed: zlib, node-api, src, async_hooks, doc. Verb after the colon is lowercase imperative in all 5 (`avoid`, `enter`, `add`, `add`, `clarify`). Lengths ~30–55 chars, single line, no emoji, no trailing period, no PR-number suffixes. 100% convention compliance — this convention is enforced because PR titles become commit messages in node's squash-merge workflow.

## Description structure
No consistent section-header structure — descriptions are prose-first, and markdown headers are essentially absent:
- #65278: `Fixes: <issue URL>` line → 2-sentence explanation ("Track file-backed contentIterator() reads only while I/O is active…") → `---` → `Assisted-by:` footer. No headings.
- #65406: pure prose — 4 long technical paragraphs explaining the assertion failure (`Assertion failed: (Environment::GetCurrent(isolate)) == (env)`, quoted from a code block), the fix at three call sites, and a realm note; then a `**Tests:**` bold-text label (not a markdown heading) describing the new cctest; then `---` → AI disclosure. No `#`/`##` headings anywhere.
- #65622: single line — `Fixes: https://github.com/nodejs/node/issues/65620`. Nothing else.
- #61415: 2 short prose paragraphs → `Refs: <PR URL>` line → the full PR-template HTML comment (see Template usage). No headings.
- #65618: single line — `Refs: https://github.com/nodejs/node/pull/63249`. Nothing else.

Pattern: the description opens with a `Fixes:`/`Refs:` metadata line (4 of 5 PRs), followed by prose only as long as the change warrants. Zero `##` section headings across the entire corpus; the only structural device is a literal `---` horizontal rule separating the body from a disclosure footer (2 of 5).

## Template usage
Node.js **has** a PR template, but it is an advisory HTML comment, not a fill-in scaffold. It survives verbatim in #61415: `<!-- Before submitting a pull request, please read: - the CONTRIBUTING guide … For code changes: 1. Include tests for any bug fixes or new features. 2. Update documentation if relevant. 3. Ensure that make -j4 test … passes. … Developer's Certificate of Origin 1.1 … -->`. Because it renders invisibly, authors routinely leave it in — there are no `- [ ]` checklists, no "How Has This Been Tested" sections, no unfilled prompts anywhere in the corpus. The other 4 PRs show no template residue (either deleted or written over). Conclusion: **template exists but is non-structural — effective practice is freeform prose**, with the repo relying on the subsystem:title convention and review culture instead of description scaffolding.

## Length & density
Bimodal — either very short or very thorough, scaled to change complexity:
- #65622: ~5 words (one-liner trivial `+<1>` include fix)
- #65618: ~4 words (doc clarification, context carried by the linked PR)
- #65278: ~55 words (+26 -4)
- #61415: ~85 words of authored prose (+145 -9, semver-minor feature)
- #65406: ~330 words (+109 -0, subtle multi-environment C++ bug)

Density is high: no filler, no greetings, no "please review" boilerplate. The longest description (#65406) is dense mechanism-explanation prose, not padded structure.

## Voice & tone
- Third-person, descriptive, present-tense engineering register: "This adds a trackPromises option that allows users to completely opt out…" (#61415); "This enters the node-api env's context at those three sites" (#65406).
- No first person; the only `@`-mention is in the AI disclosure ("directed and reviewed by @codebytere", #65406).
- Highly technical vocabulary assumed (isolates, Environments, persistent handles, cctest) with exact symbol references in backticks — written for expert reviewers, no onboarding explanations.
- Formal but plain; zero exclamation marks, emoji, or marketing language.

## Content habits
- **Linked issues**: referenced by *full URL*, not `#N` shorthand, and via labeled metadata lines: "Fixes: https://github.com/nodejs/node/issues/65277" (#65278), "Fixes: …/issues/65620" (#65622), "Refs: …/pull/57148" (#61415), "Refs: …/pull/63249" (#65618). 4 of 5 PRs carry exactly one such line as the first or last body line; #65406 has none.
- **Test plans**: no checklists; test evidence is folded into prose. #65406: "**Tests:** new cctest `NodeApiTest.AsyncCallbacksEnterOwnContext` … it hits the assertion above on `main` and passes here. cctest, node-api, js-native-api and async-hooks suites pass." #61415 notes prior internal usage; trivial fixes (#65622, #65618) give none.
- **Screenshots/images**: none — corpus is all runtime/C++/doc changes, no UI surface.
- **Breaking-change callouts / reviewer ask-outs**: none in description bodies; process signals live in labels instead (`semver-minor`, `dont-land-on-v22.x/v24.x/v26.x` on #65618, `fast-track` on #65622, `commit-queue-squash` on #61415).
- Inline crash output: #65406 pastes the actual assertion failure in a fenced code block — the one "attachment-style" content habit observed.

## Bot-generated content
No CodeRabbit/Copilot auto-summary blocks. However, **2 of 5 PRs carry explicit AI-assistance disclosures, placed after a `---` rule at the very bottom**:
- #65278: `Assisted-by: codex:gpt-5.6-sol` — one-line trailer, mimicking a git `Co-authored-by:` footer.
- #65406: "Disclosure: the code, test and this description were written by Claude Code, directed and reviewed by @codebytere." — a full-sentence disclosure including that the *description itself* is AI-written.

Both were merged with the disclosure intact, indicating maintainers keep (and possibly require) AI attribution as a footer rather than stripping it. The disclosed-AI description (#65406) is also the longest and most rigorously structured in the corpus — notable for competitors: node authors, when using AI, produce mechanism-first prose with named test suites, not section-headed summaries.

## Notable exemplars
- **PR #65406** — https://github.com/nodejs/node/pull/65406 — the strongest sample: quotes the exact assertion failure, explains *why* the scoping bug only manifests with two Environments per isolate, justifies the narrow `Finalize()` scope against a use-after-free edge case, names the new test and the four suites run, and discloses AI authorship — a complete audit trail with zero scaffolding.
- **PR #65278** — https://github.com/nodejs/node/pull/65278 — the ideal small-fix shape: `Fixes:` link, two sentences stating mechanism and behavioral effect, AI-assist trailer; nothing more needed for a +26/-4 change.
