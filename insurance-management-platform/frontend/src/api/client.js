import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "";

const api = axios.create({ baseURL });

// Attach the JWT on every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("imp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401, drop the session and bounce to login.
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("imp_token");
      localStorage.removeItem("imp_user");
      if (location.pathname !== "/login") location.assign("/login");
    }
    return Promise.reject(error);
  }
);

// Small helper to surface the API's message field.
export function apiMessage(error, fallback = "Something went wrong") {
  return error?.response?.data?.message || fallback;
}

export default api;
