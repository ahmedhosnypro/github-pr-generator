import type { SaveConfigData, SaveConfigResponse, StoredConfig } from "../types";
import { errorMessage, logMsg } from "./log";

// Only overwrite keys actually present in `data` so that partial updates
// (e.g. the popup's per-field autosave) don't clobber the other saved fields
// with empty strings, which would silently make getConfig() fall back to the
// bundled config.local.json values. Exported for unit tests (config-save.test coverage).
export function buildStorageUpdate(data: SaveConfigData): StoredConfig {
  const update: StoredConfig = {};
  if (data.apiEndpoint !== undefined) update.apiEndpoint = (data.apiEndpoint || "").trim();
  if (data.apiKey !== undefined) update.apiKey = (data.apiKey || "").trim();
  if (data.model !== undefined) update.model = (data.model || "").trim();
  if (data.githubToken !== undefined) update.githubToken = (data.githubToken || "").trim();
  if (data.thinkingEffort !== undefined) update.thinkingEffort = (data.thinkingEffort || "").trim();
  if (data.diffEnabled !== undefined) update.diffEnabled = data.diffEnabled;
  // Cleared numeric fields arrive as "" and parse to NaN — drop them instead
  // of writing NaN to storage (the read side still falls back to its default).
  if (data.diffMaxLines !== undefined) {
    const n = Number.parseInt(String(data.diffMaxLines), 10);
    if (!Number.isNaN(n)) update.diffMaxLines = n;
  }
  if (data.diffMaxBytes !== undefined) {
    const n = Number.parseInt(String(data.diffMaxBytes), 10);
    if (!Number.isNaN(n)) update.diffMaxBytes = n;
  }
  return update;
}

// Persist config from the popup in the service worker context, which outlives
// the popup. This prevents writes from being dropped if the popup closes
// before an in-popup chrome.storage.local.set completes.
export function handleSaveConfig(data: SaveConfigData, sendResponse: (response: SaveConfigResponse) => void): boolean {
  try {
    const update = buildStorageUpdate(data);
    chrome.storage.local.set(update, () => {
      const err = chrome.runtime.lastError;
      if (err) {
        logMsg("saveConfig storage error: " + String(err.message));
        sendResponse({ ok: false, error: err.message });
      } else {
        logMsg(
          "saveConfig stored: keys=" +
            Object.keys(update).join(",") +
            ", apiEndpoint=" +
            String(update.apiEndpoint) +
            ", model=" +
            String(update.model) +
            ", hasKey=" +
            String(!!update.apiKey) +
            ", hasGithubToken=" +
            String(!!update.githubToken),
        );
        sendResponse({ ok: true });
      }
    });
    return true;
  } catch (e) {
    logMsg("saveConfig exception: " + errorMessage(e));
    sendResponse({ ok: false, error: errorMessage(e) });
    return false;
  }
}
