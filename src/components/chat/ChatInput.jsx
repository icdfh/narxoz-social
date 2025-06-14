// src/components/chat/ChatInput.jsx
import React, { useRef, useState } from "react";
import apiClient from "../../utils/apiClient";
import clipIcon from "../../assets/icons/clip.svg";
import "../../assets/css/ChatInput.css";

export default function ChatInput({ chatId, onSend }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  // Отправка текста
  const sendText = () => {
    if (!text.trim()) return;
    onSend({ type: "text", text });
    setText("");
  };

  // Обработка выбора файлов и загрузка на сервер
  const handleFiles = async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const form = new FormData();
    form.append("chat_id", chatId);
    files.forEach(f => form.append("files", f));

    setBusy(true);
    try {
      const { data } = await apiClient.post(
        "/chats/upload-file/",
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );
      // После успешной загрузки шлём каждый файл в чат через onSend
      data.files.forEach(f =>
        onSend({
          type:      "file",
          url:       f.file_url,
          name:      f.filename,
          __localId: crypto.randomUUID()
        })
      );
    } catch (err) {
      alert("Ошибка при загрузке файла");
      console.error(err);
    } finally {
      setBusy(false);
      // Сброс значения input, чтобы можно было снова загрузить тот же файл
      fileRef.current.value = "";
    }
  };

  return (
    <div className="chat-input-wrap">
      {/* Скрытый input для выбора файлов */}
      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        onChange={handleFiles}
      />

      {/* Кнопка прикрепления файлов */}
      <button
        className="clip-btn"
        disabled={busy}
        onClick={() => fileRef.current.click()}
        aria-label="Attach file"
      >
        <img src={clipIcon} alt="Attach file" />
      </button>

      {/* Поле ввода текста */}
      <textarea
        className="msg-field"
        placeholder="Message…"
        value={text}
        disabled={busy}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendText();
          }
        }}
      />

      {/* Кнопка отправки текста */}
      <button
        className="send-btn"
        disabled={busy || !text.trim()}
        onClick={sendText}
        aria-label="Send message"
      >
        ➤
      </button>
    </div>
  );
}
