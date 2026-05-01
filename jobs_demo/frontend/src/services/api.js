// frontend/src/services/api.js
import axios from "axios";
import { getApiBaseUrl, getApiBaseUrls } from "../utils/apiBaseUrl.js";
import { showSweetAlert } from "../utils/sweetAlert.js";

/**
 * Axios Instance
 * - Uses env base URL if provided
 * - Falls back to localhost for development
 * - Sends cookies if backend uses them
 */
const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const LOCAL_ADMIN_AUTH_KEY = "jobgateway_local_admin_auth";
const API_BASE_URLS = getApiBaseUrls();
let apiBaseCursor = 0;
let adminUnauthorizedAlertOpen = false;

function pickApiBaseUrl() {
  if (!API_BASE_URLS.length) return getApiBaseUrl();
  const next = API_BASE_URLS[apiBaseCursor % API_BASE_URLS.length];
  apiBaseCursor += 1;
  return next;
}

function readLocalAdminToken() {
  try {
    if (typeof localStorage === "undefined") return "";
    const raw = localStorage.getItem(LOCAL_ADMIN_AUTH_KEY);
    if (!raw) return "";
    return JSON.parse(raw)?.token || "";
  } catch {
    return "";
  }
}

/**
 * Clerk Token Integration
 * We inject Clerk token dynamically from React
 * using setApiTokenGetter(() => getToken())
 */

let getTokenFn = null;

/**
 * Call this in your React root (after Clerk ready):
 *
 *   import { setApiTokenGetter } from "./services/api";
 *   const { getToken } = useAuth();
 *   useEffect(() => {
 *     setApiTokenGetter(() => getToken());
 *   }, [getToken]);
 */
export const setApiTokenGetter = (fn) => {
  getTokenFn = fn;
};

/**
 * Request Interceptor
 * Automatically attaches Authorization header
 */
api.interceptors.request.use(
  async (config) => {
    try {
      if (API_BASE_URLS.length > 1) {
        config.baseURL = pickApiBaseUrl();
      }

      const localAdminToken = readLocalAdminToken();
      if (localAdminToken) {
        config.headers["X-Admin-Token"] = localAdminToken;
      } else if (getTokenFn) {
        const token = await getTokenFn();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (err) {
      console.error("Failed to attach auth token:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Optional: Global Response Error Handler
 * (Helps debugging 401 / 403 issues)
 */
function isAdminRequest(config = {}) {
  const url = String(config.url || "");
  return url.startsWith("/admin") && !url.startsWith("/admin/auth/login");
}

function handleAdminUnauthorized(error) {
  if (!isAdminRequest(error?.config)) return;

  try {
    localStorage.removeItem(LOCAL_ADMIN_AUTH_KEY);
  } catch {
    // ignore storage cleanup failures
  }

  if (adminUnauthorizedAlertOpen || typeof window === "undefined") return;
  adminUnauthorizedAlertOpen = true;

  void showSweetAlert("Unauthorized. Please login with the admin account.", "error", {
    title: "Unauthorized",
    confirmButtonText: "Login",
  }).finally(() => {
    adminUnauthorizedAlertOpen = false;
    if (window.location.pathname.startsWith("/admin")) {
      window.location.assign("/admin/login");
    }
  });
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      console.warn("Unauthorized request");
      handleAdminUnauthorized(error);
    }
    return Promise.reject(error);
  }
);

export default api;
