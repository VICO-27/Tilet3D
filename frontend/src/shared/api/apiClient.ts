import axios from "axios";

const ACCESS_TOKEN_KEY = "tilet3d_access_token";

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

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
// Global Error Handler
// ==========================================================
apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("tilet3d_access_token");
      localStorage.removeItem("tilet3d_refresh_token");
      localStorage.removeItem("tilet3d_user");

      // Avoid redirect loops
      if (window.location.pathname !== "/account") {
        window.location.href = "/account";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;