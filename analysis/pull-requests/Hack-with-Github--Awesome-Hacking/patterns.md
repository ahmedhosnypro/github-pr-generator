# PR Patterns: Hack-with-Github/Awesome-Hacking

## Corpus
- PRs analyzed: 5 (numbers: #172, #173, #211, #234, #235)
- Caveat: this is an "awesome list" repo, so most PRs are one-line list additions. #172 and #173 were merged ~10 months after creation (created 2025-06/07, merged 2026-04), suggesting minimal review engagement; #234 and #235 are both by the same author (0xbadshah) on the same day (2026-07-26) and share an identical structure, so stylistic signal comes largely from that pair. Sample is small and skewed toward trivial changes — weak basis for repo-wide conclusions.

## Titles
Mixed conventions — no single enforced style:
- Conventional-commit style (2 of 5): `chore: update lock-threads from v5 to v6.0.2` (#234), `chore: compress repository banner from PNG to WebP` (#235); also `feat: add Awesome Node.js Security to the list` (#173) — all lowercase after the prefix.
- Plain sentence style (2 of 5): `Added Awesome Drone Hacking List` (#172, past tense, title-cased), `redesign the repository banner with a cleaner GitHub-style visual identity` (#211, lowercase, imperative).
- Length range: short (#172: 4 words) to long (#211: 11 words, ~70 chars). No emoji, no trailing periods, no scope parentheses.

## Description structure
Descriptions are sparse and inconsistent; only 2 of 5 use any headers:
- #172: **empty** description entirely.
- #173: single informal sentence, no headers: "adding a new awesome repo to the mix".
- #211: a 5-item bullet list of visual changes ("- replaced the original flat background with a modern gradient composition", "- updated title typography using Hubot Sans (GitHub official font)", …) plus a plain-text footer "mascot source:" with a URL. No markdown headers.
- #234: `## Summary` (3 bullets) → one follow-up sentence ("This workflow runs hourly and has been failing on every run, generating CI failure notifications.") → `## Test plan` (checklist).
- #235: `## Summary` (3 bullets) → one-line closer "Closes #212". No test plan despite touching 4 files.

So the only repeated structure is `#234`/`#235` sharing an H2 `## Summary` lead; the remaining PRs are unstructured or absent.

## Template usage
No evidence of a repo-mandated template: no unfilled scaffold boilerplate, no "How Has This Been Tested"-style prompts, no repeated instructions across PRs. #234 contains raw `- [ ]` checkboxes inside a self-authored "## Test plan" ("- [ ] Verify the workflow passes on the next scheduled run (top of the hour)"), but #235 by the same author on the same day omits the test plan — indicating the structure is personal habit, not an enforced template. Conclusion: **freeform**, with one author reusing a personal Summary/Test-plan layout.

## Length & density
- #172: 0 words; #173: 8 words; #211: ~60 words; #234: ~75 words; #235: ~40 words.
- Pattern: extremely terse across the board. Even the substantive maintenance PR #234 stays under ~75 words while still carrying root-cause explanation (Node 20 deprecation, exact error string `"github-token" length must be less than or equal to 100 characters long`). High information density when the author bothers to write anything at all.

## Voice & tone
- Two registers coexist. #234/#235 are neutral, imperative, third-person engineering prose: "Update `dessant/lock-threads` from v5 to v6.0.2", "Compress repository banner from PNG (1.13 MB) to WebP (~124 KB)". 
- #211 is softer, lowercase, descriptive-aesthetic language: "improved spacing, composition, and overall visual balance", "a more playful GitHub-inspired aesthetic".
- #173 is casual first-person-adjacent ("adding a new awesome repo to the mix").
- No "I/we" forms observed anywhere.

## Content habits
- **Linked issues**: 4 of 5 PRs link none. #235 uses a proper auto-close ("Closes #212") and also credits the original author: "Cherry-picked from #212 (original author: @grayguava)".
- **Test plans**: present only in #234, and as an unchecked future-action checklist rather than executed verification ("Verify the workflow passes on the next scheduled run"). No PR demonstrates testing performed.
- **Screenshots/images**: none — conspicuously absent even in #211, which is a pure visual banners redesign and merely links the mascot source (https://octodex.github.com/securitocat/).
- **Quantified evidence**: #234 quotes the exact failing error message and Node versions; #235 quantifies the win ("1.13 MB → ~124 KB — 91% size reduction"). The two strongest PRs anchor claims in numbers/strings.
- **Labels**: none on any PR. **Review activity** is minimal: #234 and #235 merged with 0 reviews and 0–1 comments, within hours of creation.
- **Breaking-change callouts / reviewer ask-outs**: none.

## Bot-generated content
No explicit bot signature (no "Summary by CodeRabbit" block, no Copilot disclaimer, no AI footer) in any of the 5 PRs. However, the #234/#235 pair shows hallmarks of AI-assist drafting without disclosure: identical `## Summary`/`## Test plan` scaffold, em-dash-heavy one-line bullets ("v6.0.2 natively targets Node 24, fixing the failure"), and a `## Test plan` containing `- [ ]` items phrased as post-merge verification — a layout typical of LLM-generated PR bodies (the same shape that tools like Claude Code emit by default). Unproven, but if so, the maintainer merged it as-is, meaning such AI-style structure is acceptable to this project.

## Notable exemplars
- **PR #234** — https://github.com/Hack-with-Github/Awesome-Hacking/pull/234 — the strongest sample: for a 2-line version bump it gives root cause (Node 20 deprecation), the exact failure string, and a concrete verification path, all in ~75 words.
- **PR #235** — https://github.com/Hack-with-Github/Awesome-Hacking/pull/235 — good hygiene habits: quantifies the win (91% size reduction), credits the original author via cherry-pick attribution, and closes the linked issue with `Closes #212`.
