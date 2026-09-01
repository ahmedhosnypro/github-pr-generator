# PR Patterns: kubernetes/kubernetes

## Corpus
- PRs analyzed: 5 (numbers: #140572, #141658, #141500, #141081, #140779)
- Caveat: 5 PRs by 5 different authors (darshansreenivas, liggitt, krishhna24, macsko, liyuerich) merged within ~14 hours (2026-08-27 → 2026-08-28), all under heavy SIG/area labeling. Author-diverse but a 5-PR snapshot of one merge window — enough to confirm the template convention, not to characterize prose styles repo-wide.

## Titles
All 5 titles are single-line, no emoji, no trailing period, with a loose subsystem-prefix habit:
- `apimachinery: add k8s-label-key format validation for Condition.Type` (#140572)
- `Bump containerd API 1.12.0-rc.0` (#141658)
- `apiextensions: report why the test server's healthz wait failed` (#141500)
- `Unify code for PodGroups and CompositePodGroups in workloadForest` (#141081)
- `enable commentstart check on extensions API group` (#140779)

Pattern: 3 of 5 use `<subsystem>: <lowercase imperative description>` (`apimachinery:`, `apiextensions:`); the other 2 start directly with a verb (`Bump`, `Unify`, `enable`). Not strict Conventional Commits — no `feat:`/`fix:` types — but consistently imperative and lowercase-first (only `Bump`/`Unify` start capitalized, at sentence position). Lengths ~36–65 characters. Commitmessage-style discipline: no PR numbers, no author tags, no filler words.

## Description structure
Every description uses `####` (H4) section headers — the kubernetes PR template's level — in a fixed order:

- PR #140572: `/kind feature` + `/sig api-machinery` commands up top (no "What type" header), then `#### What this PR does / why we need it:` (short paragraph + 4 bullets), `#### Which issue(s) this PR is related to:` ("Part of #139638", "Closes <PR url>"), trailing "co-author @thesauravpoddar".
- PR #141658: `#### What type of PR is this?` (`/kind dependency`, `/kind cleanup`), `#### What this PR does / why we need it:` (one sentence), then a ```release-note NONE``` block (no "user-facing change" header), trailing `/cc @dims`.
- PR #141500: `#### What type of PR is this?`, `#### What this PR does / why we need it:` (5 long prose paragraphs with indented log samples), `#### Which issue(s) this PR is related to:`, `#### Special notes for your reviewer:`, `#### Does this PR introduce a user-facing change?` with ```release-note NONE```, then `/sig`, `/assign`, `/cc` commands.
- PR #141081: full raw template kept including `<!-- ... -->` instruction comments; headers: `#### What type of PR is this?`, `#### What this PR does / why we need it:`, `#### Which issue(s) this PR is related to:`, `#### Special notes for your reviewer:`, `#### Does this PR introduce a user-facing change?`, `#### Additional documentation e.g., KEPs...` with ```docs``` block.
- PR #140779: same full template as #141081 (all HTML comments left in), same six headers, `#### Special notes for your reviewer:` left empty.

Canonical order: What type of PR → What this PR does / why we need it → Which issue(s) → Special notes for reviewer → user-facing change/release-note → Additional documentation. Body content is a mix of short bullets (#140572) and genuine prose (#141500); headers are never customized.

## Template usage
Strong, explicit template — this is the canonical kubernetes `.github/PULL_REQUEST_TEMPLATE.md`. Evidence:
- Both #141081 and #140779 retain the entire prefilled template verbatim, including the "Thanks for sending a pull request!" HTML comment, the `/kind` option list (`/kind bug`, `/kind dependency`, `/kind cleanup`, `/kind documentation`, `/kind feature`, ...), and the release-note and docs guidance comments.
- Recurring boilerplate across PRs: `#### What type of PR is this?`, `#### What this PR does / why we need it:`, `#### Special notes for your reviewer:`, `#### Does this PR introduce a user-facing change?`, and the fenced `release-note` code block (`NONE` in #141658, #141500, #141081, #140779).
- Zero checklists (`- [ ]`) in any PR — the template relies on prow slash-commands (`/kind`, `/sig`, `/assign`, `/cc`) instead, which every PR uses (#140572: `/kind feature`, `/sig api-machinery`; #141500: `/assign @jpbetz`, `/cc @jefftree`).
- Unfilled scaffolds persist at merge time: #140779 ships an empty `#### Special notes for your reviewer:` and a `docs NONE` block; #141081 ships an empty `docs` block.

Conclusion: **template** — mandatory, heavily structured, and enforced culturally rather than by stripping boilerplate.

## Length & density
Highly bimodal (excluding retained template boilerplate):
- #141658: ~15 words of body ("Updates containerd, drops unwanted dependencies and links") for a massive +4879/−13225 dependency bump — extremely terse, relying on `/kind` labels.
- #140779: ~10 words of own text ("Ensure comments start with the serialized version of the field name.") inside a full template.
- #140572: ~70 words, structured bullets.
- #141081: ~25 words of own text.
- #141500: ~450 words — the outlier, with real log excerpts and a narrative explanation.

Median is extremely short: 4 of 5 PRs say nearly nothing beyond the template fields, even for large diffs (#141658 touches 139 files; #141081 is +1001/−1693 across 24 files). The convention favors labels + issue links over prose; #141500 shows what a first-time/long-form contributor description looks like when the author actually writes.

## Voice & tone
- Titles and bullets are imperative/present ("add", "report", "Unify", "Ensure", "Updates").
- Short descriptions are neutral third-person; #141500 is strikingly first-person and conversational: "My first version didn't do that", "While I was in here I swapped `wait.Poll`…", "I left those alone so this stays in one SIG. Happy to do them separately if that's wanted."
- Formality is loose overall — kubernetes culture tolerates casual reviewer-directed asides — but the machinery (slash-commands, release-note blocks, SIG labels) is rigid.

## Content habits
- **Linked issues**: none of the 5 use `Fixes #N`; instead "Part of #139638" (#140572), "Related to #141178" with an explicit disclaimer "it does not fix #141178" (#141500), "Relates to <issue url>" (#140779), and full issue URLs rather than bare numbers. #140572 even closes a superseded PR ("Closes https://github.com/kubernetes/kubernetes/pull/139897").
- **Release-note blocks**: every PR except #140572 has a fenced ```release-note block, all `NONE` — the release-note decision is a required, explicit field.
- **Test plans**: no dedicated test-plan sections; #141500 folds verification into "Special notes for your reviewer" ("No test change… `./test/integration/conversion/` passes unchanged", plus the exact command used to force the error output: `go test ./test/integration/ -run TestMultipleRegistration`).
- **Reviewer routing via bot commands**: /sig, /assign, /cc appear in 4 of 5 PRs (#141658 `/cc @dims`; #141500 `/assign @jpbetz` / `/cc @jefftree`; #140572 `/sig api-machinery`) — reviewer ask-outs are codified as prow commands, not prose.
- **Breaking-change callouts**: none (all release-notes are `NONE`).
- **Labels as metadata**: dense label sets do the descriptive work — e.g. #141500 carries `kind/flake, release-note-none, approved, cncf-cla: yes, ok-to-test, needs-priority`; #140779 `kind/api-change, area/code-generation, size/L`. Size labels (size/S, size/L, size/XXL) are bot-assigned.
- **Screenshots/images**: none — all backend/API changes.

## Bot-generated content
No CodeRabbit/Copilot-style summary blocks in any of the 5 descriptions. However, AI-assistance disclosure is an emerging explicit habit: #141500 states "I used AI assistance while working on this." in "Special notes for your reviewer", and #141081 states "Generative AI was used in the PR preparation. Changes were carefully reviewed before pushing." — 2 of 5 PRs volunteer an AI-use note, but both are one-line disclosures, not AI-written structure; the surrounding text is human-voiced. The template itself, not a bot, provides all structure. Additionally, label/merge automation (cncf-cla, size/*, needs-triage) is heavy but lives in labels, not in the description body.

## Notable exemplars
- **PR #141500** — https://github.com/kubernetes/kubernetes/pull/141500 — the strongest description in the sample: quotes the actual unhelpful error, shows the improved output verbatim, explains the design tradeoff (previous-probe fallback), declares scope limits ("it does not fix #141178"), names what's deliberately left for other SIGs, and gives the exact command used to verify — all inside the standard template.
- **PR #140572** — https://github.com/kubernetes/kubernetes/pull/140572 — best use of the compact form: four precise bullets covering the tag added, old validation marked covered, tests added, and code regenerated, plus clear linkage ("Part of #139638", closes the superseded PR) and a co-author credit.
