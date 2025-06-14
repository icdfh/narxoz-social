import React, { useState } from "react";
import { parseISO, format } from "date-fns";
import { ru } from "date-fns/locale";
import { useSelector, shallowEqual } from "react-redux";

import LikeButtonUserPanel from "./LikeButtonUserPanel";
import CommentSection       from "./CommentSection";

import commentIcon from "../assets/icons/comments.svg";
import moreIcon    from "../assets/icons/more.svg";

const MyPostCard = ({ post, images = [], onClick }) => {
  const [showComments, setShowComments] = useState(false);

  const commentCount = useSelector(
    s => (s.posts.commentsByPost[post.id] || []).length,
    shallowEqual
  );

  return (
    <div style={styles.wrapper}>
      {/* ---------- TOP ---------- */}
      <div style={styles.top}>
        <div style={styles.userBlock}>
          <img
            src={post.author_avatar_path || "/avatar.jpg"}
            alt="avatar"
            style={styles.avatar}
          />
          <div>
            <div style={styles.name}>{post.author}</div>
            <div style={styles.time}>
              {format(parseISO(post.created_at), "d MMM yyyy HH:mm", { locale: ru })}
            </div>
          </div>
        </div>
        <button onClick={onClick} style={styles.editBtn}>
          <img src={moreIcon} alt="more" />
        </button>
      </div>

      {/* ---------- CARD ---------- */}
      <div style={styles.card}>
        <div style={styles.content}>
          <strong style={styles.title}>{post.content}</strong>
        </div>

        {images.length > 0 && (
          <div style={styles.mainImage}>
            <img src={images[0].image_path} alt="main" style={styles.fullImage} />
          </div>
        )}

        <div style={styles.metaRow}>
          <LikeButtonUserPanel postId={post.id} />
          <div style={styles.metaIcon} onClick={() => setShowComments(p => !p)}>
            <img src={commentIcon} alt="comments" style={{ width: 20 }} />
            <span style={styles.metaText}>{commentCount}</span>
          </div>
        </div>

        {showComments && (
          <div style={styles.commentWrap}>
            <CommentSection postId={post.id} />
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- INLINE STYLES ---------- */
const styles = {
  wrapper: { marginBottom: 20 },

  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    padding: "0 4px",
  },
  userBlock: { display: "flex", gap: 12, alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: "50%", objectFit: "cover" },
  name:   { fontWeight: 600, fontSize: 16, color:"white" },
  time:   { fontSize: 13, color: "#B2B2B2", marginTop: 2 },
  editBtn:{ background: "none", border: "none", cursor: "pointer", padding: 6 },

  card: {
    background: "#fff",
    padding: 16,
    borderRadius: 12,
    color: "#000",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  content: { marginBottom: 12 },
  title:   { fontSize: 15 },

  mainImage: { width: "100%", overflow: "hidden", borderRadius: 8 },
  fullImage: { width: "100%", height: "auto", objectFit: "cover", borderRadius: 8 },

  metaRow:  { display: "flex", alignItems: "center", gap: 20, marginTop: 12 },
  metaIcon: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer" },
  metaText: { fontSize: 14, color: "#333" },

  /* ---- самое важное: делаем фон, рамку и отступы ---- */
  commentWrap: {
    marginTop: 12,
    padding: 12,
    background: "#D50032",          // заметно серый фон
    borderRadius: 8,
    border: "1px solid #E0E0E0",
                  // цвет текста CommentSection
  },
};

export default MyPostCard;
