// src/components/events/SubscribersModal.jsx
import React, { useEffect, useState } from "react";
import cls from "./SubscribersModal.module.css";
import apiClient from "../../utils/apiClient";

export default function SubscribersModal({ open, eventId, canKick, onClose }) {
  const [list, setList] = useState(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await apiClient.get(
        `/events/subscriptions/by-event/${eventId}/`
      );
      setList(data);                             // [{id, user:{id,full_name,avatar}}]
    })();
  }, [open, eventId]);

  if (!open) return null;

  const kick = async (userId) => {
    await apiClient.post(`/events/unsubscribe/${eventId}/`, { user_id: userId });
    setList((prev) => prev.filter((s) => s.user.id !== userId));
  };

  return (
    <div className={cls.backdrop} onClick={onClose}>
      <div className={cls.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Subscribers</h3>
        {!list && <p>Loading…</p>}
        {list?.length === 0 && <p>No subscribers yet</p>}

        {list && list.map((s) => (
          <div key={s.id} className={cls.row}>
            <img src={s.user.avatar} alt="" />
            <span>{s.user.full_name}</span>
            {canKick && (
              <button onClick={() => kick(s.user.id)}>Kick</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
