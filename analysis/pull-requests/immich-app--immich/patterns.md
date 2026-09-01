# PR Patterns: immich-app/immich

## Corpus
- PRs analyzed: 5 (numbers: #31080, #31094, #30976, #31128, #31129)
- Caveat: the sample is extremely heterogeneous and only **2 of 5 PRs are original human-authored descriptions** (#31080 by maintainer bo0tzz, #30976 by external contributor brn-lin). The other three are automation output: #31128 is a Renovate dependency bump, and #31094/#31129 are one-line backports authored by the `immich-push-o-matic` bot. Conclusions about "human PR style" rest on essentially two data points; treat repo-wide generalizations accordingly.

## Titles
All 5 titles are strict Conventional Commits: `<type>(<optional scope>): <lowercase summary>`.
- `fix: generate release notes from the previous release on the line` (#31080, and verbatim copy on backport #31094)
- `fix(web): misleading toast notification ` (#30976 — note the trailing space, merged as-is)
- `chore(deps): update base-image to v202608300913` (#31128, and verbatim copy on backport #31129)

Observed types: `fix` (3×) and `chore(deps)` (2×, bot). Scope used once (`web`). All lowercase after the colon, imperative/descriptive short phrases, no emoji, no trailing period (but one trailing space). Backport PRs reuse the parent title verbatim rather than a `chore: backport …` scheme.

## Description structure
No single structure — the corpus splits into four distinct shapes:

- **#31080 (maintainer fix)**: pure prose, no headers, no lists — two sentences ("GitHub picks the globally latest release as the starting point, which is wrong / once a patch release and a newer line coexist. Release candidates now describe / the delta since the previous candidate, and a full release the whole line."). Behavior-then-fix narrative.
- **#30976 (external contributor)**: full H2-sectioned document — `## Description` → `## How Has This Been Tested?` → `## Screenshots` (with `### Before` / `### After` H3 sub-headers) → `## Checklist:` → `## Please describe to which degree, if any, an LLM was used in creating this pull request.` Prose paragraphs inside each section, no bullet lists outside the checklist.
- **#31094 / #31129 (backports)**: single line, e.g. "Backport of #31080 to `release/v3.2`."
- **#31128 (Renovate)**: bot scaffold — package table, `---` dividers, `<details><summary>` release-notes block, "### Configuration" with emoji-bulleted schedule info, and an HTML-comment debug footer.

## Template usage
Strong evidence of a repo PR template, visible in full in #30976: the exact scaffold `## Description`, `## How Has This Been Tested?`, `## Screenshots`, `## Checklist:` (with 9 fixed checkbox items — "I have carefully read CONTRIBUTING.md", "I have performed a self-review of my own code", "I have no unrelated changes in the PR.", plus two architecture rules about `src/services/` vs `src/repositories/`), and a mandatory LLM-disclosure section. All checkboxes are ticked (`- [x]`), no unfilled prompts remain. However, the maintainer PR #31080 ignores the template entirely (no headers, no checklist), suggesting maintainers are exempt or the template is only enforced/expected for external contributors. Conclusion: **template exists and is fully exercised by contributors; core maintainers write freeform**.

## Length & density
- #31080: ~40 words
- #31094, #31129: ~7 words each (one line)
- #30976: ~330 words of body prose (excluding boilerplate checklist items) — the longest human description
- #31128: ~200 words, nearly all auto-generated boilerplate

Bimodal distribution: maintainer/backport descriptions are ultra-concise (one sentence to one short paragraph), while the single external-contributor PR is verbose and expansive. Notably, #31080 and #30976 are similarly small code changes (+12/-0 and +9/-3) yet differ ~8× in description length — verbosity correlates with author role (external vs maintainer), not change size.

## Voice & tone
- #31080: neutral explanatory prose, present tense, no first person ("GitHub picks the globally latest release… which is wrong") — declarative and confident, assumes reader context.
- #30976: heavy first person ("I added the appropriate toastManager method…", "I created one", "I used ChatGPT to help me trace the bug") — walkthrough narrative voice, informal-developer register.
- Backports are telegraphic ("Backport of #31080"); Renovate is impersonal boilerplate ("This PR contains the following updates:").

Pattern: external contributors narrate their process in first person; maintainers state the problem and outcome without self-reference.

## Content habits
- **Linked issues**: only #30976 links an issue ("Fixes #30849", both in metadata and as the description's opening line). The maintainer PR #31080 links nothing.
- **Test plans**: #30976 has an explicit "How Has This Been Tested?" section describing a new spec file ("Since no test file for album.service.ts in the frontend web folder existed, I created one") with manual reproduction instructions. #31080 has no test plan despite touching release tooling.
- **Screenshots**: #30976 embeds Before/After `<img>` screenshots (GitHub user-attachments URLs) under H3 sub-headers — expected practice for the `🖥️web`-labeled UI change.
- **Breaking-change callouts / reviewer ask-outs**: none observed in any PR.
- **Architecture checklist as content**: the template's checklist doubles as a design-gate (e.g. "All code in `src/repositories/` is pretty basic/simple and does not have any immich specific logic").
- **LLM disclosure**: the template mandates a section asking "to which degree, if any, an LLM was used in creating this pull request" — #30976 answers candidly ("I used ChatGPT to help me trace the bug… I manually fixed any errors and double checked it").

## Bot-generated content
Bot content dominates the corpus (3 of 5 PRs):

- **Renovate** (#31128): full standard boilerplate — update table ("| [ghcr.io/immich-app/base-server-dev](…) | stage | major | `202608251107` → `202608300913` |"), collapsible release-notes `<details>` block, "### Configuration" with emoji bullets (📅 Schedule, 🚦 Automerge "Disabled by config"), a `- [ ] <!-- rebase-check -->` rebase checkbox, and an HTML-comment debug footer (`<!--renovate-debug:eyJj…-->`). Maintainers merge these as-is with 1 review — no human edits to the description.
- **immich-push-o-matic** (#31094, #31129): the repo's own backport bot; descriptions are a single generated line ("Backport of #31080 to `release/v3.2`."). These inherit the parent's title and are merged within minutes (~10 min after #31080, ~1h after #31128) — an automated release-train pipeline, not a writing pattern.

No CodeRabbit/Copilot AI-summary blocks observed. However, the repo's **template itself institutionalizes AI awareness** via the mandatory LLM-usage disclosure section — a notable stance relative to AI-generated PR descriptions: immich doesn't ban AI assistance, it requires it be declared.

## Notable exemplars
- **PR #31080** — https://github.com/immich-app/immich/pull/31080 — the best-written sample in ~40 words: names the incorrect behavior ("GitHub picks the globally latest release… which is wrong"), states the rule fix ("a full release the whole line"), and stops. A model of minimal maintainer prose.
- **PR #30976** — https://github.com/immich-app/immich/pull/30976 — the most complete sample: opens with "Fixes #30849", walks through root cause and fix, adds a real test plan with a newly created spec file, includes Before/After screenshots, and gives an honest LLM-usage disclosure — everything the template asks for, fully filled in.
