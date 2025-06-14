import React, { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import "../../assets/css/NotificationsSettings.css";
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Box,
} from "@mui/material";

export default function NotificationsSettings() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------- load ---------- */
  useEffect(() => {
    apiClient
      .get("/notifications/")
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.results || [];
        setNotifs(list);
      })
      .catch((e) => console.error("Ошибка при загрузке уведомлений:", e))
      .finally(() => setLoading(false));
  }, []);

  /* ---------- mark read ---------- */
  const markRead = async (id) => {
    try {
      await apiClient.post(`/notifications/read/${id}/`);
      setNotifs((p) => p.filter((n) => n.id !== id));
    } catch (e) {
      console.error("Ошибка при отмечании уведомления:", e);
    }
  };

  /* ---------- helpers ---------- */
  const iso = (s) =>
    s
      ? new Date(s.replace(/(\.\d{3})\d+/, "$1")).toLocaleString("ru-RU", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "";

  const title = (n) => {
    if (n.type === "friend_request" && n.data?.request)
      return `Заявка в друзья от ${n.data.request.from_user.nickname}`;
    if (n.type === "event_reminder" && n.data?.event_title)
      return `Напоминание: ${n.data.event_title}`;
    return n.type.replace(/_/g, " ");
  };

  const emoji = (t) => {
    switch (t) {
      case "friend_request":
        return "🤝";
      case "event_reminder":
        return "📅";
      default:
        return "🔔";
    }
  };

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <Container className="notifications-settings center">
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container className="notifications-settings" maxWidth="md">
      <Typography variant="h5" className="notif-title">
        Все уведомления
      </Typography>

      {notifs.length === 0 ? (
        <Typography className="notif-empty">
          У вас нет непрочитанных уведомлений
        </Typography>
      ) : (
        <List className="notifications-list">
          {notifs.map((n) => (
            <ListItem key={n.id} className="notification-item" disablePadding>
              {/* emoji-аватар */}
              <Box className="notif-emoji">{emoji(n.type)}</Box>

              <ListItemText
                primary={title(n)}
                secondary={iso(n.created_at)}
                className="notification-text"
              />

              <IconButton edge="end" onClick={() => markRead(n.id)}>
                ×
              </IconButton>
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
}
