const DEFAULT_BACKEND_ORIGIN = "http://localhost:5000";
const DEFAULT_API_BASE_URL = `${DEFAULT_BACKEND_ORIGIN}/api`;

function getRawApiBaseUrl(env) {
  return String(
    env?.VITE_API_BASE_URL ||
      env?.VITE_API_URL ||
      DEFAULT_API_BASE_URL,
  ).trim();
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

export function getApiOrigin(env = import.meta.env) {
  try {
    return new URL(getApiBaseUrl(env), getResolutionBase()).origin;
  } catch {
    return DEFAULT_BACKEND_ORIGIN;
  }
}
