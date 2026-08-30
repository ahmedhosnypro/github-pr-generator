import type { ExtensionMessage, SaveConfigData } from "../types";

/** Shape produced when chrome.runtime reports an error or returns no answer. */
export interface BackgroundError {
  ok: false;
  error: string;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Runs a chrome API call that may throw synchronously (early popup contexts);
 * async rejections stay unhandled, matching the original behavior.
 */
export function runSafe(action: () => void, logPrefix: string): void {
  try {
    action();
  } catch (e) {
    console.error(logPrefix, e);
  }
}

export function sendToBackground<T>(type: ExtensionMessage["type"], data: unknown): Promise<T | BackgroundError> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type, data }, (resp: unknown) => {
        const err = chrome.runtime.lastError;
        if (err) {
          console.error("[PR Generator popup] sendMessage error:", err.message);
          resolve({ ok: false, error: err.message ?? "unknown error" });
        } else {
          resolve((resp as T | undefined) ?? { ok: false, error: "no response" });
        }
      });
    } catch (e) {
      console.error("[PR Generator popup] sendMessage threw:", e);
      resolve({ ok: false, error: errorMessage(e) });
    }
  });
}

/** Direct storage write used when the service worker is unavailable or fails. */
export function storageSetFallback(data: SaveConfigData): void {
  runSafe(() => {
    void chrome.storage.local.set(data as unknown as { [key: string]: unknown });
  }, "[PR Generator popup] storage set fallback failed:");
}
