import {
  apiEndpointError,
  connectionStatus,
  connectionStatusText,
  endpointInput,
  insecureEndpointWarning,
} from "./elements";
import { isTimeoutError, parseUrlOrNull } from "./messaging";
import { hasEndpointPermission } from "./permissions";
import { stripTrailingSlashes } from "./text";

const ERROR_CLASS = "md-text-field__input--error";
const VALIDATE_TIMEOUT_MS = 10_000;
/** Monotonic counter: only the newest validation attempt may touch the UI. */
let validationSeq = 0;

// Status text changes must be announced; popup.html has no live regions.
connectionStatus.setAttribute("aria-live", "polite");
apiEndpointError.setAttribute("aria-live", "polite");
insecureEndpointWarning.setAttribute("aria-live", "polite");

const INSECURE_WARNING_TEXT =
  "Warning: this endpoint uses plain HTTP. Your API key will be sent in cleartext over an unencrypted connection.";

function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  // The URL parser normalizes IPv4 (octal/hex/decimal literals included), so a
  // "127." prefix check covers the whole [IP_REDACTED]/8 loopback block.
  if (host.startsWith("127.")) return true;
  // Hostname for IPv6 includes brackets under the WHATWG URL spec.
  return host === "[::1]";
}

/** True when the endpoint would carry the Bearer token over cleartext HTTP to a non-loopback host. */
function isInsecureHttpEndpoint(value: string): boolean {
  const url = parseUrlOrNull(value.trim());
  if (url === null || url.protocol !== "http:") return false;
  return !isLoopbackHostname(url.hostname);
}

// Pure DOM update — no fetch, no permission probe — so callers can invoke it
// unconditionally (input listener, load.ts, pre-validation in validateEndpoint).
export function updateInsecureEndpointWarning(): void {
  const insecure = isInsecureHttpEndpoint(endpointInput.value);
  insecureEndpointWarning.textContent = insecure ? INSECURE_WARNING_TEXT : "";
  insecureEndpointWarning.classList.toggle("visible", insecure);
}

// The input listener tracks live edits; load.ts also calls
// updateInsecureEndpointWarning directly after applying the stored values (no
// input event fires for that), so this interval is only a backstop — it stops
// as soon as the field has content.
endpointInput.addEventListener("input", updateInsecureEndpointWarning);
let openChecks = 0;
const openCheckTimer = setInterval(() => {
  updateInsecureEndpointWarning();
  openChecks += 1;
  if (openChecks >= 20 || endpointInput.value.trim() !== "") clearInterval(openCheckTimer);
}, 100);

function setConnectionStatus(status: string, message: string): void {
  connectionStatus.className = "status-indicator status-indicator--" + status;
  connectionStatusText.textContent = message;
}

function clearEndpointError(status: string, message: string): void {
  setConnectionStatus(status, message);
  endpointInput.classList.remove(ERROR_CLASS);
  apiEndpointError.textContent = "";
  apiEndpointError.classList.remove("visible");
}

function showEndpointError(statusMessage: string, errorText: string): void {
  setConnectionStatus("error", statusMessage);
  endpointInput.classList.add(ERROR_CLASS);
  apiEndpointError.textContent = errorText;
  apiEndpointError.classList.add("visible");
}

/** Clears only the field-level error styling (input listener), not the status indicator. */
export function resetEndpointFieldError(): void {
  endpointInput.classList.remove(ERROR_CLASS);
  apiEndpointError.textContent = "";
  apiEndpointError.classList.remove("visible");
}

function handleValidateResponse(response: Response, insecure: boolean): void {
  if (response.ok) {
    clearEndpointError(
      "connected",
      insecure ? "Connected (warning: insecure HTTP, API key would be sent in cleartext)" : "Connected",
    );
    return;
  }
  // The probe sends no credentials, so 401/403 mean the host answered: the
  // endpoint is reachable and only auth stands between it and a green state.
  if (response.status === 401 || response.status === 403) {
    clearEndpointError(
      "connected",
      "Reachable — key not checked (" + String(response.status) + "). Use Test API to verify the key.",
    );
    return;
  }
  showEndpointError("Error: " + String(response.status), "Server returned " + String(response.status));
}

/** Shown when the extension lacks host permission for the configured endpoint. */
export function showEndpointPermissionError(): void {
  showEndpointError("Permission needed", "Click Validate again and allow access to this host");
}

async function handleValidateError(err: unknown): Promise<void> {
  if (isTimeoutError(err)) {
    showEndpointError("Timed out", "No response within " + String(VALIDATE_TIMEOUT_MS / 1000) + " seconds");
    return;
  }
  // A fetch TypeError here is almost always the MV3 host-permission block on
  // non-declared origins (Chrome says "Failed to fetch", never "CORS"), so
  // probe the permission state instead of guessing from the message.
  const has = await hasEndpointPermission(endpointInput.value);
  if (!has) {
    showEndpointPermissionError();
    return;
  }
  showEndpointError("Connection failed", "Could not connect to endpoint. Original error: " + String(err));
}

export function validateEndpoint(): void {
  const seq = ++validationSeq;
  updateInsecureEndpointWarning();
  const url = endpointInput.value.trim();
  if (!url) {
    clearEndpointError("", "Not validated");
    return;
  }
  if (parseUrlOrNull(url) === null) {
    showEndpointError("Invalid URL", "Please enter a valid URL");
    return;
  }
  setConnectionStatus("validating", "Validating...");
  void runValidateAttempt(seq, url);
}

/**
 * Automatic validation (popup open, field blur): a reachability probe only.
 * Two hard rules — no user gesture exists here, so chrome.permissions.request
 * is impossible; skip the check entirely when host permission is absent, and
 * never send the API key automatically. Only the explicit Test buttons do.
 */
export function autoValidateEndpoint(): void {
  const url = endpointInput.value.trim();
  if (!url || parseUrlOrNull(url) === null) return;
  void hasEndpointPermission(url).then((granted) => {
    if (granted) validateEndpoint();
    return undefined;
  });
}

async function runValidateAttempt(seq: number, url: string): Promise<void> {
  try {
    // Keyless reachability probe: the Validate button and the automatic checks
    // only ask "does the server answer?" — the API key leaves the popup solely
    // via the explicit Test API button.
    const response = await fetch(stripTrailingSlashes(url) + "/models", {
      method: "GET",
      mode: "cors",
      signal: AbortSignal.timeout(VALIDATE_TIMEOUT_MS),
    });
    if (seq !== validationSeq) return; // a newer attempt superseded this one
    handleValidateResponse(response, isInsecureHttpEndpoint(url));
  } catch (err) {
    if (seq !== validationSeq) return;
    await handleValidateError(err);
  }
}
