import { apiEndpointError, apiKeyInput, connectionStatus, connectionStatusText, endpointInput } from "./elements";
import { stripTrailingSlashes } from "./text";

const ERROR_CLASS = "md-text-field__input--error";
let validationTimeout: ReturnType<typeof setTimeout> | null = null;

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

function handleValidateResponse(response: Response): void {
  if (response.ok || response.status === 401 || response.status === 403) {
    clearEndpointError("connected", "Connected");
  } else {
    showEndpointError("Error: " + String(response.status), "Server returned " + String(response.status));
  }
}

function handleValidateError(err: unknown): void {
  if (err instanceof TypeError && err.message.includes("CORS")) {
    clearEndpointError("connected", "Connected (CORS limited)");
  } else {
    showEndpointError("Connection failed", "Could not connect to endpoint");
  }
}

export function validateEndpoint(): void {
  const url = endpointInput.value.trim();
  if (!url) {
    clearEndpointError("", "Not validated");
    return;
  }
  if (URL.parse(url) === null) {
    showEndpointError("Invalid URL", "Please enter a valid URL");
    return;
  }
  setConnectionStatus("validating", "Validating...");
  fetch(stripTrailingSlashes(url) + "/models", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + apiKeyInput.value.trim(),
      "Content-Type": "application/json",
    },
    mode: "cors",
  })
    .then(handleValidateResponse)
    .catch(handleValidateError);
}

export function validateEndpointDebounced(): void {
  if (validationTimeout) clearTimeout(validationTimeout);
  validationTimeout = setTimeout(validateEndpoint, 500);
}
