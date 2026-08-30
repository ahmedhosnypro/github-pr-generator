# GitHub PR Generator

A Chrome extension that generates pull request titles and descriptions using any OpenAI-compatible API.

**On the PR creation page** — click **AI Generate** and the extension will analyze your commits and file changes, then fill in the title and description for you.

**On an already-opened PR page** — click **AI Title** or **AI Description** to regenerate and update each field separately via the GitHub API.

---

## Features

### PR Creation Page (`/compare` or `/pull/*/edit`)

- Generates PR title and description from commit messages and file changes
- Two generate buttons: one next to the title field, one in the description toolbar
- Results are filled into the form using React-compatible value setters

### Opened PR Page (`/owner/repo/pull/N`)

- **AI Title** button — generates and updates only the PR title via the GitHub API
- **AI Description** button — generates and updates only the PR description via the GitHub API
- Title and description are updated independently
- Changes are pushed to GitHub via `PATCH /repos/{owner}/{repo}/pulls/{number}` and the page auto-refreshes through GitHub's real-time channel

### General

- Works with any OpenAI-compatible API endpoint
- Built-in log panel for debugging (copy logs to clipboard)
- Configurable via `config.local.json` or modern extension popup (Material Design 3, dark mode, theme toggle, test buttons)
- Circuit breaker: validates config before making API calls
- GitHub PAT support for higher API rate limits and private repo access

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

Re-run `bun run build` to copy the updated config into `dist/`, or just `bun run dev` to rebuild on every change.

5. Load the extension in Chrome:

   - Open `chrome://extensions`
   - Enable **Developer mode** (toggle in top-right)
   - Click **Load unpacked**
   - Select the `dist/` folder (inside the `github-pr-generator` directory)

5. Navigate to a GitHub PR creation page and click **AI Generate**, or open any PR page and click **AI Title** / **AI Description**

---

## Configuration

The extension loads config from two sources, in priority order:

| Priority | Source | Description |
|----------|--------|-------------|
| 1 | `config.local.json` | File in the extension root (gitignored) |
| 2 | Extension popup | Saved to `chrome.storage.local` |

### config.local.json

Create this file in the extension root directory. **It is gitignored and will never be committed.**

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
- Settings saved to `chrome.storage.local` and override `config.local.json`
- **Test API** button — validates endpoint + key with a quick chat request
- **Test GitHub** button — validates your PAT against `api.github.com/user`
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

The extension includes local tests to validate commit coverage using a reference PR.

### Configuration

Add a `testPr` section to your `config.local.json`:

```json
{
  "apiEndpoint": "http://localhost:20128/v1",
  "apiKey": "sk-your-api-key",
  "model": "model_id",
  "githubToken": "ghp_your_github_pat_here",
  "testPr": {
    "owner": "ahmedhosnypro",
    "repo": "siraj",
    "number": 17,
    "headRefName": "tests",
    "baseRefName": "master",
    "title": "pull",
    "description": "Test PR for commit coverage validation",
    "commits": 33,
    "filesChanged": 118,
    "additions": 7212,
    "deletions": 186
  }
}
```

### Running Tests

```bash
# Run commit coverage test (checks if PR description covers all commits)
bun run test:coverage

# Run extension prompt coverage test (checks if extension's changes summary includes all commits)
bun run test:extension

# Run full extension coverage test (checks prompt structure and PR description coverage)
bun run test:full

# Run PR creation page prompt test (checks prompt includes commit coverage instruction)
bun run test:pr-creation

# Run all tests
bun run test
```

### Test Output

Tests will output:
- List of all commits in the test PR
- Coverage analysis showing which commits are mentioned in the PR description
- Pass/fail status based on coverage threshold (90% = pass, 70% = partial, <70% = fail)

The test uses GitHub CLI (`gh`) to fetch PR data, so you need:
1. `gh` installed and authenticated (`gh auth login`)
2. A valid `githubToken` in config with `repo` scope

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

Open DevTools (`F12`) on the GitHub page. Look for `[PR Generator v1.6]` prefixed messages.

---

## Project Structure

```
github-pr-generator/
├── manifest.json                  # Chrome extension manifest (v3) — copied to dist/ as-is
├── src/
│   ├── types.ts                   # Shared message/config/GitHub-API types
│   ├── background.ts              # Service worker entry (thin) + modules in src/background/
│   ├── content.ts                 # Content script entry (thin) + modules in src/content/
│   └── popup/                     # Popup entry, compiled to dist/popup/popup.js
├── popup/
│   ├── popup.html                 # Settings UI (copied to dist/)
│   └── popup.css                  # Material Design 3 styles (copied to dist/)
├── styles.css                     # Content-script button & log panel styles (copied to dist/)
├── scripts/
│   ├── build.ts                   # bun build → dist/ + asset copy
│   └── convert-icons.ts           # PNG icon generation from SVG (sharp)
├── tests/                         # bun-run TypeScript test scripts
│   ├── commit-coverage.ts
│   ├── extension-coverage.ts
│   ├── full-coverage.ts
│   └── pr-creation-prompt.ts
├── config.local.json              # Your API config (gitignored, copied to dist/ if present)
├── config.local.example.json      # Config template (tracked)
├── .gitignore
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
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

Linting enforces, among other rules: `sonarjs/max-lines` 150 lines per file and `sonarjs/max-lines-per-function` 50 lines per function.


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

- Support for streaming API responses
- Custom prompt templates
- Support for more API providers (Anthropic, Google, etc.)
- Better error recovery and retry logic
- Internationalization

---

## Issues

Found a bug or have a feature request?

[Open an issue](https://github.com/your-username/github-pr-generator/issues)

Please include:

- Chrome version
- Extension version
- Steps to reproduce
- Console logs (use the built-in log panel or service worker console)

---

## License

MIT
