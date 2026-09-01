# Merged PRs: mattpocock/skills

## PR #904: wait-what: follow CONTEXT-MAP.md to the right CONTEXT.md

- URL: https://github.com/mattpocock/skills/pull/904
- Author: mattpocock
- Merged: 2026-08-19T09:45:36Z (created: 2026-08-19T09:43:52Z)
- Stats: +7 -2, 3 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Summary

- `wait-what` re-pitches a message using the ubiquitous language from `CONTEXT.md`, but had no notion of `CONTEXT-MAP.md` — the multi-context index some repos use instead of a single root `CONTEXT.md`. On a repo like that, the skill fell silent on vocabulary instead of following the map.
- Adds one clause to the skill body pointing it at `CONTEXT-MAP.md` when the repo has more than one context, and a matching one-line correction to the docs page so it doesn't claim vocabulary is unavailable in that case.

Kept deliberately tiny — the skill is three lines by design (see its docs: "Skills that fight verbosity fail by growing").

## Test plan

- [ ] Re-run `wait-what` in a multi-context repo (one with `CONTEXT-MAP.md` and no root `CONTEXT.md`) and confirm it follows the map to the relevant `CONTEXT.md` instead of falling back to code-level vocabulary.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## PR #911: Fix invalid YAML front matter in six SKILL.md files

- URL: https://github.com/mattpocock/skills/pull/911
- Author: mattpocock
- Merged: 2026-08-19T13:09:19Z (created: 2026-08-19T13:01:41Z)
- Stats: +11 -6, 7 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: Fixes #907

### Description

## Summary
- Quotes the `description` front-matter scalar in six `SKILL.md` files where an unquoted colon-space sequence made the YAML invalid, causing `skills.sh` to skip them during discovery (they couldn't be listed or installed via `npx skills`)
- The invalid colons were introduced by #905's em-dash-to-colon sweep, which validated YAML files generally but didn't run every `SKILL.md` front-matter block through the parser `skills.sh` uses
- Files fixed: `skills/engineering/to-spec/SKILL.md`, `skills/engineering/code-review/SKILL.md`, `skills/engineering/setup-matt-pocock-skills/SKILL.md`, `skills/in-progress/writing-fragments/SKILL.md`, `skills/in-progress/writing-shape/SKILL.md`, `skills/productivity/wait-what/SKILL.md`
- Wording is unchanged — only quoting was added, matching the existing style used by e.g. `skills/engineering/implement/SKILL.md`

Fixes #907

## Test plan
- [x] Parsed the front matter of all 35 `SKILL.md` files in the repo with PyYAML's `safe_load` (the same style of parser `skills.sh` uses) — all 35 now parse cleanly, down from 6 failures before the fix
- [ ] `npx skills add mattpocock/skills --global --agent claude-code --skill to-spec --yes` picks up `to-spec` (and the other five) during discovery

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## PR #905: Remove all em-dashes from the repo

- URL: https://github.com/mattpocock/skills/pull/905
- Author: mattpocock
- Merged: 2026-08-19T10:04:49Z (created: 2026-08-19T09:56:57Z)
- Stats: +1095 -1087, 100 files
- Labels: none
- Reviews: 0 | Comments: 2
- Linked issues: none

### Description

## Summary
- Every em-dash in the repo's prose has been removed: docs, `SKILL.md` files, ADRs, `README.md`, scripts, JSON/YAML metadata.
- Each occurrence was rewritten by hand rather than mechanically substituted: fixes vary per sentence (commas, colons, periods splitting a sentence, parentheses, conjunctions, restructuring) so the text still reads naturally and keeps its original meaning.
- Code/script/JSON/YAML files were only touched inside comments or string values; no executable syntax changed. Verified: JSON files parse, `.mjs`/`.cjs` pass `node --check`, `.sh` scripts pass `bash -n`, and the `.yaml` file parses.
- `CHANGELOG.md` is changeset-generated, so its historical entries are left alone (reverted to `main`'s text) rather than hand-edited; a `.changeset/remove-em-dashes-repo-wide.md` patch changeset covers this change instead, and will land in `CHANGELOG.md` on the next version bump.
- Added a line to `CLAUDE.md` (mirrored into `AGENTS.md` via symlink) steering future agents away from reintroducing em-dashes in this repo's prose.
- `grep -rP` for the em-dash character across the repo now returns matches only in `CHANGELOG.md`, which is intentionally untouched.

## Test plan
- [x] em-dash grep across the repo returns matches only in `CHANGELOG.md` (untouched on purpose)
- [x] `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` parse as valid JSON
- [x] `node --check` passes on `scripts/sync-plugin-version.mjs` and `skills/in-progress/setup-ts-deep-modules/dependency-cruiser.config.cjs`
- [x] `bash -n` passes on `scripts/link-skills.sh`, `skills/engineering/wizard/template.sh`, `skills/engineering/diagnosing-bugs/scripts/hitl-loop.template.sh`
- [x] `skills/productivity/wait-what/agents/openai.yaml` parses with `yaml.safe_load`
- [ ] Human read-through for tone/accuracy (99 files touched)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## PR #917: grilling: separate questions in a round with an HR

- URL: https://github.com/mattpocock/skills/pull/917
- Author: mattpocock
- Merged: 2026-08-20T10:35:14Z (created: 2026-08-20T10:32:16Z)
- Stats: +12 -1, 2 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Summary
- Multi-question rounds in the `grilling` skill had no visual separator, so consecutive `❓`/`➡️` blocks ran straight into each other.
- Adds one line to `SKILL.md` instructing the agent to insert a horizontal rule (`---`) between consecutive questions within the same round.
- Adds a changeset (patch bump) per this repo's convention.

## Test plan
- [ ] Skim `skills/productivity/grilling/SKILL.md` to confirm the new line reads naturally alongside the existing question-format block.
- [ ] Run `/grill` (or trigger the grilling skill) with a multi-question round and confirm the model inserts `---` between questions.

## PR #926: Add implement-spec skill (in-progress) with its bucket docs

- URL: https://github.com/mattpocock/skills/pull/926
- Author: mattpocock
- Merged: 2026-08-21T10:11:23Z (created: 2026-08-21T10:09:50Z)
- Stats: +47 -0, 5 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Adds the `implement-spec` skill to the `in-progress` bucket, with every documentation duty that bucket carries.

The skill takes a spec plus its tickets and drives them to a single PR. It reads the tickets as a **task graph** with blocking edges rather than a list of steps, so **implementer subagents** run in background worktrees across the ready **frontier**, a **merger subagent** folds each one back into the PR branch, and the flow closes with `/code-review` before the PR is marked ready.

## Documentation

- **`skills/in-progress/README.md`**: adds the entry. This is the one hard requirement, since every bucket README must list every skill in the bucket, name linked to its `SKILL.md`, flat list for this bucket.
- **Changeset**: added, so the release notes carry the skill.
- **`agents/openai.yaml`**: `short_description` now matches the bucket style, a short verb phrase with no closing period.

Correctly left alone, as the rules for non-promoted buckets require: no entry in the top-level `README.md`, no entry in `.claude-plugin/plugin.json`, and no `docs/` page.

`ask-matt` is **not** updated. No `in-progress` skill appears in the router today, so the skill joins it when it graduates to a promoted bucket.

## Also

`.gitignore` now ignores `.claude`, which holds `settings.local.json` and agent worktrees. Neither belongs in the repo.

## After merge

Run `scripts/link-skills.sh` to symlink the new skill into `~/.claude/skills` and `~/.agents/skills`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
