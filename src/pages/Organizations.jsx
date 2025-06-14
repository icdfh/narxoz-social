// src/pages/Organizations.jsx

import React, { useEffect, useState } from "react";
import { useNavigate }     from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import apiClient           from "../utils/apiClient";
import { loadOrganizations } from "../store/organizationSlice";

import groupsIcon   from "../assets/icons/friends.svg";
import threeDotsIcon from "../assets/icons/more.svg";
import chatIcon     from "../assets/icons/Chats.svg";
import searchIcon   from "../assets/icons/search.svg";

import "../assets/css/Organizations.css";

// вычисляем базовый адрес бэка из axios.baseURL без /api/
const BACKEND_URL = apiClient.defaults.baseURL.replace(/\/api\/?$/, "");

/** формирует абсолютный URL для аватара */
const buildUrl = (path) => {
  if (!path) return "/avatar.jpg";
  if (/^https?:\/\//.test(path)) return path;
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${BACKEND_URL}${clean}`;
};

export default function Organizations() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: orgs, loading, error } = useSelector(s => s.organizations);

  const [searchQuery,   setSearchQuery]   = useState("");
  const [filtered,      setFiltered]      = useState([]);
  const [outgoingReqs,  setOutgoingReqs]  = useState(new Set());

  // загрузка организаций + исходящих запросов
  useEffect(() => {
    dispatch(loadOrganizations());
    apiClient.get("/friends/outgoing/").then(res => {
      const ids = (res.data || [])
        .filter(r => r.status === "pending")
        .map(r => r.to_user.id);
      setOutgoingReqs(new Set(ids));
    });
  }, [dispatch]);

  // фильтрация по поиску
  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      setFiltered(orgs.filter(o =>
        o.full_name.toLowerCase().includes(q) ||
        o.nickname.toLowerCase().includes(q)
      ));
    } else {
      setFiltered([]);
    }
  }, [searchQuery, orgs]);

  const toShow = filtered.length ? filtered : orgs;

  // начать чат
  const startChat = async (orgId) => {
    try {
      const { data } = await apiClient.post(`/chats/direct/${orgId}/`);
      navigate(`/messages/${data.chat_id}`);
    } catch (e) {
      console.error("Не удалось открыть чат:", e);
    }
  };

  // отправить заявку в друзья
  const sendRequest = async (orgId) => {
    try {
      await apiClient.post(`/friends/send/${orgId}/`);
    } catch (e) {
      // если заявка уже есть — игнорируем
      if (e.response?.data?.error !== "Уже существует активный запрос") {
        console.error(e);
        return;
      }
    }
    setOutgoingReqs(prev => new Set(prev).add(orgId));
  };

  if (loading) return <p className="friends-empty">Загрузка организаций…</p>;
  if (error)   return <p className="friends-empty">{error}</p>;
  if (!toShow.length) return <p className="friends-empty">Нет организаций</p>;

  return (
    <div className="friends-page">
      <div className="friends-header">
        <div className="friends-header-left">
          <img src={groupsIcon}     className="friends-icon"    alt="Organizations" />
          <span className="friends-title">Organizations</span>
        </div>
        <div className="friends-header-right">
          <div className="friends-search">
            <input
              type="text"
              className="friends-search-input"
              placeholder="Search organizations…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <img
              src={searchIcon}
              className="friends-search-icon"
              alt="Search"
            />
          </div>
        </div>
      </div>

      <div className="friends-list">
        {toShow.map(org => {
          const isPending = outgoingReqs.has(org.id);
          return (
            <div key={org.id} className="friend-card">
              <div className="friend-left">
                <div className="avatar-wrap">
                  <img
                    src={buildUrl(org.avatar_path || org.avatar_url)}
                    className="friend-avatar"
                    alt={org.nickname}
                  />
                  <span className={`friend-status ${org.is_online ? "online" : "offline"}`} />
                </div>
                <div className="friend-info">
                  <span className="friend-name">{org.full_name}</span>
                  <span className="friend-nick">@{org.nickname}</span>
                </div>
              </div>
              <div className="friend-right">
                <img
                  src={threeDotsIcon}
                  className="friend-more"
                  alt="Profile"
                  onClick={() => navigate(`/profile/${org.id}`)}
                />
                <button
                  className={`friend-add-btn ${isPending ? "disabled" : ""}`}
                  onClick={() => !isPending && sendRequest(org.id)}
                  disabled={isPending}
                >
                  {isPending ? "⏳ Отправлено" : "+ Добавить"}
                </button>
                <img
                  src={chatIcon}
                  className="friend-chat"
                  alt="Chat"
                  onClick={() => startChat(org.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
