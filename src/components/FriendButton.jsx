// src/components/FriendButton.jsx
import React from "react";

const API = "http://127.0.0.1:8000/api/friends";

/**
 * Компонент единой кнопки действий дружбы.
 * Для «outgoing_declined_request» выводит две отдельные кнопки.
 */
export default function FriendButton({
  status,        // строковый статус из /friends/status/
  requestId,     // id заявки (если есть) для pending / incoming
  userId,        // id человека, чей профиль мы смотрим
  token,
  onStatusChange // callback → перечитать статус/списки на фронте
}) {
  /* -------------------------------------------------- utils */
  const api = (url, method = "GET", body) =>
    fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body && { "Content-Type": "application/json" })
      },
      ...(body && { body: JSON.stringify(body) })
    });

  /* повторная отправка после отказа */
  const resend = async () => {
    // ищем свою отклонённую исходящую
    const outgoing = await api(`${API}/outgoing/`).then(r => r.json());
    const declined = outgoing.find(r => r.to_user.id === userId && r.status === "declined");
    if (!declined) return alert("Отклонённая заявка не найдена");

    await api(`${API}/cancel/${declined.id}/`, "DELETE");  // удаляем
    await api(`${API}/send/${userId}/`, "POST");           // шлём новую
    onStatusChange();
  };

  /* удалить отклонённую (или pending) заявку */
  const removeDeclined = async () => {
    const outgoing = await api(`${API}/outgoing/`).then(r => r.json());
    const declined = outgoing.find(r => r.to_user.id === userId && r.status === "declined");
    if (!declined) return alert("Заявка не найдена");
    await api(`${API}/cancel/${declined.id}/`, "DELETE");
    onStatusChange();
  };

  /* базовые действия */
  const send    = () => api(`${API}/send/${userId}/`, "POST").then(onStatusChange);
  const cancel  = () => api(`${API}/cancel/${requestId}/`, "DELETE").then(onStatusChange);
  const remove  = () => api(`${API}/remove/${userId}/`, "DELETE").then(onStatusChange);
  const accept  = () => api(`${API}/respond/${requestId}/`, "POST", { action: "accept"  }).then(onStatusChange);
  const decline = () => api(`${API}/respond/${requestId}/`, "POST", { action: "decline" }).then(onStatusChange);

  /* -------------------------------------------------- UI */
  switch (status) {
    /* ============ ваша заявка отклонена ============ */
    case "outgoing_declined_request":
      return (
        <>
          <button onClick={resend}        className="friend-btn">🔁 Повторить</button>
          <button onClick={removeDeclined} className="friend-btn gray">🗑 Удалить</button>
        </>
      );

    /* ============ нет отношений / входящий отклонён ============ */
    case "None":
    case "no_relation":
    case "incoming_declined_request":
      return (
        <button onClick={send} className="friend-btn">
          ➕ Добавить в друзья
        </button>
      );

    /* ============ исходящий pending ============ */
    case "outgoing_request":
    case "outgoing":
      return (
        <button onClick={cancel} className="friend-btn gray">
          ⏳ Заявка отправлена
        </button>
      );

    /* ============ входящий pending ============ */
    case "incoming_request":
    case "incoming":
      return (
        <>
          <button onClick={accept}  className="friend-btn">✅ Принять</button>
          <button onClick={decline} className="friend-btn gray">❌ Отклонить</button>
        </>
      );

    /* ============ уже друзья ============ */
    case "friends":
      return (
        <button onClick={remove} className="friend-btn red">
          👥 Удалить из друзей
        </button>
      );

    default:
      return null;   // self или неизвестный статус
  }
}
