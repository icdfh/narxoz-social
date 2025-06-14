// src/pages/PostDetail.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
  fetchComments,
  createComment,
  deleteComment,
  fetchLikes,
} from "../store/postSlice";
import apiClient from "../utils/apiClient";
import LikeButton from "../components/LikeButton";
import ImageLightbox from "../components/ImageLightbox";
import { parseISO, format, isToday, isYesterday } from "date-fns";

import commentIcon from "../assets/icons/comment_for_posts.svg";
import deleteIcon from "../assets/icons/delete_icon.svg";

import "../assets/css/PostDetail.css";

const dateFmtEn = (iso) => {
  if (!iso) return "";
  const d = parseISO(iso);
  if (isToday(d)) return `Today, ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, "HH:mm")}`;
  return format(d, "d MMM yyyy, HH:mm");
};

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Текущий пользователь (для аватара у формы)
  const currentUser = useSelector((s) => s.auth.user, shallowEqual);
  const nick = currentUser?.nickname;
  const userAvatar = currentUser?.avatar_path || "/avatar.jpg";

  const [post, setPost] = useState(null);
  const [imgs, setImgs] = useState([]);
  const [idx, setIdx] = useState(null);
  const [draft, setDraft] = useState("");

  const cmts = useSelector(
    (s) => s.posts.commentsByPost[id] || [],
    shallowEqual
  );

  const close = () => setIdx(null);
  const prev = useCallback(
    () => setIdx((i) => (i === 0 ? imgs.length - 1 : i - 1)),
    [imgs]
  );
  const next = useCallback(
    () => setIdx((i) => (i === imgs.length - 1 ? 0 : i + 1)),
    [imgs]
  );

  useEffect(() => {
    apiClient
      .get(`/posts/${id}/`)
      .then(({ data }) => {
        setPost(data);
        if (Array.isArray(data.images) && data.images.length) {
          setImgs(data.images);
        } else {
          return apiClient
            .get(`/posts/image-list/${id}/`)
            .then(({ data: imgsData }) => setImgs(Array.isArray(imgsData) ? imgsData : []))
            .catch(() => setImgs([]));
        }
      })
      .catch(() => setPost(null));

    dispatch(fetchComments(id));
    if (nick) dispatch(fetchLikes({ postId: id, currentNickname: nick }));
  }, [id, dispatch, nick]);

  if (!post) {
    return <div className="pd-loading">Loading post…</div>;
  }

  // Предположим, в post есть:
  // - post.author_id
  // - post.author (имя или ник)
  // - post.author_avatar_path
  const authorId = post.author_id;
  const authorName = post.author;
  const authorAvatar = post.author_avatar_path || "/avatar.jpg";

  return (
    <div className="pd-container">
      <button className="pd-back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {/* ───────── Шапка поста ───────── */}
      <section className="pd-header">
        <h2 className="pd-title">{post.content}</h2>
        <div className="pd-meta">
          <span className="pd-date">{dateFmtEn(post.created_at)}</span>
        </div>

        {/* ───────── Инфо об авторе ───────── */}
        <div className="pd-author-block">
          <Link to={`/profile/${authorId}`}>
            <img
              src={authorAvatar}
              alt={authorName}
              className="pd-author-avatar"
            />
          </Link>
          <Link to={`/profile/${authorId}`} className="pd-author-name">
            {authorName}
          </Link>
        </div>
      </section>

      {/* ───────── Картинки ───────── */}
      {imgs.length > 0 && (
        <div className="pd-image-grid">
          {imgs.map((im, i) => (
            <img
              key={im.id}
              src={im.image_path}
              alt=""
              className="pd-image-item"
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
      )}

      {/* ───────── Лайки ───────── */}
      <div className="pd-like-section">
        <LikeButton postId={+id} />
      </div>

      {/* ───────── Комментарии ───────── */}
      <div className="pd-comments-section">
        <div className="pd-comments-header">
          <img src={commentIcon} alt="comments icon" className="pd-comment-icon" />
          <span className="pd-comments-title">Comments ({cmts.length})</span>
        </div>

        <div className="pd-comment-list">
          {cmts.length > 0 ? (
            cmts.map((c) => (
              <div key={c.id} className="pd-comment-item">
                <div className="pd-comment-text">
                  <strong>{c.author_nickname}</strong>: {c.content}
                </div>
                {c.author_nickname === nick && (
                  <img
                    src={deleteIcon}
                    alt="delete"
                    className="pd-comment-delete-icon"
                    onClick={() =>
                      dispatch(deleteComment({ postId: id, commentId: c.id }))
                    }
                  />
                )}
              </div>
            ))
          ) : (
            <div className="pd-no-comments">No comments yet.</div>
          )}
        </div>

        {nick && (
          <form
            className="pd-comment-form"
            onSubmit={(e) => {
              e.preventDefault();
              const text = draft.trim();
              if (!text) return;
              dispatch(createComment({ postId: id, content: text })).then(() =>
                setDraft("")
              );
            }}
          >
            <img src={userAvatar} alt="avatar" className="pd-comment-avatar" />
            <input
              className="pd-comment-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a comment..."
            />
            <button type="submit" className="pd-comment-submit">
              Send
            </button>
          </form>
        )}
      </div>

      <ImageLightbox
        sources={imgs.map((i) => i.image_path)}
        index={idx}
        onClose={close}
        onPrev={prev}
        onNext={next}
      />
    </div>
  );
}
