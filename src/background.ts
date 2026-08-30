import { CONFIG_STORAGE_KEYS, getConfig } from "./background/config";
import { handleSaveConfig } from "./background/config-save";
import { handleGenerateDescription } from "./background/handlers/description";
import { handleGenerate } from "./background/handlers/generate";
import { handleGenerateMergeDescription, handleGenerateMergeTitle } from "./background/handlers/merge";
import { handleGenerateTitle } from "./background/handlers/title";
import { errorMessage, logMsg } from "./background/log";
import type { ExtensionMessage, GetConfigResponse, GetStoredConfigResponse, MessageErrorResponse } from "./types";

function relayAsync<T extends object>(
  task: Promise<T>,
  sendResponse: (response: T | MessageErrorResponse) => void,
  logSuccess: (result: T) => string,
  errorPrefix: string,
): boolean {
  task
    .then((result) => {
      logMsg(logSuccess(result));
      sendResponse(result);
      return undefined;
    })
    .catch((err: unknown) => {
      const message = errorMessage(err);
      logMsg(errorPrefix + message);
      sendResponse({ error: message });
    });
  return true;
}

function handleGetConfig(sendResponse: (response: GetConfigResponse) => void): boolean {
  void getConfig().then((config) => {
    sendResponse({
      apiEndpoint: config.apiEndpoint,
      model: config.model,
      hasKey: !!config.apiKey,
      hasGithubToken: !!config.githubToken,
    });
    return undefined;
  });
  return true;
}

function handleGetStoredConfig(sendResponse: (response: GetStoredConfigResponse) => void): boolean {
  chrome.storage.local.get(CONFIG_STORAGE_KEYS, (stored: GetStoredConfigResponse | null) => {
    sendResponse(stored || {});
  });
  return true;
}

type SendResponse = (response: unknown) => void;

function relayOpenedPR(message: ExtensionMessage, sendResponse: SendResponse): boolean {
  switch (message.type) {
    case "generateTitle":
      return relayAsync(
        handleGenerateTitle(message.data ?? {}),
        sendResponse,
        (r) => "generateTitle success - title: " + r.title,
        "generateTitle error: ",
      );
    case "generateDescription":
      return relayAsync(
        handleGenerateDescription(message.data ?? {}),
        sendResponse,
        (r) => "generateDescription success - body length: " + String((r.body || "").length),
        "generateDescription error: ",
      );
    case "generateMergeTitle":
      return relayAsync(
        handleGenerateMergeTitle(message.data ?? {}),
        sendResponse,
        (r) => "generateMergeTitle success - title: " + r.title,
        "generateMergeTitle error: ",
      );
    case "generateMergeDescription":
      return relayAsync(
        handleGenerateMergeDescription(message.data ?? {}),
        sendResponse,
        (r) => "generateMergeDescription success - body length: " + String((r.description || "").length),
        "generateMergeDescription error: ",
      );
    default:
      return false;
  }
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  // Keepalive pings from content.js keep the service worker alive across
  // long API calls. Respond immediately and never touch storage.
  if (message.type === "__keepalive_ping__") {
    sendResponse({ ok: true });
    return false;
  }

  logMsg("Received message type: " + message.type);
  logMsg("[BG LOG] generate message received - type=" + message.type + ", hasData=" + String(!!message.data));

  switch (message.type) {
    case "generate":
      return relayAsync(
        handleGenerate(message.data ?? {}),
        sendResponse,
        (r) => "Success - title: " + r.title,
        "Error: ",
      );
    case "getConfig":
      return handleGetConfig(sendResponse);
    case "saveConfig":
      return handleSaveConfig(message.data ?? {}, sendResponse);
    case "getStoredConfig":
      return handleGetStoredConfig(sendResponse);
    default:
      return relayOpenedPR(message, sendResponse);
  }
});
