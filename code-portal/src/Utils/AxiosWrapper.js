import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send cookies automatically
});

// Optional request interceptor (for token injection)
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

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
