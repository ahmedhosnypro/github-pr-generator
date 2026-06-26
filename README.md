# GitHub PR Generator

A Chrome extension that generates pull request titles and descriptions using any OpenAI-compatible API.

When you're on GitHub's "Open a Pull Request" page, click **AI Generate** and the extension will analyze your commits and file changes, then fill in the title and description for you.

---

## Features

- Generates PR title and description from commit messages and file changes
- Works with any OpenAI-compatible API endpoint
- Two generate buttons: one next to the title field, one in the description toolbar
- Built-in log panel for debugging (copy logs to clipboard)
- Configurable via `config.local.json` or extension popup
- Circuit breaker: validates config before making API calls

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/ahmedhosnypro/github-pr-generator.git
cd github-pr-generator
```

2. Copy the example config and fill in your credentials:

```bash
cp config.local.example.json config.local.json
```

3. Edit `config.local.json` with your API details:

```json
{
  "apiEndpoint": "http://localhost:20128/v1",
  "apiKey": "sk-your-actual-api-key-here",
  "model": "model_id"
}
```

4. Load the extension in Chrome:

   - Open `chrome://extensions`
   - Enable **Developer mode** (toggle in top-right)
   - Click **Load unpacked**
   - Select the `github-pr-generator` folder

5. Navigate to a GitHub PR creation page and click **AI Generate**

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
  "model": "model_id"
}
```

### config.local.example.json

A template file tracked in git with placeholder values. Copy it to get started:

```bash
cp config.local.example.json config.local.json
```

### Extension Popup

Click the extension icon in Chrome's toolbar to open the settings popup. Changes here override `config.local.json` for the current browser session.

### Configuration Validation

The extension validates your config before making API calls and will show a clear error if:

- API endpoint is missing or not a valid URL
- API key is missing or too short
- Model name is missing
- API returns 401/403 (authentication failed)

---

## How It Works

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
3. Background makes **two API calls**: one for the title, one for the description
4. Results are filled into the PR form fields using React-compatible value setters

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
4. A DevTools window opens — check console for `[PR Generator BG v5]` logs

### Content Script Console

Open DevTools (`F12`) on the GitHub page. Look for `[PR Generator v1.1]` prefixed messages.

---

## Project Structure

```
github-pr-generator/
├── manifest.json                  # Chrome extension manifest (v3)
├── background.js                  # Service worker — API calls
├── content.js                     # Content script — page scraping, UI injection
├── styles.css                     # Button and log panel styles
├── config.local.json              # Your API config (gitignored)
├── config.local.example.json     # Config template (tracked)
├── .gitignore
├── popup/
│   ├── popup.html                 # Extension settings UI
│   └── popup.js                   # Settings load/save logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

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
