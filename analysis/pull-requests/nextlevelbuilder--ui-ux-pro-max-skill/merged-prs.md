# Merged PRs: nextlevelbuilder/ui-ux-pro-max-skill

## PR #452: docs: add Vietnamese README

- URL: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/pull/452
- Author: tuananh31j
- Merged: 2026-08-24T16:56:42Z (created: 2026-08-22T04:13:29Z)
- Stats: +646 -2, 3 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## What does this PR change?

Adds a complete Vietnamese translation in `README.vi.md` and adds Vietnamese language links to the English and Chinese READMEs.

## Why?

Makes the project documentation more accessible to Vietnamese-speaking users.

## Checklist

- [x] N/A — This is a documentation-only change; no source or generated skill files were modified
- [x] N/A — No data, scripts, or templates changed
- [x] N/A — No behavior changed, so tests were not required
- [x] Commit messages follow [[Conventional Commits](https://www.conventionalcommits.org/)](https://www.conventionalcommits.org/) (`docs: add Vietnamese README`)
- [ ] This PR targets a feature branch, not pushed directly to `main`

## PR #458: test(cli): add droid to script-path rendering coverage

- URL: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/pull/458
- Author: Fermilus-coder
- Merged: 2026-08-25T10:26:24Z (created: 2026-08-25T03:48:56Z)
- Stats: +1 -0, 1 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## Summary
- `cli/tests/e2e/template-script-paths.spec.ts` currently checks generated search-script paths for only 4 of the ~20 supported `--ai` platforms (`claude`, `codex`, `copilot`, `kiro`).
- Adds `droid` to the covered cases. Like `codex` (root `.agents`), `droid`'s install root (`.factory`) doesn't match its platform identifier (`droid`), which is exactly the kind of naming mismatch a future refactor of `cli/src/utils/template.ts` or `cli/assets/templates/platforms/droid.json` could silently break without a test catching it.
- No behavior change — this only extends existing test coverage using the file's existing pattern.

## Test plan
- [x] Verified the expected path (`.factory/skills/ui-ux-pro-max/scripts/search.py`) by tracing `cli/assets/templates/platforms/droid.json` (`root: .factory`, `scriptPath: skills/ui-ux-pro-max/scripts/search.py`) against `renderSkillFile`'s `rootedScriptPath` logic in `cli/src/utils/template.ts`.
- [x] Confirmed `droid.json`'s `installType`/`sections` config matches the already-passing `copilot`/`kiro` cases (`installType: full`, `quickReference: false`), so the shared `SEARCH_COMMAND_COUNT` assertion should hold.
- [ ] Could not run the Playwright suite locally (no Node/npm/bun available in this environment) — please let CI confirm.

## PR #461: test(brand): decode subprocess output as UTF-8 so the suite can pass on Windows

- URL: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/pull/461
- Author: djatadougbewilfried-star
- Merged: 2026-08-25T15:27:04Z (created: 2026-08-25T14:34:23Z)
- Stats: +70 -14, 2 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## What does this PR change?

Pins the subprocess pipe in `brand/scripts/tests/test_sync_brand_to_tokens.py` to UTF-8, and adds a regression test for the code path that exposes the problem. One commit, tests only — no change to `sync-brand-to-tokens.cjs` itself.

## Why?

This is the follow-up promised in #460 (which fixes the same class of bug in `design-system`). The test does:

```python
subprocess.run([node, str(SCRIPT)], cwd=tmp_path, capture_output=True, text=True)
```

`text=True` with no `encoding` decodes the pipe with the locale codec. Three of the script's messages carry emoji whose UTF-8 bytes land on cp1252's five undefined slots:

| Line | Message | Byte |
|---|---|---|
| `sync-brand-to-tokens.cjs:132` | `⚠️  No base hex found for … color` | `0x8F` |
| `sync-brand-to-tokens.cjs:198` | `❌ Brand guidelines not found: …` | `0x9D` |
| `sync-brand-to-tokens.cjs:223` | `⏭️  Dry run - no files changed` | `0x8F` |

Decoding raises inside subprocess's reader thread, the stream comes back as `None`, and the test's own `assert "TypeError" not in result.stderr` then fails with — of all things — a `TypeError`.

Reproduced on Windows 11 / Python 3.14 / Node 24.11.1, running the script with no `docs/brand-guidelines.md` present:

```
UnicodeDecodeError: 'charmap' codec can't decode byte 0x9d in position 1
    stdout = 'ðŸ”„ Syncing brand guidelines â†’ design tokens\n\n'   # mojibake
    stderr = None
    assert "TypeError" not in result.stderr
      -> TypeError: argument of type 'NoneType' is not a container or iterable
```

With `encoding="utf-8"`, `stderr` reads back correctly as `❌ Brand guidelines not found: …` and the assertion passes.

**The existing test survives today only by luck** — the bundled starter fixture takes none of those three paths. Emoji whose bytes miss the five cp1252 holes (`🔄`, `✅`, `📊`, `📋`, `✨`) decode as mojibake without raising, so the failure looks arbitrary until you line the bytes up.

## What the new test covers

`test_reports_missing_guidelines_without_breaking_the_harness` runs the script against an empty project — the default state of anything that has not run the brand skill yet, and the path a contributor hits first. It asserts a clean exit 1 with a readable error.

Verified it is a real regression test, not decoration: with the `encoding="utf-8"` line removed it fails on `assert result.stderr is not None`; with it, both tests pass. Confirmed in `.claude/skills/brand/` and the `cli/assets/` mirror.

## Checklist

- [x] Changes were made in the source of truth — `.claude/skills/` for sub-skills, per `cli/scripts/sync-assets.mjs:26-28`. (The template's `src/ui-ux-pro-max/` wording does not apply: `brand` has no `src/` copy.)
- [x] Ran `npm run sync:assets && npm run check:assets` in `cli/` — mirror included in the commit, **Assets are in sync**.
- [x] Added a test: 1 passed → **2 passed**, in both copies.
- [x] Commit message follows Conventional Commits.
- [x] Targets a feature branch.

Independent of #460 — either can merge first, they touch different files.

## PR #464: fix(cli): detect .claude-plugin directory for Claude Code in detectAIType

- URL: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/pull/464
- Author: loulanyue
- Merged: 2026-08-26T06:57:16Z (created: 2026-08-26T06:42:12Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## Summary
- Update `detectAIType` in `cli/src/utils/detect.ts` to detect `.claude-plugin` directory alongside `.claude`.
- Ensures projects structured as Claude Code plugins are recognized automatically for Claude skill installations.

## Tests
- `npm run verify:data` (153 python tests, 35 CSV validations, agent guide checks passed)
- `bun run typecheck` passed (0 TypeScript errors)

## PR #447: feat(design): add optional Atlas Cloud logo provider

- URL: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/pull/447
- Author: binyangzhu000-sudo
- Merged: 2026-08-27T09:15:37Z (created: 2026-08-17T13:30:19Z)
- Stats: +968 -232, 8 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## What does this PR change?

Adds Atlas Cloud as an explicit opt-in provider for the logo generator while preserving Gemini as the default. The integration uses the asynchronous image API with a single generation POST, bounded result polling, HTTPS media validation, credential-free downloads, CLI flags, documentation, and offline contract tests.

## Why?

Users with an Atlas Cloud key can generate logo variants without installing the Gemini SDK, while existing Gemini workflows and defaults remain unchanged.

## Validation

- `python3 -m pytest .claude/skills -q` (219 passed)
- `npm run verify:data`
- `npm run typecheck`
- `npm run build`
- Ruff checks for the changed Python files
- Live model catalog and schema verification
- Live Atlas generation reached `completed`; the no-credential media downloader was separately verified with a live Atlas-hosted PNG

## Checklist

- [x] Source changes are in `.claude/skills/design/`, the source of truth for bundled design sub-skills
- [x] Ran `npm run sync:assets && npm run check:assets` in `cli/`
- [x] Added offline tests under `.claude/skills/design/scripts/logo/tests/`
- [x] Commit message follows Conventional Commits
- [x] This PR targets a feature branch, not `main`

