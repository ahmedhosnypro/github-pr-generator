import { THINKING_EFFORTS, type ThinkingEffort } from "../types";
import { diffConditionalFields, diffEnabledInput, lastSavedEl, thinkingEffortGroup, toast } from "./elements";

export const COLOR_ERROR = "var(--md-sys-color-error)";
export const COLOR_OK = "var(--md-sys-color-tertiary)";
export const COLOR_MUTED = "var(--md-sys-color-on-surface-variant)";

let lastSavedTime: Date | null = null;

export function showToast(message: string, type?: string): void {
  toast.textContent = message;
  toast.className = "toast show " + (type === "error" ? "toast--error" : "toast--success");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

export function updateLastSaved(): void {
  lastSavedTime = new Date();
  const timeStr = lastSavedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  lastSavedEl.textContent = "Saved " + timeStr;
}

export function togglePasswordVisibility(input: HTMLInputElement, button: HTMLElement): void {
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  const eyeOpen = button.querySelector<HTMLElement>(".eye-open");
  const eyeClosed = button.querySelector<HTMLElement>(".eye-closed");
  if (eyeOpen && eyeClosed) {
    eyeOpen.style.display = isPassword ? "none" : "block";
    eyeClosed.style.display = isPassword ? "block" : "none";
  }
  button.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
}

export function updateDiffConditionalVisibility(): void {
  if (diffEnabledInput.checked) {
    diffConditionalFields.classList.remove("hidden");
  } else {
    diffConditionalFields.classList.add("hidden");
  }
}

/** Normalizes any incoming string (storage, config file, dataset) to a valid ThinkingEffort. */
export function toThinkingEffort(value: string | null | undefined): ThinkingEffort {
  return THINKING_EFFORTS.find((effort) => effort === value) ?? "default";
}

export function selectThinkingEffort(effort: ThinkingEffort): void {
  for (const button of thinkingEffortGroup.querySelectorAll<HTMLButtonElement>("[data-effort]")) {
    button.setAttribute("aria-pressed", String(button.dataset.effort === effort));
  }
}

export function getSelectedThinkingEffort(): ThinkingEffort {
  const selected = thinkingEffortGroup.querySelector<HTMLButtonElement>('[data-effort][aria-pressed="true"]');
  return toThinkingEffort(selected?.dataset.effort);
}
