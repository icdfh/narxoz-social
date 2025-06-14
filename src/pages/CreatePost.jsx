// src/pages/CreatePost.jsx
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { createPost } from "../store/postSlice";
import { useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";

import deleteIcon from "../assets/icons/delete_for_createpost.svg";
import "../assets/css/CreateDetail.css";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);

  const dispatch = useDispatch();
  const nav = useNavigate();

  // Выбор файлов
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) {
      setImages((prev) => [...prev, ...files]);
    }
    e.target.value = null;
  };

  // Удалить картинку по индексу
  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;
    setBusy(true);

    // Сначала создаём пост (только текст)
    const res = await dispatch(createPost({ content }));
    if (res.meta.requestStatus !== "fulfilled") {
      setBusy(false);
      return;
    }

    const postId = res.payload.id;

    // Затем загружаем каждую картинку
    for (const file of images) {
      const form = new FormData();
      form.append("image_path", file);
      try {
        await apiClient.post(`/posts/image-upload/${postId}/`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch {
        // Ошибки можно обработать отдельно (например: показать уведомление)
      }
    }

    setBusy(false);
    nav("/home");
  };

  return (
    <div className="page-wrapper">
      <div className="create-card">
        <h1 className="create-title">Create Post</h1>

        <form className="create-form" onSubmit={onSubmit} noValidate>
          {/* Поле для текста */}
          <div className="form-group">
            <label htmlFor="postContent" className="form-label">
              Post Content
            </label>
            <textarea
              id="postContent"
              className="form-field"
              rows="4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your post here..."
            ></textarea>
          </div>

          {/* Кнопка загрузки изображений */}
          <div className="form-group">
            <label className="upload-btn">
              Upload Images
              <input
                type="file"
                multiple
                accept="image/*"
                className="file-input"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Превью выбранных картинок */}
          {images.length > 0 && (
            <div className="preview-grid">
              {images.map((file, idx) => {
                const objectUrl = URL.createObjectURL(file);
                return (
                  <div className="preview-item" key={idx}>
                    <img
                      className="preview-img"
                      src={objectUrl}
                      alt={`preview-${idx}`}
                    />
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeImage(idx)}
                    >
                      <img src={deleteIcon} alt="delete" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Кнопка «Publish» */}
          <button
            type="submit"
            className="publish-btn"
            disabled={busy}
          >
            {busy ? "Publishing..." : "Publish"}
          </button>
        </form>
      </div>
    </div>
  );
}
