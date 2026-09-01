/** Typed lookups for popup.html elements: the markup guarantees every id exists. */
function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error("[PR Generator popup] missing element #" + id);
  return el;
}

export const endpointInput = byId("apiEndpoint") as HTMLInputElement;
export const apiKeyInput = byId("apiKey") as HTMLInputElement;
export const modelInput = byId("model") as HTMLInputElement;
export const thinkingEffortGroup = byId("thinkingEffortGroup");
export const githubTokenInput = byId("githubToken") as HTMLInputElement;
export const diffEnabledInput = byId("diffEnabled") as HTMLInputElement;
export const diffMaxLinesInput = byId("diffMaxLines") as HTMLInputElement;
export const diffMaxBytesInput = byId("diffMaxBytes") as HTMLInputElement;
export const saveBtn = byId("saveBtn") as HTMLButtonElement;
export const toast = byId("toast");
export const themeToggle = byId("themeToggle") as HTMLButtonElement;
export const validateEndpointBtn = byId("validateEndpointBtn") as HTMLButtonElement;
export const toggleApiKeyBtn = byId("toggleApiKeyBtn") as HTMLButtonElement;
export const toggleGithubTokenBtn = byId("toggleGithubTokenBtn") as HTMLButtonElement;
export const diffSettingsToggle = byId("diffSettingsToggle") as HTMLButtonElement;
export const diffConditionalFields = byId("diffConditionalFields");
export const connectionStatus = byId("connectionStatus");
export const testApiBtn = byId("testApiBtn") as HTMLButtonElement;
export const testApiResult = byId("testApiResult");
export const testGitHubBtn = byId("testGitHubBtn") as HTMLButtonElement;
export const testGitHubResult = byId("testGitHubResult");
export const lastSavedEl = byId("lastSaved");
export const apiEndpointError = byId("apiEndpointError");

const statusText = connectionStatus.querySelector<HTMLElement>(".status-indicator__text");
if (!statusText) throw new Error("[PR Generator popup] missing .status-indicator__text");
export const connectionStatusText = statusText;
