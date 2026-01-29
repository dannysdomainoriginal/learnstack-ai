import axios from "axios";
import { BASE_URL } from "../utils/apiPaths";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 80000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor
api.interceptors.request.use(
  (request) => {
    const accessToken = localStorage.getItem("swe0k:learnstack:token");

    if (accessToken) {
      request.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      console.error("Access token is missing, please re-login");
    }

    return request;
  },

  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    error.response?.status === 500
      ? console.error("Internal Server error", error)
      : error.code === "ECONNABORTED"
        ? console.error("Request timed out.")
        : error.code === "ERR_NETWORK"
          ? import.meta.env.DEV && alert("Server is offline")
          : "";

    import.meta.env.DEV && console.error("Axios error:", error);
    console.log(error);
    return Promise.reject(error);
  },
);

export default api;
