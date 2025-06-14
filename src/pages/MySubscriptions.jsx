import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../utils/apiClient";
import SubscriptionDetailModal from "../components/events/SubscriptionDetailModal";

/* красивый дата-формат */
const fmt = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

/* ——————————————————————————————————————————————— */
export default function MySubscriptions() {
  const [tab, setTab]         = useState("active");          // active | finished
  const [rows, setRows]       = useState(null);
  const [detailId, setDetail] = useState(null);              // id подписки для модалки

  /* загрузка по вкладке */
  useEffect(() => {
    setRows(null);
    const url =
      tab === "active"
        ? "/events/my/active-subscriptions/"
        : "/events/my/finished-subscriptions/";

    (async () => {
      const { data } = await apiClient.get(url);
      setRows(Array.isArray(data) ? data : data.results || []);
    })();
  }, [tab]);

  /* ————————————————————— render ——————————————————— */
  if (!rows) return <p style={{ padding: 24 }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 1000, margin: "20px auto" }}>
      <h2>Мои подписки</h2>

      {/* вкладки */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button onClick={() => setTab("active")}
                style={tab==="active"?styles.tabActive:styles.tab}>Active</button>
        <button onClick={() => setTab("finished")}
                style={tab==="finished"?styles.tabActive:styles.tab}>Finished</button>
      </div>

      {rows.length === 0 ? (
        <p>{tab==="active" ? "Нет активных подписок" : "Нет прошедших подписок"}</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Event</th>
              <th>Date</th>
              <th>Author</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} style={{ borderTop: "1px solid #eee", cursor:"pointer" }}
                  onClick={() => setDetail(s.id)}>
                <td>{s.event.title}</td>
                <td align="center">{fmt(s.event.start_at)}</td>
                <td align="center">{s.event.created_by.full_name}</td>
                <td align="center">
                  {tab==="active" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); /* чтобы не открыть модалку */ 
                                        apiClient.post(`/events/unsubscribe/${s.event.id}/`)
                                                 .then(()=>setRows(prev=>prev.filter(r=>r.id!==s.id)));}}
                      style={styles.btnUnsub}
                    >
                      Unsub
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* модалка деталки */}
      <SubscriptionDetailModal
        open={!!detailId}
        subId={detailId}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}

/* inline-style */
const styles = {
  tab:       { padding:"4px 12px", border:"1px solid #ccc", borderRadius:12, background:"none", cursor:"pointer" },
  tabActive: { padding:"4px 12px", borderRadius:12, background:"#c81d3b", color:"#fff", border:"1px solid #c81d3b" },
  btnUnsub:  { background:"#ddd", border:"none", padding:"4px 10px", cursor:"pointer" },
};
