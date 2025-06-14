// src/components/groups/AddUserModal.jsx

import React, { useState, useRef, useEffect, useMemo } from "react";
import apiClient from "../../utils/apiClient";
import "./AddUserModal.css";

export default function AddUserModal({ chatId, currentMembers = [], afterAdd, onClose }) {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const timer = useRef(null);

  // Поиск на бэкенде (вызывается после 300 мс паузы и не раньше, чем 2 символа)
  const handleChange = e => {
    const q = e.target.value;
    setQuery(q);
    setError("");
    clearTimeout(timer.current);
    setResults([]);

    if (q.trim().length < 2) return;

    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get("/search/users/", { params: { q: q.trim() } });
        setResults(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        console.error("Search error:", err);
        setError("Не удалось выполнить поиск");
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // Локальная фильтрация по query
  const filteredResults = useMemo(() => {
    const ql = query.trim().toLowerCase();
    return results.filter(u => {
      if (currentMembers.includes(u.id)) return false;
      return (
        u.full_name?.toLowerCase().includes(ql) ||
        u.nickname?.toLowerCase().includes(ql) ||
        u.login?.toLowerCase().includes(ql)
      );
    });
  }, [results, query, currentMembers]);

  // Добавление в группу
  const handleAdd = async userId => {
    try {
      await apiClient.post(`/chats/${chatId}/add/`, { user_id: userId });
      afterAdd();
      onClose();
    } catch {
      setError("Не удалось добавить пользователя");
    }
  };

  return (
    <div className="aum-backdrop">
      <div className="aum-modal">
        <h3 className="aum-title">Добавить участника</h3>
        <input
          type="text"
          className="aum-search"
          placeholder="Имя, ник или логин…"
          value={query}
          onChange={handleChange}
          autoFocus
        />
        {error && <div className="aum-error">{error}</div>}
        {loading && <div className="aum-loading">Поиск…</div>}

        {!loading && query.trim().length >= 2 && filteredResults.length === 0 && (
          <div className="aum-empty">Ничего не найдено</div>
        )}

        <ul className="aum-list">
          {filteredResults.map(u => (
            <li key={u.id} className="aum-item">
              <div className="aum-info">
                <img src={u.avatar_path || "/avatar.jpg"} className="aum-avatar" alt="" />
                <div className="aum-text">
                  <div className="aum-name">{u.full_name || u.nickname}</div>
                  <div className="aum-nick">@{u.nickname}</div>
                </div>
              </div>
              <button className="aum-add-btn" onClick={() => handleAdd(u.id)}>➕</button>
            </li>
          ))}
        </ul>

        <div className="aum-actions">
          <button className="aum-close-btn" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}
