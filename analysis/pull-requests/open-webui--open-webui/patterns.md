# PR Patterns: open-webui/open-webui

## Corpus
- PRs analyzed: 5 (numbers: #29247, #29217, #29250, #29226, #29037)
- Authors: 4 distinct (aindriu80, joaoback, Classic298, silentoplayz ×2), so the sample is not single-author. However, all 5 were merged within ~5 days (2026-08-26 → 2026-08-30), and the set is skewed: 2 of 5 are i18n-only translation PRs and 3 of 5 are small UI fixes (+912/−913 down to +8/−0). No feature/architecture PRs are in the sample, so patterns for large changes cannot be inferred.

## Titles
All 5 titles use a Conventional-Commits-style prefix, which matches the repo's mandatory "Title Prefix" checklist item (quoted in #29217: prefixes `build`, `ci`, `chore`, `docs`, `feat`, `fix`, `i18n`, `perf`, `refactor`, `style`, `test`, `WIP`):
- `i18n:  Update Irish translation` (#29247 — note the double space after the colon)
- `i18n: add pt-BR translations for newly added UI items and consistency…` (#29217 — truncated)
- `fix: structured output renderer crashing on an empty output slot` (#29250)
- `fix: keep select dropdowns inside the viewport` (#29226)
- `fix: restore visibility of disabled models visible in the admin Models list` (#29037)

Pattern: `<type>: <lowercase descriptive phrase>`. Casing is inconsistent — #29247 capitalizes "Update"; the other four are lowercase. No scopes (`fix(ui):`), no emoji, no trailing periods. Lengths ~40–60 chars. One anomaly: #29247's description body opens with a stray fragment `…-hidden\r\r` followed by the verbatim title of #29037 (`fix: restore visibility of disabled models visible in the admin Models list`) pasted in front of the template's HTML comment — a copy-paste artifact that survived merge.

## Description structure
Header usage splits cleanly into three clusters:

1. **Full official template** (#29247, #29217): `# Pull Request Checklist` → `# Changelog Entry` with `### Description`, `### Added`, `### Changed`, `### Deprecated`, `### Removed`, `### Fixed`, `### Security`, `### Breaking Changes` (Keep-a-Changelog format, empty sections filled with `- N/A`) → `---` → `### Additional Information` → `### Screenshots or Videos` → `### Contributor License Agreement` → `> [!NOTE]` CLA warning. #29217 additionally prepends a `# i18n: ...` H1 restating the title, a prose summary, and a `## Related Discussion` section *before* the Checklist.
2. **Newer/simplified template** (#29226): `# Pull Request` → `## Checklist` (short one-line items, no bold labels) → `## Summary` → `## Testing` (numbered steps) → `## Changelog Entry` (`### Fixed` only) → `## Additional Context` (screenshot table) → `## Contributor License Agreement`. The checklist items differ textually from #29247/#29217's version (e.g. "This PR links to a confirmed Issue or active Discussion: `Closes #29225`"), so at least two template generations are in circulation.
3. **CLA-only** (#29250): three prose paragraphs + `Fixes #29244`, then just the `### Contributor License Agreement` section — no checklist, no changelog. #29037 is a hybrid: it fills the full checklist and changelog blocks but renames/reorders sections (`### Manual Verification Performed` instead of the template's testing prompt).

The CLA block plus the `> [!NOTE] Deleting the CLA section will lead to immediate closure of your PR` footer is the only element present verbatim in all 5 PRs.

## Template usage
Strong evidence of a repo-enforced PR template, in at least two/three versions:
- Identical boilerplate across PRs: the `<!-- ⚠️ CRITICAL CHECKS FOR CONTRIBUTORS (READ, DON'T DELETE) ⚠️ ... -->` HTML comment appears in #29247, #29217, and #29037; the CLA comment block (`🚨 DO NOT DELETE THE TEXT BELOW 🚨`) and `> [!NOTE]` admonition appear in all 5.
- Checklists with `- [X]` / `- [ ]`: present in 4 of 5 (#29250 omits them entirely). Authors check most boxes and leave inapplicable ones unchecked (e.g. #29247 leaves `**Testing**` unchecked for a translation-only PR; note also formatting slips like `- [] **Testing:**` and `- [ X **Git Hygiene:**` in #29247).
- Unfilled template remnants survive to merge: #29247 retains the entire "Do not open a pull request as the first step" instructional prose; both i18n PRs fill empty changelog sections with `- N/A` rather than deleting them.

Conclusion: **template** — an elaborate, enforced-by-bots template (CLA-bot; PRs targeting `main` auto-closed), and merged PRs demonstrably keep the boilerplate rather than stripping it.

## Length & density
- #29247: ~40 words of original content ("Updated the Irish translation with approximately 850 newly translated strings…") inside ~450 words of template boilerplate.
- #29217: ~550 words of authored content — the most verbose i18n entry, including a terminology table (`Model → Modelo`, `Context window → Janela de contexto`).
- #29250: ~180 words, pure prose.
- #29226: ~600 words checklist-to-footer, including a full diff block and screenshot table.
- #29037: ~850 words — longest, with problem/root-cause/fix narrative, two diff blocks, a 6-step verification list, and screenshots.

Pattern: fix PRs from silentoplayz are long and forensic; i18n PRs are template-dominated; the maintainer-adjacent quick fix (#29250, Classic298, 0 comments, merged 15 min after creation) is a compact prose note. There is no shared brevity norm — density tracks author, not repo.

## Voice & tone
- Descriptive present/past tense dominates over imperative. #29250 is fully neutral-third-person ("Output items that would land past the end are now appended…").
- First person appears where the template invites disclosure: "I have thoroughly reviewed and manually tested it" (#29226), "If helpful, I can follow up with a separate PR proposing a pt-BR localization style guide/glossary" (#29217).
- Register is formal-engineering; #29037 is notably precise ("`/api/models` returns 311 models, `/api/models/base` returns 174. The 6 models missing from the first are exactly the 6 disabled rows").
- An explicit AI-assistance disclosure sentence — "This PR was prepared with AI copilot assistance and I have thoroughly reviewed and manually tested it" — appears verbatim or near-verbatim in #29226 and #29037, and as the checked "**No Unchecked AI Code**" box in #29247. This is a repo-mandated norm, not an author quirk.

## Content habits
- **Linked issues**: 3 of 5 link issues — `Fixes #29244` (#29250), `Closes #29225` (#29226), `Closes #29036` (#29037). The i18n PRs link a Discussion instead (#29217 → discussions/27323) or nothing (#29247), consistent with the template's first-time-contributor policy.
- **Test plans**: manual-verification culture, no CI/test-command citations. #29037 has `### Manual Verification Performed` with 6 numbered steps; #29226 has `## Testing` with 3 numbered steps ("Opened a Workspace Knowledge collection on my iPhone and in a mobile device viewport…").
- **Screenshots**: before/after `<img>` tables in both UI fix PRs (#29037, #29226) with `| Surface | Before | After |` headers; hosted on github user-attachments and the author's fork repo respectively.
- **Diff blocks**: #29226 and #29037 embed ```diff snippets of the exact code change inside the description.
- **Breaking-change callouts**: only via the template's `### Breaking Changes` section, answered "None"/"N/A" in each PR that has it.
- **Labels**: none on any of the 5 PRs. Review activity is minimal: `Reviews: 0` on all 5; comments 0–7.

## Bot-generated content
No CodeRabbit, Copilot-summary, or other bot-generated description blocks appear in any of the 5 PRs. The only bot presence is the CLA-bot contract itself — the mandatory `### Contributor License Agreement` checkbox and the `> [!NOTE]` threat that "Deleting the CLA section will lead to immediate closure of your PR" — plus the template's anti-AI posture ("Unreviewed AI-generated PRs may be closed immediately", #29247). Notably, the human-written AI-assistance *disclosure* sentence is itself becoming boilerplate (identical wording across #29037 and #29226, both by silentoplayz). For AI-PR-description tooling this repo is adversarial territory: the template is heavy, mandatory, and explicitly suspicious of generated content, yet authors still disclose copilot assistance on merged PRs.

## Notable exemplars
- **PR #29037** — https://github.com/open-webui/open-webui/pull/29037 — the strongest sample: names the regression to a specific commit (`ccbb3303f`), shows the offending diff, explains *why the naive revert would reintroduce a different bug* (143 workspace preset models), and backs the fix with a 6-step verification including endpoint count arithmetic (311 vs 174 models) and before/after screenshots.
- **PR #29226** — https://github.com/open-webui/open-webui/pull/29226 — best use of the newer template: a `## Summary` that explains the root cause by referencing the sibling component where the solution already exists (`Dropdown.svelte` "already solves this"), the exact diff inline, numbered manual-testing steps, and a Surface/Before/After screenshot table.
