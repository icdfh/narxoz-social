import React from "react";
import Modal from "../common/Modal";
import "../../assets/css/ChatShareModal.css";

export default function ChatShareModal({ contacts, onClose, onSelect }) {
  return (
    <Modal onClose={onClose}>
      <div className="chat-share-modal">
        <h3>Кому отправить сообщение?</h3>
        <ul className="chat-share-list">
          {contacts.map(c => (
            <li
              key={c.chatId}
              className="chat-share-item"
              onClick={() => onSelect(c.chatId)}
            >
              <img
                src={c.avatarUrl}
                alt={c.nickname}
                className="chat-share-avatar"
              />
              <span className="chat-share-nickname">@{c.nickname}</span>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
