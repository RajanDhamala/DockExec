import axios from "axios";

const api = axios.create({
  baseURL: `http://localhost:8000` || "/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => {
    const res = response.data;
    const isSuccess = res?.success ?? (response.status >= 200 && response.status < 300);

    if (!isSuccess) {
      return Promise.reject({
        statusCode: res?.statusCode || response.status,
        message: res?.message || "Something went wrong",
        errors: res?.errors || [],
      });
    }

    return res;
  },
  (error) => {
    const status = error.response?.status || 500;
    const data = error.response?.data || {};
    console.log("data inside wrapper:", data)

    switch (status) {
      case 401:
        console.error("Unauthorized - redirecting to login");
        window.location.href = "/login";
        break;

      case 403:
        console.error("Forbidden - you don't have permission");
        break;

      case 429:
        console.warn("Rate limit exceeded. Please wait a moment.");
        break;

      case 500:
        console.error("Server error. Try again later.");
        break;

      default:
        console.warn(`HTTP ${status}: ${data.message || error.message}`);
    }

    return Promise.reject({
      statusCode: status,
      message: data.message || error.message || "Something went wrong",
      errors: data.errors || [],
    });
  }
);

export default api;
