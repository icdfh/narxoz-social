// src/components/MoreButton.jsx

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../assets/css/MoreButton.css";

import postMoreIcon from "../assets/icons/more_for_post.svg";

export default function MoreButton({
  targetType,
  objectId,
  onView,
  onReport,
  onShare
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  // Закрыть меню при клике вне
  useEffect(() => {
    const handleClickOutside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleView = () => {
    setOpen(false);
    if (onView) {
      return onView();
    }
    if (targetType === "post") {
      navigate(`/posts/${objectId}`, { state: { background: location } });
    } else if (targetType === "user") {
      navigate(`/profile/${objectId}`);
    } else if (targetType === "event") {
      navigate(`/events/${objectId}`);
    }
  };

  const handleReport = () => {
    setOpen(false);
    onReport && onReport({ targetType, objectId });
  };

  const handleShare = () => {
    setOpen(false);
    onShare && onShare({ targetType, objectId });
  };

  return (
    <div className="more-btn-wrapper" ref={menuRef}>
      <img
        src={postMoreIcon}
        alt="more"
        className="more-btn-icon"
        onClick={() => setOpen(o => !o)}
      />
      {open && (
        <div className="more-menu">
          <button onClick={handleView}>Просмотреть</button>
          <button onClick={handleReport}>Пожаловаться</button>
          <button onClick={handleShare}>Поделиться</button>
        </div>
      )}
    </div>
  );
}
