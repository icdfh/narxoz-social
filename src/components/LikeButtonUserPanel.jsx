import React, { useEffect, useState } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { fetchLikes, toggleLike } from "../store/postSlice";

/* ваши иконки */
import unlikedIcon from "../assets/icons/like_for_userpanel.svg";   // не актив
import likedIcon   from "../assets/icons/unactive_like.svg";    // актив

const EMPTY = { liked: false, count: 0 };

export default function LikeButtonUserPanel({ postId }) {
  const dispatch = useDispatch();
  const nickname = useSelector((s) => s.auth.user?.nickname);

  const like = useSelector(
    (s) => s.posts.likesByPost[postId] || EMPTY,
    shallowEqual
  );

  const [initFetched, setInitFetched] = useState(false);
  const [busy, setBusy]               = useState(false);

  /* начальное состояние лайка */
  useEffect(() => {
    if (!nickname || initFetched) return;
    dispatch(fetchLikes({ postId, currentNickname: nickname }));
    setInitFetched(true);
  }, [nickname, initFetched, dispatch, postId]);

  const click = async (e) => {
    e.stopPropagation();
    if (!nickname || busy) return;
    setBusy(true);
    await dispatch(toggleLike(postId));
    setBusy(false);
  };

  return (
    <div
      onClick={click}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        cursor: nickname && !busy ? "pointer" : "not-allowed",
        opacity: busy ? 0.6 : 1,
        userSelect: "none",
      }}
    >
      <img
        src={like.liked ? likedIcon : unlikedIcon}
        alt="like"
        style={{ width: 20, height: 20 }}
      />
      <span style={{ fontSize: 14, color: "#333" }}>{like.count}</span>
    </div>
  );
}
