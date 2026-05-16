import { describe, it, expect, beforeEach, vi } from "vitest";

function createLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

function createSessionStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

describe("clearAuthStorage", () => {
  beforeEach(() => {
    vi.resetModules();
    const ls = createLocalStorage();
    const ss = createSessionStorage();
    ls.setItem("token", "a");
    ls.setItem("refreshToken", "b");
    ls.setItem("role", "ADMIN");
    ls.setItem("userId", "u1");
    ss.setItem("kaspx_att_z", "1");
    vi.stubGlobal("localStorage", ls);
    vi.stubGlobal("sessionStorage", ss);
  });

  it("removes auth and kaspx_att session keys", async () => {
    const { clearAuthStorage } = await import("./api");
    clearAuthStorage();
    expect(globalThis.localStorage.getItem("token")).toBeNull();
    expect(globalThis.localStorage.getItem("refreshToken")).toBeNull();
    expect(globalThis.sessionStorage.getItem("kaspx_att_z")).toBeNull();
  });
});
