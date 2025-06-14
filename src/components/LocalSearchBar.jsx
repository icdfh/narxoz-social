// src/components/LocalSearchBar.jsx
import React, { useEffect, useRef, useState } from "react";
import apiClient from "../utils/apiClient";
import "../assets/css/LocalSearchBar.css";

const LocalSearchBar = ({
  endpoint,
  mapResult,
  placeholder = "Search…",
  debounceMs = 300,
}) => {
  const [q, setQ]         = useState("");
  const [items, setItems] = useState([]);
  const [loading, setL]   = useState(false);
  const [open, setOpen]   = useState(false);
  const timer = useRef(null);
  const box   = useRef(null);

  const onChange = (e) => {
    const v = e.target.value;
    setQ(v);
    clearTimeout(timer.current);

    if (!v.trim()) {
      setItems([]);
      setOpen(false);
      return;
    }

    timer.current = setTimeout(async () => {
      setL(true);
      try {
        const { data } = await apiClient.get(endpoint, {
          params: { q: v },
        });
        const arr = Array.isArray(data) ? data : data.results || [];
        setItems(arr.map(mapResult));
        setOpen(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setL(false);
      }
    }, debounceMs);
  };

  useEffect(() => {
    const onOutside = (e) => {
      if (box.current && !box.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div className="lsb-box" ref={box}>
      <input
        className="lsb-input"
        placeholder={placeholder}
        value={q}
        onChange={onChange}
        onFocus={() => items.length && setOpen(true)}
      />

      {open && (
        <div className="lsb-dd">
          {loading && <div className="lsb-loading">поиск…</div>}

          {!loading && items.map((it) => (
            <div
              key={it.id}
              className="lsb-item"
              onClick={() => {
                it.onClick();
                setOpen(false);
              }}
            >
              {it.label}
            </div>
          ))}

          {!loading && !items.length && (
            <div className="lsb-empty">ничего не найдено</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocalSearchBar;
