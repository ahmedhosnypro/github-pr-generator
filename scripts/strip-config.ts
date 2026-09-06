// Pure config sanitization shared by scripts/build.ts and tests/build-secrets.ts.
// Strips credentials from config.local.json before it is copied into dist/, so the
// built extension can never carry a real API key or PAT into a zip, share, or
// accidental release; secrets must be set via the popup (chrome.storage).

// Explicit denylist of known secret fields.
export const SECRET_CONFIG_FIELDS = ["apiKey", "githubToken"] as const;

// Fail-safe net for future secret fields (e.g. "anthropicKey", "apiKey2"):
// any key whose name looks credential-like is stripped even if it was never
// added to SECRET_CONFIG_FIELDS.
const SECRET_KEY_PATTERN = /key|token|secret|password|credential/i;

export interface SanitizeResult {
  sanitized: Record<string, unknown>;
  stripped: string[];
}

function isSecretKey(key: string): boolean {
  return (SECRET_CONFIG_FIELDS as readonly string[]).includes(key) || SECRET_KEY_PATTERN.test(key);
}

// Accepts unknown parsed JSON; anything that is not a plain object sanitizes to
// an empty config (fail-closed, never leaks).
export function sanitizeConfig(parsed: unknown): SanitizeResult {
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { sanitized: {}, stripped: [] };
  }
  const sanitized: Record<string, unknown> = {};
  const stripped: string[] = [];
  for (const [key, value] of Object.entries(parsed)) {
    if (isSecretKey(key)) {
      if (typeof value === "string" && value) stripped.push(key);
    } else {
      sanitized[key] = value;
    }
  }
  return { sanitized, stripped };
}
