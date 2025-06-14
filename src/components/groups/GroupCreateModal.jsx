import React, { useEffect, useState, useRef, useMemo } from "react";
import apiClient from "../../utils/apiClient";
import "../../assets/css/GroupCreateModal.css";

function GroupCreateModal({ onClose }) {
  const [groupName, setGroupName]     = useState("");
  const [avatarFile, setAvatarFile]   = useState(null);
  const [friends, setFriends]         = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [query, setQuery]               = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const timer = useRef(null);

  // 1) Подгружаем список друзей
  useEffect(() => {
    apiClient.get("/friends/list/")
      .then(res => setFriends(res.data))
      .catch(err => console.error("Ошибка загрузки друзей:", err));
  }, []);

  // 2) Поиск пользователей при query.length ≥ 2 (дебаунс 300мс)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setLoading(false);
      setError("");
      return;
    }

    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await apiClient.get("/search/users/", {
          params: { q }
        });
        const list = Array.isArray(data) ? data : (data.results || []);
        setSearchResults(list);
      } catch (err) {
        console.error("Search error:", err);
        setError("Не удалось выполнить поиск");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer.current);
  }, [query]);

  // 3) Отображаем либо searchResults, либо friends, фильтруем по запросу и убираем уже выбранных
  const displayList = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q.length >= 2 ? searchResults : friends;
    return base
      .filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.nickname?.toLowerCase().includes(q)  ||
        u.login?.toLowerCase().includes(q)
      )
      .filter(u => !selectedIds.includes(u.id));
  }, [query, searchResults, friends, selectedIds]);

  const toggleCheckbox = id => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!groupName.trim() || selectedIds.length === 0) {
      alert("Укажите название и выберите хотя бы одного участника.");
      return;
    }

    const formData = new FormData();
    formData.append("name", groupName.trim());
    if (avatarFile) formData.append("avatar", avatarFile);
    selectedIds.forEach(id => formData.append("members", id));

    try {
      await apiClient.post("/chats/group/create/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      onClose();
    } catch (err) {
      console.error("Ошибка создания группы:", err);
      alert("Ошибка при создании группы. Проверьте данные.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2 className="modal-title">Создать новую группу</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Название группы"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            required
            className="group-search-input"
          />

          <input
            type="file"
            accept="image/*"
            onChange={e => setAvatarFile(e.target.files[0])}
          />

          <input
            type="text"
            className="group-search-input"
            placeholder="Поиск пользователей…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {loading && <div className="gc-loading">Поиск…</div>}
          {error   && <div className="gc-error">{error}</div>}

          <div className="gc-users-list">
            {displayList.map(u => (
              <label key={u.id} className="gc-user-item">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(u.id)}
                  onChange={() => toggleCheckbox(u.id)}
                />
                <img
                  src={u.avatar_path || "/avatar.jpg"}
                  alt="avatar"
                  className="gc-user-avatar"
                />
                <span>{u.full_name || u.nickname} (@{u.nickname})</span>
              </label>
            ))}
            {displayList.length === 0 && (
              <div className="gc-empty">
                {query.trim().length >= 2
                  ? "Ничего не найдено"
                  : "Список друзей пуст или все выбраны"}
              </div>
            )}
          </div>

          <button type="submit" className="submit-btn">Создать</button>
          <button type="button" className="cancel-btn" onClick={onClose}>
            Отмена
          </button>
        </form>
      </div>
    </div>
  );
}

// ОБЯЗАТЕЛЬНО добавляем default-экспорт:
export default GroupCreateModal;
