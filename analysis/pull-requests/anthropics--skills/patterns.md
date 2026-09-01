# PR Patterns: anthropics/skills

## Corpus
- PRs analyzed: 5 (numbers: #1557, #1554, #1553, #1605, #1623)
- Caveat: only two authors, both appearing to be Anthropic staff adding/updating first-party skills — `kswan-wk` (3 PRs: #1554, #1553, #1605) and `cj-ant` (2 PRs: #1557, #1623). All merged within 9 days (2026-08-13 → 2026-08-21), zero labels, zero linked issues, zero comments on every PR. This is an internal-team contribution pattern, not community-contributor behavior; too small and homogeneous to generalize repo-wide.

## Titles
No Conventional Commits types (no `feat:`/`fix:`), no bracketed scopes, no emoji. Every title starts with a capitalized imperative verb followed by the skill name:
- `Update claude-api skill: prompt-audit subcommand` (#1557)
- `Add claude-academy-guide skill` (#1554)
- `Add discernment-nudge skill` (#1553)
- `Rename claude-academy-guide skill to academy-guide and shorten its description` (#1605)
- `Update claude-api skill: Python SDK 0.x to 1.x upgrade guide` (#1623)

Pattern: `<Add|Update|Rename> <skill-name> skill[: <specific change>]`. The colon-delimited qualifier appears on #1557 and #1623; #1605 spells the same information out in prose ("and shorten its description"), and the two plain "Add … skill" titles are new-skill introductions. Lengths ~30–78 chars, single line, sentence case, no trailing period. Verb inventory across 5 PRs: Add (2×), Update (2×), Rename (1×).

## Description structure
Two distinct, author-consistent section scaffolds, both using `##` (H2) headers:

**cj-ant's four-part scaffold** (identical across #1557 and #1623):
1. `## What this does` — one-sentence statement of the change ("Adds a `prompt-audit` subcommand to the `claude-api` skill.")
2. `## Why now` — motivation with concrete failure modes ("an `httpx.Timeout` or `httpx.Client` handed to a 1.x client fails at request time rather than import time")
3. `## What changed` — per-file breakdown: a bolded header per file (`**New file: `shared/prompt-audit.md` (219 lines).**`, `**`SKILL.md` (3 edits).**`) with bulleted detail under each, line counts and edit counts stated explicitly
4. `## How we know it works` — evidence paragraph (see Content habits)

**kswan-wk's scaffold** (#1554, #1553, #1605):
1. `## Summary` — one dense paragraph, then a per-file bullet list with em-dash descriptions (`- **`skills/discernment-nudge/SKILL.md`** — trigger/skip rules and output format.`)
2. Context-specific middle section when warranted — `## Runtime network fetch — please note` (#1554), `## Follow-up` (#1605)
3. `## Testing` — one short prose paragraph (#1554, #1553; omitted in the trivial rename #1605)

Common skeleton across both: Summary/What → file-by-file bullet list → evidence section. Prose is used for narrative (why, testing), bullets for file inventories. No H1/H3 headings anywhere; exact header text is stable per author.

## Template usage
No repo-enforced template: no `- [ ]` checklists, no boilerplate instructional text, no "How Has This Been Tested"-style scaffold, no unfilled prompts. However, the two authors each reuse their own fixed section set verbatim across PRs (cj-ant's four headers are character-identical in #1557 and #1623), functioning as personal templates. Conclusion: **freeform, but with strong per-author self-templates**.

## Length & density
Substantially longer and denser than typical OSS descriptions — these are documentation-heavy PRs with documentation-heavy descriptions:
- #1557: ~560 words
- #1623: ~420 words
- #1554: ~330 words
- #1553: ~220 words
- #1605: ~180 words (shortest; trivial rename)

Pattern: length scales with change complexity. Density is high — numeric specifics throughout (line counts "(219 lines)", character counts "1,176 to 992 characters", benchmark results "14 of the 15 cases"). Bullets carry full sentences with technical detail, not one-word change logs.

## Voice & tone
- Declarative present tense, third-person/neutral: "Adds a `prompt-audit` subcommand…", "The skill reads the live catalog…". No first person ("I"/"we") as actor, though cj-ant's scaffold embeds a collective "we" in the fixed header "How we know it works".
- Formal, precise, engineering-register prose with careful hedging where behavior is probabilistic ("an audit run with this file fixed 14 of the 15 cases it was not developed against").
- Heavy use of backticks for identifiers, bold for file names and key guarantees, em-dashes for qualification. Occasional aphoristic emphasis, quoted as design principle: "An audit that finds nothing should change nothing." (#1557).

## Content habits
- **Linked issues**: none — 0 of 5 PRs reference an issue (no "Fixes #" anywhere). Cross-PR references exist: #1605 cites "#1554" for the selection eval it preserves. #1605's `## Follow-up` section flags downstream work ("The pending export-script fix needs to allowlist the new name `academy-guide`").
- **Test plans**: always present in substance, never as a checklist. cj-ant reports quantified behavioral evals ("On a 20-case benchmark of dated patterns… fixed 14 of the 15 cases" plus a negative control "On a clean codebase with nothing planted, 2 of 3 runs proposed no edits", #1557); kswan-wk reports internal scenario testing ("Tested internally across advice, estimation, drafting, and data-analysis conversations to tune the trigger boundaries", #1553). Structural hygiene is asserted too: "no unresolved template placeholders" (#1557, #1623).
- **Screenshots/images**: none — consistent with a repo of markdown skill files.
- **Reviewer call-outs**: #1554 dedicates a whole section to pre-empting reviewer concern — `## Runtime network fetch — please note` — enumerating fetch limits, failure behavior, and URL constraints ("No other network access, no scripts, no external dependencies").
- **Labels**: none on any PR. **Breaking-change callouts**: none as PR metadata, though the knowledge itself (httpx→httpx2, removed APIs) is the PR's subject in #1623.

## Bot-generated content
None observed. No "Summary by CodeRabbit" blocks, no Copilot/AI-review summaries, no auto-generated release notes in any of the 5 descriptions. Given the repo is Anthropic's own skills collection the irony is noted, but there is no structural signature (emoji bullet headers, "This PR introduces…" openers, walkthrough tables) of bot authorship; the two distinct, stable per-author scaffolds read as deliberate human house style.

## Notable exemplars
- **PR #1557** — https://github.com/anthropics/skills/pull/1557 — the strongest sample: four clean sections, a per-file breakdown with line counts, a quantified head-to-head benchmark with a negative control, and a falsifiable design philosophy ("An audit that finds nothing should change nothing") — a complete review package with zero reviewer questions (0 comments, merged same day).
- **PR #1554** — https://github.com/anthropics/skills/pull/1554 — best risk disclosure: the `## Runtime network fetch — please note` section anticipates every security/privacy question a reviewer would ask about a skill that fetches a live URL, then closes with the bounding statement "No other network access, no scripts, no external dependencies".
