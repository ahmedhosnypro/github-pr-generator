// Unit tests for getConfig (background/config.ts): the stored <-> file
// priority merge and the resolveNumberLimit NaN guard. chrome does not
// exist under Bun, and config.ts runs loadFileConfig() (a fetch to
// chrome.runtime.getURL("config.local.json")) at module-evaluation time,
// so both globals must be stubbed BEFORE the import, and each scenario
// gets a fresh module instance via a query-param cache-bust (FILE_CONFIG
// is module-level state).
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
    fileConfig: { diffMaxLines: 100, diffMaxBytes: 200 },
    stored: { diffMaxLines: 700, diffMaxBytes: 42000 },
  });
  const cfg = await getConfig();
  expectMatch("file diffMaxLines beats stored", cfg.diffMaxLines, 100);
  expectMatch("file diffMaxBytes beats stored", cfg.diffMaxBytes, 200);
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

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All config-resolve tests passed");
