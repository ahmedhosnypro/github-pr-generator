import { runSafe } from "./messaging";

/**
 * True only after the user explicitly toggles the theme — system preference
 * changes apply until then. Reset by reading storage; initTheme never counts.
 */
let userOverrodeTheme = false;

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
    chrome.storage.local.get("theme", (result: Record<string, unknown>) => {
      if (result.theme === "light" || result.theme === "dark") {
        userOverrodeTheme = true;
        applyTheme(result.theme);
        return;
      }
      migrateThemeFromSync();
    });
  } catch {
    applyTheme(null);
  }
}

// One-time migration: the theme preference lived in chrome.storage.sync while
// every other popup preference is local. If sync still holds a value, seed
// local with it and drop the stale sync copy.
function migrateThemeFromSync(): void {
  chrome.storage.sync.get("theme", (result: Record<string, unknown>) => {
    if (result.theme === "light" || result.theme === "dark") {
      userOverrodeTheme = true;
      applyTheme(result.theme);
      runSafe(() => {
        void chrome.storage.local.set({ theme: result.theme });
        void chrome.storage.sync.remove("theme");
      }, "[PR Generator popup] Failed to migrate theme:");
      return;
    }
    applyTheme(null);
  });
}

export function toggleTheme(): void {
  const html = document.documentElement;
  const isDark = html.classList.contains("theme-dark");
  const newTheme = isDark ? "light" : "dark";
  userOverrodeTheme = true;
  html.classList.remove(isDark ? "theme-dark" : "theme-light");
  html.classList.add("theme-" + newTheme);
  runSafe(() => {
    void chrome.storage.local.set({ theme: newTheme });
  }, "[PR Generator popup] Failed to save theme:");
}

function handleSystemThemeChange(): void {
  if (!userOverrodeTheme) {
    applyTheme(null);
  }
}

export function watchSystemTheme(): void {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", handleSystemThemeChange);
}
