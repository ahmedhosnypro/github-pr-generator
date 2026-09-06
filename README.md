# GitHub PR Generator

A Chrome extension that generates pull request titles and descriptions using any OpenAI-compatible API.

**On the PR creation page** — click **AI Generate** and the extension will analyze your commits and file changes, then fill in the title and description for you.

**On an already-opened PR page** — click **AI Title** or **AI Description** to regenerate and update each field separately via the GitHub API.

---

## Features

### PR Creation Page (`/compare`)

- Generates PR title and description from commit messages and file changes
- Two generate buttons: one next to the title field, one in the description toolbar
- Results are filled into the form using React-compatible value setters

### Opened PR Page (`/owner/repo/pull/N`)

- **AI Title** button — generates and updates only the PR title via the GitHub API. The dropdown next to it offers two modes: *Improve current title* (refines the existing title, the default click action) and *Generate fresh title* (crafts a brand-new title from the PR's commits, files, and diff only — the current title is never included in the prompt)
- **AI Description** button — generates and updates only the PR description via the GitHub API
- Title and description are updated independently
- Changes are pushed to GitHub via `PATCH /repos/{owner}/{repo}/pulls/{number}` and the page auto-refreshes through GitHub's real-time channel

### General

- Works with any OpenAI-compatible API endpoint
- Streams the model's response and fills the PR title/description live as tokens arrive (with a non-streaming fallback for endpoints that ignore `stream: true`)
- Built-in log panel for debugging (copy logs to clipboard)
- Configurable via `config.local.json` or modern extension popup (Material Design 3, dark mode, theme toggle, test buttons)
- Circuit breaker: validates config before making API calls
- GitHub PAT support for higher API rate limits and private repo access

### Description Style (universal, corpus-informed)

Prompt wording is calibrated against an analysis of 470 merged PRs from 94 top-starred repositories, and per-repo behavior is **discovered live for any repository** — no hardcoded repo list:

- **Live template discovery** — the repo's own `PULL_REQUEST_TEMPLATE` (in `.github/`, `docs/`, or the repo root, incl. multi-template directories) is fetched from GitHub and used as the structure to fill; results are cached for 6 hours
- **Live convention inference** — the extension samples the repo's recently merged PRs, filters out bots, and infers the dominant title convention (conventional commits, `subsystem: verb`, `[Area]`, plain imperative, …) and typical description length from real human examples
- **Proportional output** — small diffs get compact descriptions (Summary + Testing) instead of a fixed multi-section scaffold
- **Render-quality contract** — descriptions follow the presentation rules of the best merged PRs (`analysis/pull-requests/PRESENTATION.md`): fenced code blocks for commands, tables with verdict captions for comparisons, one-line bold-label bullets, numbered testing steps with expected outcomes, and a mandatory closing artifact
- **Template fidelity** — existing PR templates are preserved byte-for-byte (headers, HTML comments, checkboxes); already-written text is completed, never rewritten
- **Evidence-based testing** — Testing sections prefer copy-pasteable commands and quantified results over prose claims
- **Bot-signature stripping** — hallucinated "Summary by CodeRabbit"-style blocks, badges, and AI credit lines are removed from generated output
- **Anchor guard** — every file named in the description carries a clickable `diffhunk://` link when the diff provided one; a missing-anchor generation is logged as a warning

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/ahmedhosnypro/github-pr-generator.git
cd github-pr-generator
```

2. Install dependencies and build the extension:

```bash
bun install
bun run build
```

This compiles the TypeScript sources and produces a ready-to-load extension in `dist/`.

3. Copy the example config and fill in your credentials:

```bash
cp config.local.example.json config.local.json
```

4. Edit `config.local.json` with your API details:

```json
{
  "apiEndpoint": "http://localhost:20128/v1",
  "apiKey": "sk-your-actual-api-key-here",
  "model": "model_id"
}
```

Re-run `bun run build` to copy the updated config into `dist/`, or just `bun run dev` to rebuild on every change. **Secrets (`apiKey`, `githubToken`) are stripped from the `dist/` copy** — the build warns when it strips them. Set them once in the extension popup instead; they're kept in `chrome.storage.local`, which takes precedence over the file.

5. Load the extension in Chrome:

   - Open `chrome://extensions`
   - Enable **Developer mode** (toggle in top-right)
   - Click **Load unpacked**
   - Select the `dist/` folder (inside the `github-pr-generator` directory)

6. Navigate to a GitHub PR creation page and click **AI Generate**, or open any PR page and click **AI Title** / **AI Description**

---

## Configuration

The extension merges config from two sources. Precedence is **per field** (see `src/background/config.ts`):

| Fields | Effective precedence |
|---|---|
| `apiEndpoint`, `apiKey`, `model`, `githubToken` | Extension popup (`chrome.storage.local`) → `config.local.json` |
| `thinkingEffort`, `diffEnabled`, `diffMaxLines`, `diffMaxBytes` | `config.local.json` → extension popup → built-in defaults (`default`, `true`, 3000 lines, 100 000 bytes) |

Because the build strips secrets from `dist/`, `apiKey` and `githubToken` must come from the popup. Conversely, setting `thinkingEffort` or any diff setting in `config.local.json` **pins** that value — the corresponding popup control then has no effect, so the example config deliberately leaves those fields unset.

### config.local.json

Create this file in the extension root directory. **It is gitignored and will never be committed.**

Secret fields (`apiKey`, `githubToken`) in this file are **not** copied into `dist/` — the build strips them so a zipped or shared `dist/` can never leak your credentials. The extension reads secrets only from `chrome.storage.local`, so set them once via the extension popup. Non-secret defaults (`apiEndpoint`, `model`, diff limits, `testPr`) still ship in `dist/config.local.json`, and the full file (secrets included) is read directly by the Node test tooling (`tests/`).

```json
{
  "apiEndpoint": "http://localhost:20128/v1",
  "apiKey": "sk-your-api-key",
  "model": "model_id",
  "githubToken": "ghp_your_github_pat_here"
}
```

> **Note:** The `githubToken` (GitHub Personal Access Token with `repo` scope) is **required** for updating PR title/description on already-opened PR pages. Without it, only the PR creation page feature works. It also enables higher API rate limits and private repo access for diff fetching.

### config.local.example.json

A template file tracked in git with placeholder values. Copy it to get started:

```bash
cp config.local.example.json config.local.json
```

### Extension Popup

Click the extension icon in Chrome's toolbar to open the modern settings popup. Features:

- **Material Design 3** with light/dark mode (auto-detects browser theme, with manual toggle)
- Settings are saved to `chrome.storage.local`. Popup values override `config.local.json` for `apiEndpoint`/`apiKey`/`model`/`githubToken`; for **Thinking Effort** and the **Diff Settings** the file wins when those keys are present in `config.local.json` (the example config omits them so the popup controls stay live)
- **Test API** button — validates endpoint + key with a quick chat request
- **Test GitHub** button — validates your PAT against `api.github.com/user`
- **Thinking Effort** button group (`none`, `default`, `minimal`, `low`, `medium`, `high`, `max`) — sent to the API as `reasoning_effort`; `default` omits the field
- Collapsible **Diff Settings** section (`diffEnabled`, `diffMaxLines`, `diffMaxBytes`)

### Configuration Validation

The extension validates your config before making API calls and will show a clear error if:

- API endpoint is missing or not a valid URL
- API key is missing or too short
- Model name is missing
- API returns 401/403 (authentication failed)

---

## How It Works

### PR Creation Page Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  GitHub Page  │────▶│  Content.js  │────▶│  Background.js    │
│  (PR form)    │◀────│  (scrapes    │◀────│  (calls API      │
│               │     │   page data) │     │   via fetch)      │
└──────────────┘     └──────────────┘     └──────────────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │  OpenAI-compat   │
                                          │  API Endpoint    │
                                          └──────────────────┘
```

1. **Content script** extracts commit messages and file changes from the GitHub PR page
2. Sends data to **background service worker** (avoids CORS issues)
3. Background builds a prompt, calls the **LLM API**, and parses the combined title + description response
4. Results are filled into the PR form fields using React-compatible value setters

### Opened PR Page Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  GitHub Page  │────▶│  Content.js  │────▶│  Background.js    │────▶│  GitHub API   │
│  (opened PR)  │     │  (sends owner│     │  (fetches PR data│     │  (PATCH to   │
│               │     │   /repo/num) │     │   via GitHub API, │     │   update PR) │
│               │     │              │     │   calls LLM)     │     │              │
└──────────────┘     └──────────────┘     └──────────────────┘     └──────────────┘
                                                       │
                                                       ▼
                                              ┌──────────────────┐
                                              │  OpenAI-compat   │
                                              │  API Endpoint    │
                                              └──────────────────┘
```

1. **Content script** extracts owner, repo, and PR number from the URL, plus existing title/description from the page
2. Sends data to **background service worker**
3. Background fetches PR commits, files, and diff via **GitHub REST API**
4. Background builds a focused prompt (title-only or description-only), calls the **LLM API**, and parses the response
5. Background calls **GitHub REST API** (`PATCH /repos/{owner}/{repo}/pulls/{number}`) to update the PR
6. GitHub's real-time channel pushes the update to the page automatically

---

## Testing

The extension includes local tests: an offline suite that runs anywhere (`bun run test`), and a fetch-based suite that validates commit coverage against a reference PR (`bun run test:fetch`).

### Configuration

Only the fetch-based suite needs configuration. Add a `testPr` section to your `config.local.json` — only `owner`, `repo`, and `number` are read; anything else (titles, expected stats, ref names) is ignored:

```json
{
  "apiEndpoint": "http://localhost:20128/v1",
  "apiKey": "sk-your-api-key",
  "model": "model_id",
  "githubToken": "ghp_your_github_pat_here",
  "testPr": {
    "owner": "ahmedhosnypro",
    "repo": "siraj",
    "number": 17
  }
}
```

### Running Tests

The offline suite (`bun run test`) chains twenty suites that never touch the network, `gh`, or `config.local.json`: **logic** (prompt wording, mirror drift), **parse** (bot-signature stripping, template preservation), **format** (render-quality contract), **stream** (SSE parsing), **style** (repo-style inference), **refinement** (quality-loop scorer), **diff-parse** (hunk extraction), **config-save** (popup → SW config write), **config-resolve** (stored ↔ file config merge, NaN guard), **pr-update** (GitHub title/body write path via mock fetch), **discovery** (repo-style cache and PR-template discovery), **llm** (callAPI via mock fetch), **sse** (incremental stream parser), **stream-render** (live-preview helpers), **rubric** (acceptance-gate checks), **linkify** (URL resolution from diffhunk markers), **popup-text** (popup URL text helpers), **common** (repo-name / PR-number validation guards), **diff-fetch** (PR diff retrieval via mock fetch), and **pr-lists** (commit/file list pagination).

The fetch-based suite (`bun run test:fetch`) chains the four suites that shell out to `gh` and require the `testPr` fixture: **coverage**, **extension**, **full** (commit coverage from description/prompt/both sides), and **pr-creation** (creation-page prompt assembly).

```bash
# Run all offline tests
bun run test

# Run the fetch-based tests (needs gh + testPr fixture)
bun run test:fetch

# Run everything
bun run test:all

# Individually (offline):
bun run test:logic         # prompt wording & drift guard
bun run test:parse         # bot stripping / template fidelity
bun run test:format        # render-quality rules
bun run test:stream        # SSE chunk parsing
bun run test:style         # repo-style inference
bun run test:refinement    # quality loop scorer (anchors, size, coverage)
bun run test:diff-parse    # diff → hunk-range extraction
bun run test:config-save   # config write path (partial updates, NaN guard)
bun run test:config-resolve # stored ↔ file config merge, NaN guard
bun run test:pr-update     # GitHub title/body write path (mock fetch)
bun run test:discovery     # repo-style cache & PR-template discovery
bun run test:llm           # callAPI over mocked fetch (retries, JSON/SSE)
bun run test:sse           # incremental SSE parser
bun run test:stream-render # streaming-render helpers in the content script
bun run test:rubric        # acceptance-gate checks against generated output
bun run test:linkify       # diffhunk → GitHub URL resolution + bare-ref stripping
bun run test:popup-text    # popup URL text helpers (trailing-slash stripping)
bun run test:common        # repo-name / PR-number validation guards
bun run test:diff-fetch    # PR diff retrieval over mocked fetch
bun run test:pr-lists      # commit/file list pagination

# Individually (fetch-based, uses testPr):
bun run test:coverage      # PR description covers commits
bun run test:extension     # prompt covers commits
bun run test:full          # both + PR structure
bun run test:pr-creation   # creation-page prompt assertions
```

### Live labs (hit the real LLM endpoint — not part of `bun run test`)

```bash
# Single PR end-to-end: fetch a real PR, generate, refine, score
bun run lab                    # sirajLMS/siraj#119 by default; override with --repo o/r --pr N

# All top-10 active GitHub repos in parallel, one merged PR each, summary table
bun run lab:parallel

# Render-quality acceptance against a hand-built fixture
bun run test:format-live
```

Labs read the same `config.local.json` (they require `apiEndpoint`, `apiKey`, `model`, and `githubToken`) but can override the model and reasoning effort **without touching the extension's settings**:

| Field / env | Effect |
|---|---|
| `labModel` | Model for lab runs instead of `model`. The `PR_LAB_MODEL` env var wins over it. |
| `labEffort` | `reasoning_effort` for lab runs (`none`/`default`/`minimal`/`low`/`medium`/`high`/`max`; anything else falls back to `low`). The `PR_LAB_EFFORT` env var wins over it. |

### Browser E2E (real Chromium, not in `bun run test`)

```bash
bun run test:e2e   # loads dist/ as an unpacked extension: service worker registers,
                   # popup renders + saves/restores settings, buttons inject on a
                   # live opened-PR page, and the run 9 title-corruption regression
                   # is asserted against the real GitHub DOM
```

### Test Output

The fetch-based suites (`bun run test:fetch`) will output:
- List of all commits in the test PR
- Coverage analysis showing which commits are mentioned in the PR description
- Pass/fail status based on coverage threshold (90% = pass, 70% = partial, <70% = fail)

They use the GitHub CLI (`gh`) for all PR metadata (title, branches, commits, files, stats); the two prompt-building suites (`test:full`, `test:pr-creation`) additionally fetch the compare diff from the GitHub REST API with your `githubToken` as a Bearer token. You need:

1. `gh` installed and authenticated (`gh auth login`)
2. Optionally, a `githubToken` in `config.local.json` — the suites only warn when it's missing, but diff fetches then run unauthenticated (lower rate limits, public repos only; use a PAT with `repo` scope for private repos)

---

## Debugging

### Log Panel

Click the **📋 PR Gen Logs** button (fixed at bottom-right of the page) to open the in-page log panel:

- **Copy** — copies all logs to clipboard
- **Clear** — clears current and stored logs
- **Close** — hides the panel

Logs persist across page reloads (last 200 entries stored in `chrome.storage.local`).

### Service Worker Console

To debug the background script:

1. Go to `chrome://extensions`
2. Find **GitHub PR Generator**
3. Click the **"service worker"** link
4. A DevTools window opens — check console for `[PR Generator BG v8]` logs

### Content Script Console

Open DevTools (`F12`) on the GitHub page. Look for `[PR Generator vX.Y.Z]` prefixed messages — the version is read live from `manifest.json` (currently 1.7.1).

---

## Project Structure

```
github-pr-generator/
├── manifest.json                  # Chrome extension manifest (v3) — copied to dist/ as-is
├── styles.css                     # Content-script button & log-panel styles (copied to dist/)
├── popup/
│   ├── popup.html                 # Settings UI markup (copied to dist/)
│   └── popup.css                  # Material Design 3 styles (copied to dist/)
├── icons/                         # Extension icons (SVG sources + generated PNGs)
├── src/
│   ├── background.ts              # Service-worker entry (thin; delegates to src/background/)
│   ├── content.ts                 # Content-script entry (thin; delegates to src/content/)
│   ├── types.ts / messages.ts / responses.ts / github-types.ts   # shared config/message/API types
│   ├── background/                # Service-worker modules (config merge, LLM client, SSE/stream parsing,
│   │   │                          #  prompt assembly, refinement loop, repo-style discovery, …)
│   │   ├── handlers/              # Message handlers: generate / title / description / merge
│   │   ├── github/                # GitHub REST client: PR read+update, diff fetch & hunk parsing,
│   │   │                          #  commit/file list pagination, template & style discovery
│   │   └── prompts/               # Prompt builders (combined creation, opened-PR, merge)
│   ├── content/                   # Content-script modules: page detection, button injection and
│   │                              #  orchestration per page kind (compare-*, opened-*, merge-*),
│   │                              #  DOM scraping, live streaming into the form
│   └── popup/                     # Popup modules: state/load/save, messaging, permissions,
│                                  #  validation, Test API / Test GitHub, theme, UI helpers
├── scripts/
│   ├── build.ts                   # bun build → dist/ + asset copy (strips secrets from config;
│   │                              #  fails on manifest/package version drift)
│   ├── dev.ts                     # watch-mode rebuilds (picks up directories created after startup)
│   ├── check-version-sync.ts      # manifest.json ↔ package.json version guard
│   ├── strip-config.ts            # secret-stripping sanitizer shared by build + tests
│   ├── quality-gate.ts            # staged quality gate with resume (see below)
│   ├── improve-loop.ts            # automated description-improvement loop driver
│   └── convert-icons.ts           # PNG icon generation from SVG (sharp)
├── tests/                         # bun-run TypeScript tests + live labs
│   ├── (offline `bun run test`)   # prompt-logic, parse, prompt-format, stream-parse, repo-style,
│   │                              #  refinement, diff-parse, config-save, config-resolve, pr-update,
│   │                              #  discovery, llm, sse, stream-render, rubric, linkify, popup-text,
│   │                              #  common, diff-fetch, pr-lists
│   ├── (fetch `bun run test:fetch`)  # commit-coverage, extension-coverage, full-coverage,
│   │                                 #  pr-creation-prompt — need gh + testPr fixture
│   ├── shared.ts / testkit.ts / prompt.ts / prompt-mirror.ts / fixtures.ts / expect-helpers.ts
│   │                              # shared harness: config load, gh fetch, coverage logging
│   ├── pr-lab*.ts / format-live.ts   # live labs against the real LLM endpoint
│   └── extension-e2e.ts           # real Chromium E2E (popup + content script)
├── analysis/                      # PR-corpus analysis, render-quality contract, improvement log
├── .github/workflows/ci.yml       # CI (see below)
├── config.local.json              # Your API config (gitignored; copied to dist/ with secrets stripped)
├── config.local.example.json      # Config template (tracked)
├── .gitignore
└── biome.json / eslint.config.mjs / oxlint.config.mts / knip.config.ts / .jscpd.json / tsconfig.json
```

### Development & Code Quality

The extension source is TypeScript; bun bundles each entry into a single self-contained script in `dist/`.

```bash
bun run dev              # rebuild dist/ on every file change
bun run build            # one-shot production build
bun run typecheck        # tsc --noEmit (strict)
bun run lint             # typecheck + biome + oxlint + eslint (type-aware, sonarjs)
bun run biome:fix        # auto-fix formatting/lint via biome
bun run check:duplicates # jscpd copy-paste detection
bun run check:unused     # knip unused code/exports/deps
bun run quality          # lint + duplicates + unused
```

Linting enforces, among other rules: `sonarjs/max-lines` 300 lines per file and `sonarjs/max-lines-per-function` 80 lines per function.

`bun run quality-gate` runs the full check pipeline in stages — **BASIC_CHECKS** (typecheck → oxlint → biome → eslint), **TESTS** (the offline `bun run test` suite), **UNUSED** (knip), **DUPLICATES** (jscpd) — and resumes from the first failing stage on rerun; `bun run quality-gate:fresh` clears the state and starts from the top.

---

## Continuous Integration

`.github/workflows/ci.yml` runs on every push and pull request to `master`:

1. Check out the repo and set up Bun
2. `bun install --frozen-lockfile`
3. `bun run quality-gate:fresh` — the full staged gate above (lint + offline tests + hygiene)
4. `bun run build` — smoke-builds the extension into `dist/`

Only the offline suite runs in CI; the suites that need `gh`, a live LLM endpoint, or a browser (`test:fetch`, labs, E2E) stay local.


---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. Create a **feature branch**:

```bash
git checkout -b feature/your-feature-name
```

3. Make your changes and test them
4. **Commit** with clear messages
5. Open a **Pull Request**

### Ideas for Contributions

- Custom prompt templates
- Support for more API providers (Anthropic, Google, etc.)
- Better error recovery and retry logic
- Internationalization

---

## Issues

Found a bug or have a feature request?

[Open an issue](https://github.com/ahmedhosnypro/github-pr-generator/issues)

Please include:

- Chrome version
- Extension version
- Steps to reproduce
- Console logs (use the built-in log panel or service worker console)

---

## License

MIT
