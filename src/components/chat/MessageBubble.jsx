

import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import "../../assets/css/MessagesBubble.css";

/* ───────── helpers ──────────────────────────────────────────── */
// базовый адрес бэка = axios.baseURL без /api/
const BACKEND_URL = apiClient.defaults.baseURL.replace(/\/api\/?$/, "");

/** абсолютный URL для медиа */
const fullUrl = (u) =>
  !u
    ? ""
    : /^https?:\/+/.test(u)
    ? u
    : `${BACKEND_URL}${u.startsWith("/") ? "" : "/"}${u}`;

/** компактная карточка файла / превью картинки */
const FileCard = ({ url, name }) => {
  const safe = name || url.split("/").pop().split("?")[0];
  const ext = (safe.split(".").pop() || "").toLowerCase();
  const icon =
    {
      pdf: "📄",
      doc: "📄",
      docx: "📄",
      xls: "📊",
      xlsx: "📊",
      ppt: "📑",
      pptx: "📑",
      zip: "🗜",
      rar: "🗜",
      txt: "📝",
    }[ext] || "📁";
  const img = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);

  return img ? (
    <a
      className="file-img-wrapper"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src={url} alt={safe} className="file-img-preview" />
    </a>
  ) : (
    <div className="file-card">
      <span className="file-ico">{icon}</span>
      <div className="file-meta">
        <span className="file-name">{safe}</span>
        <a className="file-dl" href={url} download={safe}>
          Скачать
        </a>
      </div>
    </div>
  );
};

/* ───────── компонент ───────────────────────────────────────── */
export default function MessageBubble({
  msg,
  currentUserId,
  sender,
  formatTime,
  onEdit,
  onDelete,
  onShare,
}) {
  const isOwn = msg.sender === currentUserId;

  /* ───── контекст‑меню ───── */
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    const h = (e) => !menuRef.current?.contains(e.target) && setMenuOpen(false);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  const openMenu = (e) => {
    if (!onEdit && !onDelete && !onShare) return;
    e.preventDefault();
    setMenuPos({ x: e.pageX, y: e.pageY });
    setMenuOpen(true);
  };

  /* ───── поддержка share_type: post ───── */
  const [post, setPost] = useState(null);
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    if (msg.share_type !== "post") return;

    const accept = (p) => {
      setPost(p);
      setAvatar(p.author_avatar_path || p.author_avatar_url || null);
    };

    if (typeof msg.share_id === "object") {
      accept(msg.share_id);
      return;
    }

    apiClient
      .get(`/posts/${msg.share_id}/`)
      .then((r) => accept(r.data))
      .catch(() => setPost(null));
  }, [msg]);

  useEffect(() => {
    if (!post || avatar) return;
    apiClient
      .get(`/users/profile/${post.author_id}/`)
      .then((r) => setAvatar(r.data.avatar_path || r.data.avatar_url || null))
      .catch(() => {});
  }, [post, avatar]);

  /* ───── confirm delete ───── */
  const [askDel, setAskDel] = useState(false);

  /* ───── content renderer ───── */
  const renderContent = () => {
    /* share: message */
    if (msg.share_type === "message" && msg.share_id) {
      const m = msg.share_id;
      return (
        <div className={`msg-shared ${isOwn ? "own" : "other"}`}>
          <div className="shared-header">
            <span className="shared-author">@{msg.sender_nickname}</span>
            &nbsp;поделился:
          </div>
          <div className="shared-content">
            {m.file_url ? (
              <FileCard url={fullUrl(m.file_url)} name={m.filename || m.file_name} />
            ) : (
              <div className="msg-text">{m.text}</div>
            )}
          </div>
        </div>
      );
    }

    /* share: profile */
    if (msg.share_type === "profile" && msg.share_id) {
      const p = msg.share_id;
      return (
        <div className={`msg-shared ${isOwn ? "own" : "other"}`}>
          <div className="shared-header">
            <span className="shared-author">@{msg.sender_nickname}</span>
            &nbsp;поделился профилем:
          </div>
          <div className="shared-profile">
            <img
              src={fullUrl(p.avatar_path || p.avatar_url) || "/avatar.jpg"}
              className="profile-avatar"
              alt=""
            />
            <div className="profile-info">
              <div className="profile-name">{p.full_name}</div>
              <div className="profile-login">{p.login}</div>
            </div>
          </div>
        </div>
      );
    }

    /* share: post */
    if (msg.share_type === "post") {
      if (!post) return <em className="msg-text">Пост недоступен</em>;
      const ava = fullUrl(avatar) || "/avatar.jpg";
      const img = post.images?.[0]?.image_path;
      return (
        <div className={`msg-shared ${isOwn ? "own" : "other"}`}>
          <div className="shared-header">
            <span className="shared-author">@{msg.sender_nickname}</span>
            &nbsp;поделился постом:
          </div>
          <Link to={`/anotheruserprofile/${post.author_id}`} className="shared-post-card">
            <div className="post-card-head">
              <img src={ava} className="post-card-avatar" alt="ava" />
              <span className="post-card-author">{post.author}</span>
            </div>
            <div className="post-card-body">
              <p className="post-card-text">
                {post.content.length > 120 ? `${post.content.slice(0, 117)}…` : post.content}
              </p>
              {img && <img src={fullUrl(img)} className="post-card-img" alt="preview" />}
            </div>
          </Link>
        </div>
      );
    }

    /* обычный файл */
    if (msg.file_url) return <FileCard url={fullUrl(msg.file_url)} name={msg.filename || msg.file_name} />;

    /* текст */
    return <div className="msg-text">{msg.text}</div>;
  };

  const senderAvatar = fullUrl(sender.avatar_path || sender.avatar_url) || "/avatar.jpg";

  return (
    <div className={`msg-row ${isOwn ? "own" : "other"}`} onContextMenu={openMenu}>
      {!isOwn && sender?.nickname && (
        <div className="sender-info">
          <img src={senderAvatar} className="sender-avatar" alt="ava" />
          <span className="sender-nickname">@{sender.nickname}</span>
        </div>
      )}

      <div className={`msg-bubble ${isOwn ? "own" : "other"}`}>
        {renderContent()}
        <div className="message-time">{formatTime(msg.created_at)}</div>

        {menuOpen && (
          <div
            ref={menuRef}
            className="context-menu"
            style={{ top: menuPos.y, left: menuPos.x }}
          >
            {onShare && (
              <div
                onClick={() => {
                  setMenuOpen(false);
                  onShare(msg);
                }}
              >
                🔄 Поделиться
              </div>
            )}
            {onEdit && (
              <div
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(msg);
                }}
              >
                ✏️ Редактировать
              </div>
            )}
            {onDelete && (
              <div
                onClick={() => {
                  setMenuOpen(false);
                  setAskDel(true);
                }}
              >
                🗑️ Удалить
              </div>
            )}
          </div>
        )}

        {askDel && (
          <div className="confirm-popover">
            <div className="confirm-text">Удалить сообщение?</div>
            <button onClick={() => setAskDel(false)}>Нет</button>
            <button
              onClick={() => {
                setAskDel(false);
                onDelete?.(msg);
              }}
            >
              Да
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
