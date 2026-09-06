// Unit tests for getConfig (background/config.ts): the stored <-> file
// priority merge and the resolveNumberLimit NaN guard. chrome does not
// exist under Bun, and config.ts runs loadFileConfig() (a fetch to
// chrome.runtime.getURL("config.local.json")) at module-evaluation time,
// so both globals must be stubbed BEFORE the import, and each scenario
// gets a fresh module instance via a query-param cache-bust (FILE_CONFIG
// is module-level state).
import { resolveConfig } from "../src/config-resolve";
import type { ExtensionConfig, FileConfig, StoredConfig } from "../src/types";
import { expectMatch, getFailures } from "./expect-helpers";

type ConfigModule = typeof import("../src/background/config");
type StorageMap = Record<string, unknown>;

let storageData: StorageMap = {};
let storageError: string | null = null;
let fileConfigPayload: FileConfig | null = null;

(globalThis as unknown as { chrome: unknown }).chrome = {
  runtime: {
    getURL: (path: string) => `file:///${path}`,
    get lastError() {
      return storageError === null ? undefined : { message: storageError };
    },
  },
  storage: {
    local: {
      get: (_keys: unknown, callback: (items: StorageMap) => void) => {
        callback({ ...storageData });
      },
    },
  },
};

globalThis.fetch = (() => {
  if (fileConfigPayload === null) {
    return Promise.resolve(new Response("not found", { status: 404 }));
  }
  return Promise.resolve(
    new Response(JSON.stringify(fileConfigPayload), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}) as unknown as typeof fetch;

let moduleCounter = 0;

async function loadGetConfig(options: {
  fileConfig: FileConfig | null;
  stored: StoredConfig;
  storageReadError?: string;
}): Promise<ConfigModule["getConfig"]> {
  fileConfigPayload = options.fileConfig;
  storageData = { ...options.stored };
  storageError = options.storageReadError ?? null;
  moduleCounter += 1;
  const specifier = `../src/background/config.ts?v=${String(moduleCounter)}`;
  const mod = (await import(specifier)) as ConfigModule;
  return mod.getConfig;
}

async function getConfigWithTimeout(getConfig: ConfigModule["getConfig"]): Promise<ExtensionConfig | null> {
  return Promise.race([
    getConfig(),
    new Promise<null>((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, 500);
    }),
  ]);
}

console.log("=== Config Resolve Tests ===\n");

// --- Defaults with nothing stored and no config.local.json (404).
{
  const getConfig = await loadGetConfig({ fileConfig: null, stored: {} });
  const cfg = await getConfig();
  expectMatch("empty storage + no file -> default diffMaxLines", cfg.diffMaxLines, 3000);
  expectMatch("empty storage + no file -> default diffMaxBytes", cfg.diffMaxBytes, 100000);
  expectMatch("empty storage + no file -> diffEnabled default true", cfg.diffEnabled, true);
  expectMatch("empty storage + no file -> thinkingEffort default", cfg.thinkingEffort, "default");
  expectMatch("empty storage + no file -> empty apiEndpoint", cfg.apiEndpoint, "");
}

// --- Stored values win over the hardcoded defaults.
{
  const getConfig = await loadGetConfig({
    fileConfig: null,
    stored: {
      apiEndpoint: "https://stored.invalid/v1",
      apiKey: "stored-key",
      model: "stored-model",
      githubToken: "stored-token",
      thinkingEffort: "high",
      diffEnabled: true,
      diffMaxLines: 700,
      diffMaxBytes: 42000,
    },
  });
  const cfg = await getConfig();
  expectMatch("stored apiEndpoint wins", cfg.apiEndpoint, "https://stored.invalid/v1");
  expectMatch("stored model wins", cfg.model, "stored-model");
  expectMatch("stored diffMaxLines wins", cfg.diffMaxLines, 700);
  expectMatch("stored diffMaxBytes wins", cfg.diffMaxBytes, 42000);
  expectMatch("stored thinkingEffort wins", cfg.thinkingEffort, "high");
}

// --- File config beats stored for diffMaxLines/diffMaxBytes.
{
  const getConfig = await loadGetConfig({
    fileConfig: { diffMaxLines: 100, diffMaxBytes: 15000 },
    stored: { diffMaxLines: 700, diffMaxBytes: 42000 },
  });
  const cfg = await getConfig();
  expectMatch("file diffMaxLines beats stored", cfg.diffMaxLines, 100);
  expectMatch("file diffMaxBytes beats stored", cfg.diffMaxBytes, 15000);
}

// --- NaN-producing stored values ('' and '   ') fall back to defaults,
// --- never to NaN (a NaN limit would silently disable diff truncation).
{
  const getConfig = await loadGetConfig({
    fileConfig: null,
    stored: { diffMaxLines: "", diffMaxBytes: "   " },
  });
  const cfg = await getConfig();
  expectMatch("'' stored diffMaxLines falls back to 3000", cfg.diffMaxLines, 3000);
  expectMatch("'   ' stored diffMaxBytes falls back to 100000", cfg.diffMaxBytes, 100000);
  expectMatch("diffMaxLines is not NaN", Number.isNaN(cfg.diffMaxLines), false);
  expectMatch("diffMaxBytes is not NaN", Number.isNaN(cfg.diffMaxBytes), false);
}

// --- Numeric strings from older saves parse to numbers.
{
  const getConfig = await loadGetConfig({
    fileConfig: null,
    stored: { diffMaxLines: "500", diffMaxBytes: "250000" },
  });
  const cfg = await getConfig();
  expectMatch("string '500' parses to 500", cfg.diffMaxLines, 500);
  expectMatch("string '250000' parses to 250000", cfg.diffMaxBytes, 250000);
}

// --- Storage read failure resolves with defaults instead of hanging.
{
  const getConfig = await loadGetConfig({
    fileConfig: null,
    stored: { diffMaxLines: 999, apiEndpoint: "https://ignored.invalid" },
    storageReadError: "storage unavailable",
  });
  const cfg = await getConfigWithTimeout(getConfig);
  expectMatch("storage failure resolves instead of hanging", cfg !== null, true);
  if (cfg !== null) {
    expectMatch("storage failure -> default diffMaxLines", cfg.diffMaxLines, 3000);
    expectMatch("storage failure -> default diffMaxBytes", cfg.diffMaxBytes, 100000);
    expectMatch("storage failure -> stored values ignored", cfg.apiEndpoint, "");
  }
}

// --- resolveDiffEnabled: file beats stored booleans.
{
  const getConfig = await loadGetConfig({
    fileConfig: { diffEnabled: false },
    stored: { diffEnabled: true },
  });
  const cfg = await getConfig();
  expectMatch("file diffEnabled=false beats stored true", cfg.diffEnabled, false);
}

// --- resolveDiffEnabled: stored values honored when no file config.
{
  const getConfigTrue = await loadGetConfig({ fileConfig: null, stored: { diffEnabled: true } });
  expectMatch("stored diffEnabled true honored", (await getConfigTrue()).diffEnabled, true);
}
{
  const getConfigString = await loadGetConfig({ fileConfig: null, stored: { diffEnabled: "true" } });
  expectMatch("stored diffEnabled 'true' honored", (await getConfigString()).diffEnabled, true);
}
{
  const getConfigFalse = await loadGetConfig({ fileConfig: null, stored: { diffEnabled: false } });
  expectMatch("stored diffEnabled false honored", (await getConfigFalse()).diffEnabled, false);
}

// --- resolveThinkingEffort: invalid values fall back to "default".
{
  const getConfig = await loadGetConfig({ fileConfig: null, stored: { thinkingEffort: "banana" } });
  expectMatch("invalid thinkingEffort -> default", (await getConfig()).thinkingEffort, "default");
}
{
  const getConfig = await loadGetConfig({ fileConfig: { thinkingEffort: "low" }, stored: { thinkingEffort: "high" } });
  expectMatch("file thinkingEffort beats stored", (await getConfig()).thinkingEffort, "low");
}

// --- Popup/background agreement: the popup resolves display values through
// --- the SAME shared resolver, so file diff settings must surface even when
// --- nothing is stored (regression: the popup prefilled defaults via
// --- applyDefaults, shadowing config.local.json entirely).
{
  const display = resolveConfig({}, { diffEnabled: false, diffMaxLines: 100, diffMaxBytes: 200 });
  expectMatch("file diffEnabled=false displays with empty storage", display.diffEnabled, false);
  expectMatch("file diffMaxLines displays with empty storage", display.diffMaxLines, 100);
  expectMatch("file diffMaxBytes displays with empty storage", display.diffMaxBytes, 200);
}
{
  const display = resolveConfig({ diffEnabled: true, diffMaxLines: 700 }, { diffEnabled: false, diffMaxLines: 100 });
  expectMatch("file diffEnabled=false displays over stored true", display.diffEnabled, false);
  expectMatch("file diffMaxLines displays over stored", display.diffMaxLines, 100);
}

// --- Numeric limits are clamped to [min, max] in background config
// --- resolution: negative/zero limits used to silently empty every diff.
{
  const getConfig = await loadGetConfig({
    fileConfig: null,
    stored: { diffMaxLines: -5, diffMaxBytes: -1 },
  });
  const cfg = await getConfig();
  expectMatch("negative diffMaxLines clamps to min 100", cfg.diffMaxLines, 100);
  expectMatch("negative diffMaxBytes clamps to min 10000", cfg.diffMaxBytes, 10000);
}
{
  const getConfig = await loadGetConfig({
    fileConfig: null,
    stored: { diffMaxLines: 0, diffMaxBytes: 0 },
  });
  const cfg = await getConfig();
  expectMatch("zero diffMaxLines clamps to min", cfg.diffMaxLines, 100);
  expectMatch("zero diffMaxBytes clamps to min", cfg.diffMaxBytes, 10000);
}
{
  const getConfig = await loadGetConfig({
    fileConfig: null,
    stored: { diffMaxLines: 999999, diffMaxBytes: 99999999 },
  });
  const cfg = await getConfig();
  expectMatch("huge diffMaxLines clamps to max 10000", cfg.diffMaxLines, 10000);
  expectMatch("huge diffMaxBytes clamps to max 500000", cfg.diffMaxBytes, 500000);
}
{
  const getConfig = await loadGetConfig({
    fileConfig: { diffMaxLines: -50, diffMaxBytes: 9e9 },
    stored: {},
  });
  const cfg = await getConfig();
  expectMatch("file negative diffMaxLines clamps", cfg.diffMaxLines, 100);
  expectMatch("file huge diffMaxBytes clamps", cfg.diffMaxBytes, 500000);
}
{
  const getConfig = await loadGetConfig({
    fileConfig: null,
    stored: { diffMaxLines: 1234.9, diffMaxBytes: 42000.7 },
  });
  const cfg = await getConfig();
  expectMatch("fractional diffMaxLines truncates", cfg.diffMaxLines, 1234);
  expectMatch("fractional diffMaxBytes truncates", cfg.diffMaxBytes, 42000);
}

// --- validateConfig: plain-HTTP endpoints to non-localhost hosts log a warning
// --- (the Bearer key would travel in cleartext) but do not block.
{
  moduleCounter += 1;
  const mod = (await import(`../src/background/config.ts?v=${String(moduleCounter)}`)) as ConfigModule;
  const base: ExtensionConfig = {
    apiEndpoint: "https://api.example.com/v1",
    apiKey: "sk-test-key",
    model: "probe-model",
    githubToken: "",
    thinkingEffort: "default",
    diffEnabled: true,
    diffMaxLines: 3000,
    diffMaxBytes: 100_000,
  };
  const captureWarn = (endpoint: string): { result: string | null; warned: boolean } => {
    const original = console.log;
    const lines: string[] = [];
    console.log = (...args: unknown[]) => lines.push(args.map(String).join(" "));
    try {
      const result = mod.validateConfig({ ...base, apiEndpoint: endpoint });
      return { result, warned: lines.some((line) => line.includes("WARNING") && line.includes("plain HTTP")) };
    } finally {
      console.log = original;
    }
  };
  const remote = captureWarn("http://api.example.com/v1");
  expectMatch("http non-localhost does not block", remote.result, null);
  expectMatch("http non-localhost logs cleartext warning", remote.warned, true);
  expectMatch("https non-localhost logs no warning", captureWarn("https://api.example.com/v1").warned, false);
  expectMatch("http localhost logs no warning", captureWarn("http://localhost:20128/v1").warned, false);
  expectMatch("http 127.x logs no warning", captureWarn("http://127.0.0.1:8080/v1").warned, false);
  expectMatch("http [::1] logs no warning", captureWarn("http://[::1]:8080/v1").warned, false);
}

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All config-resolve tests passed");
