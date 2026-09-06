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

// Keep these bounds in sync with the defensive clamp in src/background/config.ts
// (and the min/max attributes on the number inputs in popup/popup.html).
const DIFF_LIMITS = {
  diffMaxLines: { min: 100, max: 10_000, fallback: 3000 },
  diffMaxBytes: { min: 10_000, max: 500_000, fallback: 100_000 },
} as const;

export type DiffLimitKey = keyof typeof DIFF_LIMITS;

function isDiffLimitKey(key: keyof SaveConfigData): key is DiffLimitKey {
  return key in DIFF_LIMITS;
}

/** Parses raw input to an int clamped to [min, max]; null when unparseable (cleared field). */
function coerceDiffLimit(key: DiffLimitKey, raw: string | number): number | null {
  const n = typeof raw === "number" ? raw : Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  const { min, max } = DIFF_LIMITS[key];
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/** Numeric field value for full saves/display: unparseable input resolves to the default. */
export function diffLimitOrDefault(key: DiffLimitKey, raw: string | number): number {
  return coerceDiffLimit(key, raw) ?? DIFF_LIMITS[key].fallback;
}

/** One in-flight write per field; bursts (typing, or a checkbox's paired input+change) collapse to the latest value. */
const persistTimers = new Map<keyof SaveConfigData, ReturnType<typeof setTimeout>>();
const AUTOSAVE_DEBOUNCE_MS = 400;

function writeField(key: keyof SaveConfigData, value: string | boolean | number): void {
  const partial = { [key]: value } as unknown as SaveConfigData;
  void sendToBackground<SaveConfigResponse>("saveConfig", partial).then((resp) => {
    // The service-worker write settles the save; direct storage is a fallback
    // only, so a healthy SW produces exactly one write per change (the old code
    // also wrote directly on every keystroke, doubling each save).
    if (!resp.ok) storageSetFallback(partial);
    updateLastSaved();
    return resp;
  });
}

export function persistField(key: keyof SaveConfigData, value: string | boolean): void {
  if (!isLoaded()) return;
  // Latent-bug fix retained: strings get trimmed, booleans persist as-is.
  // Diff limits coerce to a clamped number on this single path, so storage
  // always holds the same type regardless of which input produced the value.
  let normalized: string | boolean | number;
  if (isDiffLimitKey(key)) {
    const parsed = coerceDiffLimit(key, String(value));
    // Cleared/incomplete input must not persist NaN or "" as a number — skip it.
    if (parsed === null) return;
    normalized = parsed;
  } else {
    normalized = typeof value === "string" ? value.trim() : value;
  }
  const pending = persistTimers.get(key);
  if (pending !== undefined) clearTimeout(pending);
  persistTimers.set(
    key,
    setTimeout(() => {
      persistTimers.delete(key);
      writeField(key, normalized);
    }, AUTOSAVE_DEBOUNCE_MS),
  );
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
    diffMaxLines: diffLimitOrDefault("diffMaxLines", diffMaxLinesInput.value),
    diffMaxBytes: diffLimitOrDefault("diffMaxBytes", diffMaxBytesInput.value),
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
