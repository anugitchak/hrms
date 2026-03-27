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
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
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
