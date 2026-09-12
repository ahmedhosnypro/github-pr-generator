import { resolveConfig } from "../config-resolve";
import { isLoopbackHostname } from "../loopback";
import type { ExtensionConfig, FileConfig, StoredConfig } from "../types";
import { clampDiffLimit } from "./config-save";
import { errorMessage, logMsg } from "./log";

const CONFIG_STORAGE_KEYS: (keyof StoredConfig)[] = [
  "apiEndpoint",
  "apiKey",
  "model",
  "githubToken",
  "thinkingEffort",
  "diffEnabled",
  "diffMaxLines",
  "diffMaxBytes",
];

let FILE_CONFIG: FileConfig | null = null;

async function loadFileConfig(): Promise<void> {
  try {
    const url = chrome.runtime.getURL("config.local.json");
    const response = await fetch(url);
    if (response.ok) {
      FILE_CONFIG = (await response.json()) as FileConfig;
      logMsg(
        "Loaded config.local.json: apiEndpoint=" +
          String(FILE_CONFIG.apiEndpoint) +
          ", model=" +
          String(FILE_CONFIG.model) +
          ", hasGithubToken=" +
          String(!!FILE_CONFIG.githubToken),
      );
    } else {
      logMsg("config.local.json not found, using chrome.storage defaults");
    }
  } catch (e) {
    logMsg("Failed to load config.local.json: " + errorMessage(e));
  }
}

const configLoadPromise = loadFileConfig();

function mergeConfig(stored: StoredConfig): ExtensionConfig {
  const config: ExtensionConfig = resolveConfig(stored, FILE_CONFIG);
  config.diffMaxLines = clampDiffLimit("diffMaxLines", config.diffMaxLines);
  config.diffMaxBytes = clampDiffLimit("diffMaxBytes", config.diffMaxBytes);
  logMsg(
    "[BG LOG] getConfig called - stored.apiEndpoint=" +
      (stored.apiEndpoint || "") +
      ", stored.model=" +
      (stored.model || "") +
      ", file.apiEndpoint=" +
      (FILE_CONFIG ? String(FILE_CONFIG.apiEndpoint) : "NONE") +
      ", file.model=" +
      (FILE_CONFIG ? String(FILE_CONFIG.model) : "NONE"),
  );
  logMsg(
    "Config resolved: apiEndpoint=" +
      config.apiEndpoint +
      ", model=" +
      config.model +
      ", thinkingEffort=" +
      config.thinkingEffort +
      ", hasKey=" +
      String(!!config.apiKey) +
      ", hasGithubToken=" +
      String(!!config.githubToken) +
      ", diffEnabled=" +
      String(config.diffEnabled) +
      ", diffMaxLines=" +
      String(config.diffMaxLines) +
      ", diffMaxBytes=" +
      String(config.diffMaxBytes),
  );
  return config;
}

export function getConfig(): Promise<ExtensionConfig> {
  return new Promise((resolve) => {
    void configLoadPromise.then(() => {
      chrome.storage.local.get(CONFIG_STORAGE_KEYS, (stored: StoredConfig) => {
        const err = chrome.runtime.lastError;
        if (err) {
          // Storage read failed — never leave callers waiting indefinitely;
          // emit defaults and log it.
          logMsg("getConfig storage read failed: " + String(err.message));
          resolve(mergeConfig({}));
          return;
        }
        resolve(mergeConfig(stored));
      });
      return undefined;
    });
  });
}

export function validateConfig(config: ExtensionConfig): string | null {
  if (!config.apiEndpoint) return "API endpoint is not configured. Set it in config.local.json or extension popup.";
  if (!config.apiKey) return "API key is not configured. Set it in the extension popup.";
  if (!config.model) return "Model is not configured. Set it in config.local.json or extension popup.";

  if (!URL.canParse(config.apiEndpoint)) {
    return "API endpoint is not a valid URL: " + config.apiEndpoint;
  }

  // Cleartext HTTP is fine for loopback dev servers, but anywhere else the
  // Bearer token travels unencrypted — warn (the popup shows the same warning
  // in its UI); not a blocking error since the user may accept the risk.
  const endpointUrl = new URL(config.apiEndpoint);
  if (endpointUrl.protocol === "http:" && !isLoopbackHostname(endpointUrl.hostname)) {
    logMsg(
      "WARNING: API endpoint uses plain HTTP to a non-localhost host (" +
        endpointUrl.hostname +
        "); the API key will be sent in cleartext.",
    );
  }

  if (config.apiKey.length < 5) return "API key appears too short to be valid.";

  return null;
}
