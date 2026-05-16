import { apiPaths } from "../apiPaths";
import { clearAuthStorage } from "./authStorage";
import { API_BASE } from "./config";

let refreshInFlight: Promise<boolean> | null = null;

export function authPathsSkipRefresh(path: string) {
  return path === apiPaths.authLogin || path === apiPaths.authRefresh;
}

export async function tryRefreshToken(): Promise<boolean> {
  const rt = localStorage.getItem("refreshToken");
  if (!rt) return false;
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}${apiPaths.authRefresh}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });
      const txt = await res.text();
      if (!res.ok) {
        clearAuthStorage();
        return false;
      }
      const out = JSON.parse(txt) as { token: string; refreshToken?: string; user?: { id: string; role: string } };
      localStorage.setItem("token", out.token);
      if (out.refreshToken) localStorage.setItem("refreshToken", out.refreshToken);
      if (out.user?.id) localStorage.setItem("userId", out.user.id);
      if (out.user?.role) localStorage.setItem("role", out.user.role);
      return true;
    } catch {
      clearAuthStorage();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}
