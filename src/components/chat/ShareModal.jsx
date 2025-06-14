import React, { useState } from "react";
import "..//..//assets//css//ShareModal.css"

export default function ShareModal({ options, onConfirm, onClose }) {
  const [target, setTarget] = useState(options[0]?.id || "");
  const [note, setNote]     = useState("");

  const submit = () => {
    if (!target) return;
    onConfirm(target, note);
    setNote("");
  };

  return (
    <div className="share-backdrop">
      <div className="share-modal">
        <h3>Переслать сообщение</h3>
        <select
          value={target}
          onChange={e => setTarget(e.target.value)}
        >
          {options.map(o => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <textarea
          placeholder="Добавить комментарий (необязательно)…"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <div className="share-actions">
          <button onClick={onClose}>Отмена</button>
          <button onClick={submit}>Отправить</button>
        </div>
      </div>
    </div>
  );
}
