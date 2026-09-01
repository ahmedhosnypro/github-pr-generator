# Merged PRs: vinta/awesome-python

## PR #3288: Reposition awesome-python as a shortlist, not a catalog

- URL: https://github.com/vinta/awesome-python/pull/3288
- Author: vinta
- Merged: 2026-08-16T11:31:51Z (created: 2026-08-16T11:29:14Z)
- Stats: +1320 -551, 28 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

awesome-python is now a shortlist, not a catalog. Each use case lists at most 3 obvious choices plus 2 challengers, hard maximum 5. Full rules in [CONTRIBUTING.md](CONTRIBUTING.md), rationale in [docs/adr/0001-shortlist-not-catalog.md](docs/adr/0001-shortlist-not-catalog.md).

## Rules

- The scope test is now "serves Python developers", replacing "primarily written in Python". uv and ty are Rust, yet Python developers use them daily.
- Admission is maintainer editorial judgment, informed primarily by PyPI download counts rather than GitHub stars.
- Once a use case is full, the only way in is displacement: name the entry you replace and argue yours does the job better.
- The existing stock got the same test retroactively: worst-first sweeps, one commit per section. Removed entries are deleted outright, git history is the archive.

## Data

- 3 PyPI download fetchers: ClickPy for full sweeps (writes `website/data/pypi_downloads.tsv`), pepy and BigQuery for cross-checks.
- `website/data/pypi_name_overrides.json` maps README names to real PyPI packages. Without it, some rows silently measure squatters (PyPI's `pytorch` is not `torch`) or dead predecessors (PyPI's `jinja` is Jinja1).

## Website

- New PyPI Downloads column, now the default sort. GitHub stars are one click away.
- Entries not on PyPI show a "Not on PyPI" badge instead of a number.
- The deploy workflow fetches fresh download counts daily.

## Maintainer tooling

- `audit-the-list` skill: re-verifies every entry's verdict with live data.
- `preview-verdicts` skill: interactive keep/drop preview pages for batch review.

The list went from 576 entries to 487 so far. Most future PRs will be rejected for fullness, not badness.


## PR #3284: Add SeleniumBase

- URL: https://github.com/vinta/awesome-python/pull/3284
- Author: mdmintz
- Merged: 2026-08-16T13:03:09Z (created: 2026-08-13T00:45:48Z)
- Stats: +1 -0, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Project

[SeleniumBase](https://github.com/seleniumbase/SeleniumBase/) - Python framework for web automation & testing, with stealth options.

## Checklist

- [X] One project per PR
- [X] PR title format: `Add project-name`
- [X] Entry format: `- [project-name](url) - Description ending with period.`
- [X] Description is concise and short

## Why This Project Is Awesome

Which criterion does it meet? (pick one)

- [X] **Industry Standard** - The go-to tool for a specific use case
- [ ] **Rising Star** - 5000+ stars in < 2 years, significant adoption
- [ ] **Hidden Gem** - Exceptional quality, solves niche problems elegantly

Explain:

## How It Differs

With 12,500+ GitHub stars and over 70M installs from PyPI (https://pypi.org/project/seleniumbase/), SeleniumBase is the industry standard for web automation & testing when stealth options are desired. Comes in various formats / design patterns so that you can structure your scripts with `pytest`, context managers, and/or line-by-line scripts. It can also integrate with Playwright. Over 100 runnable examples from the SeleniumBase GitHub repo. When running test-style scripts with `pytest`, there are dozens of command-line options, such as `--headless` (for a headless browser), `--demo` (to slow the automation and highlight actions), `--uc` (for stealth mode), `--dashboard` (to output results to a local dashboard), and many more.


## PR #3297: Add hishel

- URL: https://github.com/vinta/awesome-python/pull/3297
- Author: karpetrosyan
- Merged: 2026-08-23T07:44:21Z (created: 2026-08-21T20:54:13Z)
- Stats: +1 -0, 1 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Project

[hishel](https://hishel.com)

## Checklist

- [x] I read [CONTRIBUTING.md](https://github.com/vinta/awesome-python/blob/master/CONTRIBUTING.md) - awesome-python is a shortlist, not a catalog
- [x] One project per PR
- [x] PR title format: `Add project-name`
- [x] Entry format: `- [pypi-name](https://github.com/owner/repo) - Description ending with period.`
- [x] Display name is the PyPI package name
- [x] Placed in an existing use case (new sections and subcategories are maintainer-only)
- [x] Meets all Quality Requirements: active, stable, documented, at least 1 month old

## Which Tier

Pick one:

- [x] **Obvious choice** - a tool an experienced Python developer would name when asked "what do I use for this?"

Explain:

hishel is the RFC 9111 HTTP caching library for httpx and requests (sync and async). 5.6M downloads/month (pypistats), 1.x since Oct 2025, latest release Aug 2026

## Displacement

Not needed — Caching had 4 entries, this makes 5.

Alternative placement: HTTP response caching is arguably its own use case, so an "HTTP Caching" subcategory under HTTP Clients (next to Clients and URL Manipulation) would be a more precise home. That is a structure change and maintainer-only, so this PR uses the existing Caching use case; happy to move it if you prefer the subcategory.


## PR #3301: Add semantica

- URL: https://github.com/vinta/awesome-python/pull/3301
- Author: JinyangWang27
- Merged: 2026-08-24T06:42:58Z (created: 2026-08-24T06:26:13Z)
- Stats: +1 -0, 1 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## Project

[semantica](https://github.com/semantica-agi/semantica)

## Checklist

- [X] I read [CONTRIBUTING.md](https://github.com/vinta/awesome-python/blob/master/CONTRIBUTING.md) - awesome-python is a shortlist, not a catalog
- [X] One project per PR
- [X] PR title format: `Add project-name`
- [X] Entry format: `- [pypi-name](https://github.com/owner/repo) - Description ending with period.`
- [X] Display name is the PyPI package name
- [X] Placed in an existing use case (new sections and subcategories are maintainer-only)
- [X] Meets all Quality Requirements: active, stable, documented, at least 1 month old

## Which Tier

Pick one:

- [X] **Obvious choice** - a tool an experienced Python developer would name when asked "what do I use for this?"
- [ ] **Challenger** - not yet the obvious choice, but a credible successor to one. Give adoption-trajectory evidence, not popularity alone.

Explain:

Semantica qualifies as an obvious choice rather than a challenger because it represents a distinct core Data Layer use case: graph-native context and knowledge infrastructure for AI applications.

While LlamaIndex focuses primarily on connecting and retrieving data for LLM applications and Mem0 focuses on persistent agent memory, Semantica provides context graphs, knowledge graphs, ontology management, provenance, deterministic reasoning, and decision traceability as a dedicated infrastructure layer beneath agent frameworks and LLMs.

For Python developers specifically looking for structured, relationship-aware and auditable context rather than only vector retrieval or conversational memory, Semantica is a direct-purpose solution rather than an experimental alternative to another entry.


## PR #3302: Add openviking

- URL: https://github.com/vinta/awesome-python/pull/3302
- Author: JinyangWang27
- Merged: 2026-08-25T04:08:40Z (created: 2026-08-24T06:49:57Z)
- Stats: +1 -0, 1 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## Project

[openviking](https://github.com/volcengine/OpenViking)

## Checklist

- [X] I read [CONTRIBUTING.md](https://github.com/vinta/awesome-python/blob/master/CONTRIBUTING.md) - awesome-python is a shortlist, not a catalog
- [X] One project per PR
- [X] PR title format: `Add project-name`
- [X] Entry format: `- [pypi-name](https://github.com/owner/repo) - Description ending with period.`
- [X] Display name is the PyPI package name
- [X] Placed in an existing use case (new sections and subcategories are maintainer-only)
- [X] Meets all Quality Requirements: active, stable, documented, at least 1 month old

## Which Tier

Pick one:

- [ ] **Obvious choice** - a tool an experienced Python developer would name when asked "what do I use for this?"
- [X] **Challenger** - not yet the obvious choice, but a credible successor to one. Give adoption-trajectory evidence, not popularity alone.

Explain:

## Challenger

OpenViking is a strong challenger for the **AI and Agents → Data Layer** use case. It provides an agent-native context database that unifies memory, resources, and skills in a single hierarchical namespace, with progressive context loading and observable retrieval. Its scope is broader than memory-only systems and complementary to general RAG/data frameworks, while its rapidly growing adoption and active development make it a credible emerging alternative to the current obvious choices.

