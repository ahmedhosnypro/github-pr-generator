# PR Patterns: EbookFoundation/free-programming-books

## Corpus
- PRs analyzed: 5 (numbers: #13421, #13422, #13430, #13433, #13427)
- Authors are all distinct (mamad2411, mihhhir08, hallieren, AndyNian, bobbyonmagic), so this sample captures genuinely different contributor styles rather than one maintainer's habit — but 5 PRs is still too small to catalogue rarer genres (submissions tooling, mass link fixes) of a repo whose PR stream is overwhelmingly one-link-list edits.

## Titles
Two distinct title conventions coexist in the same 6-day window:
- Conventional-commit style, once: `fix(id): remove dead Niagahoster Bootstrap 5 tutorial link` (#13421) — lowercase scope `(id)` = the language code of the edited file.
- Plain "Add …" descriptive style, 4 of 5: `Add Sourcemap to Software Engineering courses` (#13422), `Add AI Agent Evaluation (Artificial Intelligence)` (#13430), `Add PracHub to problem sets` (#13433), `Add Linux and SQL terminal simulators (interactive tutorials, en)` (#13427).

Pattern where applicable: `Add <Resource Name> (<section/list hint>)` — the parenthetical locates the change without touching the body. Casing of the verb is consistently capitalized (`Add`) when not using conventional-commit form. Lengths ~40–75 characters, no emoji, no trailing period. The corpus shows no enforced title style: the repo merges both `fix(id): …` and bare `Add …` within days of each other.

## Description structure
No markdown section headers (`##`/`###`) appear in any of the 5 descriptions — all are short prose paragraphs plus occasional lists. Per PR:

- #13421: two prose paragraphs. First states the problem ("The Niagahoster Bootstrap 5 tutorial link in `books/free-programming-books-id.md` no longer works"); second gives evidence and reasoning (redirect chain `niagahoster.co.id` → `hostinger.co.id` → `hostinger.com/id` returning 404, no Wayback snapshot) and cites policy ("per the CONTRIBUTING guidelines I removed the dead entry").
- #13422: opening line ("Adds one entry to the Software Engineering section of `courses/free-courses-en.md`"), a fenced code block containing the exact added markdown line (`* [Sourcemap: Ninety Days to Read Any System](https://sourcemap.co) - Mihirsinh Chavda`), then bold-label pseudo-headers in list form: "**What it is:** …", "**Against the guidelines:**" with 5 bold-led sub-bullets ("**Free:**", "**No email required:**", "**Not a book:**", "**Formatting:**", "**Language:**"), and a closing "**Disclosure:**" line.
- #13430: opening line naming file and section, then 4 bullets (description + format marker, "Read online (HTML):", "Source repository:", "License: CC BY-NC-SA 4.0 (prose), MIT (code)"), then a "Disclosure:" paragraph.
- #13433: two single-sentence paragraphs (what is added, disclosure sentence).
- #13427: two paragraphs (what the two tutorials are + "free with no signup or ads"; then "Disclosure: I help maintain the site.").

Canonical order observed: *what changed* → *evidence it fits the list rules* → *authorship disclosure*. Bold inline labels (`**Free:**`, "**Disclosure:**") substitute for real headings; #13422 is the only PR using a code block to show the literal diff line.

## Template usage
No evidence of a repo PR template in these descriptions: no `- [ ]` checklists, no boilerplate instructions, no "How Has This Been Tested"-style scaffold, no unfilled template lines in any of the 5. What *functions* as an informal template is contributor-authored framing against the CONTRIBUTING rules: 3 of 5 PRs (#13422, #13430, #13421) explicitly argue compliance — "Against the guidelines: … **Free:** … **No email required:**" (#13422), "Entry follows the list's format (alphabetical order, `- Author (Format)`, license note) and I searched the list for duplicates" (#13430), "per the CONTRIBUTING guidelines I removed the dead entry" (#13421). Conclusion: **freeform, with a strong emergent convention of guideline-compliance justification** — likely a learned response to this repo's strict list-format review, not a template.

## Length & density
Short descriptions, all readable at a glance:
- #13421: ~70 words
- #13422: ~170 words (longest — the full guideline-compliance block)
- #13430: ~90 words
- #13433: ~60 words
- #13427: ~55 words (shortest)

Density is high: nearly every sentence carries verifiable information (URLs, license, formatting rule, redirect chain). Verbose prose is absent; the longest body (#13422) is long because it pre-answers every foreseeable reviewer objection, matching its stats (+1 -0). Change sizes are tiny throughout (+1/-0 or +2/-0, one file each), so description length tracks the *argument* needed, not the diff.

## Voice & tone
- Mixed imperative/descriptive: titles use imperative "Add"/"remove"; bodies are descriptive present tense ("Adds one entry…", "no longer works").
- First person is common and appears almost exclusively in disclosures: "I am the author" (#13422, #13430), "I am the founder of PracHub" (#13433), "I help maintain the site" (#13427) — 4 of 5 PRs. #13421 uses first person for reasoning instead ("I removed the dead entry").
- Tone is polite, deferential, and formal; #13422 explicitly yields judgment to maintainers: "Happy to move it to a different section or drop it if it is not a fit." #13433 says "submitting this resource for independent maintainer review."
- Emphasis via bold labels and italic stage markers (`( :construction: in process)` in #13430); no exclamation marks or casual register.

## Content habits
- **Authorship disclosure is the dominant habit**: 4 of 5 PRs contain an explicit "Disclosure:" / "disclosure" line. This is a striking, repo-specific pattern — contributors self-flag conflict of interest up front, presumably because the list polices self-promotion.
- **Compliance evidence**: every PR argues eligibility — free/no-paywall (#13422, #13430, #13433, #13427), no-email-required (#13422, #13433, #13427), correct file/section and alphabetical placement (#13422, #13430, #13433), duplicate search (#13430).
- **Linked issues**: none — "Linked issues: none" on all 5; no "Fixes #N" anywhere.
- **Screenshots/images**: none. Links are supplied instead: live URLs in #13430, #13422; #13427 describes rather than links.
- **Test plans / breaking-change callouts / reviewer ask-outs**: none — expected for link-list edits; #13427's 4-comment exchange and `waiting for changes` label (the only labeled PR) suggests review feedback happens in comments, not the body.
- **Code blocks**: one — #13422 pastes the exact added list line, a nice self-verifying habit.

## Bot-generated content
No bot-generated description content in any of the 5 PRs — no CodeRabbit/codecov summary blocks, no Copilot-generated sections, no AI-disclosure footers. The bodies read as individually hand-written (varied structure, personal disclosures, idiosyncratic phrasing like "Happy to move it"). Note: the "Comments: 1" on most PRs may indicate automated checks/bot comments on the thread, but none of that leaked into the description text captured here.

## Notable exemplars
- **PR #13422** — https://github.com/EbookFoundation/free-programming-books/pull/13422 — the strongest sample: it shows the exact added line in a code block, then systematically addresses every list rule (free, no email, correct file, alphabetical placement) with bold-labeled bullets, and closes with an honest authorship disclosure — a complete pre-emptive review-answer in ~170 words.
- **PR #13421** — https://github.com/EbookFoundation/free-programming-books/pull/13421 — best evidence-driven removal entry: documents the full redirect chain and the failed Wayback lookup, then ties the action to the CONTRIBUTING policy — a removal justified like a bug report in ~70 words.
