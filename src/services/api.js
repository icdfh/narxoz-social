// src/utils/apiClient.js

import axios from "axios";

// 📌 берём адрес из .env (VITE_API_URL), или в зависимости от режима:
//  - в production: используем prod-адрес с /api/
//  - в dev: localhost:8000/api/
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "production"
    ? "https://159.65.124.242/api/"
    : "http://127.0.0.1:8000/api/");

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,      // если нужны куки
});

// добавляем JWT-токен из localStorage к каждому запросу
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// при 401 можно попытаться авто-рефрешить токен
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (
      err.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("refresh")
    ) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${API_URL}users/refresh/`,
          { refresh: localStorage.getItem("refresh") },
          { headers: { "Content-Type": "application/json" } }
        );
        localStorage.setItem("access", data.access);
        // повторяем изначальный запрос уже с новым access
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(originalRequest);
      } catch {
        // если рефреш не удался — чистим и редиректим на логин
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default apiClient;
