// Shared config precedence for popup display and background runtime. Both
// sides resolve through resolveConfig so the popup always shows what the
// extension will actually run with:
//  - stored values win for connection settings (endpoint/key/model/token)
//  - config.local.json wins for thinkingEffort and the diff settings
import {
  type ExtensionConfig,
  type FileConfig,
  type StoredConfig,
  THINKING_EFFORTS,
  type ThinkingEffort,
} from "./types";

function resolveDiffEnabled(stored: StoredConfig, fileConfig: FileConfig | null): boolean {
  if (fileConfig?.diffEnabled !== undefined) return fileConfig.diffEnabled;
  // Legacy saves may hold "true"/"false" STRINGS; Boolean("false") is true.
  if (stored.diffEnabled !== undefined) return stored.diffEnabled === true || stored.diffEnabled === "true";
  return true;
}

function resolveThinkingEffort(stored: StoredConfig, fileConfig: FileConfig | null): ThinkingEffort {
  const raw = fileConfig?.thinkingEffort ?? stored.thinkingEffort;
  return THINKING_EFFORTS.find((effort) => effort === raw) ?? "default";
}

function resolveNumberLimit(
  fileValue: number | undefined,
  storedValue: number | string | undefined,
  fallback: number,
): number {
  if (fileValue !== undefined) return fileValue;
  if (storedValue !== undefined) {
    // Clearing the popup field stores "", which parses to NaN; a NaN limit would
    // silently disable diff truncation (every comparison against NaN is false).
    const parsed = Number.parseInt(String(storedValue), 10);
    if (Number.isNaN(parsed)) return fallback;
    return parsed;
  }
  return fallback;
}

export function resolveConfig(stored: StoredConfig, fileConfig: FileConfig | null): ExtensionConfig {
  return {
    apiEndpoint: stored.apiEndpoint || fileConfig?.apiEndpoint || "",
    apiKey: stored.apiKey || fileConfig?.apiKey || "",
    model: stored.model || fileConfig?.model || "",
    githubToken: stored.githubToken || fileConfig?.githubToken || "",
    thinkingEffort: resolveThinkingEffort(stored, fileConfig),
    diffEnabled: resolveDiffEnabled(stored, fileConfig),
    diffMaxLines: resolveNumberLimit(fileConfig?.diffMaxLines, stored.diffMaxLines, 3000),
    diffMaxBytes: resolveNumberLimit(fileConfig?.diffMaxBytes, stored.diffMaxBytes, 100000),
  };
}
