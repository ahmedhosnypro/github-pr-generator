# PR Patterns: Significant-Gravitas/AutoGPT

## Corpus
- PRs analyzed: 5 (numbers: #14232, #14229, #8448, #14024, #14231)
- Caveats: the sample splits into two eras — 4 PRs from 2026-08-29 (same day) and one docs PR (#8448) from 2024-10-28. The 2026 cluster is written by only two authors (Torantulino ×2, Bentlybro ×2), so the observed structure reflects current-maintainer convention more than a long-history repo norm. None of the 5 PRs link an issue ("Linked issues: none" on all).

## Titles
4 of 5 titles are strict Conventional Commits with a platform scope:
- `fix(frontend): clean up wallet timers` (#14232)
- `perf(backend): cache redundant active-subscription lookups on the billing status endpoint` (#14229)
- `feat(platform): increase skill description limit to 1,024 chars` (#14024)
- `feat(backend): per-user rate limit on the subscription status endpoint` (#14231)

Observed types: `fix`, `perf`, `feat`. Scope is always the platform area (`frontend`/`backend`/`platform`), lowercase, single scope. Description after the colon is lowercase imperative-infinitive phrasing ("clean up", "cache", "increase"), no emoji, no trailing period. Lengths range ~35 (#14232) to ~87 (#14229) characters. The outlier, #8448, predates the convention: `Updating docs nav structure to make Platform first class citizen v2` — title case, gerund verb, informal `v2` suffix, no type/scope.

## Description structure
The 4 recent PRs share an identical three-section skeleton, all as `###` (H3) headers:

1. `### Why / What / How` — prose rationale; #14229 and #14231 break it into bolded `**Why:**` / `**What:**` / `**How:**` sub-labels, while #14232 and #14024 use plain prose paragraphs.
2. `### Changes 🏗️` — a flat bulleted list, one change per bullet, often naming the exact file/symbol (`backend/data/credit.py`: new `_get_active_subscription_cached` — #14229; "Raise backend `MAX_DESCRIPTION_CHARS` from 250 to 1,024" — #14024).
3. `### Checklist 📋` — with nested `#### For code changes:` and `#### For configuration changes:` sub-headers.

#8448 uses only `### Background` + `### Changes 🏗️` (with `\r\n` line endings, suggesting a different authoring flow), no checklist — it is the same skeleton's earlier, shorter form. Canonical current order: Why/What/How → Changes 🏗️ → Checklist 📋.

## Template usage
Strong evidence of a repo PR template. The checklist items are identical boilerplate across PRs, e.g. in both #14232 and #14024: `- [x] I have clearly listed my changes in the PR description` / `- [x] I have made a test plan` / `- [x] I have tested my changes according to the test plan:`. The configuration block recurs verbatim: "`.env.default` is updated or already compatible…" and "`docker-compose.yml` is updated or already compatible…" (#14229, #14231; #14232 uses the near-identical "already compatible" variant). This is template scaffold mechanics (nested checkbox groups with `#### For code changes:` / `#### For configuration changes:` headings), even where the author over-answers ("Not applicable; this PR does not change configuration." — #14024). Conclusion: **repo template**, whose prose sections (Why/What/How) are authored fresh and whose checklist section is faithfully retained, with partial fills allowed (see unchecked test items below).

## Length & density
- #14232: ~210 words
- #14229: ~260 words
- #14024: ~200 words
- #14231: ~270 words
- #8448: ~85 words

The 2026 PRs are medium-length (200–270 words) and information-dense: mechanism-level explanation ("a `@cached(ttl_seconds=15)` wrapper over `_get_active_subscription`" — #14229; "`SET NX EX` + `INCR`", "fail-open on Redis brown-out" — #14231) plus quantified impact ("~3–4 Stripe `Subscription.list` calls per request drop to ~1 per customer per window" — #14229; "~1/min per tab… the cap leaves ~4x headroom" — #14231). #8448 is the concise-listing style of the earlier era.

## Voice & tone
- Neutral-technical voice; first person appears only inside the template's first-person checklist lines ("I have tested my changes"), not in the authored prose.
- Tone is precise and defensive-justifying: authors preempt reviewer objections in-line ("The 15s window only affects display fields… which the frontend re-fetches" — #14229; "PaywallGate already renders its children regardless… so a 429 degrades gracefully" — #14231).
- #8448 is plainer and more informal ("Cleaned up from original PR and incorporating that feedback").

## Content habits
- **Linked issues**: none in all 5 PRs. Cross-references go to PRs and CI runs instead: #14232 cites the failing CI run URL and references #14024; #14024 references #13448 ("The change mirrors #13448 across the same five files"); #8448 references its superseded original PR.
- **Test plans**: systematic via the template's test-plan checklist, including honest partial states — unchecked boxes with explanations: "- [ ] `pnpm test:unit`: 554/559 files and 5,988/5,994 tests pass locally; the six failures are unrelated assertions that hard-code en-US currency/date formatting…" (#14232); both #14229 and #14231 merged with the entire "tested my changes" checklist still unchecked, listing planned unit/functional cases instead. Exact tool names with counts are norm: `pnpm lint`, `pnpm types`, "Changed frontend suites: 23/23 tests pass" (#14024).
- **Screenshots/images**: none. #8448 (docs nav redesign) is the only PR where media would be expected, and it has none.
- **Breaking-change callouts / reviewer ask-outs**: none labeled as such; risk mitigation is woven into prose (e.g. mutation flows keeping fresh Stripe reads — #14229).
- **External references**: #14024 links Claude's skill-authoring docs to justify the 1,024 limit — evidence-based rationale is a habit in the Torantulino samples.
- **Labels**: every recent PR carries `size/*` + `platform/*` + `cla: signed`; #8448 adds a `Review effort [1-5]: 4` label, suggesting triage automation.

## Bot-generated content
No bot-generated content in the description bodies — no CodeRabbit "Summary by CodeRabbit" block, no Copilot summary, no AI-attribution footer in any of the 5 PRs. The corpus does not include comment bodies, so bot review comments (the 2026 PRs have 3–7 comments each) cannot be ruled out; but the descriptions themselves read as deliberately structured human/editorial prose with template checklists — ironically, the uniform Why/What/How scaffolding here achieves by human convention what summary-bots do by generation.

## Notable exemplars
- **PR #14231** — https://github.com/Significant-Gravitas/AutoGPT/pull/14231 — most complete package: quantified Why (cold-cache Stripe fan-out, precedent from `/search/global`), implementation detail down to the Redis command shape, a sizing argument for the cap (60/min vs ~1/min steady state), and a graceful-degradation analysis ("429 degrades gracefully rather than blocking the app").
- **PR #14229** — https://github.com/Significant-Gravitas/AutoGPT/pull/14229 — cleanest mechanism write-up: states the redundancy ("up to three times in a single request"), the exact fix boundary (read-only display path only; mutations keep fresh state), and the numeric net effect in one paragraph each.
