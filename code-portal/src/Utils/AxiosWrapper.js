import axios from "axios";

const api = axios.create({
  baseURL: `http://localhost:8000` || "/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send cookies automatically
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (!res.success) {
      return Promise.reject(res);
    }
    return res.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized, redirecting to login...");
      window.location.href = "/login";
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
