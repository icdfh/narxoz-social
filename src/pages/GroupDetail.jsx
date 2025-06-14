// src/pages/GroupDetail.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import apiClient from "../utils/apiClient";

import AddUserModal from "../components/groups/AddUserModal";

export default function GroupDetail() {
  const { chatId }     = useParams();
  const navigate       = useNavigate();
  const currentUser    = useSelector(s => s.auth.user);

  const [group, setGroup]       = useState(null);
  const [members, setMembers]   = useState([]);
  const [showAdd, setShowAdd]   = useState(false);

  // права: владелец или админ/модератор/teacher
  const isOwner   = group?.owner_id === currentUser.id;
  const canManage = isOwner || ["admin","moderator","teacher"].includes(currentUser.role);

  // загрузка деталей
  const load = async () => {
    try {
      const { data } = await apiClient.get(`/chats/${chatId}/detail/`);
      setGroup(data);
      setMembers(data.members);
    } catch (e) {
      console.error("Ошибка загрузки группы:", e);
    }
  };

  useEffect(() => {
    load();
  }, [chatId]);

  const leaveGroup = async () => {
    await apiClient.post(`/chats/${chatId}/leave/`);
    navigate("/groups");
  };

  const deleteGroup = async () => {
    if (!window.confirm("Удалить группу?")) return;
    await apiClient.delete(`/chats/${chatId}/delete/`);
    navigate("/groups");
  };

  return (
    <div className="mx-auto max-w-2xl p-4">
      {!group ? (
        <p>Загрузка…</p>
      ) : (
      <>
        <div className="mb-4 flex items-center gap-4">
          <img
            src={group.avatar_url || "/group.png"}
            alt=""
            className="h-20 w-20 rounded-full object-cover"
          />
          <div>
            <h2 className="text-2xl font-bold">{group.name}</h2>
            <p className="text-sm text-gray-500">ID: {chatId}</p>
          </div>
        </div>

        <h3 className="mb-2 text-lg font-semibold">Участники</h3>
        <ul className="mb-6">
          {members.map(uid => (
            <li key={uid} className="flex items-center gap-2 mb-2">
              {/* подтягиваем профиль каждого */}
              <MemberAvatar id={uid} />
            </li>
          ))}
        </ul>

        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="mb-4 rounded bg-blue-600 px-4 py-2 text-white"
          >
            ➕ Добавить участника
          </button>
        )}

        {isOwner || ["admin","moderator"].includes(currentUser.role) ? (
          <button
            onClick={deleteGroup}
            className="rounded bg-red-600 px-4 py-2 text-white"
          >
            🗑 Удалить группу
          </button>
        ) : (
          <button
            onClick={leaveGroup}
            className="rounded bg-gray-800 px-4 py-2 text-white"
          >
            🚪 Выйти из группы
          </button>
        )}

        {showAdd && (
          <AddUserModal
            chatId={chatId}
            currentMembers={members}
            afterAdd={() => {
              load();
              setShowAdd(false);
            }}
            onClose={() => setShowAdd(false)}
          />
        )}
      </>
      )}
    </div>
  );
}

// вспомогательный компонент для аватара + имя
function MemberAvatar({ id }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    apiClient.get(`/users/profile/${id}/`)
      .then(res => setUser(res.data))
      .catch(() => setUser({ full_name: "?", avatar_path: null }));
  }, [id]);

  if (!user) return <span>…</span>;
  return (
    <>
      <img
        src={user.avatar_path || "/avatar.jpg"}
        alt=""
        className="h-8 w-8 rounded-full object-cover"
      />
      <span>{user.full_name || user.nickname}</span>
    </>
  );
}
