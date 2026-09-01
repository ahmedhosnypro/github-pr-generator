# PR Patterns: AUTOMATIC1111/stable-diffusion-webui

## Corpus
- PRs analyzed: 5 (numbers: #16275, #8425, #13535, #2092, #7925)
- Caveat: 5 different authors (w-e-w, vladlearns, chu8129, C43H66N12O12S2, AUTOMATIC1111), all external contributors except one maintainer revert; dates spread 2022-10 → 2024-07. The sample is diverse but small, and mixes two eras of the repo's PR template (see below), so repo-wide conclusions should be drawn cautiously.

## Titles
Two of 5 titles use a Conventional-Commits-style prefix; the rest are plain descriptive:
- `fix image upscale on cpu` (#16275) — no prefix, all lowercase
- `feat: auto update all extensions using flag` (#8425) — `feat:` prefix, lowercase
- `fix: checkpoints_loaded:{checkpoint:state_dict}, model.load_state_dict issue in dict value empty` (#13535) — `fix:` prefix, overloaded with inline code/identifiers, 89 chars
- `Implement SwinIR v2` (#2092) — capitalized imperative, no prefix
- `Revert "Aspect ratio sliders"` (#7925) — GitHub auto-generated revert title

Pattern: no enforced convention. Even within prefixed titles, casing after the colon is lowercase; unprefixed titles vary in casing. No emoji, no trailing periods. Length range is extreme: 16 chars (#16275) to 89 chars (#13535), which stuffs code identifiers into the title instead of a summary.

## Description structure
Headers differ per PR; both repo template eras appear:

- PR #16275 (newer template era): `## Description` → narrative prose + linked issue → `## Checklist:` (H2). The body under Description is freeform prose with `-` bullets, quoted self-observations (`>` blockquotes), and an ask: "I suggest a version 1.10.1 patch".
- PR #8425 (older template era): bold-text prompts instead of markdown headings — `**Describe what this pull request is trying to achieve.**` → `**Additional notes and description of your changes**` → `**Environment this was tested in**` with a scaffolded list (` - OS: [Windows, Mac, Linux]`, ` - Browser: not applicable`, ` - Graphics card: not applicable`).
- PR #13535 (newer template era, heavily extended): `## Description` (bulleted reasoning: "* bug:", "* reason:", "* fix:") → `## Screenshots/videos:` containing nested `###` sections (`### the original error`, `### use master branch code:ERROR`, `### without sd_disable_initialization.LoadStateDictOnMeta:NORMAL`, `### MR && with sd_disable_initialization.LoadStateDictOnMeta:NORMAL`) with large code/log blocks → `## Checklist:` → a trailing question section `## anyone can explain this?`.
- PR #2092: no headers at all — three prose paragraphs, then `Examples:` with inline images and captioned comparisons, ending with an analysis sentence.
- PR #7925: one line, the auto-generated "Reverts AUTOMATIC1111/stable-diffusion-webui#7601".

Canonical order when structure exists: Description → (Screenshots/videos) → Checklist. Heading levels: `##` for top sections, `###` only in #13535; #8425's older template uses bolded text rather than headings.

## Template usage
Strong, direct evidence of a repo PR template, in two generations:
1. Newer template (#16275, #13535): identical 4-item checklist verbatim in both — `- [x] I have read [contributing wiki page](...)`, `- [x] I have performed a self-review of my own code`, `- [x] My code follows the [style guidelines](...)`, `- [x] My code passes [tests](...)` — plus the `## Description` and `## Screenshots/videos:` scaffold headers (left in place even when empty in #13535).
2. Older template (#8425): bolded prompts ("Describe what this pull request is trying to achieve.", "Additional notes and description of your changes", "Environment this was tested in") with example values left partially unfilled — "Nope." as the entire additional-notes answer and `OS: [Windows, Mac, Linux]` bracket placeholder kept verbatim.

Two PRs bypass the template entirely: #2092 (2022, before either template) and #7925 (maintainer self-revert). Conclusion: **template (with evolving versions) — but enforcement is loose; authors fill it in with widely varying diligence.**

## Length & density
High variance:
- #7925: 5 words (revert stub)
- #8425: ~50 words, mostly template prompt text
- #2092: ~90 words of prose plus 3 images
- #16275: ~180 words of narrative plus checklist
- #13535: ~400+ words excluding code blocks, plus several hundred lines of raw logs/tracebacks in fenced code blocks

Pattern: no shared density norm. Contributor PRs trend toward "explain your debugging process" (#13535 dumps console logs with `print` instrumentation; #16275 recounts the troubleshooting history) rather than the terse outcome-summary style of e.g. the vscode corpus. Code/log blocks dominate when present.

## Voice & tone
- First-person singular is common in contributor PRs: #16275 ("I've mentioned this on discord and ask if anyone is able to reproduce this issue", "so I'm not entirely sure what's going on"), #13535 ("in my mind: checkpoints_loaded: use to cache state_dict"), #8425 ("Nope.").
- Informal, chatty register with typos left in ("upsacall", "backthen"), hedging ("not entirely sure"), and direct mentions of maintainers: #16275 opens "@AUTOMATIC1111 @akx".
- #2092 is the outlier: neutral, precise, third-person ("SwinIR v2 is SwinIR but with Swin Transformer V2 from Microsoft").
- Lowercase, stream-of-consciousness style pervades #16275 and #13535; no editorial polish anywhere in the corpus.

## Content habits
- **Linked issues**: none use GitHub's "Fixes #N" syntax. #16275 links the related issue as a bare bullet ("- https://github.com/.../issues/16274"); #7925's auto-body references the reverted PR #7601. "Linked issues: none" in all 5 metadata blocks.
- **Labels**: none on any of the 5 PRs.
- **Test plans**: no dedicated test-plan section; instead the template checklist asserts tests pass (`My code passes [tests]` in #16275 and #13535), and #8425 uses the "Environment this was tested in" scaffold. #13535 demonstrates the fix via before/after console logs rather than tests.
- **Screenshots/images**: #2092 embeds 3 comparison images (original / v1 / v2) — the strongest content in the corpus; #13535's "Screenshots/videos" heading contains code blocks only, no actual media.
- **Breaking-change callouts**: none; #16275 instead asks for release action ("I suggest a version 1.10.1 patch").
- **Reviewer ask-outs**: #16275 pings maintainers directly; #13535 ends with an open technical question to reviewers ("anyone can explain this? module_load_state_dict did not declare, how did it run?").
- **Cross-context references**: #16275 references Discord discussion and a prior PR (#16144) inline.

## Bot-generated content
No bot-generated description content: no CodeRabbit "Summary", no Copilot-written bodies, no AI disclaimers in any of the 5 PRs. #7925's "Reverts AUTOMATIC1111/stable-diffusion-webui#7601" is GitHub's mechanical revert-generated body, not an AI summary. These descriptions are unmistakably human-written (typos, hedging, Discord references, pasted logs) — this repo's merged PRs show no trace of the AI-summary tooling prevalent in later-era repos.

## Notable exemplars
- **PR #2092** — https://github.com/AUTOMATIC1111/stable-diffusion-webui/pull/2092 — the cleanest sample: states what is implemented and the source repo, gives usage instructions ("download ... rename it to have the `.v2.pth` extension"), proactively clarifies the diff ("The actual line addition of this PR is 28 lines, the rest is the model architecture"), and shows visual before/after evidence — a ~90-word proof without any template.
- **PR #16275** — https://github.com/AUTOMATIC1111/stable-diffusion-webui/pull/16275 — messier format but good debugging hygiene: names the regression-causing PR (#16144), quotes the exact error, links the corroborating issue report, and makes an explicit release recommendation (1.10.1 patch).
