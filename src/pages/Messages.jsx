import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";
import MessagesList from "../components/chat/MessagesList";
import GroupCreateModal from "../components/groups/GroupCreateModal";

import chatIcon from "../assets/icons/Chats.svg";
import searchIcon from "../assets/icons/search.svg";
import "../assets/css/Friends.css";

const TABS = ["All", "Personals", "Groups"];

export default function Messages() {
  const currentUser = useSelector((s) => s.auth.user);
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [error, setError] = useState("");

  const canCreateGroup =
    currentUser && ["admin", "moderator", "teacher"].includes(currentUser.role);

  const loadChats = async () => {
    setError("");
    // 1) Загрузить список чатов
    let data;
    try {
      const res = await apiClient.get("/chats/allchats/");
      data = res.data;
      setChats(data);
    } catch (e) {
      const status = e.response?.status;
      const body = e.response?.data;
      console.error("loadChats error:", status, body);
      // Покажем либо JSON-ошибку, либо статус
      if (body && typeof body === "object") {
        setError(JSON.stringify(body));
      } else {
        setError(`Ошибка ${status}: ${body}`);
      }
      return;
    }

    // 2) Подтянуть профили пользователей в direct-чатах (не критично)
    const missing = data
      .filter((c) => c.type === "direct")
      .map((c) => c.members.find((id) => id !== currentUser.id))
      .filter((id) => id && !userMap[id]);

    if (missing.length) {
      const map = { ...userMap };
      await Promise.all(
        missing.map(async (id) => {
          try {
            const { data: ud } = await apiClient.get(
              `/users/profile/${id}/`
            );
            map[id] = ud;
          } catch (err) {
            console.warn(`Не удалось загрузить профиль ${id}`, err.response?.data || err.message);
          }
        })
      );
      setUserMap(map);
    }
  };

  useEffect(() => {
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const personalBadge = chats
    .filter((c) => c.type === "direct")
    .reduce((sum, c) => sum + (c.unread || 0), 0);

  const groupBadge = chats
    .filter((c) => c.type === "group")
    .reduce((sum, c) => sum + (c.unread || 0), 0);

  const handleClick = async (c) => {
    try {
      await apiClient.post(`/chats/${c.id}/read/`);
      setChats((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x))
      );
    } catch (err) {
      console.error("mark-read error:", err.response || err);
    }
    navigate(c.type === "group" ? `/groups/${c.id}/chat` : `/messages/${c.id}`);
  };

  const filtered = chats.filter((c) => {
    if (tab === "Personals" && c.type !== "direct") return false;
    if (tab === "Groups" && c.type !== "group") return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const label =
        c.type === "group"
          ? c.name
          : userMap[c.members.find((id) => id !== currentUser.id)]?.full_name || "";
      const last = c.last_message?.text || "";
      return (label + last).toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="friends-page">
      {error && <div className="friends-error">{error}</div>}

      <div className="friends-header">
        <div className="friends-header-left">
          <img src={chatIcon} className="friends-icon" alt="Chats" />
          <span className="friends-title">Chats</span>
          <div className="friends-tabs">
            {TABS.map((t) => (
              <button
                key={t}
                className={`friends-tab ${tab === t ? "active" : ""}`}
                onClick={() => {
                  setTab(t);
                  setSearch("");
                }}
              >
                {t}
                {t === "Personals" && personalBadge > 0 && (
                  <span className="tab-badge">{personalBadge}</span>
                )}
                {t === "Groups" && groupBadge > 0 && (
                  <span className="tab-badge">{groupBadge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="friends-header-right">
          <div className="friends-search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="friends-search-input"
              placeholder="Поиск чатов…"
            />
            <img src={searchIcon} className="friends-search-icon" alt="Search" />
          </div>

          {canCreateGroup && (
            <button
              onClick={() => setShowGroupModal(true)}
              className="friends-add-btn"
            >
              ➕ Создать группу
            </button>
          )}
        </div>
      </div>

      <MessagesList
        chats={filtered}
        userMap={userMap}
        currentUserId={currentUser.id}
        onChatClick={handleClick}
      />

      {showGroupModal && (
        <GroupCreateModal
          onClose={() => {
            setShowGroupModal(false);
            loadChats();
          }}
        />
      )}
    </div>
  );
}
