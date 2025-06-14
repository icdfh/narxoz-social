/*  ПОЛНЫЙ ФАЙЛ – ОБНОВЛЁННАЯ ВЕРСИЯ
    -------------------------------------------------------------- */

import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector, shallowEqual }   from "react-redux";
import {
  fetchPosts, append,
  fetchComments,
  fetchLikes,
} from "../store/postSlice";
import { parseISO, format, isToday, isYesterday }   from "date-fns";
import { ru }                                       from "date-fns/locale";
import { Link }                                     from "react-router-dom";

import LikeButton       from "../components/LikeButton";
import ImageLightbox    from "../components/ImageLightbox";
import MoreButton       from "../components/MoreButton";
import ReportModal      from "../components/ReportModal";
import ChatShareModal   from "../components/chat/ChatShareModal";
import CommentSection   from "../components/CommentSection";   // ←-- NEW

import apiClient         from "../utils/apiClient";

import commentIcon from "../assets/icons/comment_for_posts.svg";

import "../assets/css/PostList.css";

/* ───────── helpers ───────── */
const dateFmt = iso => {
  if (!iso) return "";
  const d = parseISO(iso);
  if (isToday(d))     return `Сегодня, ${format(d, "HH:mm", { locale: ru })}`;
  if (isYesterday(d)) return `Вчера, ${format(d, "HH:mm", { locale: ru })}`;
  return format(d, "d MMM yyyy, HH:mm", { locale: ru });
};

/* ───────── component ───────── */
export default function PostList() {
  const dispatch      = useDispatch();
  const currentUserId = useSelector(s => s.auth.user?.id);
  const nick          = useSelector(s => s.auth.user?.nickname);

  const raw            = useSelector(s => s.posts.items,          shallowEqual);
  const commentsByPost = useSelector(s => s.posts.commentsByPost, shallowEqual);
  const loading        = useSelector(s => s.posts.loading);
  const error          = useSelector(s => s.posts.error);
  const nextUrl        = useSelector(s => s.posts.nextUrl);

  const posts = Array.isArray(raw) ? raw : raw?.results || [];

  /* local UI-state */
  const [openComments, setOpenComments] = useState({});
  const [lbSrc, setLbSrc]               = useState([]);
  const [lbIdx, setLbIdx]               = useState(null);
  const [reportParams, setReportParams] = useState(null);

  /* sharing */
  const [directContacts, setDirectContacts] = useState([]);
  const [shareOpen, setShareOpen]           = useState(false);
  const [sharePostId, setSharePostId]       = useState(null);
  const [toast, setToast]                   = useState("");

  /* ───── initial posts ───── */
  useEffect(() => { dispatch(fetchPosts()); }, [dispatch]);

  /* ───── likes / comments ───── */
  useEffect(() => {
    posts.forEach(p => {
      if (nick) dispatch(fetchLikes({ postId: p.id, currentNickname: nick }));
      dispatch(fetchComments(p.id));
    });
  }, [posts, nick, dispatch]);

  /* ───── infinite scroll ───── */
  useEffect(() => {
    if (!nextUrl) return;
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        window.removeEventListener("scroll", onScroll);
        fetch(nextUrl.replace("/api", ""))
          .then(r => r.json())
          .then(data => dispatch(append(data.results)));
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [nextUrl, dispatch]);

  /* ───── direct-contacts для share ───── */
  useEffect(() => {
    apiClient.get("/chats/allchats/")
      .then(({ data }) => {
        const directs = data.filter(c => c.type === "direct");
        return Promise.all(directs.map(async c => {
          const peerId = c.members.find(id => id !== currentUserId);
          const { data: user } = await apiClient.get(`/users/profile/${peerId}/`);
          return {
            chatId:    c.id,
            nickname:  user.nickname,
            avatarUrl: user.avatar_path || user.avatar_url || "/avatar.jpg",
          };
        }));
      })
      .then(setDirectContacts)
      .catch(() => {});
  }, [currentUserId]);

  /* ───── lightbox helpers ───── */
  const closeLb = () => setLbIdx(null);
  const prevLb  = useCallback(() => setLbIdx(i => (i === 0 ? lbSrc.length - 1 : i - 1)), [lbSrc]);
  const nextLb  = useCallback(() => setLbIdx(i => (i === lbSrc.length - 1 ? 0 : i + 1)), [lbSrc]);

  /* ───── share helpers ───── */
  const openShare = postId => { setSharePostId(postId); setShareOpen(true); };
  const doShare   = async chatId => {
    await apiClient.post(`/chats/${chatId}/share/`, { share_type:"post", share_id:sharePostId });
  };

  /* ───── UI ───── */
  if (loading && !posts.length) return <p>Загрузка…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <>
      <div className="post-list">
        {posts.map(p => {
          const cmts = commentsByPost[p.id] || [];
          const show = openComments[p.id];

          return (
            <div key={p.id} className="post-item">
              {/* ---------- TOP (автор + меню) ---------- */}
              <div className="post-top">
                <div className="post-header">
                  <img
                    src={p.author_avatar_path || "/avatar.jpg"}
                    alt=""
                    className="post-avatar"
                  />
                  <div className="post-user-info">
                    <Link to={`/profile/${p.author_id}`} className="post-author">
                      {p.author}
                    </Link>
                    <div className="post-time">{dateFmt(p.created_at)}</div>
                  </div>
                </div>

                <MoreButton
                  targetType="post"
                  objectId={p.id}
                  onReport={() =>
                    setReportParams({
                      targetType: "post",
                      objectId:   p.id,
                      postTitle:  p.content.slice(0, 30) + "…",
                      postAuthor: p.author,
                    })
                  }
                  onShare={() => openShare(p.id)}
                />
              </div>

              {/* ---------- CARD ---------- */}
              <div className="post-card">
                <div className="post-content">
                  <h4>{p.content}</h4>
                </div>

                {/* изображения */}
                {p.images?.length > 0 && (
                  <div className={`post-images ${p.images.length === 1 ? "single" : "multi"}`}>
                    {p.images.map((im, i) => (
                      <img
                        key={im.id}
                        src={im.image_path}
                        alt=""
                        className="post-img"
                        onClick={() => {
                          setLbSrc(p.images.map(x => x.image_path));
                          setLbIdx(i);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* лайки / комментарии */}
                <div className="like-comment-row">
                  <LikeButton postId={p.id} />
                  <div
                    className="comment-icon-block"
                    onClick={() => setOpenComments(o => ({ ...o, [p.id]: !o[p.id] }))}
                  >
                    <img src={commentIcon} alt="" className="comment-icon" />
                    <span className="comment-count">{cmts.length}</span>
                  </div>
                </div>

                {/* ---------- КОММЕНТАРИИ (компонент) ---------- */}
                {show && <CommentSection postId={p.id} />}
              </div>
            </div>
          );
        })}
      </div>

      <ImageLightbox
        sources={lbSrc}
        index={lbIdx}
        onClose={closeLb}
        onPrev={prevLb}
        onNext={nextLb}
      />

      {/* ---------- SHARE MODAL ---------- */}
      {shareOpen && (
        <ChatShareModal
          contacts={directContacts}
          onClose={() => setShareOpen(false)}
          onSelect={cid => doShare(cid).finally(() => setShareOpen(false))}
        />
      )}

      {toast && <div className="post-toast">{toast}</div>}

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
