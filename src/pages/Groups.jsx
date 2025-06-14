// src/pages/Groups.jsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import apiClient from "../utils/apiClient";

import GroupCreateModal from "../components/groups/GroupCreateModal";
import "../assets/css/MessagesList.css"; // стили от списка чатов

export default function Groups() {
  const currentUser = useSelector((s) => s.auth.user);
  const [groups, setGroups]     = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  // загружаем список групп
  const loadGroups = async () => {
    try {
      const { data } = await apiClient.get("/chats/groups/");
      setGroups(data);
    } catch (e) {
      console.error("Ошибка загрузки групп:", e);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // только админ, модератор или учитель могут создавать
  const canCreate = ["admin","moderator","teacher"].includes(currentUser.role);

  return (
    <div className="messages-list">
      <div className="flex justify-between items-center px-4 mb-4">
        <h2 className="text-xl font-bold">Групповые чаты</h2>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            ➕ Создать группу
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="messages-empty">Пока нет групп</div>
      ) : (
        groups.map((g) => (
          <Link
            key={g.id}
            to={`/groups/${g.id}`}
            className="chat-item"
          >
            <img
              src={g.avatar_url || "/group.png"}
              className="chat-avatar"
              alt=""
            />
            <div className="chat-info">
              <div className="chat-title">{g.name}</div>
              <div className="chat-last">ID: {g.id}</div>
            </div>
          </Link>
        ))
      )}

      {showCreate && (
        <GroupCreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadGroups();
          }}
        />
      )}
    </div>
);
}
