import { runSafe } from "./messaging";

function applyTheme(theme: unknown): void {
  const html = document.documentElement;
  html.classList.remove("theme-light", "theme-dark");

  if (theme === "light" || theme === "dark") {
    html.classList.add("theme-" + theme);
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    html.classList.add(prefersDark ? "theme-dark" : "theme-light");
  }
}

export function initTheme(): void {
  try {
    chrome.storage.sync.get("theme", (result: Record<string, unknown>) => {
      applyTheme(result.theme);
    });
  } catch {
    applyTheme(null);
  }
}

export function toggleTheme(): void {
  const html = document.documentElement;
  const isDark = html.classList.contains("theme-dark");
  const newTheme = isDark ? "light" : "dark";
  html.classList.remove(isDark ? "theme-dark" : "theme-light");
  html.classList.add("theme-" + newTheme);
  runSafe(() => {
    void chrome.storage.sync.set({ theme: newTheme });
  }, "[PR Generator popup] Failed to save theme:");
}

function handleSystemThemeChange(): void {
  const html = document.documentElement;
  const hasManualTheme = html.classList.contains("theme-light") || html.classList.contains("theme-dark");
  if (!hasManualTheme) {
    applyTheme(null);
  }
}

export function watchSystemTheme(): void {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", handleSystemThemeChange);
}
