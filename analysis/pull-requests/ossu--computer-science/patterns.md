# PR Patterns: ossu/computer-science

## Corpus
- PRs analyzed: 5 (numbers: #1410, #1425, #1324, #1443, #1447)
- Caveat: this is a documentation-curriculum repo (a course roadmap in Markdown, not application code), so every sampled PR is a docs/content change — small stats (+1 to +16 additions, 1–3 files), no tests, and no reviews (Reviews: 0 on all 5). Four distinct authors (kevintprivett ×2, Flomza, 2023Anita, Sushanth012); conclusions are about merged docs PRs here, not code PRs.

## Titles
Titles are plain declarative/imperative sentences, not Conventional Commits — 4 of 5 use a capitalized imperative verb with no prefix:
- `Fix space invaders demo link` (#1410)
- `Pin Python version to 3.8.X` (#1425)
- `Change High School Math FAQ to OSSU Pre-College Math` (#1324)
- `Remove incorrect class-based Lecture 30 archive` (#1447)

The lone exception is #1443: `docs: update resource links to HTTPS` — conventional-commit `docs:` type with a lowercase stem, and notably the only PR with a structured description (see below), suggesting a single contributor's personal convention rather than repo policy. Lengths run 28–52 characters, no emoji, no trailing periods.

## Description structure
No consistent structure; three distinct styles appear:

- **Freeform prose paragraphs** (#1410, #1425): short narrative paragraphs separated by blank lines. #1410: problem ("The space invaders demo link is broken on the spd course page.") → remedy ("Rather than rely on youtube, I added the video to the repo…") → credit. #1425: motivation → consequence → a `Ref:` label with raw URLs.
- **One-liner** (#1324): a single sentence, "Also adds link to linear algebra prerequisite mentioned under Computer Graphics."
- **Summary/Validation pair** (#1443, #1447): same two sections but different rendering. #1443 uses `## Summary` / `## Validation` as H2 headers with `-` bullets ("- verified the HTTPS URLs respond successfully"). #1447 uses plain-text `Summary:` / `Validation:` labels (not markdown headers) followed by bullets, preceded by one context line ("Addresses ossu/computer-science#1441").

Heading levels: only #1443 uses real headings (`##`). Where sections exist, order is always context → Summary → Validation.

## Template usage
No evidence of a repo PR template: no checklists (`- [ ]`), no scaffold headers, no unfilled prompt text in any of the 5 PRs. The Summary/Validation pairing in #1443 and #1447 is a structural echo, but the sections differ in rendering (H2 vs plain label) and in content order, and were authored months apart by different people — too weak and too loose to call a shared template. Conclusion: **freeform**, with an emerging informal Summary/Validation idiom in 2 of 5 samples.

## Length & density
Uniformly short:
- #1410: ~45 words (3 short paragraphs)
- #1425: ~70 words + 2 reference URLs (longest)
- #1324: ~14 words (single line)
- #1443: ~40 words (bulleted)
- #1447: ~55 words (bulleted)

All five are under ~75 words and under one screen. Density is high: descriptions state what changed and why in one breath, matching the tiny diff sizes (1–3 files). No multi-screen or exhaustively-argued descriptions exist in this corpus.

## Voice & tone
Mixed and informal. First person appears in both prose PRs: "I added the video to the repo and made a simple page" (#1410) and "I've updated the link and notes accordingly" (#1425). The bulleted PRs (#1443, #1447) use imperative bullets ("Remove the Lecture 30 YouTube archive because…", "update the networking course and Wireshark lab links to HTTPS"). Tone is friendly and community-flavored — video credit with an @mention ("Video credit to @pulkitkrishna00 included with permission", #1410) and a Discord-channel citation in #1425's refs — rather than a strict engineering register.

## Content habits
- **Linked issues**: the metadata records zero linked issues for all 5, but bodies do reference them in prose: #1447 opens with "Addresses ossu/computer-science#1441" (not the auto-closing "Fixes #N" keyword form), and #1425 links an issue comment under `Ref:` plus a Discord message URL. No PR uses `Fixes`/`Closes`/`Resolves`.
- **Test/validation plans**: no automated tests (unsurprising for docs), but 2 of 5 (#1443, #1447) note manual validation — "verified the HTTPS URLs respond successfully" and "`git diff --check`" appears in both.
- **Labels**: none on any of the 5.
- **Screenshots/images**: none — no image embeds in any description, despite #1410 adding a video demo page and using an external YouTube/video workflow.
- **Reviews/discussion**: all merged with 0 reviews and few comments (0–5), indicating light-weight maintainer review for docs changes.
- **Breaking-change callouts / reviewer ask-outs**: none.

## Bot-generated content
No explicit bot-generated blocks in any of the 5 PRs: no CodeRabbit "Summary by CodeRabbit" section, no Copilot/AI disclaimer footers. The two structured PRs (#1443, #1447) follow the Summary/Validation shape common to LLM-drafted descriptions and both authors are recent first-timers to this sample, so AI assistance is plausible — but there is no structural fingerprint (boilerplate headings, emoji checkmarks, "This PR does the following") to confirm it. Samples #1410 and #1425 read as unmistakably human narrative.

## Notable exemplars
- **PR #1425** — https://github.com/ossu/computer-science/pull/1425 — best freeform sample: states the bug (course code incompatible with current Python), justifies the pinned version (course lectures use 3.8), explains the cascading doc fix (Spyder 6.1 dropped 3.8 support), and cites sources under `Ref:` — a complete decision trail in ~70 words.
- **PR #1443** — https://github.com/ossu/computer-science/pull/1443 — best structured sample: tight `## Summary`/`## Validation` pairing with an explicit URL liveness check ("verified the HTTPS URLs respond successfully") and `git diff --check`, the only PR using real markdown section headers.
