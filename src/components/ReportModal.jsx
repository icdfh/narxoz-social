// src/components/ReportModal.jsx
import React, { useState } from "react";
import apiClient from "../utils/apiClient";
import "../assets/css/ReportModal.css";

export default function ReportModal({
  targetType,
  objectId,
  postTitle,
  postAuthor,
  avatar,
  fullName,
  nickname,
  login,
  onClose,
  onSuccess,
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return alert("Опишите причину жалобы");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("target_type", targetType);
      form.append("object_id", objectId);
      form.append("text", text);
      if (file) form.append("attachment", file);

      // Принудительно указываем multipart/form-data
      const response = await apiClient.post(
        "/complaints/create/",
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      onSuccess();
    } catch (e) {
      // Показываем точную ошибку от сервера
      const msg =
        e.response?.data
          ? JSON.stringify(e.response.data, null, 2)
          : e.message;
      console.error("Ошибка создания жалобы:", e.response?.data || e);
      alert("Не удалось отправить жалобу:\n" + msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="report-backdrop">
      <div className="report-modal">
        <h3>
          Жалоба на{" "}
          {targetType === "post"
            ? `пост «${postTitle}» (автор ${postAuthor})`
            : "пользователя"}
        </h3>

        {targetType === "user" && (
          <div className="report-user-info">
            <img src={avatar} alt="avatar" className="report-user-avatar" />
            <div className="report-user-text">
              <strong>{fullName}</strong> @{nickname}
             
              
            </div>
          </div>
        )}

        <textarea
          className="report-content"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Опишите причину..."
        />

        <input
          className="report-content"
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <div className="report-actions">
          <button
            className="report-btn cancel"
            onClick={onClose}
            disabled={busy}
          >
            Отмена
          </button>
          <button
            className="report-btn submit"
            onClick={handleSubmit}
            disabled={busy}
          >
            {busy ? "Отправляем…" : "Отправить"}
          </button>
        </div>
      </div>
    </div>
  );
}
