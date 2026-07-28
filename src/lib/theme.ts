export type Theme = "light" | "dark";

const KEY = "qrcode-tools.theme";

export function getStoredTheme(): Theme {
  if (typeof localStorage === "undefined") return "light";
  const v = localStorage.getItem(KEY);
  if (v === "light" || v === "dark") return v;
  // Fall back to OS preference on first visit.
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function setStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function toggleTheme(theme: Theme): Theme {
  const next: Theme = theme === "dark" ? "light" : "dark";
  setStoredTheme(next);
  return next;
}
