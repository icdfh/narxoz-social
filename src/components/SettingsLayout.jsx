// src/components/SettingsLayout.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet }           from "react-router-dom";
import { useSelector }               from "react-redux";

import apiClient                     from "../utils/apiClient";
import "../assets/css/SettingsLayout.css";

export default function SettingsLayout() {
  const [notifCount, setNotifCount] = useState(0);
  const user = useSelector((s) => s.auth.user);

  /* ——— загружаем количество непрочитанных уведомлений ——— */
  useEffect(() => {
    apiClient
      .get("/notifications/")
      .then((res) =>
        setNotifCount(res.data.count ?? (res.data.results?.length || 0)),
      )
      .catch((e) =>
        console.error("Не удалось загрузить уведомления:", e),
      );
  }, []);

  /* ——— пункты меню ——— */
  const menu = [
    { to: "account",       label: "Аккаунт" },
    { to: "notifications", label: "Уведомления", badge: notifCount },
    { to: "privacy",       label: "Конфиденциальность" },
    { to: "report",        label: "Мои жалобы" },
    ...(user?.role === "admin"
      ? [{ to: "complaints", label: "Все жалобы" }]
      : []),
  ];

  return (
    <div className="settings-container">
      {/* левая колонка меню */}
      <nav className="settings-sidebar">
        <h3>Настройки</h3>
        <ul className="settings-menu">
          {menu.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "settings-link active" : "settings-link"
                }
              >
                {item.label}
                {item.badge > 0 && (
                  <span className="settings-badge">{item.badge}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* правая область с вложенными роутами */}
      <main className="settings-content">
        <Outlet />
      </main>
    </div>
  );
}
