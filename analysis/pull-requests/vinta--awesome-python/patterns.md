# PR Patterns: vinta/awesome-python

## Corpus
- PRs analyzed: 5 (numbers: #3288, #3284, #3297, #3301, #3302)
- Caveat: the sample splits into two distinct kinds — one large maintainer governance PR by the repo owner (#3288, +1320/-551, 28 files) and four single-line list additions (+1/-0 each) by three different external contributors. One contributor (JinyangWang27) authored 2 of the 4 additions (#3301, #3302). The sample is too small and skewed toward "Add X" entries to characterize maintainer code PRs; conclusions about template-driven submissions are on firmer ground.

## Titles
Two clear title formats observed:
- Contribution PRs (4 of 5): literal `Add <project-name>` — "Add SeleniumBase" (#3284), "Add hishel" (#3297), "Add semantica" (#3301), "Add openviking" (#3302). This is mandated by the PR template itself, which requires checking the box "PR title format: `Add project-name`". No type prefix, no scope, no emoji, no trailing period; project name kept in its native casing (lowercase `hishel`, `semantica`, `openviking`; CamelCase `SeleniumBase`).
- Maintainer PR (1 of 5): a full descriptive sentence, no conventional-commit prefix — "Reposition awesome-python as a shortlist, not a catalog" (#3288).
- Lengths: 16–56 characters, all single line, title case avoided in favor of sentence-style or bare names.

## Description structure
Two completely different structures coexist:

The 4 contribution PRs use the repo's PR template with `##` (H2) headers in a fixed order. Two template generations are visible:
- #3284 (older template): `## Project` → `## Checklist` (4 checked boxes) → `## Why This Project Is Awesome` (with a "Which criterion does it meet? (pick one)" radio checklist: Industry Standard / Rising Star / Hidden Gem) → `## How It Differs` (prose justification).
- #3297, #3301, #3302 (newer, consistent with the "shortlist, not catalog" repositioning in #3288): `## Project` → `## Checklist` (7 checked boxes, e.g. "Placed in an existing use case (new sections and subcategories are maintainer-only)") → `## Which Tier` (radio: Obvious choice / Challenger, with "Explain:") → optional `## Displacement` (#3297 only).

The maintainer PR #3288 uses its own freeform H2 sections in the order: prose intro paragraph → `## Rules` → `## Data` → `## Website` → `## Maintainer tooling`, mixing prose and bullets; it closes with a metric summary ("The list went from 576 entries to 487 so far.").

Checklists dominate the contribution PRs; prose is reserved for the "Explain"/"How It Differs" fields.

## Template usage
Strong evidence of an enforced PR template. In 4 of 5 PRs the headers are identical boilerplate (`## Project`, `## Checklist`, `## Which Tier`), and the checklists quote the template's own rules verbatim (e.g. "Entry format: `- [pypi-name](https://github.com/owner/repo) - Description ending with period.`", "Meets all Quality Requirements: active, stable, documented, at least 1 month old"). All boxes are pre-checked with `[X]`/`[x]`; the unchosen tier options are left unchecked (`- [ ] **Challenger**`), showing the radio-choice scaffold. Template drift is visible: #3284 carries the older "Why This Project Is Awesome / Industry Standard / Rising Star / Hidden Gem" scaffold, replaced in later PRs by the "Which Tier / Obvious choice / Challenger / Displacement" scaffold introduced alongside the shortlist policy. Unfilled prompts occur: #3284 leaves "Explain:" empty, and #3302 adds a stray `## Challenger` header below "Explain:" instead of filling it inline. Conclusion: **template** (mandatory, checklist-heavy, two generations observed).

## Length & density
Approximate body word counts:
- #3288: ~250 words (longest; governance change spanning rules, data, website, tooling)
- #3284: ~180 words (bulk is the "How It Differs" evidence paragraph)
- #3297: ~130 words
- #3301: ~160 words
- #3302: ~80 words (shortest; boilerplate dominates, little original prose)

Pattern: descriptions are mostly template scaffolding with a small core of original prose; density is high — every prose sentence carries evidence (usage stats, feature claims). One-line diffs (+1/-0) match the short bodies.

## Voice & tone
- Contribution PRs: third-person declarative, evidence-first. Claims are framed as facts with numbers: "With 12,500+ GitHub stars and over 70M installs from PyPI" (#3284), "5.6M downloads/month (pypistats), 1.x since Oct 2025, latest release Aug 2026" (#3297). Zero first person in the four submissions.
- Maintainer PR #3288: imperative normative tone for policy ("name the entry you replace and argue yours does the job better", "Removed entries are deleted outright, git history is the archive"), brisk and authoritative.
- Politeness appears once, from a contributor deferring to maintainer prerogative: "happy to move it if you prefer the subcategory" (#3297).

## Content habits
- **Evidence over enthusiasm**: merged "Add" PRs justify admission with adoption metrics (PyPI downloads, GitHub stars, release recency) rather than adjectives — consistent with #3288's rule that admission is "informed primarily by PyPI download counts rather than GitHub stars".
- **Displacement/placement reasoning**: #3297 explicitly addresses the at-most-5 cap ("Not needed — Caching had 4 entries, this makes 5") and even proposes an alternate home ("an 'HTTP Caching' subcategory under HTTP Clients"), showing the shortlist policy shapes PR content directly.
- **Linked issues**: none in any PR (all 5 report "Linked issues: none").
- **Screenshots/images**: none — unsurprising for single-line list additions and doc/infra work.
- **Test plans / breaking changes / reviewer ask-outs**: none; the checklist itself serves as the compliance artifact in place of a test plan.
- **Labels**: none on any of the 5 PRs. Review engagement is minimal (0–1 comments/reviews each) — merges are largely checklist-driven.

## Bot-generated content
No bot-generated description content in any of the 5 PRs — no CodeRabbit "Summary by …" blocks, no Copilot autofill signatures, no AI-disclaimer footers. All bodies are either verbatim repo template scaffolding or hand-written prose. As a counterpoint, the template-heavy format means a large share of each contribution PR is pre-written boilerplate by design, leaving little room (or need) for AI summarization.

## Notable exemplars
- **PR #3297** — https://github.com/vinta/awesome-python/pull/3297 — the model contribution: fully completed newer-generation checklist, a quantified tier justification ("5.6M downloads/month … latest release Aug 2026"), explicit displacement analysis against the 5-entry cap, and a proactive alternative-placement proposal that defers to maintainers.
- **PR #3288** — https://github.com/vinta/awesome-python/pull/3288 — exemplary maintainer governance PR: a one-sentence thesis ("a shortlist, not a catalog"), normative rules, data tooling, and a closing quantified outcome ("576 entries to 487"), with links to CONTRIBUTING.md and an ADR for full rationale.
