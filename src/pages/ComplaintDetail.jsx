// src/pages/ComplaintDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";
import "../assets/css/ComplaintDetail.css";

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [status, setStatus]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => {
    apiClient.get(`/complaints/${id}/`)
      .then(res => {
        setComplaint(res.data);
        setStatus(res.data.status);  // уже "pending" или "canceled" или "resolved"
      })
      .catch(e => {
        console.error("Не удалось загрузить жалобу:", e);
        alert("Ошибка при загрузке жалобы");
        navigate(-1);
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/complaints/${id}/`, { status });
      setComplaint(c => ({ ...c, status }));
      alert("Статус сохранён");
    } catch (e) {
      console.error("Ошибка сохранения:", e);
      const msg = e.response?.data?.status?.join?.("; ") || e.message;
      alert("Не удалось обновить статус: " + msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Вы уверены, что хотите удалить эту жалобу?")) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/complaints/${id}/`);
      alert("Жалоба удалена");
      navigate(-1);
    } catch (e) {
      console.error("Ошибка удаления:", e);
      alert("Не удалось удалить жалобу");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p>Загрузка...</p>;
  if (!complaint) return <p>Жалоба не найдена</p>;

  return (
    <div className="complaint-detail-container">
      <header className="complaint-detail-header">
        <h2>Жалоба #{complaint.id}</h2>
        <button className="back-btn" onClick={() => navigate(-1)}>← Назад</button>
      </header>

      <div className="complaint-detail-field">
        <label>Автор:</label>
        <span className="value">{complaint.author}</span>
      </div>

      <div className="complaint-detail-field">
        <label>Тип:</label>
        <span className="value">{complaint.content_type}</span>
      </div>

      <div className="complaint-detail-field">
        <label>Object ID:</label>
        <span className="value">{complaint.object_id}</span>
      </div>

      <div className="complaint-detail-field">
        <label>Текст жалобы:</label>
        <p className="value">{complaint.text}</p>
      </div>

      <div className="complaint-detail-field">
        <label>Статус:</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          disabled={saving || deleting}
        >
          <option value="pending">Pending</option>
          <option value="canceled">Canceled</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="complaint-detail-actions">
        <button className="btn save" onClick={handleSave} disabled={saving || deleting}>
          {saving ? "Сохраняем…" : "Сохранить"}
        </button>
        <button className="btn delete" onClick={handleDelete} disabled={saving || deleting}>
          {deleting ? "Удаляем…" : "Удалить"}
        </button>
      </div>
    </div>
  );
}
