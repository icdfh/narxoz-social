// src/components/chat/ManageMembersModal.jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import apiClient from "../../utils/apiClient";
import AddUserModal from "../groups/AddUserModal";
import "./ManageMembersModal.css";

export default function ManageMembersModal({ chatId, onClose, onUpdated }) {
  const currentUser = useSelector(s => s.auth.user);
  const [info, setInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const canManage = info && (
    info.owner_id === currentUser.id ||
    ["admin","moderator","teacher","organization"].includes(currentUser.role)
  );

  // Загрузка профиля группы + участников
  const load = async () => {
    try {
      const { data } = await apiClient.get(`/chats/${chatId}/detail/`);
      setInfo(data);
      setName(data.name || "");
      const profs = await Promise.all(
        data.members.map(uid =>
          apiClient
            .get(`/users/profile/${uid}/`)
            .then(r => r.data)
            .catch(() => ({ id: uid, full_name: "Unknown", nickname: "?", avatar_path: null }))
        )
      );
      setMembers(profs);
    } catch {
      setError("Не удалось загрузить данные группы");
    }
  };

  useEffect(() => {
    load();
  }, [chatId]);

  // Сохранение (name + новый avatar_url)
  const handleUpdate = async () => {
    if (!name.trim()) {
      setError("Название не может быть пустым");
      return;
    }
    // без avatarFile сервер даёт 415, поэтому принудительно требуем файл
    if (!avatarFile) {
      setError("Чтобы изменить название, загрузите новый аватар");
      return;
    }
    const form = new FormData();
    form.append("name", name);
    form.append("avatar_url", avatarFile);
    try {
      await apiClient.patch(`/chats/${chatId}/update/`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditMode(false);
      setError("");
      onUpdated?.();
      load();
    } catch (e) {
      console.error(e);
      setError("Не удалось сохранить изменения");
    }
  };

  // Удалить участника
  const handleRemove = async uid => {
    if (!window.confirm("Удалить этого участника?")) return;
    try {
      await apiClient.post(`/chats/${chatId}/remove/`, { user_id: uid });
      load();
    } catch {
      alert("Ошибка при удалении участника");
    }
  };

  // Удалить группу
  const handleDeleteGroup = async () => {
    if (!window.confirm("Удалить всю группу?")) return;
    try {
      await apiClient.delete(`/chats/${chatId}/delete/`);
      onClose();
    } catch {
      alert("Не удалось удалить группу");
    }
  };

  if (!info) return null;

  return (
    <div className="mmm-backdrop">
      <div className="mmm-modal">
        <h2 className="mmm-title">Управление группой</h2>
        {error && <div className="mmm-error">{error}</div>}

        {canManage && (editMode
          ? (
            <div className="mmm-edit">
              <input
                type="text"
                className="mmm-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Название группы"
              />
              <input
                type="file"
                className="mmm-input"
                onChange={e => {
                  setAvatarFile(e.target.files[0]);
                  setError("");
                }}
              />
              <div className="mmm-actions">
                <button
                  className="mmm-btn mmm-save"
                  onClick={handleUpdate}
                  disabled={!avatarFile}
                >
                  Сохранить
                </button>
                <button
                  className="mmm-btn mmm-cancel"
                  onClick={() => {
                    setEditMode(false);
                    setError("");
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          )
          : (
            <div className="mmm-info">
              <img
                src={info.avatar_url || "/group.png"}
                alt=""
                className="mmm-avatar"
              />
              <div>
                <div className="mmm-name">{info.name}</div>
                <div className="mmm-id">ID: {chatId}</div>
              </div>
              <button
                className="mmm-btn mmm-edit-btn"
                onClick={() => {
                  setEditMode(true);
                  setError("");
                }}
              >
                ✏️ Редактировать
              </button>
            </div>
          )
        )}

        <h3 className="mmm-subtitle">Участники ({members.length})</h3>
        <div className="mmm-members">
          {members.map(m => (
            <div key={m.id} className="mmm-member">
              <img
                src={m.avatar_path || "/avatar.jpg"}
                alt=""
                className="mmm-member-avatar"
              />
              <span className="mmm-member-name">
                {m.full_name || m.nickname}
              </span>
              {canManage && m.id !== info.owner_id && (
                <button
                  className="mmm-btn mmm-remove"
                  onClick={() => handleRemove(m.id)}
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>

        {canManage && (
          <button
            className="mmm-btn mmm-add"
            onClick={() => setShowAdd(true)}
          >
            ➕ Добавить участника
          </button>
        )}

        <div className="mmm-actions mmm-bottom-actions">
          {canManage && (
            <button
              className="mmm-btn mmm-delete-group"
              onClick={handleDeleteGroup}
            >
              Удалить группу
            </button>
          )}
          <button className="mmm-btn mmm-close" onClick={onClose}>
            Закрыть
          </button>
        </div>

        {showAdd && (
          <AddUserModal
            chatId={chatId}
            currentMembers={info.members}
            afterAdd={() => {
              setShowAdd(false);
              load();
            }}
            onClose={() => setShowAdd(false)}
          />
        )}
      </div>
    </div>
  );
}
