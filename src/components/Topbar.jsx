/*  src/components/Topbar.jsx  */

import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import apiClient       from "../utils/apiClient";
import { makeWsUrl }   from "../utils/ws";           // ← импорт утилиты
import calendarIcon    from "../assets/icons/calendar.svg";
import bellIcon        from "../assets/icons/notification.svg";
import searchIcon      from "../assets/icons/search.svg";

import "../assets/css/Topbar.css";
import SearchDropdown        from "./SearchDropdown";
import NotificationsDropdown from "./NotificationsDropdown";

export default function Topbar() {
  const user    = useSelector(s => s.auth.user);
  const token   = useSelector(s => s.auth.token);
  const navigate = useNavigate();

  /* поиск */
  const [q, setQ]                 = useState("");
  const [openSearch, setOpenSearch] = useState(false);
  const [searchRes, setSearchRes]   = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const debRef = useRef();

  /* уведомления */
  const [notifs, setNotifs]     = useState([]);
  const [openBell, setOpenBell] = useState(false);
  const boxRef                  = useRef();
  const wsRef                   = useRef();

  // 1. initial fetch + WebSocket for live updates
  useEffect(() => {
    if (!user || !token) return;

    // initial load
    apiClient.get("/notifications/")
      .then(r => {
        const arr = Array.isArray(r.data) ? r.data : r.data.results||[];
        setNotifs(arr.map(n => ({
          ...n,
          ts: new Date(n.created_at)
                .toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"})
        })));
      })
      .catch(() => {});

    // open WS
    const socket = new WebSocket(makeWsUrl("notify/", token));
    wsRef.current = socket;

    socket.onmessage = ({ data }) => {
      try {
        const n = JSON.parse(data);
        n.ts = new Date(n.created_at)
                 .toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"});
        setNotifs(prev => [n, ...prev]);
      } catch {}
    };
    socket.onerror = err => console.error("WS error:", err);
    socket.onclose = () => {
      // optionally reconnect logic
      console.warn("WS closed");
    };

    return () => {
      socket.close();
    };
  }, [user, token]);

  // 2. close dropdowns on outside click
  useEffect(() => {
    const onClickOutside = e => {
      if (!boxRef.current?.contains(e.target)) {
        setOpenSearch(false);
        setOpenBell(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  // 3. debounce search
  const onSearch = e => {
    const val = e.target.value;
    setQ(val);
    clearTimeout(debRef.current);

    if (!val.trim()) {
      setSearchRes(null);
      setOpenSearch(false);
      return;
    }

    debRef.current = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const [gRes, uRes] = await Promise.all([
          apiClient.get("/search/global/", { params: { q: val } }),
          apiClient.get("/search/users/",  { params: { search: val } })
        ]);
        setSearchRes({
          ...gRes.data,
          users: (uRes.data.results || [])
                   .filter(u => u.role !== "organization")
        });
        setOpenSearch(true);
      } catch {}
      finally {
        setLoadingSearch(false);
      }
    }, 400);
  };

  /* helpers */
  const goCalendar  = () => navigate("/events/calendar");
  const goAddUser   = () => navigate("/admin/register");

  return (
    <div className="topbar" ref={boxRef}>
      {/* Search */}
      <div className="search-wrapper">
        <input
          className="search-input"
          placeholder="Search"
          value={q}
          onChange={onSearch}
          onFocus={() => searchRes && setOpenSearch(true)}
        />
        <img src={searchIcon} className="search-icon" alt="Search" />
      </div>
      {openSearch && q && (
        <SearchDropdown
          query={q}
          loading={loadingSearch}
          data={searchRes}
          onClose={() => setOpenSearch(false)}
        />
      )}

      {/* Icons */}
      <div className="topbar-icons">
        <button onClick={goCalendar} className="icon-button" title="Календарь">
          <img src={calendarIcon} className="topbar-icon" alt="Calendar" />
        </button>

        <button
          onClick={() => setOpenBell(b => !b)}
          className="icon-button"
          title="Уведомления"
        >
          <img src={bellIcon} className="topbar-icon" alt="Notifications" />
          {notifs.length > 0 && (
            <span className="notif-badge">{notifs.length}</span>
          )}
        </button>

        {openBell && user && (
          <NotificationsDropdown
            items={notifs}
            onNavigate={(link, id) => {
              navigate(link);
              setNotifs(prev => prev.filter(n => n.id !== id));
              setOpenBell(false);
            }}
            onClose={() => setOpenBell(false)}
            onMarkRead={id => setNotifs(prev => prev.filter(n => n.id !== id))}
          />
        )}

        {user?.role === "admin" && (
          <button onClick={goAddUser} className="add-user-btn">
            ADD USER
          </button>
        )}
      </div>
    </div>
  );
}
