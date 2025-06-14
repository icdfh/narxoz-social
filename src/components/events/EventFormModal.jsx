import React, { useState, useEffect } from "react";
import cls from "./EventFormModal.module.css";
import apiClient from "../../utils/apiClient";

/* ───────── helpers ───────── */
const iso = (val) => (val ? new Date(val).toISOString() : null);
const initState = {
  title: "",
  description: "",
  place: "",
  start_at: "",
  end_at: "",
};

export default function EventFormModal({ open, initial, onClose, onSuccess }) {
  if (!open) return null;

  const isEdit = !!initial;
  const [form, setForm] = useState(initState);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState(null); // {field: [msg]}

  /* если редактирование — заполняем форму данными события */
  useEffect(() => {
    if (isEdit) {
      setForm({
        title:       initial.title       || "",
        description: initial.description || "",
        place:       initial.place       || "",
        start_at:    initial.start_at?.slice(0, 16) || "", // ISO -> 2025-06-04T14:30
        end_at:      initial.end_at?.slice(0, 16)   || "",
      });
    } else {
      setForm(initState);
    }
  }, [initial, isEdit]);

  /* изменения в полях */
  const handle = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* submit */
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors(null);
    try {
      const payload = {
        ...form,
        start_at: iso(form.start_at),
        end_at:   iso(form.end_at),
      };

      if (isEdit)
        await apiClient.put(`/events/${initial.id}/`, payload);
      else
        await apiClient.post("/events/",          payload);

      onSuccess();   // перезагрузить календарь
      onClose();
    } catch (err) {
      console.error("❌ form error:", err.response?.data || err);
      setErrors(err.response?.data || { detail: ["Unknown error"] });
    } finally {
      setBusy(false);
    }
  };

  /* helper: вывести ошибки под полем */
  const fieldErr = (name) =>
    errors?.[name] && <span className={cls.err}>{errors[name][0]}</span>;

  return (
    <div className={cls.backdrop} onClick={onClose}>
      <form
        className={cls.modal}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h3>{isEdit ? "Edit event" : "Create event"}</h3>

        <label>
          Title *
          <input
            name="title"
            value={form.title}
            onChange={handle}
            required
          />
          {fieldErr("title")}
        </label>

        <label>
          Place *
          <input
            name="place"
            value={form.place}
            onChange={handle}
            required
          />
          {fieldErr("place")}
        </label>

        <label>
          Description
          <textarea
            name="description"
            rows="3"
            value={form.description}
            onChange={handle}
          />
          {fieldErr("description")}
        </label>

        <label>
          Start&nbsp;at *
          <input
            type="datetime-local"
            name="start_at"
            value={form.start_at}
            onChange={handle}
            required
          />
          {fieldErr("start_at")}
        </label>

        <label>
          End&nbsp;at
          <input
            type="datetime-local"
            name="end_at"
            value={form.end_at}
            onChange={handle}
          />
          {fieldErr("end_at")}
        </label>

        {errors?.non_field_errors && (
          <div className={cls.err}>{errors.non_field_errors[0]}</div>
        )}
        {errors?.detail && (
          <div className={cls.err}>{errors.detail[0]}</div>
        )}

        <div className={cls.btnRow}>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={busy}>
            {isEdit ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
