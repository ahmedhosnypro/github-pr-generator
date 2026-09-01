# Presentation & Readability Study — PR Description Corpus

Companion to `SYNTHESIS.md`. While the earlier analysis covered content
patterns (sections, evidence, disclosure), this study covers **how merged PR
bodies look when rendered**: markdown structure, visual rhythm, emphasis,
progressive disclosure, and the failure modes that make generated text
unreadable. Produced by three agent-swarm passes over all ~100 repo reports
(`merged-prs.md` + `patterns.md`), followed by three meta-syntheses (anatomy
dissection, anti-pattern catalog, template-fidelity rulebook).

## The composite anatomy of a top-tier body

Canonical order distilled from the 12 best-rendered bodies
(next.js #97480, MoneyPrinterTurbo #1263, v2rayN #10017, openclaw #120900,
langflow #14832, ECC #2693, electron #53174, anthropics/skills #1557,
open-webui #29037, PowerToys #50230, scrcpy #6772, ponytail #601):

**thesis → cause → change → measured evidence → verification → honesty ledger → sign-off**

```
[Opener]            1–2 lines: thesis, or bare "Fixes #NNNN"
## Problem / What   ≤5 lines prose; ≤6-row measured table if quantifiable
## Root cause/Why   ≤10 lines; ≤1 verbatim error/diff fence (≤6 lines)
## What changed     bold per-area labels OR ≤5 one-line bullets; ≤1 short fence
## Evidence         tables with a bold one-line verdict caption above each
## Verification     checked boxes naming what each test pins, OR numbered recipe ≤6 steps
## Honesty ledger   trade-offs / "deliberately not in this PR" / retractions, ≤5 bullets
[Sign-off]          Closes #… / release-note line / scope accounting — 1–2 lines
```

Size budgets by PR class:
- **Small** (≤30 lines): ≤4 sections, exactly one fence, tables only when the
  evidence is a number, one-line closer.
- **Medium** (35–60 lines): 3–6 H2s, 1–2 tables of ≤7 rows, verdict-line closer.
- **Huge** (100–180 lines): same skeleton; extra length goes only into
  *evidence* (tables with run IDs/SHAs, transcripts, reviewer guides) — never
  into longer prose.

## The eight golden rules (every top-12 body obeys all of them)

1. The first screenful carries the thesis (bold one-liner, measured table, or
   the runnable commands) — never boilerplate.
2. Tables carry numbers; prose carries argument; fenced blocks carry verbatim
   artifacts. Roles never mix.
3. Every table above the fold has a bold one-line verdict caption.
4. Honesty is a named section ("What a round trip cannot prove", "Trade-offs",
   "deliberately not in this PR") — not hedging inline.
5. Checked checkboxes earn the check (command + result); unchecked ones carry
   `N/A — reason`.
6. UI evidence uses captioned images (`**What this shows:** …`) or
   Before/After tables — never naked screenshots.
7. Superseded or bulky artifacts go under `<details>`, never deleted.
8. The body ends on an artifact (verdict, `Closes #N`, reviewer guide, scope
   accounting) — never on "please review".

## Anti-pattern catalog (16 items, merged-anyway failures to avoid)

1. **Empty/stub bodies** (react #37087: 7 words on +100/−89) — minimum floor:
   one problem sentence, one change sentence, one verification sentence.
2. **Unfilled template verbatim** (sindresorhus #2051, kubernetes #141081,
   gitignore #4700) — zero scaffold should ship unfilled.
3. **Evidence-free big diffs** (TheAlgorithms #15109) — body length scales
   with diff size.
4. **Checklist-only bodies and malformed boxes** (`- [x ]`, `- []` — freeCodeCamp
   #69799, open-webui #29247) — exact `- [x]` syntax; checklists are footers.
5. **Unlabeled stacked log dumps** (AUTOMATIC1111 #13535) — ≤10 salient lines,
   `### Before (fails)` / `### After (passes)` labels, counts over dumps.
6. **Bot-block duplication under a human body** (rustdesk #15980) — one fact,
   one place; strip bot restatements.
7. **Prose walls** (nodejs #65406 content-wise fine, render-wise a wall;
   ours: sirajLMS/siraj #119) — one idea per paragraph, ≥2 headings above
   ~120 words, bullets one line.
8. **Unlabeled bullet soup** (ollama #18056) — bold-label bullets; group past
   4 items.
9. **Copy-paste artifacts** (open-webui #29247's `…-hidden` + foreign title) —
   compose the body; no stray tokens.
10. **Unclosed fences swallowing sections** (awesome-llm-apps #1097) — fences
    must balance.
11. **Heading-depth abuse** (shadcn #11710 skipping levels) — H2 sections, H3
    children, no skips.
12. **Pseudo-headers instead of real headings** (`Summary:` as bare text —
    ossu #1447, react-native #58057) — section titles are always `##`/`###`.
13. **Anchor-less file mentions / URL-only bodies** (langchain #40022, golang
    #54390) — every file named carries a link; every `Fixes #N` stands alone
    readable.
14. **Duplicate info across sections** (hermes #98628) — dedupe before output.
15. **Title-verbatim openers** (openai/codex) — the first sentence must add
    information not in the title.
16. **Boilerplate dwarfing content** (sindresorhus #2051, public-apis #7110) —
    compliance footer ≤3 items or `<details>`-collapsed.

## Template-fidelity ladder (template-gated repos)

When filling a repo template, de-emphasize boilerplate with the *lowest*
sufficient rung:

1. **HTML comments: always keep** — invisible after render, often bot-read
   (kubernetes instruction blocks, transformers who-to-tag, bot sentinel pairs,
   renovate debug markers).
2. **Row removal only when the template text itself instructs it**
   (yt-dlp: "remove the ones that do not apply").
3. **Positional de-emphasis** — authored content claims the top slot, the
   mandatory form closes the body (ohmyzsh, public-apis, yt-dlp).
4. **`<details open>` folding with an informative `<summary>`** where repo
   precedent exists (yt-dlp's `Template` fold, llama.cpp for author-side logs).
5. Anything more aggressive (deleting bot-watched/CLA/honeypot regions) is
   never acceptable — open-webui's CLA "DO NOT DELETE", sindresorhus'
   `unicorn` honeypot, TheAlgorithms' gatekeeper bot.

Checkbox etiquette in filled templates: exact `- [x]` / `- [ ]` syntax; check
only what the diff proves; unchecked items carry `N/A — reason` (PowerToys
#50220) or stay visibly unchecked (vinta #3284); unchosen radio options stay
visible as a decision record unless the template says otherwise; placeholders
(`#xxx`, `XXXXX`) are always replaced.

## What we ship against this

The generator's skeleton, rules, template-fill etiquette, and the live
acceptance gate (`bun run test:format-live`) encode the eight golden rules and
block the top anti-patterns. See `render-quality-plan.md` for the mapping from
findings to code.
