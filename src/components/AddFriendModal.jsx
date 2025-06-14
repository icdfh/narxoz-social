// src/components/AddFriendModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";
import "../assets/css/AddFriendModal.css";

export default function AddFriendModal({
  existingFriends = [],       // [id, id, …]
  outgoingRequests = [],      // [id, id, …] to_user IDs
  incomingRequests = [],      // [id, id, …] from_user IDs
  onFriendAdded,              // callback после добавления
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  // закрыть по клику вне
  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // debounce + поиск
  const handleChange = (e) => {
    const v = e.target.value;
    setQ(v);
    clearTimeout(timer.current);
    setResults([]);
    if (v.trim().length < 2) return;
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get("/search/users/", {
          params: { q: v.trim() },
        });
        const arr = Array.isArray(data) ? data : data.results || [];
        const lower = v.trim().toLowerCase();
        // фильтруем по name/nickname/login
        const filtered = arr.filter((u) => {
          return (
            u.full_name?.toLowerCase().includes(lower) ||
            u.nickname?.toLowerCase().includes(lower) ||
            u.login?.toLowerCase().includes(lower)
          );
        });
        setResults(filtered);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div className="afm-box" ref={boxRef}>
      <button
        className="friends-add-btn"
        onClick={() => {
          setOpen((o) => !o);
          setQ("");
          setResults([]);
        }}
      >
        Add Friends
      </button>

      {open && (
        <div className="afm-modal">
          <input
            type="text"
            className="afm-input"
            placeholder="Login / имя / ник…"
            value={q}
            onChange={handleChange}
            autoFocus
          />
          {loading && <div className="afm-loading">Loading…</div>}

          {!loading && (
            <ul className="afm-results">
              {results.length === 0 ? (
                <li className="afm-empty">No users</li>
              ) : (
                results.map((u) => {
                  const isFriend = existingFriends.includes(u.id);
                  const isOutgoing = outgoingRequests.includes(u.id);
                  const isIncoming = incomingRequests.includes(u.id);
                  let status = "";
                  if (isFriend) status = "Friends";
                  else if (isOutgoing) status = "Заявка отправлена";
                  else if (isIncoming) status = "Вам отправили заявку";

                  return (
                    <li key={u.id} className="afm-item">
                      <span
                        className="afm-label"
                        onClick={() => {
                          navigate(`/profile/${u.id}`);
                          setOpen(false);
                        }}
                      >
                        {u.full_name || u.nickname} (@{u.nickname})
                      </span>

                      {status ? (
                        <span className="afm-status">{status}</span>
                      ) : (
                        <button
                          className="afm-add-btn-usr"
                          onClick={async () => {
                            await apiClient.post(`/friends/send/${u.id}/`);
                            setOpen(false);
                            onFriendAdded?.();
                          }}
                        >
                          Добавить
                        </button>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
