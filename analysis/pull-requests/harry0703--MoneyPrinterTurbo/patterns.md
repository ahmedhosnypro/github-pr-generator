# PR Patterns: harry0703/MoneyPrinterTurbo

## Corpus
- PRs analyzed: 5 (numbers: #1263, #1269, #1270, #1277, #1282)
- All merged within a 4-day window (2026-08-26 → 2026-08-30), none by the repo owner (harry0703): 4 distinct external contributors (YUSAKRU, Mihir7027 ×2, brizzio, housine35). Author diversity is good for a 5-sample corpus, but all PRs are small fixes/features (+22 to +149 additions) merged fast with little review (0–1 reviews, 1–4 comments each), so the sample reflects drive-by contributor style, not maintainer-authored PR conventions.

## Titles
Mixed convention: 3 of 5 use Conventional Commits with a parenthesized scope, 2 of 5 are plain capitalized sentences:
- `fix(audio): measure audio_duration from the real file, not SubMaker cues` (#1263)
- `fix(tts): ensure AudioFileClip is always closed in ElevenLabs, Chatterbox, and Fish Audio` (#1269)
- `fix(llm): use non-greedy quantifier when stripping bracket and paren groups from script` (#1270)
- `Add OpenRouter LLM provider` (#1277)
- `Fix UnicodeEncodeError that kills the CLI after a successful run` (#1282)

All three conventional titles are type `fix` with lowercase-scope and lowercase description — no `feat:` used even for the feature PR (#1277 uses plain "Add…"). Titles are descriptive and long (~44–84 chars), often naming the exact mechanism ("non-greedy quantifier", "AudioFileClip is always closed"). No emoji, no trailing periods. Merged as-is, so the maintainer tolerates both styles.

## Description structure
Every PR uses markdown section headers and bullets, but the header names and levels vary per author — there is no single canonical structure:

- #1263: `## Summary`, `## Measured`, `## What the under-count actually affects`, `## Fix`, `## Test plan`, `## Follow-ups (deliberately not in this PR)` — six H2 sections, prose-heavy with a markdown table, a numbered impact ranking, and bold callouts.
- #1269: `## Summary`, `## Changes`, `## Test plan` — H2, bullets only, written with hard-wrapped CRLF lines (~72 col), suggesting an authored-elsewhere (possibly tool-generated) body pasted in.
- #1270: `## Summary`, `## Test plan` — H2, bullets, inline before/after examples (`"[Intro] Great content [end]" → "."`).
- #1277: `## Summary`, `## Tests` — two H2 sections, one-line bullets; the "Tests" section is a single verbatim command (`uv run pytest test/services/test_llm.py …`).
- #1282: `### What happens`, `### Reproducing`, `### The change`, `### Verified` — H3 headers (unique in the sample), prose paragraphs with two fenced traceback blocks and a bash repro command.

Convergent pattern: a `Summary` opener (4 of 5 PRs) followed by a test/verification section (`Test plan` ×2, `Tests` ×1, `Verified` ×1). Middle sections (problem evidence, fix mechanics) vary by author.

## Template usage
No repo PR template is evident: no shared boilerplate, no instructional scaffold text, no "How Has This Been Tested"-style fixed prompts. The `- [ ]` checklists in #1269 and #1270 are unchecked *at merge time* (e.g. `- [ ] test_elevenlabs_tts_audio_clip_closed_on_duration_error passes`), which indicates contributor-authored test plans rather than a maintainer-enforced checklist — a repo template's checkboxes would typically be ticked or gate the merge. #1263 uses checked boxes (`- [x]`) as a completion report. Conclusion: **freeform**, with a strong emergent convention of `## Summary` + test section that contributors converge on independently.

## Length & density
Highly heterogeneous — bimodal distribution:
- #1263: ~650 words, six sections, a measured-data table — an outlier of thoroughness, far beyond its +149/-1 diff.
- #1282: ~330 words with two code blocks.
- #1269: ~130 words.
- #1270: ~110 words.
- #1277: ~45 words — the tersest, essentially a changelog plus one test command.

Median is short (~110–130 words); the two longest PRs are diagnostic bug fixes where the author builds an evidence case (measurement tables, tracebacks) rather than just describing the diff.

## Voice & tone
- Explanatory/descriptive register dominates; titles use imperative mood ("Add", "Fix") while bodies use declarative prose.
- First person appears only in the two longest PRs and only for epistemic honesty: #1263's "I initially wrote that the final mux truncates the narration… That is wrong… I want to withdraw it" and offer "Happy to open a separate PR for either if you want them"; #1282 is fully impersonal despite similar depth.
- Tone is direct, technical, and precise — quantified claims ("a constant ~0.88s tail", "19.0% error", "22 lines, `cli.py` only") rather than hedged summaries.
- Bold emphasis used for key conclusions ("**This is not a new opinion about which number is correct…**", "**the relative error is worst on short clips**").

## Content habits
- **Linked issues: none in any of the 5 PRs** — no "Fixes #N", no issue references at all. Every PR is self-motivated. Labels: none on any PR.
- **Test plans near-universal**: 4 of 5 PRs include an explicit test section; #1263 goes furthest with load-bearing-test verification ("reverting the fix turns the priority cases red") and lint/suite status. #1277 gives the exact pytest invocation.
- **Evidence blocks**: #1263 includes a measurement table cross-checked with `ffprobe` and inline file:line references (`app/services/task.py:474`); #1282 includes verbatim tracebacks and a repro command.
- **Screenshots/images: none** — consistent with a backend/pipeline codebase, but none even for the WebUI-adjacent changes.
- **Scope discipline callouts**: #1263 explicitly lists "Follow-ups (deliberately not in this PR)" to keep the change reviewable — a notable reviewer-consideration habit.
- **Breaking-change callouts / reviewer ask-outs**: none.

## Bot-generated content
- #1282 carries an explicit AI attribution footer: "🤖 Generated with [Claude Code](https://claude.com/claude-code)" — the only disclosed AI-generated description in the sample; the maintainer merged it with the footer intact, indicating AI-assisted PRs are accepted and the attribution is not stripped.
- #1269 and #1270 (same author) show structural signatures of tool generation — CRLF hard-wrapped lines, uniform `## Summary` / `## Test plan` scaffolding, unchecked test-plan boxes — but carry no disclosure, so this is inference from formatting, not confirmed.
- No CodeRabbit/Copilot summary blocks observed in any PR.

## Notable exemplars
- **PR #1263** — https://github.com/harry0703/MoneyPrinterTurbo/pull/1263 — the strongest sample: quantified root-cause evidence (a 3-row measurement table cross-checked with `ffprobe`), an impact ranking citing exact call sites, a mid-PR self-correction withdrawing a wrong claim, load-bearing regression tests, and explicitly deferred follow-ups. A model diagnostic PR description.
- **PR #1282** — https://github.com/harry0703/MoneyPrinterTurbo/pull/1282 — compact bug-fix arc (symptom → tracebacks → repro command → fix → verification) with an honest AI-generation footer; demonstrates that disclosed AI-authored descriptions can still meet a high evidence bar.
