# PR Patterns: jackfrued/Python-100-Days

## Corpus
- PRs analyzed: 5 (numbers: #54, #70, #99, #136, #942)
- Caveat: small and heterogeneous sample — 5 different authors (jankeromnes, xiaoer371, JalanJiang, geekya215, ccwanggl), all external contributors, none by the repo owner. 4 of 5 merged within the same week of May 2019; #942 was merged 2023-10-30 (created 2022-12-13, i.e. ~10 months open). All PRs are tiny (+9/-0 up to +52/-52; #942 shows +0/-0, 0 files). Sample skews toward documentation/typo fixes from first-time contributors and cannot represent maintainer-authored PR conventions.

## Titles
- Language: 4 of 5 titles are Chinese; 1 is English (#942: `type fix`).
- No consistent convention. Only one title uses a Conventional-Commit-style prefix: #136 `fix(docs): 修改 Day02 文档中的笔误`. The other four are free-form phrases:
  - #99 `为新开发人员简化打码`
  - #54 `补充sublime text 手动下载package control插件说明` (mixed Chinese + English product names inline)
  - #70 `修复DAY1~DAY15文档中错误`
  - #942 `type fix` (lowercase, minimal)
- Lengths range from 8–30+ characters; no emoji, no sentence-ending punctuation, no trailing period.

## Description structure
Descriptions are short and mostly unstructured; only one PR uses markdown headings.
- PR #99: short prose greeting ("👋 你好，我的中文不好，对不起。🙏") + brief pitch ("我为Python-100-Days配置了Gitpod"), then a Gitpod badge link and a screenshot image. No headers, no lists.
- PR #54: **empty** description.
- PR #136: one-line summary ("修改 Day02 课程中的笔误，做如下修改：") followed by a fenced code block showing the before/after text (`计算机能处理的数据有很多中类型` → `很多种类型`).
- PR #70: the only structured one — an H1 header `# Bug Fix List 🐛` with a numbered list of 4 fix items, each with bolded titles ("修复文档中 `说明`字段的错误, 并统一了其格式") and hyphen sub-bullets; closes with an H2 `## Finally, thx for your sharing!!!:tada::tada::tada:`.
- PR #942: **empty** description.

Canonical order observed (in the single structured sample): H1 section title → numbered top-level fixes → sub-bullets per fix → closing thanks/lede. 2 of 5 descriptions are empty; 3 of 5 have no section headers at all.

## Template usage
No evidence of a repo PR template: no checklists (`- [ ]`), no boilerplate instructions, no "How Has This Been Tested"-style scaffold, no repeated section headers across PRs, no leftover template prompts. Each non-empty description is clearly authored fresh in a different style. Conclusion: **freeform** — no template, and no contributor self-structure either (except #70's one-off layout).

## Length & density
Extremely short or empty:
- #54: 0 words
- #942: 0 words
- #99: ~30 words (Chinese) + an image
- #136: ~25 words + a quoted before/after correction
- #70: ~180 words (Chinese/English mix), the longest by far

Pattern: terseness to the point of under-specification — 2 of 5 PRs carry no description at all, and none exceeded ~200 words. Commit/diff stats are correspondingly small, so descriptions mostly say what one could infer from the title.

## Voice & tone
- Casual and personal, not engineering-formal. #99 opens with a greeting and apology ("我的中文不好，对不起。🙏"); #70 opens with a strikethrough joke (`~刚刚手贱版本回滚PR自动close了... 重新PR一次~`) and ends with enthusiastic thanks (`thx for your sharing!!!:tada::tada::tada:`).
- First person appears in Chinese first-person framing (#99: "我为Python-100-Days配置了Gitpod"; #70: "个人认为最好还是做到格式统一").
- Mostly descriptive/explanatory mood rather than imperative; no imperative sentence-case summaries in the vscode maintainer style.
- Emoji/emoticons used liberally: 👋 🙏 🐛 :tada: (in #99 and #70).

## Content habits
- **Linked issues**: none — zero of 5 PRs link an issue (no "Fixes #N" anywhere); the `Linked issues` field is `none` for all 5.
- **Screenshots/images**: 1 of 5 — #99 embeds a full-width screenshot (`<img ... src="https://user-images.githubusercontent.com/..."`) of the Gitpod environment plus an "Open in Gitpod" button badge.
- **Test plans**: none — no PR describes testing or verification (expected, since all changes are docs/config; #99's "请试一试" ("please try it") is the closest thing to an instruction to verify).
- **Breaking-change callouts / reviewer ask-outs**: none. The only explicit ask of the maintainer is #70's question about formatting convention ("不知道您具体是使用哪一种,或是混用").
- **Labels**: none on any of the 5 PRs.
- **Review activity**: minimal — Reviews: 0 on all 5; comments 0 on three, 1 on #136, 5 on #70 (the largest diff, +52/-52 across 20 files). Merges appear to be handled by the owner with little discussion.
- **Before/after evidence**: #136 quotes the exact erroneous sentence and its correction inside a code block — a lightweight, effective convention for typo PRs.

## Bot-generated content
None observed. No CodeRabbit/Copilot summaries, no AI-disclosure footers, no auto-generated release notes. All content is plainly human-written (including the informal tone and typos). Note the sample is mostly from May 2019, which predates the AI-PR-summary era; only #942 (2023) is recent enough to have plausibly included bot content, and its description is empty.

## Notable exemplars
- **PR #70** — https://github.com/jackfrued/Python-100-Days/pull/70 — the strongest sample: a numbered, grouped bug-fix list (formatting, tables, math formulas, JSON rendering) with per-item details and an explicit question to the maintainer about which convention to standardize on; it justified its 20-file diff in ~180 words.
- **PR #136** — https://github.com/jackfrued/Python-100-Days/pull/136 — minimal but effective for its class: a one-line summary plus a verbatim before/after quote, exactly the right density for a typo fix, and the only PR using a Conventional-Commit title (`fix(docs): …`).
