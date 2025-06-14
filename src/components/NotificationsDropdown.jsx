// src/components/NotificationsDropdown.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";
import "../assets/css/NotificationsDropdown.css";

// Парсер ISO -> Date
const parseIso = (iso) => {
  if (!iso) return null;
  const fixed = iso.replace(/(\.\d{3})\d+/, "$1");
  const d = new Date(fixed);
  return isNaN(d.getTime()) ? null : d;
};

// Формат времени
const fmtTime = (iso) => {
  const d = parseIso(iso);
  return d
    ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : "";
};

// Куда вести по типу уведомления
function renderLink(n) {
  if (n.type === "friend_request") return "/friends";
  if (n.type === "event_reminder") return "/events/reminders";
  return "/";
}

// Заголовок уведомления
function renderTitle(n) {
  if (n.type === "friend_request" && n.data?.request) {
    return `Заявка в друзья от ${n.data.request.from_user.nickname}`;
  }
  if (n.type === "event_reminder" && n.data?.event_title) {
    return `Напоминание: ${n.data.event_title}`;
  }
  return n.type.replace(/_/g, " ");
}

export default function NotificationsDropdown({ onClose }) {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient
      .get("/notifications/")
      .then((res) => {
        const data = res.data;
        setItems(Array.isArray(data) ? data : data.results || []);
      })
      .catch((e) => console.error("Ошибка загрузки уведомлений:", e));
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await apiClient.post(`/notifications/read/${id}/`);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error("Ошибка при отмечании прочитанным:", e);
    }
  };

  return (
    <div className="notif-box" onClick={(e) => e.stopPropagation()}>
      <div className="notif-head">
        <span>Уведомления</span>
        <button className="notif-close-all" onClick={onClose}>
          ×
        </button>
      </div>

      {items.length === 0 ? (
        <p className="notif-empty">Нет новых</p>
      ) : (
        items.slice(0, 10).map((n) => (
          <div key={n.id} className="notif-item">
            <div
              className="notif-content"
              onClick={() => {
                onClose();
                navigate(renderLink(n));
              }}
            >
              <div className="notif-title">{renderTitle(n)}</div>
              <div className="notif-time">{fmtTime(n.created_at)}</div>
            </div>
            <button
              className="notif-mark-read"
              onClick={() => handleMarkRead(n.id)}
            >
              ×
            </button>
          </div>
        ))
      )}

      <div className="notif-view-all-wrapper">
        <button
          className="notif-view-all"
          onClick={() => {
            onClose();
            navigate("/settings/notifications");
          }}
        >
          Посмотреть все
        </button>
      </div>
    </div>
  );
}
