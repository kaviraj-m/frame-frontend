import { API_BASE } from "./config";
import { authPathsSkipRefresh, tryRefreshToken } from "./refreshToken";

function parseHttpError(txt: string): Error {
  try {
    const parsed = JSON.parse(txt) as { error?: string };
    return new Error(parsed.error || "request failed");
  } catch {
    return new Error(txt || "request failed");
  }
}

async function doRequest(path: string, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

/** GET (or other) without forcing JSON Content-Type; still sends Bearer and handles refresh on 401. */
async function fetchAuthorized(path: string, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = { ...(init?.headers ?? {}) };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && !(headers as Record<string, string>)["Content-Type"]) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

async function doUpload(path: string, form: FormData): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { method: "POST", headers, body: form });
}

/** Multipart upload (field name `file`). Does not set Content-Type (browser sets boundary). */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  let res = await doUpload(path, form);
  if (res.status === 401 && !authPathsSkipRefresh(path)) {
    const ok = await tryRefreshToken();
    if (ok) res = await doUpload(path, form);
  }
  const txt = await res.text();
  if (!res.ok) {
    throw parseHttpError(txt);
  }
  if (!txt) return {} as T;
  return JSON.parse(txt) as T;
}

/** Merges concurrent identical GETs (e.g. React StrictMode double-mount) into one network request. */
const inflightGet = new Map<string, Promise<unknown>>();

function inflightGetKey(path: string, init?: RequestInit): string | null {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET" || init?.body != null) return null;
  return path;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const key = inflightGetKey(path, init);
  if (key) {
    const existing = inflightGet.get(key);
    if (existing) return existing as Promise<T>;
  }

  const run = (async (): Promise<T> => {
    let res = await doRequest(path, init);
    if (res.status === 401 && !authPathsSkipRefresh(path)) {
      const ok = await tryRefreshToken();
      if (ok) res = await doRequest(path, init);
    }
    const txt = await res.text();
    if (!res.ok) {
      throw parseHttpError(txt);
    }
    if (!txt) return {} as T;
    return JSON.parse(txt) as T;
  })();

  if (key) {
    inflightGet.set(key, run);
    run.finally(() => {
      if (inflightGet.get(key) === run) inflightGet.delete(key);
    });
  }

  return run;
}

/** Authenticated GET returning raw bytes (e.g. order asset file). */
export async function apiBinaryGet(path: string): Promise<Blob> {
  let res = await fetchAuthorized(path, { method: "GET" });
  if (res.status === 401 && !authPathsSkipRefresh(path)) {
    const ok = await tryRefreshToken();
    if (ok) res = await fetchAuthorized(path, { method: "GET" });
  }
  if (!res.ok) {
    const txt = await res.text();
    throw parseHttpError(txt);
  }
  return res.blob();
}
