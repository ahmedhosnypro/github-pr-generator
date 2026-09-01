# Merged PRs: obra/superpowers

## PR #1995: feat: add Devin CLI support

- URL: https://github.com/obra/superpowers/pull/1995
- Author: caiolopes
- Merged: 2026-08-07T20:42:37Z (created: 2026-07-16T14:12:11Z)
- Stats: +103 -1, 5 files
- Labels: none
- Reviews: 1 | Comments: 2
- Linked issues: none

### Description


## Who is submitting this PR? (required)

| Field | Value |
|-------|-------|
| Your model + version | Claude Fable 5 (XHigh thinking) |
| Harness + version | Devin CLI 3000.1.27 (macOS, Homebrew cask) |
| All plugins installed | None during development; only `superpowers` (this branch, local live-linked install) during acceptance testing |
| Human partner who reviewed this diff | Caio Lopes (@caiolopes) |

## What problem are you trying to solve?

Devin CLI (Cognition's terminal agent) gained a plugin system that installs skill bundles from a GitHub repo (`devin plugins install owner/repo`). Running the natural command against this repo fails today:

```
$ devin plugins install obra/superpowers
Error: invalid manifest: could not read manifest at .../.devin-plugin/plugin.json: No such file or directory (os error 2)
```

This was hit in a real session: a Devin CLI user asked whether Superpowers could be installed (it isn't listed in the README), tried the install, and got the error above. Devin CLI's installer requires a `.devin-plugin/plugin.json` manifest at the repo root; the repo ships manifests for Claude Code, Codex, Cursor, Kimi, OpenCode, and Pi, but not Devin.

## What does this PR change?

Adds a `.devin-plugin/plugin.json` manifest so `devin plugins install obra/superpowers` works, a Devin tool mapping (`references/devin-tools.md`) linked from using-superpowers' Platform Adaptation list, a README install section, version tracking in `.version-bump.json`, a `.devin-plugin/` exclude in the Codex sync script, and a CI-safe test (`tests/devin/test-devin-plugin.sh`).

## Is this change appropriate for the core library?

Yes — it's new harness support, the one carve-out the contributor rules allow. No skill bodies are modified (the single SKILL.md change is a one-line pointer in the Platform Adaptation section, which the porting guide explicitly sanctions). Zero dependencies added; no hooks, no code plugin — the integration is a manifest + a mapping doc.

**How the bootstrap works on Devin CLI (per `docs/porting-to-a-new-harness.md`):** Devin plugins carry skills only — the plugin system has no hook or context-file component (hooks exist in Devin but only as user/project config, which rule 2 forbids touching). However, Devin natively surfaces every installed skill's name + description in the system prompt at session start, with a standing instruction to invoke any matching skill immediately via its native `skill` tool. This is the "surfaced skill index" path the porting guide describes (Part 5 case 2 / Part 6: "lean on the installed `using-superpowers` skill itself"), for which the acceptance test is the mandatory proof — see the transcript below.

## What alternatives did you consider?

- **Session-start hook injection (Shape A):** Devin CLI has a `SessionStart` hook event with Claude Code–compatible `hookSpecificOutput.additionalContext` output — but hooks load only from user/project config (`.devin/hooks.v1.json`, `~/.config/devin/config.json`), not from installed plugins. Shipping the bootstrap that way would require editing the user's config, which the porting guide forbids (rule 2). If Devin plugins gain a hooks component later, the existing `hooks/session-start` script could be wired up for a stronger guarantee.
- **Reusing an existing manifest:** Devin's installer specifically requires `.devin-plugin/plugin.json`; it does not read `.claude-plugin/` or the `.agents/` marketplace file. Verified empirically (the error message above).
- **Doing nothing / external install shim:** fails the acceptance test and the "install through the harness's own mechanism" rule.

## Does this PR contain multiple unrelated changes?

No — one harness, and every touched file is required by the porting guide for a new harness (manifest, mapping, SKILL.md pointer, README, version tracking, sync excludes, tests).

## Existing PRs

- [x] I have reviewed all open AND closed PRs for duplicates or prior art
- Related PRs: none found for Devin (searched "devin", "devin CLI", "cognition"). Closest prior art: #741 (closed, Windsurf) — rejected for duplicated install/update instructions and no evident human review. This PR keeps a single install path (the harness's own `devin plugins install`), adds no duplicated instructions, and the complete diff was human-reviewed.

## Environment tested

| Harness (e.g. Claude Code, Cursor) | Harness version | Model | Model version/ID |
|-------------------------------------|-----------------|-------|------------------|
| Devin CLI | 3000.1.27 (0d4bf12e) | Claude Fable 5 | Claude Fable 5 XHigh |

## New harness support (required if this PR adds a new harness)

Acceptance test run in a clean environment: pristine `HOME` (only Devin CLI credentials copied in), `superpowers` installed via `devin plugins install <path-to-this-branch>`, fresh empty git repo as the working directory, interactive session. `devin skills list` confirmed only the two Devin built-ins plus the 14 superpowers skills were loaded.

The first agent actions after the user message were invoking `using-superpowers` and then `brainstorming` — before any code, any file writes, or any exploration.

<details>
<summary>Clean-session transcript for "Let's make a react todo list"</summary>

```
◆ Trust /private/tmp/superpowers-acceptance? Yes, trust /private/tmp/superpowers-acceptance
⠀⣴⣾⣶⡄⠀⠀⠀⠀
⠀⠛⠿⠟⠻⣶⣾⣶⡄  Devin CLI
⠀⣤⣶⣦⣴⠿⢿⠿⠃  v3000.1.27
⠀⠻⢿⠿⠃⠀⠀⠀⠀

Cognition Platform (Enterprise)

❭ Let's make a react todo list

⏺ Invoked skill using-superpowers

⏺ Invoked skill brainstorming

Using brainstorming to design this before writing any code. Let me read the rest
of the skill and check the project context.

⏺ Read /private/var/folders/sv/.../content.txt
  └ 14 lines

⏺ Ran command
  │ $ ls -la /private/tmp/superpowers-acceptance && git -C /private/tmp/
  │   superpowers-acceptance log --oneline -5 2>/dev/null; echo "---"; git -C /
  │   private/tmp/superpowers-acceptance status
  │ On branch main
  │ No commits yet
  │ nothing to commit (create/copy files and use "git add" to track)
  └ Exited with code 0

⏺ Updated todo list (9 items)
  │ ✓ 1. Explore project context
  │ ◔ 2. Ask clarifying questions (one at a time)
  │ ○ 3. Offer visual companion just-in-time (only if a visual question arises)
  │ ○ 4. Propose 2-3 approaches with trade-offs
  │ ○ 5. Present design and get approval
  │ ○ 6. Write design doc to docs/superpowers/specs/ and commit
  │ ○ 7. Spec self-review
  │ ○ 8. User reviews written spec
  └ ○ 9. Invoke writing-plans skill

⏺ Asked user What's the main purpose of this React todo list?
  └ Learning exercise

⏺ Asked user Beyond adding, completing, and deleting todos, what should be
included?
  ✗ Canceled due to user interrupt

✱ Canceled. What should Devin do?

❭ /exit
```

(Session ended by the human at the second clarifying question — the design flow was proceeding per the brainstorming skill: context exploration, checklist todos, one question at a time via Devin's native multiple-choice prompt. No code was written at any point.)

</details>

## Evaluation

- Initial prompt: a Devin CLI user asked "can devin use https://github.com/obra/superpowers? i don't see it listed on README", then tried the install and hit the missing-manifest error.
- Eval sessions after the change: 2 acceptance sessions (one non-interactive `-p` run, one interactive TUI run — both in the clean environment described above). Both auto-triggered `using-superpowers` + `brainstorming` as the first actions.
- Before the change: `devin plugins install obra/superpowers` errors out; no skills load at all. After: install succeeds, all 14 skills register as `/superpowers:<skill>`, and the acceptance test passes.

## Rigor

- [ ] If this is a skills change: I used `superpowers:writing-skills` and completed adversarial pressure testing (paste results below) — **N/A: no skill body content was modified** (only the sanctioned Platform Adaptation pointer line and a new references/ mapping file)
- [x] This change was tested adversarially, not just on the happy path — the clean-HOME environment removed all personal skills/config; the non-interactive mode run additionally showed the skills still trigger when interactive tools are unavailable
- [x] I did not modify carefully-tuned content (Red Flags table, rationalizations, "human partner" language) without extensive evals showing the change is an improvement

## Human review

- [x] A human has reviewed the COMPLETE proposed diff before submission


## PR #2109: docs: streamline README getting-started navigation

- URL: https://github.com/obra/superpowers/pull/2109
- Author: arittr
- Merged: 2026-08-08T00:37:17Z (created: 2026-08-08T00:14:26Z)
- Stats: +2 -6, 1 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Who is submitting this PR? (required)

| Field | Value |
|-------|-------|
| Your model + version | GPT-5.6 Sol (`gpt-5.6-sol`) |
| Harness + version | Codex Desktop, runtime `0.147.0-alpha.6.5` |
| All plugins installed | `stream-deck-agents-codex` 1.0.0; `documents`, `pdf`, `spreadsheets`, `presentations`, and `template-creator` 26.805.11740; `sites` 0.1.34; `browser` 26.803.41515; `computer-use` 1.0.1000633; `visualize` 1.0.20; `primeradiant-ops` 2.5.0; `linear`, `slack`, `github`, and `codex-security` 11c74d6b; `superpowers` 6.2.0; `cloud-build` 0.9.0 |
| Human partner who reviewed this diff | Drew Ritter (@arittr) |

## What problem are you trying to solve?

PR #1293 added a Quickstart row of installation links, and PR #2090 later added a full table of contents containing the same installation links. The README now presents two adjacent navigation surfaces for the same destinations, which means readers see two competing starting points and maintainers must keep two lists synchronized.

The lists had already drifted: Hermes Agent was present in Quickstart and had an installation section, but was missing from the table of contents. That concrete mismatch demonstrated the maintenance problem rather than merely suggesting a theoretical one.

## What does this PR change?

Removes the redundant Quickstart entry and section, renames the table-of-contents label from “Installation” to “Getting Started” while preserving its existing anchor, and adds Hermes Agent to the installation links in the table of contents.

## Is this change appropriate for the core library?

Yes. This changes only the project README's general navigation. It adds no dependency, service integration, project-specific configuration, harness behavior, or skill content.

## What alternatives did you consider?

- **Keep both Quickstart and the table of contents:** rejected because the two hand-maintained lists had already drifted on Hermes Agent.
- **Also rename the `## Installation` heading:** rejected because the requested change was to the table-of-contents label; changing the heading would unnecessarily change the public anchor and existing bookmarks.
- **Remove Quickstart without adding Hermes to the table of contents:** rejected during independent review because it would remove the README's only direct link to the existing Hermes Agent installation section.

## Does this PR contain multiple unrelated changes?

No. Removing Quickstart, relabeling the remaining navigation entry, and preserving Hermes navigation are one cohesive change. The Hermes entry is necessary because Quickstart previously carried its only direct link.

## Existing PRs

- [x] I have reviewed all open AND closed PRs for duplicates or prior art
- Related PRs: #1293, #2090, #2108

No duplicate was found. #1293 added the Quickstart links before a full table of contents existed. #2090 added the table of contents and deliberately retained Quickstart; this follow-up differs because the post-merge README now provides concrete evidence of duplicated-list drift through the missing Hermes entry. #2108 is an open Qwen Code documentation PR that touches the same navigation area but adds a harness rather than consolidating navigation.

## Environment tested

| Harness | Harness version | Model | Model version/ID |
|---------|-----------------|-------|------------------|
| Codex Desktop | Runtime `0.147.0-alpha.6.5` | GPT-5.6 Sol | `gpt-5.6-sol` |

Validation was structural because this is a README-only change: `git diff --check` passed; the Getting Started link resolves to the unchanged Installation heading; the Hermes link resolves to the existing Hermes Agent heading; no Quickstart references remain; and an independent read-only re-review found no remaining issues.

## New harness support (required if this PR adds a new harness)

Not applicable. This PR adds no harness support and changes no integration code.

## Evaluation

- **Initial prompt:** Drew asked, “we should remove the 'quick start' section now that we have the ToC. But rename 'Installation' in the ToC to 'Getting Started'”.
- **Eval sessions run after the change:** 0. README navigation is not loaded into agent context and does not affect skill behavior, so agent-behavior evals would not measure this change.
- **Outcome change:** Before the change, the README had two adjacent navigation surfaces and the table of contents omitted Hermes Agent. After the change, one table of contents provides the navigation, labels the installation group as Getting Started, and includes Hermes Agent.

## Rigor

- [ ] If this is a skills change: I used `superpowers:writing-skills` and completed adversarial pressure testing — **not applicable; no skill content changed.**
- [x] This change was tested adversarially, not just on the happy path — an independent reviewer identified the missing Hermes navigation link after Quickstart removal; that regression was corrected and the complete diff was re-reviewed.
- [x] I did not modify carefully-tuned content (Red Flags table, rationalizations, “human partner” language) — only `README.md` changed.

## Human review

- [x] A human has reviewed the COMPLETE proposed diff before submission

Drew reviewed and explicitly approved the complete final diff before the branch was pushed and this PR was created.


## PR #2125: Release v6.3.0: Devin CLI and Hermes Agent support, brainstorming three-path router, SDD/Codex efficiency fixes

- URL: https://github.com/obra/superpowers/pull/2125
- Author: obra
- Merged: 2026-08-12T16:53:22Z (created: 2026-08-12T05:05:17Z)
- Stats: +2888 -67, 40 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

Release train for v6.3.0: merges everything on `dev` since v6.2.0 into `main`. Tagging, the GitHub release, and the marketplace update follow after this merge.

## Who is submitting this PR?

| Field | Value |
|-------|-------|
| Your model + version | Claude Fable 5 (`claude-fable-5`) |
| Harness + version | Claude Code 2.1.228 (CLI, Linux) |
| Human partner who reviewed this diff | Jesse Vincent (@obra), maintainer — directed this release |

## What's in the release

- **Harness support:** Devin CLI (#1995), Hermes Agent (#1922, #2025), Grok Build CLI docs (#1919)
- **Brainstorming:** three-path router — ceremony scales to spike/bounded/architectural, approval gate on every path (#2063)
- **SDD/Codex efficiency:** never-stall rulings (#2077), evidence-bearing preflight (#2080), micro-task batching (#2078), no worker-spawned subagents (#2059), spec travels with the plan (#2086), reviewers re-read evidence (#2089), event-driven Codex waits and explicit spawn routing (#2060–#2062)
- **Finishing:** worktree removal with untracked files is a stop-and-ask (#2024)
- **Fixes:** render-graphs.js on Windows, Copilot CLI Windows guidance (#2006), Hermes manifest in bump-version.sh

Full notes: `RELEASE-NOTES.md` v6.3.0 section.

## Verification

- `scripts/bump-version.sh --check` clean across all nine declared manifests
- Deterministic suites pass locally: version-bump, hooks, devin, kimi, antigravity, pi, opencode, codex (marketplace + package), systematic-debugging, writing-skills, shell-lint, codex-plugin-sync, explicit-skill-requests; hermes pytest 19/19
- Live-LLM batteries (tests/claude-code) not run for this release


## PR #2122: Update to Prime Radiant Community Code of Conduct.

- URL: https://github.com/obra/superpowers/pull/2122
- Author: kattni
- Merged: 2026-08-12T22:31:43Z (created: 2026-08-11T17:55:49Z)
- Stats: +94 -92, 1 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

Updates the current code of conduct to the Prime Radiant Community Code of Conduct. 

## PR #1: Add problem-solving skills from amplifier patterns

- URL: https://github.com/obra/superpowers/pull/1
- Author: obra
- Merged: 2025-10-11T04:17:33Z (created: 2025-10-11T00:46:52Z)
- Stats: +878 -4, 14 files
- Labels: none
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

## Summary

Extract and adapt problem-solving techniques from [Amplifier's agent system](https://github.com/microsoft/amplifier) into focused, composable skills.

**New skills added:**
- 5 problem-solving techniques (simplification-cascades, collision-zone-thinking, meta-pattern-recognition, inversion-exercise, scale-game)
- 1 dispatch skill (when-stuck flowchart)
- 1 architecture skill (preserving-productive-tensions)
- 1 research skill (tracing-knowledge-lineages)

**Enhanced existing skills:**
- brainstorming: Added flexibility to revisit earlier phases
- executing-plans: Added explicit blocker handling

**Key improvements:**
- ~60 lines each with quick reference tables
- Symptom-based when_to_use for discovery
- Pattern-based triggers (not exact phrases)
- Cross-referenced from brainstorming for discoverability
- All pressure-tested with subagents

## What Changed

### Problem-Solving Skills (New)
- **simplification-cascades**: Find one insight that eliminates multiple components
- **collision-zone-thinking**: Force unrelated concepts together for breakthroughs
- **meta-pattern-recognition**: Spot patterns appearing in 3+ domains
- **inversion-exercise**: Flip assumptions to reveal alternatives
- **scale-game**: Test at extremes to expose fundamental truths
- **when-stuck**: Dispatch flowchart mapping stuck-symptoms to techniques

### Architecture Skills (New)
- **preserving-productive-tensions**: Preserve multiple valid approaches when context determines which is better

### Research Skills (New)
- **tracing-knowledge-lineages**: Understand why code exists before changing it

### Workflow Skills (Enhanced)
- **brainstorming**: Phases with "When to Revisit" - flexibility over rigid progression
- **executing-plans**: Steps with "When to Stop" - blocker handling

## Testing

All skills tested with RED-GREEN-REFACTOR methodology:
- Baseline tests without skills showed natural behavior
- Tests with skills verified compliance under pressure
- Pressure scenarios included: sunk cost, time pressure, momentum bias
- All skills passed final verification

## Attribution

Skills derived from amplifier agents (commit 2adb63f):
- insight-synthesizer → 5 problem-solving techniques
- ambiguity-guardian → preserving-productive-tensions
- knowledge-archaeologist → tracing-knowledge-lineages

See ABOUT.md files in each category for full attribution.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

## Summary by CodeRabbit

- New Features
  - New skill guides: Collision-Zone Thinking, Inversion Exercise, Meta-Pattern Recognition, Scale Game, Simplification Cascades, When Stuck (dispatch), Tracing Knowledge Lineages, and Preserving Productive Tensions.

- Improvements
  - Brainstorming: clarified non-linear flow, added “When to Revisit Earlier Phases,” simplified guidance.
  - Executing Plans: added “When to Stop and Ask for Help” and “When to Revisit Earlier Steps,” reorganized reminders.

- Documentation
  - Added attribution pages for Architecture, Problem-Solving, and Research skill sets.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->
