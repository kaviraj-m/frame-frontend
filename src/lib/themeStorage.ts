import { DEFAULT_THEME_ID, isThemeId, type ThemeId } from "./themes";

const GUEST_KEY = "memorix_ui_theme";

function storageKey(userId?: string | null): string {
  const id = userId?.trim();
  return id ? `${GUEST_KEY}_${id}` : GUEST_KEY;
}

export function getStoredTheme(userId?: string | null): ThemeId {
  if (typeof localStorage === "undefined") return DEFAULT_THEME_ID;
  const raw = localStorage.getItem(storageKey(userId));
  if (raw && isThemeId(raw)) return raw;
  return DEFAULT_THEME_ID;
}

export function setStoredTheme(themeId: ThemeId, userId?: string | null): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey(userId), themeId);
}

export function applyThemeToDocument(themeId: ThemeId): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = themeId;
}
