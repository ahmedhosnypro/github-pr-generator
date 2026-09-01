# PR Patterns: public-apis/public-apis

## Corpus
- PRs analyzed: 5 (numbers: #7112, #7115, #7110, #7108, #7107)
- Caveat: the sample is highly homogeneous in *kind*, not author — 5 different authors (anshss, RobotFleet-HQ, pixer-11, mtaahfunnels, quanna1210), but every PR is the same mechanical change: a single-line addition to the API list (`+1 -0, 1 files` on all five), all merged within a single 8-minute window on 2026-08-30 by (presumably) one maintainer. Zero reviews, zero comments, zero labels, zero linked issues across the board. The patterns below describe "list-entry submission PRs", which in this repo likely *are* the dominant genre — but they say nothing about how the repo handles any other change type.

## Titles
All 5 titles are plain `Add <Name>` imperatives, with three observed formats:
- `Add Aquanode API` (#7112) — name + generic "API" suffix
- `Add TradeDataHub` (#7115), `Add Wander Atlas API` (#7110) — bare name
- `Add Scrax to Development section` (#7108), `Add PublicDataHub to Open Data` (#7107) — name + target category

No conventional-commit prefixes (`feat:`/`docs:`), no scopes, no emoji, no trailing periods, sentence-case capitalization of the API's own brand name. Lengths are short (~20–40 chars). The title carries almost no information beyond the API name.

## Description structure
No consistent section headers. Only #7112 uses a markdown header at all (`## Add API`); the others mix checklist + prose in varying order:

- #7112: `## Add API` header → one-sentence API pitch → bolded field bullets (`- **Category:**`, `- **Auth:** No`, `- **HTTPS:** Yes`, `- **CORS:** No — …`, `- **Docs:**`, `- **Endpoint:**`) → prose reassurance ("No API key, no signup…") → 9-item checklist
- #7115: 9-item checklist **first** → one dense prose paragraph with inline links (`[TradeDataHub](https://www.tradedatahub.net) provides a free, keyless, rate-limited public discovery API (HTTPS, CORS enabled, OpenAPI 3.1 spec at …)`)
- #7110: checklist only — no prose at all, not even one sentence about Wander Atlas
- #7108: a single 2-sentence prose paragraph ("Adds Scrax, a web scraping API that only bills for successful scrapes…") — no checklist, no fields
- #7107: prose intro ("Adds PublicDataHub to the **Open Data** section.") → detail paragraph → example endpoint in a code span → metadata bullets (`- **Auth \`No\`** — no key, no registration…`) → horizontal rule `---` → 9-item checklist

Heading levels: `#7112`'s `## Add API` is the only heading in the corpus. Lists dominate over prose in 4 of 5.

## Template usage
Strong evidence of a repo PR template: the identical 9-item checklist appears verbatim in 4 of 5 PRs (#7112, #7115, #7110, #7107), e.g.:

```
- [x] My submission is formatted according to the guidelines in the contributing guide
- [x] My addition is ordered alphabetically
- [x] My submission has a useful description
- [x] The description does not have more than 100 characters
- [x] The description does not end with punctuation
- [x] Each table column is padded with one space on either side
- [x] I have searched the repository for any relevant issues or pull requests
- [x] Any category I am creating has the minimum requirement of 3 items
- [x] All changes have been squashed into a single commit
```

The checkboxes are pre-ticked (`- [x]`) in nearly every case; the sole unchecked item is #7115's `- [ ] Any category I am creating has a minimum requirement of 3 items` (a legitimately non-applicable item, correctly left unchecked — the checklist is being read, not rubber-stamped). Minor drift between copies exists ("the guidelines in the contributing guide" vs "…in the [contributing guide](/CONTRIBUTING.md)"; "has the minimum requirement" vs "has a minimum requirement"; "[squashed][squash-link]" vs plain "squashed"), suggesting authors copy from slightly different template versions. #7108 omits the checklist entirely. Conclusion: **template — a checklist-only template that contributors fill inconsistently**; the template contains no prose scaffold (no "What/Why/Testing" prompts).

## Length & density
Bimodal; every description is short by any normal standard:
- #7112: ~110 words excluding checklist — the fullest
- #7107: ~100 words + checklist
- #7115: ~70 words + checklist
- #7110: ~30 words — checklist only, zero prose
- #7108: ~30 words — two sentences, no checklist

Pattern: hyper-concise, matching the change size (one table row). The useful signal per PR is the justification that the API qualifies (free/keyless, HTTPS, CORS status, docs link) — the better PRs spend their entire prose budget on exactly that.

## Voice & tone
- Imperative titles; descriptions switch between imperative-adjacent ("Add Aquanode API") and declarative present ("[TradeDataHub] provides…", "Adds PublicDataHub…", "It publishes United States federal reference data…"). "Adds X" is the recurring opening verb (#7107, #7108).
- First person appears only inside the template checklist ("My submission…"), never in authored prose.
- Promotional-but-factual register: authors pitch their own API ("a free, unauthenticated endpoint returning live GPU rental pricing…", "only bills for successful scrapes") but the accepted style keeps claims verifiable (auth/HTTPS/CORS facts, doc links). Slightly marketing-flavored (#7112's "No API key, no signup, and no purchase of any device or service is required") yet no exclamation points or emoji.

## Content habits
- **Linked issues**: none — 0 of 5; no "Fixes #N" anywhere. This repo's PRs don't come from issues.
- **Test plans**: none in the conventional sense; the checklist items (alphabetical order, 100-char description, one commit squashed) act as a mechanical substitute.
- **Field callouts**: the characteristic habit — 3 of 5 PRs (#7112, #7107, #7115) state Auth/HTTPS/CORS values explicitly in the description, anticipating the reviewer's qualification check. #7112 even pre-emptively flags a negative: "CORS: No — the endpoint sends no `Access-Control-Allow-Origin`, so it is server-side/CLI use only."
- **Screenshots, breaking changes, reviewer ask-outs**: none in any PR.
- **Links**: docs/OpenAPI links are common (4 of 5 include at least one: docs.aquanode.io, tradedatahub.net/openapi.json, publicdatahub.org/openapi.json).

## Bot-generated content
No bot-generated content detected in any of the 5 PRs — no CodeRabbit "Summary" blocks, no Copilot-generated descriptions, no AI-disclosure footers. The near-identical checklist boilerplate is repo-template text, not bot output. (#7115's author name "RobotFleet-HQ" suggests an org account, but its description is hand-written prose with a correctly-unchecked template item.) The structured Auth/HTTPS/CORS field bullets in #7112 and #7107 have the regularity AI generators imitate, but there is no explicit signature of generation.

## Notable exemplars
- **PR #7112 (Add Aquanode API)** — https://github.com/public-apis/public-apis/pull/7112 — the model submission: anticipates every reviewer question with bolded Category/Auth/HTTPS/CORS/Docs/Endpoint fields, honestly discloses the CORS limitation instead of hiding it, notes alphabetical placement, and completes the full checklist.
- **PR #7107 (Add PublicDataHub to Open Data)** — https://github.com/public-apis/public-apis/pull/7107 — pairs a concrete live endpoint example (`GET https://publicdatahub.org/api/export/hospital/mayo-clinic-hospital-rochester.json`) with per-field justification and a health-check endpoint reference, making the API independently verifiable in seconds.
