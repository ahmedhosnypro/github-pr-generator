import type { SaveConfigData } from "../types";
import {
  apiKeyInput,
  diffEnabledInput,
  diffMaxBytesInput,
  diffMaxLinesInput,
  diffSettingsToggle,
  endpointInput,
  githubTokenInput,
  modelInput,
  saveBtn,
  testApiBtn,
  testGitHubBtn,
  themeToggle,
  toggleApiKeyBtn,
  toggleGithubTokenBtn,
  validateEndpointBtn,
} from "./elements";
import { loadSettings } from "./load";
import { persistField, saveSettings } from "./save";
import { testApi } from "./test-api";
import { testGitHub } from "./test-github";
import { initTheme, toggleTheme, watchSystemTheme } from "./theme";
import { togglePasswordVisibility, updateDiffConditionalVisibility } from "./ui";
import { resetEndpointFieldError, validateEndpoint, validateEndpointDebounced } from "./validate";

function wireAutosaveField(key: keyof SaveConfigData, el: HTMLInputElement): void {
  el.addEventListener("input", () => {
    persistField(key, el.value);
  });
  if (el.type === "checkbox") {
    el.addEventListener("change", () => {
      persistField(key, el.checked);
    });
  }
}

function wireAutosave(): void {
  wireAutosaveField("apiEndpoint", endpointInput);
  wireAutosaveField("apiKey", apiKeyInput);
  wireAutosaveField("model", modelInput);
  wireAutosaveField("githubToken", githubTokenInput);
  wireAutosaveField("diffEnabled", diffEnabledInput);
  wireAutosaveField("diffMaxLines", diffMaxLinesInput);
  wireAutosaveField("diffMaxBytes", diffMaxBytesInput);
}

function wireDiffSettingsToggle(): void {
  diffSettingsToggle.addEventListener("click", () => {
    const section = diffSettingsToggle.closest(".section");
    const expanded = diffSettingsToggle.getAttribute("aria-expanded") === "true";
    diffSettingsToggle.setAttribute("aria-expanded", String(!expanded));
    if (section) section.classList.toggle("collapsed");
  });
}

function wireButtons(): void {
  saveBtn.addEventListener("click", saveSettings);
  validateEndpointBtn.addEventListener("click", validateEndpoint);
  toggleApiKeyBtn.addEventListener("click", () => {
    togglePasswordVisibility(apiKeyInput, toggleApiKeyBtn);
  });
  toggleGithubTokenBtn.addEventListener("click", () => {
    togglePasswordVisibility(githubTokenInput, toggleGithubTokenBtn);
  });
  diffEnabledInput.addEventListener("change", updateDiffConditionalVisibility);
  wireDiffSettingsToggle();
  testApiBtn.addEventListener("click", testApi);
  testGitHubBtn.addEventListener("click", testGitHub);
  themeToggle.addEventListener("click", toggleTheme);
  endpointInput.addEventListener("blur", validateEndpointDebounced);
  endpointInput.addEventListener("input", resetEndpointFieldError);
}

wireAutosave();
wireButtons();
watchSystemTheme();

console.log(
  "[POPUP LOG] popup loaded, endpoint=" +
    endpointInput.value +
    ", model=" +
    modelInput.value +
    ", apiKey set=" +
    String(apiKeyInput.value !== ""),
);
console.log("[POPUP LOG] model value on load =", modelInput.value);

initTheme();
loadSettings();
