import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { acceptPolicy } from "../store/authSlice";
import "../assets/css/PolicyModal.css";

export default function PolicyModal() {
  const dispatch = useDispatch();
  // показываем, только если пользователь залогинен и ещё не принял политику
  const needPP = useSelector((s) => s.auth.user?.is_policy_accepted === false);
  const [busy, setBusy] = useState(false);

  if (!needPP) return null;

  const handleAccept = async () => {
    setBusy(true);
    try {
      // ставим флаг на сервере и в Redux (+ сохраняем в localStorage через extraReducer)
      await dispatch(acceptPolicy()).unwrap();
      // после этого Layout.jsx по депенденси isPolicyAccepted сам дёрнет fetchProfile
    } catch (e) {
      console.error("Ошибка при приёме политики:", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pp-backdrop">
      <div className="pp-modal">
        <h2>Политика конфиденциальности платформы Narxoz Social</h2>
        <div className="pp-content">
          {/* сюда ваш текст политики */}
        </div>
        <button className="pp-accept" onClick={handleAccept} disabled={busy}>
          {busy ? "Сохраняем…" : "Принять"}
        </button>
      </div>
    </div>
  );
}
