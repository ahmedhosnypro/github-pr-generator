import {
  type ExtensionConfig,
  type FileConfig,
  type StoredConfig,
  THINKING_EFFORTS,
  type ThinkingEffort,
} from "../types";
import { errorMessage, logMsg } from "./log";

export const CONFIG_STORAGE_KEYS: (keyof StoredConfig)[] = [
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

function resolveDiffEnabled(stored: StoredConfig): boolean {
  if (FILE_CONFIG && FILE_CONFIG.diffEnabled !== undefined) return FILE_CONFIG.diffEnabled;
  if (stored.diffEnabled !== undefined) return stored.diffEnabled === true || stored.diffEnabled === "true";
  return true;
}

function resolveThinkingEffort(stored: StoredConfig): ThinkingEffort {
  const raw = FILE_CONFIG?.thinkingEffort ?? stored.thinkingEffort;
  return THINKING_EFFORTS.find((effort) => effort === raw) ?? "default";
}

function resolveNumberLimit(
  fileValue: number | undefined,
  storedValue: number | string | undefined,
  fallback: number,
): number {
  if (fileValue !== undefined) return fileValue;
  if (storedValue !== undefined) return Number.parseInt(String(storedValue), 10);
  return fallback;
}

function mergeConfig(stored: StoredConfig): ExtensionConfig {
  const config: ExtensionConfig = {
    apiEndpoint: stored.apiEndpoint || FILE_CONFIG?.apiEndpoint || "",
    apiKey: stored.apiKey || FILE_CONFIG?.apiKey || "",
    model: stored.model || FILE_CONFIG?.model || "",
    githubToken: stored.githubToken || FILE_CONFIG?.githubToken || "",
    thinkingEffort: resolveThinkingEffort(stored),
    diffEnabled: resolveDiffEnabled(stored),
    diffMaxLines: resolveNumberLimit(FILE_CONFIG ? FILE_CONFIG.diffMaxLines : undefined, stored.diffMaxLines, 3000),
    diffMaxBytes: resolveNumberLimit(FILE_CONFIG ? FILE_CONFIG.diffMaxBytes : undefined, stored.diffMaxBytes, 100000),
  };
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
        resolve(mergeConfig(stored));
      });
      return undefined;
    });
  });
}

export function validateConfig(config: ExtensionConfig): string | null {
  if (!config.apiEndpoint) return "API endpoint is not configured. Set it in config.local.json or extension popup.";
  if (!config.apiKey) return "API key is not configured. Set it in config.local.json or extension popup.";
  if (!config.model) return "Model is not configured. Set it in config.local.json or extension popup.";

  if (!URL.canParse(config.apiEndpoint)) {
    return "API endpoint is not a valid URL: " + config.apiEndpoint;
  }

  if (config.apiKey.length < 5) return "API key appears too short to be valid.";

  return null;
}
