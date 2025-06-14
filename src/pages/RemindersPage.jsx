import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../utils/apiClient";

const stageLabel = { 1: "-24 ч", 2: "-3 ч", 3: "Чек-ин", 4: "Прошёл" };

export default function RemindersPage() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await apiClient.get("/events/all-reminded/");
      // [{id, subscription:{event{title,id},user{full_name,id}}, stage}]
      setRows(data.results || data);
    })();
  }, []);

  if (!rows) return <p style={{ padding: 24 }}>Loading…</p>;
  if (!rows.length) return <p style={{ padding: 24 }}>Напоминаний нет</p>;

  return (
    <div style={{ maxWidth: 1100, margin: "20px auto" }}>
      <h2>Event Reminders log</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Event</th>
            <th>User</th>
            <th>Stage</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
              <td>
                <Link to={`/events/calendar`} state={{ scrollTo: r.subscription.event.id }}>
                  {r.subscription.event.title}
                </Link>
              </td>
              <td>{r.subscription.user.full_name}</td>
              <td align="center">{stageLabel[r.stage] || r.stage}</td>
              <td align="center">{r.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
