const DEFAULT_BACKEND_ORIGIN = "http://localhost:5000";
const DEFAULT_API_BASE_URL = `${DEFAULT_BACKEND_ORIGIN}/api`;

function hasExplicitApiBaseUrl(env) {
  return Boolean(String(env?.VITE_API_BASE_URL || env?.VITE_API_URL || "").trim());
}

function isLocalBrowserHost() {
  if (typeof window === "undefined") return true;
  const host = String(window.location?.hostname || "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1";
}

function getRawApiBaseUrl(env) {
  const explicitUrl = String(env?.VITE_API_BASE_URL || env?.VITE_API_URL || "")
    .split(",")[0]
    ?.trim();
  if (explicitUrl) return explicitUrl;
  if (isLocalBrowserHost()) return DEFAULT_API_BASE_URL;
  return "/api";
}

function getResolutionBase() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_BACKEND_ORIGIN;
}

function normalizePathname(pathname = "/") {
  const trimmed = String(pathname || "").replace(/\/+$/, "");
  if (!trimmed || trimmed === "/") return "/api";
  return trimmed;
}

export function getApiBaseUrl(env = import.meta.env) {
  const raw = getRawApiBaseUrl(env);

  try {
    const url = new URL(raw || DEFAULT_API_BASE_URL, getResolutionBase());
    url.pathname = normalizePathname(url.pathname);
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_API_BASE_URL;
  }
}

export function getApiBaseUrls(env = import.meta.env) {
  const rawList = String(
    env?.VITE_API_BASE_URLS ||
      env?.VITE_API_URLS ||
      env?.VITE_API_BASE_URL ||
      env?.VITE_API_URL ||
      "",
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const candidates = rawList.length ? rawList : [getRawApiBaseUrl(env)];
  return [
    ...new Set(
      candidates.map((raw) => {
        try {
          const url = new URL(raw || DEFAULT_API_BASE_URL, getResolutionBase());
          url.pathname = normalizePathname(url.pathname);
          url.search = "";
          url.hash = "";
          return url.toString().replace(/\/$/, "");
        } catch {
          return DEFAULT_API_BASE_URL;
        }
      }),
    ),
  ];
}

export function getApiOrigin(env = import.meta.env) {
  try {
    if (!hasExplicitApiBaseUrl(env) && !isLocalBrowserHost() && typeof window !== "undefined") {
      return window.location.origin;
    }
    return new URL(getApiBaseUrl(env), getResolutionBase()).origin;
  } catch {
    return DEFAULT_BACKEND_ORIGIN;
  }
}
