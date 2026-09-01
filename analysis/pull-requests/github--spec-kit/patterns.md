# PR Patterns: github/spec-kit

## Corpus
- PRs analyzed: 5 (numbers: #4340, #4359, #4362, #4318, #4369)
- Caveats: authors are Noor-ul-ain001 (×2: #4340, #4318), hamedrabah (#4359), WOLIKIMCHENG (#4362), and the `github-actions` bot (#4369) — 4 distinct identities, but all 5 PRs merged within a 3-day window (2026-08-26 → 2026-08-28) and all 5 disclose AI involvement (Claude Code ×2, Codex ×1, Copilot agentic workflow ×1). This sample describes community-contributor, AI-assisted fix PRs more than maintainer norms; it is too small to characterize the whole repo.

## Titles
4 of 5 titles are Conventional Commits with the `fix` type, lowercase after the colon, under ~70 characters, no emoji, no trailing period:
- `fix(events): stop falling back to a fake "pwsh" argv when no launcher exists` (#4340)
- `fix: decode feature.json as UTF-8 in Windows PowerShell` (#4359, no scope)
- `fix(auth): reject malformed URL ports before credential matching` (#4362)
- `fix(bundler): reject non-string catalog entry tag members` (#4318)

The outlier is the automated PR: `[extension] Add AgentDocx SpecKit V2 extension to community catalog` (#4369) — bracket tag instead of a type, sentence-case imperative. No `feat:`/`chore:` types appear in the sample.

## Description structure
Two distinct scaffolds coexist:

Claude Code scaffold (#4340, #4318): `## Summary` (3–4 bullets describing root cause → fix, with inline code and fenced `python` snippets) followed by `## Test plan` (all `- [x]` checked), then a `Co-Authored-By: Claude Sonnet 5` trailer and session URL.

Repo-template scaffold (#4359, #4362): `## Description` (1–2 short prose paragraphs) → `## Testing`. #4359 adds an `## AI Disclosure` section. #4359 also opens with `Fixes #4333.` as its first line.

Bot scaffold (#4369): plain one-line opener (`Add \`agentdocx-speckitv2\` community extension submitted by \`@ahmed200346\`.`), then `## Changes` (2 bullets), then `## Validation Results` (a 10-row markdown table of ✅ passes), then `Closes #4342` and a `cc` line.

All sections use `##` (H2) headers; bullets dominate over prose. Canonical human order: Description/Summary → Testing/Test plan.

## Template usage
There **is** a repo PR template, most visible in #4359, which left its boilerplate items unchecked:
```
- [ ] Tested locally with `uv run specify --help`
- [ ] Ran existing tests with `uv sync && uv run pytest`
- [ ] Tested with a sample project (if applicable)
```
The `## AI Disclosure` section in #4359, with checkbox alternatives ("I **did not** use AI assistance" / "I **did** use AI assistance (describe below)"), is likewise template scaffolding. #4362 reuses the `## Description`/`## Testing` headers but collapses Testing into 3 command bullets without the checkbox prompts. Conclusion: **partial** — a template exists (Description / Testing / AI Disclosure), but two of four human PRs bypass it entirely with the Claude Code "Summary + Test plan" scaffold instead.

## Length & density
- #4340: ~230 words, 2 sections + footer (dense root-cause narrative)
- #4359: ~210 words, 3 sections
- #4362: ~45 words, 2 sections (shortest)
- #4318: ~180 words, 2 sections + footer
- #4369: ~120 words + a 10-row validation table (bot)

Pattern: short-to-medium, all under ~250 words, matching the small diffs (+8 to +53 changed lines across the sample). Density is high — bullets carry specifics (`shutil.which("pwsh") or shutil.which("powershell") or "pwsh"`, `WinError 5`), not filler.

## Voice & tone
- Descriptive present tense with imperative fix statements: "Fix: mirror that behavior — return `None` when neither launcher is found" (#4340); "Prevent malformed explicit ports from matching `auth.json` entries…" (#4362).
- No first-person in the substantive prose; "I" appears only inside the AI-disclosure boilerplate (#4359).
- Formal, precise, engineering-register. Technical specifics are named rather than gestured at: "`'pwsh'`", "`feature.json`", exit codes ("exit code 2" vs "exit code 0"), test counts ("118 passed", "21 passed").

## Content habits
- **Linked issues**: 2 of 5 — `Fixes #4333` (#4359) and `Closes #4342` (#4369). The other 3 link nothing.
- **Test plans**: universal — every PR has a Testing/Test plan/Validation section with concrete commands or evidence. Strong habits: test-the-test verification ("Verified the test fails without the fix", #4340 and #4318), pre-existing-failure disclaimers ("4 pre-existing Windows symlink-elevation failures … unrelated to this change", #4340), and honest gaps (`uv sync` couldn't run, "CI still needs to execute the test on Windows PowerShell 5.1", #4359).
- **Cross-references to prior PRs**: #4318 cites "the same bug class just fixed in #4091".
- **Screenshots/images**: none (all backend/tooling and metadata changes).
- **Breaking-change callouts / reviewer ask-outs**: none observed.
- **Labels**: only the bot PR has labels (`extension-submission`, `automated`).

## Bot-generated content
This corpus is saturated with AI-generated descriptions — 5 of 5 PRs disclose or exhibit AI authorship:
- #4340 and #4318 end with `Co-Authored-By: Claude Sonnet 5` plus a `https://claude.ai/code/session_…` link; the uniform `## Summary` / `## Test plan` structure and "- [x]" checklist style is the Claude Code PR scaffold. Maintainers merged both with the structure intact, so the scaffold is accepted in practice even though it bypasses the repo template.
- #4359 explicitly discloses: "Codex (GPT-5, autonomous) assisted with issue investigation, implementation, test design, and review."
- #4369 is fully bot-authored (`github-actions` actor), closing with: "*Posted on behalf of `@ahmed200346` by GitHub Copilot (model: claude-sonnet-4.6, autonomous)*" plus a "Generated by 🧩 Add Community Extension from Issue Submission … for issue #4342" footer and hidden HTML metadata comments (`<!-- gh-aw-agentic-workflow: … engine: copilot … model: claude-sonnet-4.6 … -->`). Its `## Validation Results` table is workflow-generated, not human-written.

For a PR-description generator, the Claude Code "Summary + Test plan" shape is the de-facto competitor format in this repo, and the gh-aw workflow is a direct incumbent for automation PRs.

## Notable exemplars
- **PR #4340** — https://github.com/github/spec-kit/pull/4340 — the strongest sample: a complete root-cause chain (fallback fabricates `["pwsh", "-File", …]` → `FileNotFoundError` → confusing exit code 2), compares against the sibling `_resolve_argv` that "already gets this right", and proves the fix with a test-the-test note and full suite counts.
- **PR #4359** — https://github.com/github/spec-kit/pull/4359 — best process hygiene: follows the repo template, explains the ANSI-code-page bug concretely, and is candid about what was *not* verified ("CI still needs to execute the test on Windows PowerShell 5.1").
