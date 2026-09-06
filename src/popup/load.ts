import { resolveConfig } from "../config-resolve";
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
import { diffLimitOrDefault } from "./save";
import { markLoaded } from "./state";
import { selectThinkingEffort, updateDiffConditionalVisibility } from "./ui";
import { autoValidateEndpoint } from "./validate";

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

function readFileConfig(): Promise<FileConfig | null> {
  return fetch(chrome.runtime.getURL("config.local.json"), { signal: AbortSignal.timeout(10_000) })
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

function applyValues(stored: StoredConfig, fileConfig: FileConfig | null): void {
  // Same resolver the background runs with — the popup always displays the
  // effective configuration, including file-wins diff/thinkingEffort values.
  const config = resolveConfig(stored, fileConfig);
  endpointInput.value = config.apiEndpoint;
  apiKeyInput.value = config.apiKey;
  modelInput.value = config.model;
  githubTokenInput.value = config.githubToken;
  selectThinkingEffort(config.thinkingEffort);
  diffEnabledInput.checked = config.diffEnabled;
  // Display the same clamped values the background will run with.
  diffMaxLinesInput.value = String(diffLimitOrDefault("diffMaxLines", config.diffMaxLines));
  diffMaxBytesInput.value = String(diffLimitOrDefault("diffMaxBytes", config.diffMaxBytes));
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
    // Log presence flags only — never serialize stored config (contains apiKey/githubToken).
    console.log(
      "[PR Generator popup] load: direct keys=" +
        String(Object.keys(direct).length) +
        " file=" +
        (fileConfig ? "present" : "none"),
    );
    applyValues(direct, fileConfig);
    // Probe reachability without the API key; autoValidateEndpoint bails out
    // when the URL is invalid or host permission is absent, and the probe
    // itself never carries the key — only the explicit Test buttons do.
    autoValidateEndpoint();
    return undefined;
  });
}
