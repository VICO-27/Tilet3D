import axios, { InternalAxiosRequestConfig } from "axios";

const ACCESS_TOKEN_KEY = "tilet3d_access_token";
const REFRESH_TOKEN_KEY = "tilet3d_refresh_token";
const USER_KEY = "tilet3d_user";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Avoid infinite refresh loops with a retry flag
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// ==========================================================
// Attach JWT Token
// ==========================================================
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================================
// Refresh Token & Global Error Handler
// ==========================================================
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Check if error is 401 and we haven't already retried this request
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (refreshToken) {
        try {
          // Attempt to fetch a new access token
          const baseURL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
          const refreshResponse = await axios.post(`${baseURL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = refreshResponse.data.access;

          // Save new access token
          localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);

          // Update header for original request and retry it
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh token is also expired or invalid -> destroy session
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available -> clear storage
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;