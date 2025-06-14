// src/pages/ReportSettings.jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient.js";
import "../../assets/css/ReportSettings.css";

export default function ReportSettings() {
  const user      = useSelector((s) => s.auth.user);
  const navigate  = useNavigate();

  const [tab, setTab]               = useState("my");     // my | all
  const [complaints, setComplaints] = useState([]);
  const [postInfo,  setPostInfo]    = useState({});
  const [userInfo,  setUserInfo]    = useState({});

  /* ---------- load complaints ---------- */
  const loadComplaints = async () => {
    try {
      const url   = tab === "all" ? "/complaints/all/" : "/complaints/my/";
      const res   = await apiClient.get(url);
      const list  = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.results)
        ? res.data.results
        : [];
      setComplaints(list);
      fetchDetails(list);
    } catch (e) {
      console.error("Не удалось загрузить жалобы:", e);
      setComplaints([]);
    }
  };

  /* ---------- fetch post/user titles ---------- */
  const fetchDetails = (list) => {
    list.forEach((c) => {
      if (c.content_type === "post" && !postInfo[c.id]) {
        apiClient.get(`/posts/${c.object_id}/`).then(({ data }) =>
          setPostInfo((p) => ({
            ...p,
            [c.id]: {
              title:  data.content.slice(0, 50) + (data.content.length > 50 ? "…" : ""),
              author: data.author,
            },
          }))
        );
      }
      if (c.content_type === "user" && !userInfo[c.id]) {
        apiClient.get(`/users/profile/${c.object_id}/`).then(({ data }) =>
          setUserInfo((u) => ({
            ...u,
            [c.id]: {
              full_name: data.full_name,
              nickname : data.nickname,
              avatar   : data.avatar_path,
            },
          }))
        );
      }
    });
  };

  useEffect(() => { loadComplaints(); }, [tab]);

  const canNavigate = user.role === "admin" || tab === "my";

  return (
    <div className="report-settings-container">
      {["moderator", "admin"].includes(user.role) && (
        <div className="report-tabs">
          <button className={tab === "my"  ? "active" : ""} onClick={() => setTab("my")}>Мои жалобы</button>
          <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>Все жалобы</button>
        </div>
      )}

      <ul className="complaint-list">
        {complaints.length === 0 ? (
          <li className="no-complaints">Жалоб нет</li>
        ) : (
          complaints.map((c) => {
            const info =
              c.content_type === "post" ? postInfo[c.id] : userInfo[c.id];

            const title =
              c.content_type === "post"
                ? `Пост: “${info?.title || "#"}”`
                : `Пользователь: ${info?.full_name || "#"}`;

            return (
              <li
                key={c.id}
                className={`complaint-item ${canNavigate ? "clickable" : "disabled"}`}
                onClick={() => canNavigate && navigate(`${c.id}`)}
              >
                <div className="complaint-header">
                  <span className="complaint-id">#{c.id}</span>
                  <span className="complaint-title">{title}</span>
                </div>

                {c.content_type === "user" && info && (
                  <div className="complaint-user">
                    <img
                      src={info.avatar || "/avatar.jpg"}
                      alt=""
                      className="complaint-user-avatar"
                    />
                    <span className="complaint-user-name">
                      {info.full_name} @{info.nickname}
                    </span>
                  </div>
                )}

                <div className="complaint-meta">
                  <span className={`status-badge ${c.status.toLowerCase()}`}>
                    {c.status}
                  </span>
                  <span className="complaint-date">
                    {new Date(c.created_at).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
