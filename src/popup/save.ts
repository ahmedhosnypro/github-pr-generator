import type { SaveConfigData, SaveConfigResponse } from "../types";
import {
  apiKeyInput,
  diffEnabledInput,
  diffMaxBytesInput,
  diffMaxLinesInput,
  endpointInput,
  githubTokenInput,
  modelInput,
} from "./elements";
import { sendToBackground, storageSetFallback } from "./messaging";
import { isLoaded } from "./state";
import { getSelectedThinkingEffort, showToast, updateLastSaved } from "./ui";

export function persistField(key: keyof SaveConfigData, value: string | boolean): void {
  if (!isLoaded()) return;
  // Latent-bug fix: the original trimmed everything (`(value || "").trim()`), which
  // throws on booleans — toggling the diffEnabled checkbox crashed instead of saving.
  // Strings still get trimmed; booleans now persist as-is.
  const normalized = typeof value === "string" ? value.trim() : value;
  const partial = { [key]: normalized } as unknown as SaveConfigData;
  void sendToBackground<SaveConfigResponse>("saveConfig", partial).catch(() => {
    // SW unreachable even after retry — storageSetFallback below still persists.
  });
  storageSetFallback(partial);
  updateLastSaved();
}

export function saveSettings(): void {
  console.log(
    "[POPUP LOG] saveSettings called - model=" + modelInput.value.trim() + ", endpoint=" + endpointInput.value.trim(),
  );
  const data: SaveConfigData = {
    apiEndpoint: endpointInput.value.trim(),
    apiKey: apiKeyInput.value.trim(),
    model: modelInput.value.trim(),
    githubToken: githubTokenInput.value.trim(),
    thinkingEffort: getSelectedThinkingEffort(),
    diffEnabled: diffEnabledInput.checked,
    diffMaxLines: Number.parseInt(diffMaxLinesInput.value, 10) || 3000,
    diffMaxBytes: Number.parseInt(diffMaxBytesInput.value, 10) || 100000,
  };
  void sendToBackground<SaveConfigResponse>("saveConfig", data).then((resp) => {
    console.log("[PR Generator popup] saveSettings via SW:", { ok: resp.ok });
    if (!resp.ok) {
      storageSetFallback(data);
      // The fallback write is silent; tell the user the primary save failed
      // and that settings were only stored locally for this browser.
      showToast("Background save failed — stored locally", "error");
    } else {
      showToast("Settings saved!");
    }
    updateLastSaved();
    return resp;
  });
}
