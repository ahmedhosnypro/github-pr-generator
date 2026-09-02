/**
 * Host-permission negotiation for user-configured API endpoints.
 *
 * The manifest can only hardcode github.com and the default local model
 * server; any other endpoint (OpenAI, OpenRouter, a team gateway, …) needs a
 * runtime-granted host permission or the service worker's fetch is
 * CORS-blocked. `requestEndpointPermission` must only run from a user gesture
 * (Chrome rejects `permissions.request` otherwise) — hence the click handlers,
 * never the debounced validators.
 */

/** "https://api.example.com/*" pattern for chrome.permissions, or null if invalid. */
function endpointOriginPattern(endpoint: string): string | null {
  const url = URL.parse(endpoint.trim());
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return null;
  return url.origin + "/*";
}

interface PermissionsApi {
  contains(permission: { origins: string[] }): Promise<boolean>;
  request(permission: { origins: string[] }): Promise<boolean>;
}

/** The bundled @types/chrome stub lacks the runtime permissions API — probe defensively. */
function permissionsApi(): PermissionsApi | null {
  if (typeof chrome === "undefined") return null;
  return (chrome as unknown as { permissions?: PermissionsApi }).permissions ?? null;
}

/** True when the extension already has host access to the endpoint's origin. */
export async function hasEndpointPermission(endpoint: string): Promise<boolean> {
  const pattern = endpointOriginPattern(endpoint);
  const permissions = permissionsApi();
  if (pattern === null || !permissions) return true; // nothing to request
  try {
    return await permissions.contains({ origins: [pattern] });
  } catch {
    return false;
  }
}

/**
 * Request host permission for the endpoint's origin. Call only from click
 * handlers. Returns true when access is available afterwards.
 */
export async function requestEndpointPermission(endpoint: string): Promise<boolean> {
  const pattern = endpointOriginPattern(endpoint);
  const permissions = permissionsApi();
  if (pattern === null || !permissions) return true;
  try {
    if (await permissions.contains({ origins: [pattern] })) return true;
    return await permissions.request({ origins: [pattern] });
  } catch {
    return false;
  }
}
