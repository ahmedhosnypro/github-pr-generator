# PR Patterns: tensorflow/tensorflow

## Corpus
- PRs analyzed: 5 (numbers: #126370, #109227, #126144, #126302, #126431)
- Caveat: 4 of 5 PRs are authored by `copybara-service` — Google's internal→GitHub sync bot — and the 5th (#109227) is a single external contributor (saksham-1304). This sample therefore reflects Copybara-mirrored internal commit messages, not organic GitHub PR authorship, plus one community PR. It is too small and skewed to characterize how human TensorFlow maintainers write PRs on GitHub.

## Titles
Two coexisting conventions, split cleanly by author type:
- Bracket scope prefix, sentence case, trailing period (internal/Copybara style):
  - `[XLA:CPU] Tighten the bounds for the offsets when checking if the mask is needed.` (#126370)
  - `[AutoGraph] Add warning when Python random module is used inside tf.function` (#109227 — external contributor also uses this format, suggesting the bracket-prefix convention is known repo culture)
- No Conventional Commits types (`feat:`/`fix:`) anywhere; scope is a bracketed module tag (`[XLA:CPU]`), not a `<type>(scope):` prefix.
- Placeholder title for trivial syncs: `Automated Code Change` (#126144, #126431 — 2 of 5 PRs).
- One unscoped plain imperative: `Propagate input constraints across nested fusion instruction boundaries.` (#126302 — also a Copybara PR, so even internal titles are inconsistent about the bracket prefix).
- Lengths ~25–75 chars (excluding the `Automated Code Change` outliers), no emoji, no issue numbers in titles.

## Description structure
Two distinct molds:

Copybara PRs (4 of 5): the description literally repeats the title as its first line, then appends the internal commit message body:
- #126370: title repeat + one sentence ("Before we had [min(), max()] as the limit, but we can be more precise and that leads to more folding/simplification.")
- #126302: title repeat, a "Previously, …" problem paragraph (wrapped at ~80 cols, plain prose), then a `This change:` lead-in followed by a `-` bulleted list of 3 items (Implement…, Updates…, Adds unit tests…). No markdown headers at all.
- #126144 and #126431: body is just `Automated Code Change` — effectively empty descriptions.

External PR (#109227): full markdown skeleton with headers, in this order: `# Fix: Warn When Python random Module Is Used Inside tf.function` (H1!), `## Problem` (bullets), `## Solution` (numbered list with bolded sub-items), `## Files Changed` (path — description bullets), `## Example Warning Message` (fenced code block), `## How to Test` (one line), then a `---` horizontal rule and an italicized closing line. Heading levels are inconsistent (H1 title then H2 sections).

## Template usage
No evidence of a repo-enforced PR template in this sample: no `- [ ]` checklists, no "How Has This Been Tested"-style scaffold, no leftover boilerplate prompts. #109227's header set (`## Problem` / `## Solution` / `## Files Changed` / `## How to Test`) resembles a hand-built or AI-assisted structure rather than a repo template (the corpus contains no second instance to confirm repetition). The Copybara descriptions bypass templates entirely by construction. Conclusion: **freeform** (with the caveat that 4 of 5 descriptions are mechanically mirrored commit messages, not GitHub-native writing).

## Length & density
Bimodal:
- #126144, #126431: 3 words each (`Automated Code Change`) — zero-information descriptions.
- #126370: ~25 words.
- #126302: ~150 words — the densest technical prose: problem mechanism ("constraints from internal operations failed to propagate backward… causing floating-point overflow to +inf and downstream NaN generation") plus an implementation bullet list.
- #109227: ~350 words — verbose by comparison, with redundancy (the closing italic line restates the `Fix #109111` opener).

Median is dominated by the near-empty sync PRs; the two substantive descriptions average well under 200 words except the community one.

## Voice & tone
- Copybara PRs: imperative-ish third person, no first person, terse; #126302 uses present-tense engineering prose ("Implements PropagateFusionBoundary in PropagateConstraintsExact to bidirectionally synchronize caller operands…"). #126370 has the only casual note ("we can be more precise").
- #109227: explanatory, instructional tone directed at the reader; no first person in the body despite being community-authored.
- Overall formal, neutral, code-referent (identifiers in backticks: `` `random.randint` ``, `` `call_trees.py` ``).

## Content habits
- **Linked issues**: only #109227 links an issue (`Fix #109111`, repeated in the closing line). The 4 Copybara PRs link nothing — no issues, no reviews (0 reviews, 0 comments on all four).
- **Test plans**: implicit, not a dedicated checklist. #126302 folds tests into the change bullets ("Adds unit tests verifying constraint propagation across both single-level and multi-level nested fusions"); #109227 has a `## How to Test` section, but it says only "Run the existing test suite for `call_trees_test.py`" — no concrete commands or counts in the vscode style.
- **Labels**: the 4 Copybara PRs carry none; #109227 has `ready to pull, size:M, prtype:bugfix, python` — a taxonomy (`prtype:`, `size:`) applied to external contributions.
- **Screenshots/images**: none in any of the 5 PRs.
- **Breaking-change callouts / reviewer ask-outs**: none observed.
- #109227 includes a fenced code block showing the exact warning message text — a "show the user-facing output" habit worth noting.

## Bot-generated content
No CodeRabbit/Copilot-style summary blocks in any PR. However, the dominant automation here is structural: 4 of 5 PRs are created by `copybara-service`, which generates the GitHub PR itself from an internal commit — the "description" is the commit message verbatim (title line repeated as the body's first line is the tell, visible in #126370 and #126302). Two of those (#126144, #126431) ship with the placeholder body `Automated Code Change`, meaning fully automated PRs merged with effectively empty descriptions, 0 reviews, and 0 comments. For this repo, the main competition for AI-generated PR descriptions is not bot summaries but mechanically mirrored commit messages of widely varying quality.

## Notable exemplars
- **PR #126302** — https://github.com/tensorflow/tensorflow/pull/126302 — strongest of the sample: a clear "Previously, …" problem narrative with concrete failure modes (+inf overflow, NaN), followed by a precise `This change:` bullet list covering implementation and tests, in ~150 words.
- **PR #109227** — https://github.com/tensorflow/tensorflow/pull/109227 — the most complete community PR: problem/solution/files/test structure, a verbatim example of the new warning output, and a linked issue, though verbose and somewhat repetitive.
