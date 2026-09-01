import type { FileConfig, GetStoredConfigResponse, StoredConfig } from "../types";
import {
  apiKeyInput,
  diffEnabledInput,
  diffMaxBytesInput,
  diffMaxLinesInput,
  endpointInput,
  githubTokenInput,
  modelInput,
} from "./elements";
import { type BackgroundError, sendToBackground } from "./messaging";
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

/** Popup-side merge of the service-worker copy, direct storage, and config.local.json. */
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

/** Drops the error-fallback shape from sendToBackground so only real stored values merge. */
function asStored(raw: GetStoredConfigResponse | BackgroundError | null): StoredConfig {
  return raw && !("ok" in raw) ? raw : {};
}

function pickDiffEnabled(sw: StoredConfig, direct: StoredConfig): boolean | string {
  let result: boolean | string = true;
  if (direct.diffEnabled !== undefined) result = direct.diffEnabled;
  if (sw.diffEnabled !== undefined) result = sw.diffEnabled;
  return result;
}

function mergeStored(sw: StoredConfig, direct: StoredConfig): ResolvedSettings {
  return {
    apiEndpoint: sw.apiEndpoint || direct.apiEndpoint || "",
    apiKey: sw.apiKey || direct.apiKey || "",
    model: sw.model || direct.model || "",
    githubToken: sw.githubToken || direct.githubToken || "",
    thinkingEffort: sw.thinkingEffort || direct.thinkingEffort || "default",
    diffEnabled: pickDiffEnabled(sw, direct),
    diffMaxLines: sw.diffMaxLines || direct.diffMaxLines || 3000,
    diffMaxBytes: sw.diffMaxBytes || direct.diffMaxBytes || 100000,
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
  // Boolean() mirrors the original implicit coercion (older saves may hold "true"/"false" strings)
  diffEnabledInput.checked = Boolean(resolveDiffEnabled(stored, fileConfig));
  diffMaxLinesInput.value = String(stored.diffMaxLines || fileConfig?.diffMaxLines || 3000);
  diffMaxBytesInput.value = String(stored.diffMaxBytes || fileConfig?.diffMaxBytes || 100000);
  apiKeyInput.placeholder = fileConfig?.apiKey
    ? "(loaded from config.local.json — edit to override)"
    : "(set in config.local.json)";
  githubTokenInput.placeholder = fileConfig?.githubToken
    ? "(loaded from config.local.json — edit to override)"
    : "(optional)";
  updateDiffConditionalVisibility();
  markLoaded();
}

export function loadSettings(): void {
  const storedPromise = sendToBackground<GetStoredConfigResponse>("getStoredConfig", null).catch(() => null);
  void Promise.all([storedPromise, readDirectStorage(), readFileConfig()]).then(([swRaw, direct, fileConfig]) => {
    const sw = asStored(swRaw);
    const stored = mergeStored(sw, direct);
    console.log(
      "[PR Generator popup] load: sw=" +
        JSON.stringify(sw) +
        " direct=" +
        JSON.stringify(direct) +
        " file=" +
        (fileConfig ? "(present)" : "(none)"),
    );
    applyValues(stored, fileConfig);
    validateEndpointDebounced();
    return stored;
  });
}
