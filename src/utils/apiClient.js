// src/utils/apiClient.js

import axios from "axios";
import { fetchProfile, logout } from "../store/authSlice";

// базовый URL из .env или по умолчанию
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "production"
    ? "https://159.65.124.242/api/"
    : "http://127.0.0.1:8000/api/");

// динамически подгружаем store для dispatch в интерсепторе
let storePromise = import("../store/store").then((m) => m.store);

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// добавляем access-токен из localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// авто-рефреш при 401
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config;
    if (
      err.response?.status === 401 &&
      !orig._retry &&
      localStorage.getItem("refresh")
    ) {
      orig._retry = true;
      try {
        const { data } = await axios.post(
          `${API_BASE}users/token/refresh/`,
          { refresh: localStorage.getItem("refresh") },
          { headers: { "Content-Type": "application/json" } }
        );
        localStorage.setItem("access", data.access);
        orig.headers.Authorization = `Bearer ${data.access}`;

        // если был запрос профиля — обновим его в Redux
        if (orig.url.includes("/users/profile")) {
          const store = await storePromise;
          store.dispatch(fetchProfile());
        }

        return apiClient(orig);
      } catch {
        const store = await storePromise;
        store.dispatch(logout());
        console.warn("Refresh-токен невалиден, выполнен logout");
      }
    }
    return Promise.reject(err);
  }
);

export default apiClient;
