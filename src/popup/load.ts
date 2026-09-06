import type { FileConfig, StoredConfig } from "../types";
import {
  apiKeyInput,
  diffEnabledInput,
  diffMaxBytesInput,
  diffMaxLinesInput,
  endpointInput,
  githubTokenInput,
  modelInput,
} from "./elements";
import { markLoaded } from "./state";
import { selectThinkingEffort, toThinkingEffort, updateDiffConditionalVisibility } from "./ui";
import { validateEndpointDebounced } from "./validate";

const STORAGE_KEYS = [
  "apiEndpoint",
  "apiKey",
  "model",
  "githubToken",
  "thinkingEffort",
  "diffEnabled",
  "diffMaxLines",
  "diffMaxBytes",
];

/** Popup-side merge of direct storage and config.local.json. */
interface ResolvedSettings {
  apiEndpoint?: string;
  apiKey?: string;
  model?: string;
  githubToken?: string;
  thinkingEffort?: string;
  diffEnabled?: boolean | string;
  diffMaxLines?: string | number;
  diffMaxBytes?: string | number;
}

function readFileConfig(): Promise<FileConfig | null> {
  return fetch(chrome.runtime.getURL("config.local.json"))
    .then((r) => (r.ok ? (r.json() as Promise<FileConfig>) : null))
    .catch(() => null);
}

function readDirectStorage(): Promise<StoredConfig> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(STORAGE_KEYS, (raw: Record<string, unknown>) => {
        resolve(raw);
      });
    } catch {
      resolve({});
    }
  });
}

function applyDefaults(stored: StoredConfig): ResolvedSettings {
  return {
    apiEndpoint: stored.apiEndpoint || "",
    apiKey: stored.apiKey || "",
    model: stored.model || "",
    githubToken: stored.githubToken || "",
    thinkingEffort: stored.thinkingEffort || "default",
    diffEnabled: stored.diffEnabled !== undefined ? stored.diffEnabled : true,
    diffMaxLines: stored.diffMaxLines || 3000,
    diffMaxBytes: stored.diffMaxBytes || 100000,
  };
}

function resolveDiffEnabled(stored: ResolvedSettings, fileConfig: FileConfig | null): boolean | string {
  let result: boolean | string = true;
  if (fileConfig?.diffEnabled !== undefined) result = fileConfig.diffEnabled;
  if (stored.diffEnabled !== undefined) result = stored.diffEnabled;
  return result;
}

function applyValues(stored: ResolvedSettings, fileConfig: FileConfig | null): void {
  endpointInput.value = stored.apiEndpoint || fileConfig?.apiEndpoint || "";
  apiKeyInput.value = stored.apiKey || fileConfig?.apiKey || "";
  modelInput.value = stored.model || fileConfig?.model || "";
  githubTokenInput.value = stored.githubToken || fileConfig?.githubToken || "";
  selectThinkingEffort(toThinkingEffort(stored.thinkingEffort || fileConfig?.thinkingEffort || "default"));
  const diffEnabled = resolveDiffEnabled(stored, fileConfig);
  // Legacy saves may hold "true"/"false" STRINGS; Boolean("false") is true.
  diffEnabledInput.checked = diffEnabled !== false && diffEnabled !== "false";
  diffMaxLinesInput.value = String(stored.diffMaxLines || fileConfig?.diffMaxLines || 3000);
  diffMaxBytesInput.value = String(stored.diffMaxBytes || fileConfig?.diffMaxBytes || 100000);
  apiKeyInput.placeholder = fileConfig?.apiKey
    ? "(loaded from config.local.json — edit to override)"
    : "(required — saved in extension storage)";
  githubTokenInput.placeholder = fileConfig?.githubToken
    ? "(loaded from config.local.json — edit to override)"
    : "(optional)";
  updateDiffConditionalVisibility();
  markLoaded();
}

export function loadSettings(): void {
  void Promise.all([readDirectStorage(), readFileConfig()]).then(([direct, fileConfig]) => {
    const stored = applyDefaults(direct);
    // Log presence flags only — never serialize stored config (contains apiKey/githubToken).
    console.log(
      "[PR Generator popup] load: direct keys=" +
        String(Object.keys(direct).length) +
        " file=" +
        (fileConfig ? "present" : "none"),
    );
    applyValues(stored, fileConfig);
    validateEndpointDebounced();
    return stored;
  });
}
