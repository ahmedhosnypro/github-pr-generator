# PR Patterns: justjavac/free-programming-books-zh_CN

## Corpus
- PRs analyzed: 5 (numbers: #896, #897, #898, #899, #900)
- Caveat: all 5 PRs are by a single author (justjavac, the repo owner), numbered consecutively and self-merged within a ~36-minute window on 2026-07-29 (00:05 → 00:39), with 0 reviews and 0 comments each. This is one batch of maintainer housekeeping PRs, not a representative cross-section of repo-wide contributor style. Descriptions are written in Chinese, matching the repo's audience.

## Titles
Mixed formats; no strict convention:
- #896 is conventional-commit-like English: `fix links: vhf → EbookFoundation, jcohy-docs URL` (lowercase type `fix`, arrow symbol, no scope).
- The other four are plain Chinese sentences, e.g. `为失效链接添加 :worried: 标识` (#897), `为失效链接更换备份地址` (#898), `新增 AI 分类：大模型/Agent/Vibe Coding 开源书籍 12 本` (#899), `删除已无法访问的书籍条目` (#900).
- Pattern: verb-first Chinese phrase (`为…添加`, `删除`, `新增 分类：`). #899 uses a full-width colon to split scope from content and ends with a quantity (`12 本`). No emoji characters in titles (only the literal text `:worried:`), no trailing periods, ~10–30 CJK characters.

## Description structure
Consistent micro-structure across all 5: a one-sentence summary stating scope and method, then bold one-line group headers (NOT markdown `#` headers — the pattern is `**分类名**` followed by bullets), then bulleted items.

Per PR:
- #896: one-line preamble (`两个收尾修复（源自已关闭 PR 中指出的真实问题）：`), then 2 bullets.
- #897: method preamble (`对 README 中全部 398 个未标注链接做了可用性检查（curl HEAD + GET 复核，超时重试）…`), then bullets grouped by HTTP status (`无法连接（000）`, `404`, `503`), then a `已排除的误报：` bullet list, then a `另外发现（未处理）：` note.
- #898: preamble referencing the prior PR (`在 #897 标注的基础上…`), then three bold groups: `**官方新址（去掉 :worried:）**`, `**社区镜像（去掉 :worried:）**`, `**仅存 Wayback 快照（改指快照，保留 :worried:）**`.
- #899: preamble stating inclusion criteria, then three bold groups (`**教材/原理**`, `**应用/微调/RAG/Prompt**`, `**Agent / Vibe Coding**`), each bullet listing a project with star count, ending with an `已排除：` sentence.
- #900: method preamble plus bold span (`删除 **72 个所有链接均已失效**的条目`), a `同时：` section, and a `未处理：` section.

Canonical skeleton: [method/scope sentence] → [grouped bullets under bold headers] → [exclusions / not-handled notes].

## Template usage
No evidence of a repo PR template: no checklists (`- [ ]`), no "How Has This Been Tested"-style scaffold, no boilerplate instructions, no leftover template prompts. However, the recurring `已排除` / `未处理` closing sections and the method-then-groups layout repeat across 4 of 5 PRs like a personal template. Conclusion: **freeform, with a strong self-imposed structure** (single-author convention).

## Length & density
Short, dense, information-packed descriptions (Chinese, so measured in characters):
- #896: ~60 characters (shortest)
- #897: ~430 characters
- #898: ~330 characters
- #899: ~380 characters
- #900: ~330 characters

Every bullet carries a concrete datum — domain names, HTTP codes, star counts — with almost zero filler prose. Pattern: concise enumeration over narrative.

## Voice & tone
- Declarative, neutral third-person Chinese; no first person (`我`/`我们` never appears).
- Methodical, audit-report register: precise counts (`对 README 中全部 398 个未标注链接`, `确认失效的 19 处`, `72 个所有链接均已失效`), tool names (`curl HEAD + GET 复核，超时重试`), and status codes.
- Typographically careful: full-width punctuation, backticked code (`` `:worried:` ``, `` `zh_CN/` ``), bold for group headers and one key number (`**72 个**`).

## Content habits
- **Verification methodology front and center**: #897, #898, and #900 all describe exactly how links were validated ("curl HEAD + GET 复核，超时重试", "全部经 curl 验证 HTTP 200", "GitHub 仓库用 API 确认，可疑域名用第二网络环境抽查").
- **False-positive / exclusion accounting**: dedicated `已排除的误报` sections (#897: 5 entries such as "blog.csdn.net ×2（521 为反爬，内容实际可访问）"; #899: "已排除：awesome 列表/导航合集、无完整章节的代码仓库、版权存疑的商业书非官方译本").
- **Explicit out-of-scope notes**: `未处理`/`另外发现` sections (#897 re travis-ci badge, #900 re soft-404s).
- **Cross-references**: no linked issues and no "Fixes #N" closers; but PRs reference each other and prior PRs inline — #897 cites `#843、#885、#858`, #898 opens `在 #897 标注的基础上`.
- **Labels**: none on any PR. **Screenshots/images**: none (expected — content-curation PRs to a README). **Test plans**: none as a separate section; verification is woven into the prose. **Reviewer ask-outs**: none (owner self-merges).

## Bot-generated content
No visible bot or AI-summary blocks (no CodeRabbit "Summary by…", no Copilot footer). However, the batch signature — five PRs authored and merged minutes apart, each with uniform methodology language, exhaustive verification claims ("超时重试", "全部经 curl 验证 HTTP 200"), and identical exclusion-accounting structure — strongly suggests agent-assisted authoring of both the work and the descriptions. No maintainer edited or trimmed anything: the descriptions merged as written, so this style is what the project accepts.

## Notable exemplars
- **PR #897** — https://github.com/justjavac/free-programming-books-zh_CN/pull/897 — the most rigorous sample: groups 19 dead links by HTTP failure class, documents the check method, and lists excluded false positives with reasons — a self-contained audit in ~430 characters.
- **PR #898** — https://github.com/justjavac/free-programming-books-zh_CN/pull/898 — best structural example: three-tier grouping (`官方新址` / `社区镜像` / `仅存 Wayback 快照`) where each group's header even encodes the metadata treatment applied (`去掉 :worried:` vs 保留).

Caveat: every pattern here describes one maintainer's batch-editing style; contributor-submitted PRs to this repo (book-addition requests) likely follow a different, thinner convention not represented in this sample.
