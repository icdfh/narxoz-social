/*  src/pages/AnotherUserProfile.jsx
    Страница публичного профиля (чужого / своего)
    ─ status-badge с читабельными подписями
    ─ post-list + MoreButton + Comments
    ─ меню «⋮» / share / report
    ---------------------------------------------------------------- */

import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ru } from "date-fns/locale";

import apiClient from "../utils/apiClient";
import LikeButton from "../components/LikeButton";
import CommentSection from "../components/CommentSection";
import { fetchComments } from "../store/postSlice";
import ReportModal from "../components/ReportModal";
import ChatShareModal from "../components/chat/ChatShareModal";
import MoreButton from "../components/MoreButton";

import commentIcon from "../assets/icons/comment_for_posts.svg";
import chatIcon    from "../assets/icons/messages-hover.svg";
import moreIcon    from "../assets/icons/more.svg";

import "../assets/css/AnotherUserProfile.css";

/* ───────── helpers ───────── */
const smartDate = iso => {
  if (!iso) return "";
  const d = parseISO(iso);
  if (isToday(d))     return `Сегодня, ${format(d, "HH:mm", { locale: ru })}`;
  if (isYesterday(d)) return `Вчера, ${format(d, "HH:mm", { locale: ru })}`;
  return format(d, "d MMMM yyyy, HH:mm", { locale: ru });
};

const imgUrl = p =>
  !p ? "/avatar.jpg"
     : p.startsWith("http") ? p
     : `${window.location.origin}${p.startsWith("/") ? "" : "/"}${p}`;

/* читабельные подписи + цвета для badge */
const STATUS_LABELS = {
  friends                   : { text: "Friends",              color: "#44dd88" },
  None                      : { text: "Not friends",          color: "#bbb"    },
  outgoing_request          : { text: "Friend request sent",  color: "#ffaa00" },
  incoming_request          : { text: "Incoming request",     color: "#00ccff" },
  outgoing_declined_request : { text: "Declined",             color: "#e66"    },
  incoming_declined_request : { text: "You declined",         color: "#888"    },
};

/* ───────────────────────── component ───────────────────────── */
function AnotherUserProfile() {
  const { id }              = useParams();        // чей профиль
  const navigate             = useNavigate();
  const dispatch             = useDispatch();

  const currentUser          = useSelector(s => s.auth.user);
  const commentsByPost       = useSelector(s => s.posts.commentsByPost);

  /* ---------------- state ---------------- */
  const [user, setUser]                 = useState(null);
  const [posts, setPosts]               = useState([]);
  const [imagesByPost, setImagesByPost] = useState({});
  const [friendStatus, setStatus]       = useState("None");

  const [friendsFull, setFriendsFull]   = useState([]);
  const [orgsFull, setOrgsFull]         = useState([]);

  const [openCmt, setOpenCmt]           = useState({});
  const [error, setErr]                 = useState("");

  /* меню / модалки */
  const [menuOpen,   setMenuOpen]    = useState(false);
  const [shareOpen,  setShareOpen]   = useState(false);
  const [shareTarget,setShareTarget] = useState(null);
  const [contacts,   setContacts]    = useState([]);
  const [report,     setReport]      = useState(null);

  const isSelf      = currentUser?.id === +id;
  const statusInfo  = STATUS_LABELS[friendStatus] || STATUS_LABELS.None;

  /* ---------------- initial load ---------------- */
  useEffect(() => {
    (async () => {
      try {
        /* профиль */
        const { data: u } = await apiClient.get(`/users/profile/${id}/`);
        setUser(u);

        /* посты */
        const pRes = await apiClient.get(`/posts/user/${id}/`);
        const arr  = Array.isArray(pRes.data) ? pRes.data
                   : pRes.data.results        ? pRes.data.results
                   : [];
        setPosts(arr);

        /* статус дружбы */
        if (!isSelf) {
          const { data: s } = await apiClient.get(`/friends/status/${id}/`);
          setStatus(s.status || "None");
        }

        /* изображения + комментарии */
        const map = {};
        for (const p of arr) {
          const iRes = await apiClient.get(`/posts/image-list/${p.id}/`);
          map[p.id] = Array.isArray(iRes.data)
                      ? iRes.data
                      : iRes.data.results || [];
          dispatch(fetchComments(p.id));
        }
        setImagesByPost(map);

        /* друзья */
        if (u.friends?.length) {
          const fs = await Promise.all(
            u.friends.map(f => apiClient.get(`/users/profile/${f.id}/`).then(r => r.data))
          );
          setFriendsFull(fs);
        }

        /* организации */
        const oRes = await apiClient.get("/users/organizations/");
        const orgs = Array.isArray(oRes.data) ? oRes.data
                   : oRes.data.results        ? oRes.data.results
                   : [];
        setOrgsFull(orgs.filter(o => o.members?.some(m => m.id === u.id)));

        /* direct-контакты для share-модалки */
        const { data: chats } = await apiClient.get("/chats/allchats/");
        const directs = chats.filter(c => c.type === "direct");
        const cnt = await Promise.all(
          directs.map(async c => {
            const peerId = c.members.find(m => m !== currentUser.id);
            const pu     = (await apiClient.get(`/users/profile/${peerId}/`)).data;
            return {
              chatId:   c.id,
              nickname: pu.nickname,
              avatarUrl: imgUrl(pu.avatar_path || pu.avatar_url),
            };
          })
        );
        setContacts(cnt);
      } catch {
        setErr("Ошибка при загрузке профиля.");
      }
    })();
  }, [id, dispatch, currentUser?.id, isSelf]);

  /* ---------------- friend actions ---------------- */
  const sendRequest = async () => {
    try {
      await apiClient.post(`/friends/send/${id}/`);
      setStatus("outgoing_request");
    } catch (e) {
      setErr(e.response?.data?.error || "Не удалось отправить запрос.");
    }
  };

  const removeFriend = async () => {
    try {
      await apiClient.delete(`/friends/remove/${id}/`);
      setStatus("None");
    } catch {}
  };

  /* ---------------- share helpers ---------------- */
  const openShare = payload => { setShareTarget(payload); setShareOpen(true); };
  const doShare   = chatId   => apiClient.post(`/chats/${chatId}/share/`, shareTarget);

  /* ---------------- render ---------------- */
  if (!user) return <p>Загрузка…</p>;

  return (
    <div className="another-profile-wrapper">

      {/* ───────── HEADER ───────── */}
      <div className="another-profile-wrapper__header">
        <div className="another-profile-wrapper__user-info">
          <div className="avatar-wrap">
            <img
              src={imgUrl(user.avatar_path || user.avatar_url)}
              alt=""
              className="another-profile-wrapper__avatar"
            />
            <span className={`status-indicator ${user.is_online ? "online" : "offline"}`} />
          </div>

          <div className="another-profile-wrapper__text-block">
            <div className="another-profile-wrapper__full-name">{user.full_name}</div>
            <div className="another-profile-wrapper__nickname">@{user.nickname}</div>
            <div className="another-profile-wrapper__login">{user.login}</div>
          </div>

          {!isSelf && (
            <span
              className="another-profile-wrapper__status-bar"
              style={{ backgroundColor: statusInfo.color }}
            >
              {statusInfo.text}
            </span>
          )}
        </div>

        <div className="another-profile-wrapper__controls">
          {!isSelf && (
            <>
              <img
                src={chatIcon}
                alt="chat"
                className="another-profile-wrapper__btn-chat"
                onClick={() => navigate(`/messages/${user.direct_chat_id}`)}
              />
              {(friendStatus === "None" || friendStatus.includes("declined")) && (
                <button className="another-profile-wrapper__btn-add" onClick={sendRequest}>
                  Add&nbsp;Friend
                </button>
              )}
            </>
          )}

          <img
            src={moreIcon}
            alt="menu"
            className="another-profile-wrapper__btn-more"
            onClick={() => setMenuOpen(true)}
          />
        </div>
      </div>

      {error && <p className="another-profile-wrapper__error">{error}</p>}

      {/* ───────── CONTENT (posts / friends / orgs) ───────── */}
      <div className="another-profile-wrapper__content">

        {/* ===== LEFT COLUMN — posts ===== */}
        <div className="another-profile-wrapper__left-col-outer">
          <div className="another-profile-wrapper__left-col">
            {posts.map(p => {
              const imgs = imagesByPost[p.id] || [];
              const cmts = commentsByPost[p.id] || [];

              return (
                <div key={p.id} className="another-profile-wrapper__post-card">
                  {/* header + MoreButton */}
                  <div className="another-profile-wrapper__post-inner-header">
                    <div className="another-profile-wrapper__post-header">
                      <div className="img-avatar">
                        <img
                          src={imgUrl(p.author_avatar_path || p.author_avatar_url)}
                          alt=""
                          className="another-profile-wrapper__post-avatar"
                        />
                        <div className="another-profile-wrapper__post-user-info">
                          <Link
                            to={`/profile/${p.author_id}`}
                            className="another-profile-wrapper__post-author"
                          >
                            {p.author}
                          </Link>
                          <div className="another-profile-wrapper__post-time">
                            {smartDate(p.created_at)}
                          </div>
                        </div>
                      </div>

                      <MoreButton
                        targetType="post"
                        objectId={p.id}
                        onShare={() => openShare({ share_type: "post", share_id: p.id })}
                        onReport={() => setReport({
                          targetType: "post",
                          objectId:   p.id,
                          postTitle:  p.content.slice(0, 30) + "…",
                          postAuthor: p.author,
                        })}
                      />
                    </div>
                  </div>

                  {/* изображения поста */}
                  {!!imgs.length && (
                    <div
                      className={`another-profile-wrapper__post-images ${
                        imgs.length === 1 ? "single" : "multi"
                      }`}
                    >
                      {imgs.map(im => (
                        <img
                          key={im.id}
                          src={imgUrl(im.image_path)}
                          alt=""
                          className="another-profile-wrapper__post-img"
                        />
                      ))}
                    </div>
                  )}

                  {/* текст поста */}
                  {p.content && (
                    <div className="another-profile-wrapper__post-content">
                      <p>{p.content}</p>
                    </div>
                  )}

                  {/* лайки + комменты */}
                  <div className="another-profile-wrapper__post-footer">
                    <LikeButton postId={p.id} />
                    <div
                      className="another-profile-wrapper__comment-block"
                      onClick={() => setOpenCmt(o => ({ ...o, [p.id]: !o[p.id] }))}
                    >
                      <img src={commentIcon} alt="" className="another-profile-wrapper__comment-icon" />
                      <span className="another-profile-wrapper__comment-count">{cmts.length}</span>
                    </div>
                  </div>

                  {openCmt[p.id] && <CommentSection postId={p.id} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== RIGHT COLUMN — friends & orgs ===== */}
        <div className="another-profile-wrapper__right-col">

          {/* friends */}
          <div className="another-profile-wrapper__friends-card">
            <div className="another-profile-wrapper__friends-title">Friends</div>
            {friendsFull.length ? (
              <div className="another-profile-wrapper__friends-list">
                {friendsFull.map(f => (
                  <Link
                    key={f.id}
                    to={`/profile/${f.id}`}
                    className="another-profile-wrapper__friend-link"
                  >
                    <img
                      src={imgUrl(f.avatar_path || f.avatar_url)}
                      alt=""
                      className="another-profile-wrapper__friend-avatar"
                    />
                    <span className={`status-indicator ${f.is_online ? "online" : "offline"}`} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="another-profile-wrapper__no-friends">Нет друзей</p>
            )}
          </div>

          {/* organisations */}
          <div className="another-profile-wrapper__orgs-card">
            <div className="another-profile-wrapper__orgs-title">Organizations</div>
            {orgsFull.length ? (
              <div className="another-profile-wrapper__orgs-list">
                {orgsFull.map(o => (
                  <Link
                    key={o.id}
                    to={`/profile/${o.id}`}
                    className="another-profile-wrapper__org-link"
                  >
                    <img
                      src={imgUrl(o.avatar_path || o.avatar_url)}
                      alt=""
                      className="another-profile-wrapper__org-avatar"
                    />
                    <span className={`status-indicator ${o.is_online ? "online" : "offline"}`} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="another-profile-wrapper__no-orgs">Нет организаций</p>
            )}
          </div>
        </div>
      </div>

      {/* ───────── MENU «⋮» ───────── */}
      {menuOpen && (
        <div className="profile-menu-backdrop" onClick={() => setMenuOpen(false)}>
          <div className="profile-menu" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => {
                openShare({ share_type: "profile", share_id: user.id });
                setMenuOpen(false);
              }}
            >
              Поделиться профилем
            </button>

            {isSelf ? (
              <button onClick={() => navigate("/accountsettings")}>Редактировать</button>
            ) : (
              <>
                {friendStatus === "friends" && (
                  <button onClick={removeFriend}>Удалить из друзей</button>
                )}
                <button
                  onClick={() => {
                    setReport({
                      targetType: "user",
                      objectId:   user.id,
                      avatar:     imgUrl(user.avatar_path || user.avatar_url),
                      fullName:   user.full_name,
                      nickname:   user.nickname,
                      login:      user.login,
                    });
                    setMenuOpen(false);
                  }}
                >
                  Пожаловаться
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ───────── SHARE MODAL ───────── */}
      {shareOpen && (
        <ChatShareModal
          contacts={contacts}
          onClose={() => setShareOpen(false)}
          onSelect={cid => doShare(cid).finally(() => setShareOpen(false))}
        />
      )}

      {/* ───────── REPORT MODAL ───────── */}
      {report && (
        <ReportModal
          {...report}
          onClose={() => setReport(null)}
          onSuccess={() => setReport(null)}
        />
      )}
    </div>
  );
}

export default AnotherUserProfile;
