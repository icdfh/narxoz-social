// src/components/chat/MessagesList.jsx

import React from "react";
import "../../assets/css/MessagesList.css";

// Построитель полного URL для аватаров
function getFullUrl(path) {
  if (!path) {
    // дефолт из public/
    return `${window.location.origin}/avatar.jpg`;
  }
  if (path.startsWith("http")) {
    return path;
  }
  // относительный путь
  return path.startsWith("/")
    ? `${window.location.origin}${path}`
    : `${window.location.origin}/${path}`;
}

export default function MessagesList({
  chats,
  userMap,
  currentUserId,
  onChatClick
}) {
  return (
    <div className="messages-list">
      {chats.map(c => {
        const otherId =
          c.type === "direct"
            ? c.members.find(id => id !== currentUserId)
            : null;
        const other = otherId ? userMap[otherId] || {} : {};

        const isOnline = other.is_online === true;
        const statusClass = isOnline ? "online" : "offline";

        const label =
          c.type === "group"
            ? c.name || "#"
            : other.full_name || other.nickname || "User";

        let rawPath;
        if (c.type === "group") {
          rawPath = c.avatar_url || null;
        } else {
          rawPath = other.avatar_path || other.avatar_url || null;
        }
        const avatarUrl = rawPath
          ? getFullUrl(rawPath)
          : `${window.location.origin}/avatar.jpg`;

        const unread = c.unread || 0;

        return (
          <div
            key={c.id}
            className="chat-item"
            onClick={() => onChatClick(c)}
          >
            <div className="avatar-wrap">
              <img
                src={avatarUrl}
                alt="avatar"
                className="chat-avatar"
              />
              {c.type === "direct" && otherId && (
                <span className={`friend-status ${statusClass}`} />
              )}
            </div>

            <div className="chat-info">
              <div className="chat-title">{label}</div>
              <div className="chat-last">{c.last_message?.text || ""}</div>
            </div>

            {unread > 0 && <span className="chat-badge">{unread}</span>}
          </div>
        );
      })}
    </div>
  );
}
