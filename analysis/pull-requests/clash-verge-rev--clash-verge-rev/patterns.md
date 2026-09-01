# PR Patterns: clash-verge-rev/clash-verge-rev

## Corpus
- PRs analyzed: 5 (numbers: #7811, #7812, #7819, #7829, #7834)
- Caveat: 5 PRs by 4 distinct authors (Tunglies, Tychristine, oomeow ×2, Dragon1573), all merged in a 5-day window (2026-08-25 → 2026-08-30). Sample is small but author-diverse; however 4 of 5 descriptions are written in Chinese, reflecting this project's Chinese-speaking contributor base — language choice is a repo trait worth noting, though the sample is too small to rule out English-language PRs elsewhere in the repo.

## Titles
All 5 titles strictly follow Conventional Commits `<type>: [/ <scope>: ] <summary>`:
- `refactor: api cleanup` (#7812)
- `fix: reset fake-ip-range6: "2001:2::0/64" as default on Tun Mode` (#7811) — note the embedded literal with nested quotes/colon inside the summary
- `refactor: migrate to @dnd-kit/react and simplify sortable components` (#7819)
- `fix(sysproxy): gsettings command is no longer mandatory on KDE desktop` (#7829) — scoped variant
- `chore(gitattributes): Lock end of line style for shell scripts` (#7834)

Types observed: `fix` ×2, `refactor` ×2, `chore` ×1. Scope appears in 2 of 5 (`sysproxy`, `gitattributes`). Lengths ~30–75 chars. Casing after the colon is inconsistent: lowercase in 4 of 5, Capitalized in #7834 (`Lock end of line style`). No emoji, no trailing period.

## Description structure
No shared section-header convention. Each PR uses a different structure; none use the repo-standard "Summary/Tests" scaffold:
- #7812: two bolded commit-style bullets only — `- **refactor(config): unify YAML persistence**` — no narrative at all.
- #7811: `Resolve #7564` opener, then a `>` blockquote citing RFC/IANA justification in Chinese ("整个 2001:2::/48 被 RFC 5180（IPv6 基准测试方法论）保留…"), closing with "可能需要商议." (an explicit ask for discussion).
- #7819: `Closes #7123`, 2 Chinese bullets, a `> [!NOTE]` admonition about a known regression, then four `### 订阅拖动排序`-style H3 headers each holding a bare video URL, and finally an HTML `<table>` embedding two `<video>` tags for before/after comparison （之前/之后 columns).
- #7829: the shortest — `Closes #7815` plus one Chinese sentence ("KDE 桌面环境中不再强制要求 `gsettings` 命令来设置系统代理").
- #7834: two Chinese prose paragraphs explaining the fix (`.gitattributes` 将 `.sh`/`.bash` 锁定为 LF), then a `> [!NOTE]` admonition disclosing AI assistance.

Heading levels: only #7819 uses headers (`###`, H3, in Chinese). Lists vs prose is split: bullets dominate #7812/#7819, prose dominates #7811/#7834, #7829 is a single line.

## Template usage
No evidence of a repo PR template in the raw bodies: no checklists (`- [ ]`), no boilerplate instructions, no "How Has This Been Tested" scaffold, no leftover unfilled prompts anywhere. The only repeated structural element is the `> [!NOTE]` callout (appearing in #7819 and #7834), which is native GitHub markdown used ad hoc, not a template lineage. Conclusion: **freeform** — every PR is author-structured.

## Length & density
Descriptions skew extremely short:
- #7812: ~10 words (two bullets)
- #7829: ~15 Chinese characters/words (1 sentence)
- #7811: ~60 words
- #7834: ~90 words
- #7819: ~150 words of text, but dominated by 6 linked videos and an HTML table — the densest PR carries its explanation in attachments, not prose.

Pattern: terse-to-minimal prose; large changes are documented visually (#7819: +1108/−1118 across 22 files) or barely at all (#7812: +277/−413 across 29 files described in two bullets). Description length does not scale with change size.

## Voice & tone
Mixed-language, informal-descriptive. Descriptions are predominantly Chinese prose in a conversational register: "可能需要商议." (may need discussing), "所以我认为代理链拖动排序效果是可以接受的" (so I think the proxy-chain sort effect is acceptable). First-person singular ("我认为") appears in #7819; English only appears for technical terms and link labels. No imperative "Fix/Add/Remove" -style bodies; titles carry the conventional-commit imperative instead.

## Content habits
- **Linked issues**: 3 of 5 PRs open with a closing keyword — `Resolve #7564` (#7811), `Closes #7123` (#7819), `Closes #7815` (#7829) — always as the first line. #7812 and #7834 link nothing.
- **Screenshots/videos**: heavy in #7819 — six `user-attachments` video links, one organized as an HTML `<table>` with a 之前/之后 (before/after) header and inline `<video>` tags. Other PRs have none. For a desktop-GUI app, screen recordings are the accepted evidence format.
- **GitHub native callouts**: `> [!NOTE]` used in #7819 (documenting an accepted regression) and #7834 (AI-assistance disclosure).
- **Test plans**: none — no PR enumerates commands run or manual test steps; zero reviews on all 5 PRs and ≤2 comments each.
- **Breaking-change callouts / labels**: none; every PR carries `Labels: none`.
- **Regression honesty**: #7819 explicitly flags a known quality downgrade ("除了代理链拖动排序效果和之前不一样外且效果较差之外") and justifies merging anyway.

## Bot-generated content
No CodeRabbit/Copilot "Summary by …" blocks or bot-authored descriptions. However, #7834 contains an explicit AI-assistance disclosure inside a `> [!NOTE]`: "使用 VSCode Copilot Chat ，接入 Gemini 3.7 Flash ，配合 CodeGraph 生成" (generated with VSCode Copilot Chat via Gemini 3.7 Flash with CodeGraph) — this indicates the change (and possibly the description) was AI-assisted and the project culture tolerates/discloses it. The other 4 descriptions show no AI structural signature (no templated Summary bullets, no emoji section headers) and read as human-typed, including the `\r\n` artifacts of hand-composed GitHub textareas.

## Notable exemplars
- **PR #7819** — https://github.com/clash-verge-rev/clash-verge-rev/pull/7819 — the strongest sample: despite no template, it links the issue, explains scope, honestly flags an accepted regression in a `[!NOTE]`, and provides six per-feature video demos plus a before/after comparison table — maximal reviewer evidence for a large UI refactor.
- **PR #7829** — https://github.com/clash-verge-rev/clash-verge-rev/pull/7829 — exemplar of minimal-sufficient description: `Closes #7815` + one sentence that fully states what changed and why, appropriate for a +19/−18 fix.
