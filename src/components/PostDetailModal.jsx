import React, { useEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
  fetchComments,
  fetchLikes,
} from "../store/postSlice";

import apiClient        from "../utils/apiClient";
import LikeButton       from "./LikeButton";
import CommentSection   from "./CommentSection";      // ← подключаем
import ImageLightbox    from "./ImageLightbox";

import { parseISO, format, isToday, isYesterday } from "date-fns";

import "../assets/css/PostDetailModal.css";

/* ───────── helpers ───────── */
const dateFmt = iso => {
  if (!iso) return "";
  const d = parseISO(iso);
  if (isToday(d))     return `Today, ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, "HH:mm")}`;
  return format(d, "d MMM yyyy, HH:mm");
};

/* ───────── component ───────── */
export default function PostDetailModal() {
  const { id }    = useParams();          // id поста
  const navigate  = useNavigate();
  const dispatch  = useDispatch();

  const nick      = useSelector(s => s.auth.user?.nickname);

  const [post, setPost]     = useState(null);
  const [imgs, setImgs]     = useState([]);
  const [cur, setCur]       = useState(0);
  const [lbIdx, setLbIdx]   = useState(null);

  /* CLOSE */
  const close = () => navigate(-1);

  /* навигация по превью */
  const prev = () => setCur(i => (i === 0 ? imgs.length - 1 : i - 1));
  const next = () => setCur(i => (i === imgs.length - 1 ? 0 : i + 1));
  const openLb = useCallback(i => setLbIdx(i), []);

  /* ---------- data load ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get(`/posts/${id}/`);
        setPost(data);
        setImgs(Array.isArray(data.images) ? data.images : []);
        setCur(0);
        dispatch(fetchComments(+id));
        if (nick) dispatch(fetchLikes({ postId:+id, currentNickname:nick }));
      } catch { setPost(null); }
    })();
  }, [id, dispatch, nick]);

  if (!post) return null;        // post не найден

  /* ---------- render ---------- */
  return ReactDOM.createPortal(
    <div className="pd-backdrop" onClick={close}>
      <div className="pd-modal"  onClick={e => e.stopPropagation()}>

        {/* CLOSE × */}
        <button className="pd-close" onClick={close}>×</button>

        {/* ---------- ЛЕВАЯ КОЛОНКА ---------- */}
        <div className="pd-left">
          {imgs.length ? (
            <div className="pd-img-wrap">
              {imgs.length > 1 && (
                <button className="pd-arrow left"  onClick={prev}>‹</button>
              )}

              <img
                src={imgs[cur].image_path}
                alt=""
                className="pd-img"
                onClick={() => openLb(cur)}
              />

              {imgs.length > 1 && (
                <button className="pd-arrow right" onClick={next}>›</button>
              )}
            </div>
          ) : (
            <div className="pd-text-only">{post.content}</div>
          )}
        </div>

        {/* ---------- ПРАВАЯ КОЛОНКА ---------- */}
        <div className="pd-right">
          {/* автор и дата */}
          <div className="pd-author">
            <Link to={`/profile/${post.author_id}`}>
              <img
                className="pd-author-avatar"
                src={post.author_avatar_path || "/avatar.jpg"}
                alt=""
              />
            </Link>
            <div>
              <Link to={`/profile/${post.author_id}`} className="pd-author-name">
                {post.author}
              </Link>
              <div className="pd-date">{dateFmt(post.created_at)}</div>
            </div>
          </div>

          {/* текст описания */}
          {post.content && <p className="pd-desc">{post.content}</p>}

          {/* лайки */}
          <div className="pd-like-row">
            <LikeButton postId={+id} />
          </div>

          {/* комментарии (готовый компонент) */}
          <CommentSection postId={+id} />
        </div>

        {/* ---------- LIGHTBOX ---------- */}
        <ImageLightbox
          sources={imgs.map(i => i.image_path)}
          index={lbIdx}
          onClose={() => setLbIdx(null)}
          onPrev={prev}
          onNext={next}
        />
      </div>
    </div>,
    document.body
  );
}
