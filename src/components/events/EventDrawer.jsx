import React, { useState } from "react";
import cls from "./EventDrawer.module.css";
import apiClient from "../../utils/apiClient";
import EventFormModal from "./EventFormModal";

const fmt = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function EventDrawer({
  open,
  event,
  onClose,
  onSubscribe,
  onUnsubscribe,
  isSubscribed,
  reload,
  meRole,
}) {
  /* ───────── guards ───────── */
  if (!open || !event) return null;

  /* ───────── local state ───────── */
  const [busy, setBusy]       = useState(false);
  const [showForm, setShowForm] = useState(false);

  /* ───────── derived flags ───────── */
  const now          = new Date();
  const started      = new Date(event.start_at) <= now;
  const canEdit      = event.owned || ["moderator", "admin"].includes(meRole);
  const canSubscribe = !event.owned && !started;

  /* ───────── subscribe / unsubscribe ───────── */
  const toggleSub = async () => {
    setBusy(true);
    try {
      if (isSubscribed) {
        await onUnsubscribe(event.id);
      } else {
        await onSubscribe(event.id);
      }
      reload();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Ошибка подписки";
      alert(msg);                               // показываем причину
    } finally {
      setBusy(false);
    }
  };

  /* ───────── delete ───────── */
  const del = async () => {
    if (!window.confirm("Delete this event?")) return;
    await apiClient.delete(`/events/${event.id}/`);
    reload();
    onClose();
  };

  /* ───────── render ───────── */
  return (
    <div className={cls.backdrop} onClick={onClose}>
      <aside className={cls.drawer} onClick={(e) => e.stopPropagation()}>
        <button className={cls.closeBtn} onClick={onClose}>
          ×
        </button>

        <h3>{event.title}</h3>
        <p>
          <b>When:</b> {fmt(event.start_at)} —{" "}
          {fmt(event.end_at || event.start_at)}
        </p>
        <p>
          <b>By:</b> {event.created_by.full_name}
        </p>
        {event.description && <p className={cls.desc}>{event.description}</p>}

        {event.owned && <p className={cls.note}>Это ваше событие</p>}
        {started && !event.owned && (
          <p className={cls.note}>Событие уже прошло</p>
        )}

        {/* кнопка Subscribe / Unsubscribe */}
        {canSubscribe && (
          <button
            className={isSubscribed ? cls.unsubBtn : cls.subBtn}
            onClick={toggleSub}
            disabled={busy}
          >
            {isSubscribed ? "Unsubscribe" : "Subscribe"}
          </button>
        )}

        {/* Edit / Delete для owner и модераторов */}
        {canEdit && (
          <div className={cls.edControls}>
            <button onClick={() => setShowForm(true)}>Edit</button>
            <button onClick={del} className={cls.delBtn}>
              Delete
            </button>
          </div>
        )}
      </aside>

      {/* форма редактирования */}
      {canEdit && (
        <EventFormModal
          open={showForm}
          initial={event}
          onClose={() => setShowForm(false)}
          onSuccess={reload}
        />
      )}
    </div>
  );
}
