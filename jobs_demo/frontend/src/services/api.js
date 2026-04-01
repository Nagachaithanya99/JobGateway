// frontend/src/services/api.js
import axios from "axios";
import { getApiBaseUrl } from "../utils/apiBaseUrl.js";

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
      if (getTokenFn) {
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn("Unauthorized request");
    }
    return Promise.reject(error);
  }
);

export default api;
