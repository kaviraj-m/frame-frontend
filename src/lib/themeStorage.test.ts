import { describe, expect, it, beforeEach, vi } from "vitest";
import { getStoredTheme, setStoredTheme } from "./themeStorage";
import { DEFAULT_THEME_ID } from "./themes";

const store = new Map<string, string>();

describe("themeStorage", () => {
  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
    });
  });

  it("returns default when empty", () => {
    expect(getStoredTheme()).toBe(DEFAULT_THEME_ID);
  });

  it("persists theme for guest", () => {
    setStoredTheme("memorix-light");
    expect(getStoredTheme()).toBe("memorix-light");
  });

  it("scopes theme per user id", () => {
    setStoredTheme("memorix-midnight", "user-a");
    setStoredTheme("memorix-obsidian", "user-b");
    expect(getStoredTheme("user-a")).toBe("memorix-midnight");
    expect(getStoredTheme("user-b")).toBe("memorix-obsidian");
    expect(getStoredTheme()).toBe(DEFAULT_THEME_ID);
  });

  it("ignores invalid stored values", () => {
    localStorage.setItem("memorix_ui_theme", "not-a-theme");
    expect(getStoredTheme()).toBe(DEFAULT_THEME_ID);
  });
});
