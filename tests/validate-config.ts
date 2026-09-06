// Unit tests for validateConfig (background/config.ts): the pre-request
// config guard. It returns a user-facing error string (with a per-field
// message) or null when the config is usable. Like getConfig, the module
// runs loadFileConfig() at import time, so chrome/fetch must be stubbed
// BEFORE the import (same pattern as tests/config-resolve.ts) — a single
// module instance is enough here because validateConfig itself is pure.
import type { ExtensionConfig } from "../src/types";
import { expectIncludes, expectMatch, getFailures } from "./expect-helpers";

(globalThis as unknown as { chrome: unknown }).chrome = {
  runtime: {
    getURL: (path: string) => `file:///${path}`,
  },
  storage: {
    local: {
      get: (_keys: unknown, callback: (items: Record<string, unknown>) => void) => {
        callback({});
      },
    },
  },
};

// No config.local.json: force the file-config load down the 404 path.
globalThis.fetch = (() => Promise.resolve(new Response("not found", { status: 404 }))) as unknown as typeof fetch;

const { validateConfig } = await import("../src/background/config");

const VALID: ExtensionConfig = {
  apiEndpoint: "https://api.example.invalid/v1",
  apiKey: "sk-test-key-12345",
  model: "gpt-test",
  githubToken: "ghp_test",
  thinkingEffort: "default",
  diffEnabled: true,
  diffMaxLines: 3000,
  diffMaxBytes: 100000,
};

function configWith(overrides: Partial<ExtensionConfig>): ExtensionConfig {
  return { ...VALID, ...overrides };
}

console.log("=== Validate Config Tests ===\n");

// --- Fully valid config passes.
expectMatch("fully valid config returns null", validateConfig(VALID), null);

// --- Missing / empty apiEndpoint.
expectMatch(
  "empty apiEndpoint -> endpoint message",
  validateConfig(configWith({ apiEndpoint: "" })),
  "API endpoint is not configured. Set it in config.local.json or extension popup.",
);

// --- Missing / empty apiKey.
expectMatch(
  "empty apiKey -> key message",
  validateConfig(configWith({ apiKey: "" })),
  "API key is not configured. Set it in the extension popup.",
);

// --- Missing / empty model.
expectMatch(
  "empty model -> model message",
  validateConfig(configWith({ model: "" })),
  "Model is not configured. Set it in config.local.json or extension popup.",
);

// --- Invalid endpoint URL: error embeds the offending value.
const badUrl = "not a url";
const badUrlResult = validateConfig(configWith({ apiEndpoint: badUrl }));
expectIncludes("invalid endpoint mentions 'not a valid URL'", badUrlResult ?? "", "not a valid URL");
expectIncludes("invalid endpoint error echoes the value", badUrlResult ?? "", badUrl);
expectMatch(
  "protocol-relative endpoint is not a valid URL",
  validateConfig(configWith({ apiEndpoint: "example.com/v1" })) !== null,
  true,
);

// --- apiKey length bound: <5 rejected, exactly 5 accepted.
expectMatch(
  "apiKey of 4 chars -> too short",
  validateConfig(configWith({ apiKey: "abcd" })),
  "API key appears too short to be valid.",
);
expectMatch("apiKey of exactly 5 chars passes", validateConfig(configWith({ apiKey: "abcde" })), null);

// --- Fields validateConfig does not govern must not affect the verdict:
// githubToken, thinkingEffort, diff toggles/limits are resolved/validated
// elsewhere (resolveThinkingEffort, resolveNumberLimit).
expectMatch("empty githubToken still valid", validateConfig(configWith({ githubToken: "" })), null);
expectMatch("thinkingEffort 'max' still valid", validateConfig(configWith({ thinkingEffort: "max" })), null);
expectMatch("diffEnabled false still valid", validateConfig(configWith({ diffEnabled: false })), null);
expectMatch("diffMaxLines 0 still valid", validateConfig(configWith({ diffMaxLines: 0 })), null);

// --- Check order: the first failing field wins, in declaration order
// (endpoint -> key -> model -> URL shape -> key length).
expectMatch(
  "all fields empty -> endpoint error first",
  validateConfig(configWith({ apiEndpoint: "", apiKey: "", model: "" })),
  "API endpoint is not configured. Set it in config.local.json or extension popup.",
);
expectMatch(
  "endpoint set, key+model empty -> key error",
  validateConfig(configWith({ apiKey: "", model: "" })),
  "API key is not configured. Set it in the extension popup.",
);
expectMatch(
  "bad URL and short key -> URL error first",
  validateConfig(configWith({ apiEndpoint: "@@", apiKey: "ab" }))?.includes("not a valid URL"),
  true,
);

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All validate-config tests passed");
