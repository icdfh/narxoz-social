// src/components/events/SubscriptionDetailModal.jsx
import React, { useEffect, useState } from "react";
import cls from "./SubscriptionDetailModal.module.css";
import apiClient from "../../utils/apiClient";

const fmt = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function SubscriptionDetailModal({ open, subId, onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await apiClient.get(`/events/subscription/${subId}/`);
      setData(data);
    })();
  }, [open, subId]);

  if (!open) return null;

  return (
    <div className={cls.backdrop} onClick={onClose}>
      <div className={cls.modal} onClick={(e)=>e.stopPropagation()}>
        {!data ? (
          <p>Loading…</p>
        ) : (
          <>
            <h3>{data.event.title}</h3>
            <p><b>Start:</b> {fmt(data.event.start_at)}</p>
            {data.event.end_at && <p><b>End:</b> {fmt(data.event.end_at)}</p>}
            <p><b>By:</b> {data.event.created_by.full_name}</p>
            <p><b>Stage:</b> {data.eventreminder?.stage ?? "n/a"}</p>
            <button onClick={onClose} className={cls.closeBtn}>Close</button>
          </>
        )}
      </div>
    </div>
  );
}
