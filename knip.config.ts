import type { KnipConfig } from "knip";

/**
 * Entry points are the files referenced by manifest.json (background service worker,
 * content script, popup page) plus standalone bun-run scripts and tests — none of these
 * are reachable via static imports, so knip needs them listed explicitly.
 */
const config: KnipConfig = {
  entry: [
    // manifest.json targets
    "src/background.ts",
    "src/content.ts",
    "src/popup/popup.ts",
    // bun-run scripts & tests (invoked via package.json / CLI)
    "scripts/**/*.ts",
    "tests/**/*.ts",
  ],
  project: ["src/**/*.ts", "tests/**/*.ts", "scripts/**/*.ts"],
};

export default config;
