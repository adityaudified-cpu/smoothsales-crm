// HTTP client for the SmoothSales Spring Boot backend (server.servlet.context-path = /api).
// Every endpoint returns ApiResponse<T> = { success, message, data, errors, timestamp }; callers get `data`.

const RAW_API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");

// Resolve base URL: relative paths get prefixed with origin (browser) or internal host (SSR).
function resolveBase() {
  if (!RAW_API_URL.startsWith("/")) return RAW_API_URL;
  if (typeof window !== "undefined") return `${window.location.origin}${RAW_API_URL}`;
  const internal = (process.env.INTERNAL_API_URL || "http://127.0.0.1:8080/api").replace(/\/$/, "");
  return internal;
}

export const API_BASE_URL = RAW_API_URL;

// In production SaaS, every module runs strictly on the Spring Boot backend API.
export const LEADS_DATA_SOURCE = "api";
export const isApiMode = () => true;

const ACCESS_TOKEN_KEY = "smoothsales_access_token";
const REFRESH_TOKEN_KEY = "smoothsales_refresh_token";

export class ApiError extends Error {
  constructor(message, { status, errors, path } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.path = path;
  }
}

const readToken = (key) => { try { return localStorage.getItem(key); } catch { return null; } };

export function setAuthTokens({ accessToken, refreshToken } = {}) {
  try {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {}
}

export function clearAuthTokens() {
  try { localStorage.removeItem(ACCESS_TOKEN_KEY); localStorage.removeItem(REFRESH_TOKEN_KEY); } catch {}
}

function buildUrl(path, query) {
  const base = resolveBase();
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(key, item));
    else url.searchParams.set(key, value);
  });
  return url.toString();
}

let refreshing = null;
async function refreshAccessToken() {
  const refreshToken = readToken(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;
  refreshing ||= fetch(buildUrl("/auth/refresh", { refreshToken }), { method: "POST" })
    .then(async (response) => {
      if (!response.ok) return false;
      const body = await response.json();
      setAuthTokens(body?.data || {});
      return Boolean(body?.data?.accessToken);
    })
    .catch(() => false)
    .finally(() => { refreshing = null; });
  return refreshing;
}

// body: plain object → JSON; FormData → multipart. Retries once after refreshing an expired token.
export async function apiRequest(path, { method = "GET", query, body, signal, retry = true } = {}) {
  const headers = { Accept: "application/json" };
  const token = readToken(ACCESS_TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(buildUrl(path, query), { method, headers, signal, body: body === undefined ? undefined : isForm ? body : JSON.stringify(body) });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(`Cannot reach the server at ${resolveBase()}`, { status: 0, path });
  }

  if (response.status === 401 && retry && (await refreshAccessToken())) {
    return apiRequest(path, { method, query, body, signal, retry: false });
  }

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    const isHtml = text && (text.includes("<!doctype") || text.includes("<html") || text.includes("<head"));
    const cleanMessage = isHtml
      ? `Server error (${response.status} ${response.statusText || "Bad Request"})`
      : text;
    payload = { message: cleanMessage };
  }

  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message || `Request failed (${response.status})`, { status: response.status, errors: payload?.errors, path });
  }
  return payload && "data" in payload ? payload.data : payload;
}

/** Absolute API base for non-fetch clients (WebSocket/SockJS). */
export function apiBaseUrl() {
  return resolveBase();
}

/** Current access token (for WebSocket CONNECT headers). */
export function getAccessToken() {
  return readToken(ACCESS_TOKEN_KEY);
}

// Authenticated binary download (e.g. chat attachments) → Blob.
export async function apiBlob(path, { signal, retry = true } = {}) {
  const headers = {};
  const token = readToken(ACCESS_TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(buildUrl(path), { headers, signal });
  if (response.status === 401 && retry && (await refreshAccessToken())) return apiBlob(path, { signal, retry: false });
  if (!response.ok) {
    let message = `Download failed (${response.status})`;
    try { message = (await response.json())?.message || message; } catch {}
    throw new ApiError(message, { status: response.status, path });
  }
  return response.blob();
}

// Spring Data Page<T> → { items, total, page, size, totalPages }.
export function unwrapPage(page) {
  if (Array.isArray(page)) return { items: page, total: page.length, page: 0, size: page.length, totalPages: 1 };
  return {
    items: page?.content || [],
    total: page?.totalElements ?? page?.content?.length ?? 0,
    page: page?.number ?? 0,
    size: page?.size ?? 0,
    totalPages: page?.totalPages ?? 1,
  };
}
