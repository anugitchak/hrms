import axios from "axios";

const PRODUCTION_FRONTEND_HOSTS = new Set(["mmhrms.in", "www.mmhrms.in"]);

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

const getDefaultApiUrl = () => {
  if (
    typeof window !== "undefined" &&
    PRODUCTION_FRONTEND_HOSTS.has(window.location.hostname)
  ) {
    return "https://api.mmhrms.in/api";
  }

  return "http://127.0.0.1:8000/api";
};

const getDefaultStorageUrl = () => {
  if (
    typeof window !== "undefined" &&
    PRODUCTION_FRONTEND_HOSTS.has(window.location.hostname)
  ) {
    return "https://api.mmhrms.in/storage";
  }

  return "http://127.0.0.1:8000/storage";
};

const apiBaseUrl = trimTrailingSlash(
  process.env.REACT_APP_API_URL || getDefaultApiUrl()
);

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000, // 15s — fail-fast instead of hanging forever
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Retry interceptor: 1 retry on 5xx / network errors with 1s delay
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    // Never retry canceled / aborted requests
    if (error.code === "ERR_CANCELED" || config?.signal?.aborted) {
      return Promise.reject(error);
    }
    // Only retry GET requests, only once, only on retriable errors
    if (
      config &&
      !config._retried &&
      config.method === "get" &&
      (error.code === "ECONNABORTED" ||
        error.code === "ERR_NETWORK" ||
        error.message === "Network Error" ||
        (error.response && error.response.status >= 500))
    ) {
      config._retried = true;
      await new Promise((r) => setTimeout(r, 1000));
      return api(config);
    }

    if (error?.response?.status === 401) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const STORAGE_URL = trimTrailingSlash(
  process.env.REACT_APP_STORAGE_URL || getDefaultStorageUrl()
);
export default api;
