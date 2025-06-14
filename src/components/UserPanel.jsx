import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchProfile } from "../store/authSlice";

import apiClient    from "../utils/apiClient";
import MyPostCard   from "./MyPostCard";
import MoreButton   from "./MoreButton";
import ShareModal   from "./chat/ShareModal";
import ReportModal  from "./ReportModal";

import chatIcon from "../assets/icons/Chats.svg";
import moreIcon from "../assets/icons/more.svg";

import "../assets/css/UserPanel.css";

/* ───────── helpers ───────── */
const buildAvatarUrl = (path) => {
  if (!path) return "/avatar.jpg";
  if (path.startsWith("http")) return path;
  const base = apiClient.defaults.baseURL.replace(/\/api\/?$/, "");
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function UserPanel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, user } = useSelector((s) => s.auth, shallowEqual);

  const [tab, setTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [imagesByPost, setImagesByPost] = useState({});
  const [likesByPost, setLikesByPost] = useState({});
  const [friends, setFriends] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareFriend, setShareFriend] = useState(null);
  const [reportParams, setReportParams] = useState(null);
  const [directChats, setDirectChats] = useState([]);

  /* ---- LOAD PROFILE ---- */
  useEffect(() => {
    if (!user && token) dispatch(fetchProfile());
  }, [user, token, dispatch]);

  /* ---- LOAD DATA ---- */
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const { data: raw } = await apiClient.get("/posts/user/");
        const arr = Array.isArray(raw) ? raw : raw.results || [];
        setPosts(arr);

        const imgs = {};
        const likes = {};
        await Promise.all(
          arr.map(async (p) => {
            const [imRes, lkRes] = await Promise.all([
              apiClient.get(`/posts/image-list/${p.id}/`),
              apiClient.get(`/posts/${p.id}/likes/`),
            ]);
            imgs[p.id] = imRes.data?.results || imRes.data || [];
            likes[p.id] = lkRes.data?.length || 0;
          })
        );
        setImagesByPost(imgs);
        setLikesByPost(likes);

        const { data: fr } = await apiClient.get("/friends/list/");
        const { data: orgs } = await apiClient.get("/users/organizations/");
        setFriends(fr || []);
        setOrganizations(orgs || []);
      } catch (e) {
        console.error("Ошибка загрузки:", e);
      }
    })();
  }, [token]);

  /* ---- DIRECT CHATS FOR SHARE ---- */
  useEffect(() => {
    if (!user?.id) return;
    apiClient
      .get("/chats/allchats/")
      .then(({ data }) => {
        const directs = data.filter((c) => c.type === "direct");
        return Promise.all(
          directs.map(async (c) => {
            const peerId = c.members.find((m) => m !== user.id);
            const { data: peer } = await apiClient.get(
              `/users/profile/${peerId}/`
            );
            return { id: c.id, label: `@${peer.nickname}` };
          })
        );
      })
      .then(setDirectChats)
      .catch(() => {});
  }, [user]);

  /* ---- CLOSE HEADER MENU ---- */
  useEffect(() => {
    const h = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ---- HELPERS ---- */
  const avatarUrl = buildAvatarUrl(user?.avatar_path);

  const openChatWith = async (id) => {
    try {
      const { data } = await apiClient.post(`/chats/direct/${id}/`);
      navigate(`/messages/${data.chat_id}`);
    } catch (e) {
      console.error("chat err:", e);
    }
  };

  const removeFriend = async (id) => {
    if (!window.confirm("Удалить из друзей?")) return;
    await apiClient.delete(`/friends/remove/${id}/`);
    setFriends((f) => f.filter((u) => u.id !== id));
  };

  /* ----------- SHARING ----------- */
  const doShareProfile = async (chatId) => {
    await apiClient.post(`/chats/${chatId}/share/`, {
      share_type: "profile",          // ← изменили
      share_id: user.id,
    });
    setShareOpen(false);
  };

  const doShareFriend = async (chatId) => {
    await apiClient.post(`/chats/${chatId}/share/`, {
      share_type: "profile",          // ← изменили
      share_id: shareFriend.id,
    });
    setShareFriend(null);
  };

  /* ================ UI ================ */
  return (
    <>
      <div className="user-panel">
        {/* ---------- HEADER ---------- */}
        <div className="user-info">
          <img src={avatarUrl} alt="User" className="user-avatar" />
          <div className="user-text">
            <h3 className="user-name">{user?.full_name || "Имя Фамилии"}</h3>
            <p className="user-nick">@{user?.nickname || "nickname"}</p>
            <p className="user-login">{user?.login || "S00000000"}</p>
          </div>

          <button
            className="user-edit-btn"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <img src={moreIcon} alt="menu" className="edit-icon" />
          </button>

          {menuOpen && (
            <div className="edit-menu" ref={menuRef}>
              <button onClick={() => navigate(`/profile/${user.id}`)}>
                Смотреть профиль
              </button>
              <button onClick={() => navigate("/settings")}>
                Редактировать
              </button>
              <button onClick={() => setShareOpen(true)}>
                Поделиться профилем
              </button>
            </div>
          )}
        </div>

        <hr style={{ margin: "16px 0", borderColor: "#fff" }} />

        {/* ---------- TABS ---------- */}
        <div className="user-tabs">
          <div
            className={`tab ${tab === "posts" ? "active" : ""}`}
            onClick={() => setTab("posts")}
          >
            Posts
          </div>
          <div
            className={`tab ${tab === "friends" ? "active" : ""}`}
            onClick={() => setTab("friends")}
          >
            Friends
          </div>
          <div
            className={`tab ${tab === "orgs" ? "active" : ""}`}
            onClick={() => setTab("orgs")}
          >
            Groups
          </div>
        </div>

        {/* ---------- CONTENT ---------- */}
        <div className="tab-content custom-scroll">
          {/* POSTS */}
          {tab === "posts" ? (
            posts.length ? (
              posts.map((p) => (
                <MyPostCard
                  key={p.id}
                  post={p}
                  images={imagesByPost[p.id] || []}
                  likeCount={likesByPost[p.id] || 0}
                  onClick={() => navigate(`/posts/${p.id}/edit`)}
                />
              ))
            ) : (
              <p className="up-empty">Нет постов.</p>
            )
          ) : null}

          {/* FRIENDS */}
          {tab === "friends" ? (
            friends.length ? (
              friends.map((f) => (
                <div key={f.id} className="org-card">
                  <img
                    src={buildAvatarUrl(f.avatar_path || f.avatar_url)}
                    alt={f.nickname}
                    className="org-avatar"
                  />
                  <div className="org-text">
                    <strong>{f.full_name}</strong>
                    <div className="org-sub">@{f.nickname}</div>
                  </div>
                  <div className="org-actions">
                    <img
                      src={chatIcon}
                      alt="chat"
                      onClick={() => openChatWith(f.id)}
                    />
                    <MoreButton
                      icon={moreIcon}
                      onView={() => navigate(`/profile/${f.id}`)}
                      onShare={() => setShareFriend(f)}
                      onReport={() =>
                        setReportParams({
                          targetType: "user",
                          objectId: f.id,
                          avatar: buildAvatarUrl(
                            f.avatar_path || f.avatar_url
                          ),
                          fullName: f.full_name,
                          nickname: f.nickname,
                          login: f.login,
                        })
                      }
                      onDelete={() => removeFriend(f.id)}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="up-empty">Нет друзей.</p>
            )
          ) : null}

          {/* GROUPS */}
          {tab === "orgs" ? (
            organizations.length ? (
              organizations.map((o) => (
                <div key={o.id} className="org-card">
                  <img
                    src={buildAvatarUrl(o.avatar_path)}
                    alt={o.full_name}
                    className="org-avatar"
                  />
                  <div className="org-text">
                    <strong>{o.full_name}</strong>
                    <div className="org-sub">@{o.nickname}</div>
                  </div>
                  <div className="org-actions">
                    <img
                      src={chatIcon}
                      alt="chat"
                      onClick={() => navigate(`/groups/${o.chat_id}`)}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="up-empty">Организации не найдены.</p>
            )
          ) : null}
        </div>
      </div>

      {/* SHARE MY PROFILE */}
      {shareOpen && (
        <ShareModal
          options={directChats}
          onConfirm={doShareProfile}
          onClose={() => setShareOpen(false)}
        />
      )}

      {/* SHARE FRIEND */}
      {shareFriend && (
        <ShareModal
          options={directChats}
          onConfirm={doShareFriend}
          onClose={() => setShareFriend(null)}
        />
      )}

      {/* REPORT */}
      {reportParams && (
        <ReportModal
          {...reportParams}
          onClose={() => setReportParams(null)}
          onSuccess={() => setReportParams(null)}
        />
      )}
    </>
  );
}
