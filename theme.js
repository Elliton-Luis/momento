export const THEME_STORAGE_KEY = "momento.theme.v1";
export const LIGHT_THEME = "light";
export const DARK_THEME = "dark";

// Stored choice wins; without one the system preference applies.
export function resolveTheme(storedTheme, systemTheme) {
  if (storedTheme === LIGHT_THEME || storedTheme === DARK_THEME) return storedTheme;
  return systemTheme === DARK_THEME ? DARK_THEME : LIGHT_THEME;
}

export function getStoredTheme(storage = defaultStorage()) {
  try {
    const stored = storage.getItem(THEME_STORAGE_KEY);
    return stored === LIGHT_THEME || stored === DARK_THEME ? stored : null;
  } catch (error) {
    console.warn("Failed to read theme preference:", error);
    return null;
  }
}

export function systemTheme() {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK_THEME : LIGHT_THEME;
  }
  return LIGHT_THEME;
}

// Applies the theme to the document and refreshes every toggle button.
export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const nextLabel = theme === DARK_THEME ? "Alternar para modo claro" : "Alternar para modo escuro";
  const nextSymbol = theme === DARK_THEME ? "☀" : "☾";
  for (const button of document.querySelectorAll(".theme-toggle")) {
    button.textContent = nextSymbol;
    button.setAttribute("aria-label", nextLabel);
  }
}

export function currentTheme() {
  const applied = document.documentElement.dataset.theme;
  if (applied === LIGHT_THEME || applied === DARK_THEME) return applied;
  return resolveTheme(getStoredTheme(), systemTheme());
}

export function toggleTheme(storage = defaultStorage()) {
  const next = currentTheme() === DARK_THEME ? LIGHT_THEME : DARK_THEME;
  try {
    storage.setItem(THEME_STORAGE_KEY, next);
  } catch (error) {
    throw new Error(`Failed to save theme preference (${next}): ${error.message}`);
  }
  applyTheme(next);
  return next;
}

function defaultStorage() {
  if (typeof localStorage !== "undefined") return localStorage;
  throw new Error("No storage available: localStorage is missing");
}
