# PR Patterns: ohmyzsh/ohmyzsh

## Corpus
- PRs analyzed: 5 (numbers: #14029, #14030, #14031, #14032, #14033)
- Caveat: all 5 PRs are by the same author (mxtymoshyk), created within the same minute-window (2026-08-30T08:50:18Z–08:50:28Z) and merged the same day. This is one contributor's bug-audit batch, not a cross-section of the repo. All 5 are 1-file, tiny-diff shells fixes (+1/-1 in four cases, +3/-2 in one). Too small and homogeneous to generalize repo-wide.

## Titles
All 5 titles use strict Conventional Commits with scopes:
- `fix(diagnostics): correct `reserved_words` array name` (#14031)
- `fix(cli): keep completion flag when loading multiple plugins` (#14032)
- `fix(git): restore `git_develop_branch` fallback in `gbds`` (#14033)
- `fix(systemadmin): quote awk program in `webtraffic`` (#14030)
- `fix(updater): silence git version check output` (#14029)

Pattern: `fix(<plugin-or-area>): <lowercase imperative phrase>`. Only type observed is `fix` (5/5 — consistent with the sample being a bug-audit batch). Scope values match plugin/tool names (`diagnostics`, `cli`, `git`, `systemadmin`, `updater`). Descriptions after the colon are all-lowercase, no trailing period, no emoji. 3 of 5 titles embed inline-code backticks for identifiers (`reserved_words`, `git_develop_branch`, `webtraffic`). Lengths ~40–60 chars, single line.

## Description structure
Every PR has a two-part structure: a long freeform prose investigation on top, then the repo template sections at the bottom. Exact section headers (all `##` H2, all ending with a colon):
1. Freeform prose body (no header) — opens immediately after `### Description`
2. `## Standards checklist:` (present in 5/5)
3. `## Changes:` (present in 5/5)
4. `## Other comments:` (present in 5/5)

The freeform body is prose paragraphs, never bullets, interleaved with fenced code blocks showing the offending code and before/after command output. The `## Changes:` section is always a single one-line bullet summarizing the diff ("- Swap `2>&1 >/dev/null` to `>/dev/null 2>&1` so the git availability check is actually silent." — #14029).

## Template usage
Strong evidence of a repo PR template. The `## Standards checklist:` block is byte-identical boilerplate across all 5 PRs — 9 items, e.g. `- [x] The PR title is descriptive.`, `- [x] The code follows the code style guide detailed in the wiki.`, `- [x] If I used AI tools (ChatGPT, Claude, Gemini, etc.) to assist with this contribution, I've disclosed it below.` The same one item is left unchecked in all 5: `- [ ] If the code introduces new aliases, I provide a valid use case for all plugin users down below.` (not applicable to bug fixes). Notably the template includes an explicit AI-assistance disclosure item. The trailing `## Changes:` and `## Other comments:` prompts are template sections filled with authored content, not left as placeholders. Conclusion: **full template, actively filled** — but the substantive content lives in the freeform prose the author prepended above it.

## Length & density
These are long descriptions for tiny diffs. Approximate word counts of the freeform body (excluding the repeated checklist boilerplate):
- #14029: ~230 words
- #14030: ~210 words
- #14031: ~280 words
- #14032: ~260 words
- #14033: ~420 words (longest)

Pattern: verbose-on-purpose — each +1/-1 fix carries a full root-cause write-up. Density is high: nearly every sentence carries technical content (line numbers: "`reserved_words` is declared on line 261"; shell semantics: "In zsh the exit status of `local var=$(cmd)` is the status of the `local` builtin, not of the command substitution"). No filler or pleasantries.

## Voice & tone
- First person, singular, throughout: "I kept it strictly 0/1 rather than summing" (#14032), "I used `||` directly rather than keeping the `$?` test" (#14033), "Before moving these I checked that all seven really are reserved words" (#14031).
- Past tense for what was broken, present tense for the fix rationale; titles and `## Changes:` bullets are imperative.
- Register is expert but conversational, with dry editorial asides: "which is the tell that ordering matters when it shouldn't" (#14032), "For a command whose job is deleting branches, silently doing nothing is a fairly unhelpful failure mode." (#14033).
- Confident, precise, no hedging beyond deliberate scope disclaimers.

## Content habits
- **Linked issues**: none closed. 4 of 5 have no issue references at all. #14032 says "This might be related to #10412, but … so I don't think this closes it." — reference without auto-close. #14029 cross-checks an open overlapping PR: "I checked #13828 — it also touches `check_for_upgrade.sh` but only from line 108 down, so there's no overlap."
- **Test plans**: no "Tests" section header, but every PR embeds a before/after verification block in the prose, e.g. #14030: "before: awk: syntax error ... (exit 2) / after: 2 (exit 0)", #14033: stub-based verification with expected outputs for both the failing and success paths. Verification is demonstrated via pasted terminal output rather than asserted.
- **Root-cause depth**: every PR quotes the offending line(s) verbatim in a fenced block, explains the shell-semantics trap, and explains why sibling code is unaffected ("Repos that do have `main` or `master` are unaffected" — #14033).
- **Scope discipline**: #14033 explicitly fences off adjacent work: "the same `local x=$(...)` followed by a `$?` test appears elsewhere in the tree and is probably worth a grep" — noted but "deliberately left alone to keep this reviewable."
- **Screenshots/images**: none (unsurprising — all are shell CLI fixes).
- **Labels**: none on any PR. **Breaking-change callouts / reviewer ask-outs**: none.

## Bot-generated content
No CodeRabbit/Copilot auto-summary blocks appear in any of the 5 descriptions. However, AI involvement is explicitly disclosed per the template checkbox: all 5 `## Other comments:` sections carry the identical statement "AI-assisted: I've been using Oh My Zsh for years and wanted to contribute something back, so I used Claude to help audit the tree for bugs. … I've read the surrounding code, confirmed the behaviour myself on zsh 5.9.2, and can explain the change." So rather than a bot summary maintained alongside human text, this repo's template forces human-authored disclosure of AI use — and the descriptions themselves read as human-edited or human-written, with personal verification claims that a bot summary would not make. As competition for AI-generated PR descriptions: the repo has institutionalized AI disclosure in the template rather than bot-generated prose.

## Notable exemplars
- **PR #14033** — https://github.com/ohmyzsh/ohmyzsh/pull/14033 — the most complete write-up: quotes the buggy code, explains the zsh exit-status trap, shows why the failure is silent, verifies with two stubs (failing and succeeding paths), and explicitly bounds its own scope.
- **PR #14029** — https://github.com/ohmyzsh/ohmyzsh/pull/14029 — best economy: explains a subtle redirection-ordering bug in a few paragraphs, demonstrates the user-visible symptom, and notes the exit status is unchanged — pre-empting the obvious "does this change behavior?" review question.
