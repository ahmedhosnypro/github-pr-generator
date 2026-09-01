# PR Patterns: Snailclimb/JavaGuide

## Corpus
- PRs analyzed: 5 (numbers: #2897, #2905, #2907, #2909, #2910)
- Caveat: 5 PRs by 5 different authors (ming1523, vverycool, loulanyue, weieast1314, duofuwang), all merged within a 13-day window (2026-08-16 → 2026-08-28). Good author diversity for such a small sample, but all 5 are trivially small documentation changes (4 of 5 are exactly `+1 -1`; the largest is `+6 -4`), so this reflects only the "drive-by docs fix" contribution style, not larger feature work. JavaGuide is a documentation/knowledge-base repo (Markdown content), so no code PRs exist in the sample to compare against.

## Titles
Mixed conventions — no single enforced title style:
- `docs: clarify L1 backfill after L2 hit` (#2897) — Conventional Commits, lowercase summary
- `Update java-basic-questions-01.md` (#2905) — bare "Update <file>" pattern (GitHub default-commit style), no scope
- `docs(ai-coding): update DeepSeek V4 pricing table with peak/off-peak tiers (#2906)` (#2907) — Conventional Commits with scope **and** an appended issue reference `(#2906)`
- `fix: 修正全栈路线图中的错别字` (#2909) — Conventional Commits type, but summary in Chinese
- `Fix grammar in Protobuf description` (#2910) — plain imperative English, no type prefix

Observations: 3 of 5 use a conventional-commit type (`docs`, `docs(ai-coding)`, `fix`); 2 of 5 do not. Titles are bilingual (English ×4, Chinese ×1) — consistent with a Chinese-language project that accepts English contributions. All are single-line, no emoji, no trailing period, ~30–85 characters. Casing after the colon is lowercase in all conventional-commit titles.

## Description structure
No consistent structure across the sample; each PR is different:

- PR #2897: `## Summary` (H2, 2 bullets) → `## Validation` (H2, 2 bullets) → one-line prose scoping note ("This keeps the change scoped to `docs/database/redis/cache-basics.md`.")
- PR #2905: no structure at all — the description is a raw code snippet pasted verbatim (`int a = 9;   // a = 9` … `int e = --d; // d = 10，e = 10`), no headers, no prose
- PR #2907: `## Summary` (H2) containing "Fixes #2906." plus one prose sentence explaining what and where ("Updates the DeepSeek V4 pricing table in `docs/ai-coding/cases/deepseek-v4-claude-code.md` to reflect the updated peak / off-peak tiered pricing model and current official rates.")
- PR #2909: `## 变更说明` (H2, Chinese for "Change description") → 2 bullets: what was fixed ("将"这些问题都不玄"改为"这些问题都不难"") and the affected page URL, then a reference line "参考贡献指南：#1235"
- PR #2910: single sentence, no headers: "Corrected a grammatical error in the Protobuf section for clarity."

Heading level, when headings exist, is always `##` (H2). `## Summary` appears in 2 of 5 PRs (#2897, #2907) — both English-language, structured PRs. Lists vs prose split evenly: 2 PRs use bullets, 2 use short prose, 1 is code-only.

## Template usage
No evidence of a repo-wide PR template: no `- [ ]` checklists, no "How Has This Been Tested"-style scaffolds, no repeated boilerplate text, no unfilled prompts. The `## Summary` header shared by #2897 and #2907 is too generic and too thin (2 instances) to prove a template, and the other 3 PRs share nothing structurally. PR #2909's "参考贡献指南：#1235" line suggests the project's contribution guidance lives in issue #1235 and is referenced voluntarily, not enforced via template. Conclusion: **freeform**.

## Length & density
Extremely short descriptions across the board:
- #2897: ~45 words (longest structured description)
- #2905: ~25 words of raw code, zero explanatory prose
- #2907: ~35 words
- #2909: ~30 words (Chinese)
- #2910: 11 words

All descriptions fit in 1–6 lines. This matches the change sizes (1 file, ≤6 line diffs): contributors scale description length to diff size. Nothing verbose anywhere in the sample; density is high — when prose exists it states the what/where precisely (file paths given in #2897, #2907; page URL in #2909).

## Voice & tone
- Imperative mood dominates where verbs are used: "clarify", "update", "修正", "Fix" (titles); "document", "backfill" (#2897 bullets). #2907 and #2910 use past-tense descriptive voice in the body ("Updates the DeepSeek V4 pricing table…", "Corrected a grammatical error…").
- No first person ("I", "we") anywhere in the 5 descriptions.
- Register: neutral and terse. The Chinese PR (#2909) is equally concise and factual, quoting the exact before/after strings ("这些问题都不玄" → "这些问题都不难").
- No greetings, thanks, meta-commentary, or hedging in any description.

## Content habits
- **Linked issues**: 1 of 5 — #2907 uses "Fixes #2906" (and repeats "(#2906)" in the title). The other 4 link nothing.
- **File/page targeting**: a strong habit — 4 of 5 PRs name the exact affected artifact: file path in #2897 ("docs/database/redis/cache-basics.md") and #2907 ("docs/ai-coding/cases/deepseek-v4-claude-code.md"), and a live page URL in #2909 ("https://javaguide.cn/roadmap/full-stack-roadmap.html"). #2905's title alone names the file.
- **Test/validation plans**: only #2897 has one ("`git diff --check`"; explicitly noting "Markdownlint and VuePress build were not run because dependencies are not installed in the checkout"). Honest negative reporting, which is a good practice.
- **Screenshots/images**: none — reasonable for typo/wording fixes.
- **Labels**: none on any PR. **Breaking-change callouts / reviewer ask-outs**: none.
- **Review engagement**: minimal — 0 reviews on all 5; comment counts 0–2. These PRs merge fast (same-day to ~2 days) with little discussion.
- **Linguistic quirk**: 3 of 5 descriptions contain literal carriage-return artifacts (`\r`) in the raw body (#2905, #2909, and the #2905 code block) — suggesting web-form submissions from Windows clients; cosmetic only.

## Bot-generated content
No bot-generated descriptions observed — no CodeRabbit "Summary by CodeRabbit" blocks, no Copilot-generated summaries, no AI footers. However, PR #2897 shows the classic signature of an AI-assisted (agent-written) description: a `## Summary` / `## Validation` scaffold, lowercase outcome bullets ("document the L1 hit, L2 hit, and L2 miss paths…"), an explicit statement of validation limits ("Markdownlint and VuePress build were not run because dependencies are not installed in the checkout"), and a scoping footer. #2907's `## Summary` + "Fixes #2906." layout is similarly consistent with common AI-agent PR output (e.g. Claude Code / Copilot agent style), though there is no explicit attribution. Neither structure appears to be enforced or stripped by maintainers — both merged as-is. The remaining 3 PRs are plainly hand-written.

## Notable exemplars
- **PR #2907** — https://github.com/Snailclimb/JavaGuide/pull/2907 — the strongest sample: conventional-commit title with scope and issue reference, "Fixes #2906" opening the body, and a single precise sentence naming the exact file, the subject (DeepSeek V4 pricing), and the nature of the update (peak/off-peak tiers, current official rates) — a complete handoff in ~35 words.
- **PR #2909** — https://github.com/Snailclimb/JavaGuide/pull/2909 — best minimal fix description: quotes the exact typo and its correction, links the affected live page, and cites the contribution guide — everything a reviewer needs to verify a 1-character-class change without opening the diff (though they still should).
