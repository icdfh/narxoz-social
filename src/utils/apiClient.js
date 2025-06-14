import axios from "axios";
import { fetchProfile, logout } from "../store/authSlice";

// 🔗 Базовый адрес API
const API_BASE = "http://127.0.0.1:8000/api";

// Загружаем store динамически
let storePromise = import("../store/store").then((mod) => mod.store);

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    // Всегда ожидаем JSON, даже при ошибках
    Accept: "application/json",
  },
});

// 👇 Подставляем access-токен
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 👇 Обработка 401 и обновление токена
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("refresh")
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(`${API_BASE}/users/token/refresh/`, {
          refresh: localStorage.getItem("refresh"),
        });
        const newAccess = res.data.access;
        localStorage.setItem("token", newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        // Обновим профиль, если меняется профиль
        if (originalRequest.url.includes("/users/profile")) {
          const store = await storePromise;
          store.dispatch(fetchProfile());
        }

        return apiClient(originalRequest);
      } catch (refreshErr) {
        const store = await storePromise;
        store.dispatch(logout());
        console.warn("❌ Refresh-токен невалиден. Выполнен авто-logout.");
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
