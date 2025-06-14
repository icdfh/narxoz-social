// src/components/common/Modal.jsx
import React from "react";
import "../../assets/css/Modal.css";

export default function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}
