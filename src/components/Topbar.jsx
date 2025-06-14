/*  src/components/Topbar.jsx  */
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";

import calendarIcon from "../assets/icons/calendar.svg";
import bellIcon     from "../assets/icons/notification.svg";
import searchIcon   from "../assets/icons/search.svg";

import "../assets/css/Topbar.css";
import SearchDropdown        from "./SearchDropdown";
import NotificationsDropdown from "./NotificationsDropdown";

/* -------------------------------------------------- */
export default function Topbar() {
  const user  = useSelector(s => s.auth.user);
  const navigate = useNavigate();

  /* ---------- поиск ---------- */
  const [q,setQ] = useState("");
  const [openSearch,setOpenSearch] = useState(false);
  const [searchRes,setSearchRes]   = useState(null);
  const [loading,setLoading]       = useState(false);
  const deb = useRef();

  /* ---------- уведомления ---------- */
  const [notifs,setNotifs]   = useState([]);
  const [openBell,setOpenBell] = useState(false);
  const boxRef = useRef();
  const pollRef = useRef();

  /* ===== 1. начальный fetch + polling ===== */
  useEffect(() => {
    if (!user) return;

    const load = () =>
      apiClient.get("/notifications/")
        .then(r=>{
          const arr = Array.isArray(r.data)?r.data:r.data.results||[];
          setNotifs(arr.map(n=>({
            ...n,
            ts:new Date(n.created_at).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"})
          })));
        })
        .catch(()=>{/* тихо */});

    load();                          // сразу
    pollRef.current = setInterval(load, 25_000); // каждые 25 c

    return () => clearInterval(pollRef.current);
  }, [user]);

  /* ===== 2. внешние клики закрывают дропдауны ===== */
  useEffect(() => {
    const out = e => !boxRef.current?.contains(e.target) && (setOpenSearch(false),setOpenBell(false));
    document.addEventListener("mousedown",out);
    return () => document.removeEventListener("mousedown",out);
  }, []);

  /* ===== 3. debounce-поиск ===== */
  const onSearch = e => {
    const val = e.target.value;
    setQ(val); clearTimeout(deb.current);

    if (!val.trim()){ setSearchRes(null); setOpenSearch(false); return; }

    deb.current = setTimeout(async ()=>{
      setLoading(true);
      try{
        const [g,u] = await Promise.all([
          apiClient.get("/search/global/",{params:{q:val}}),
          apiClient.get("/search/users/", {params:{search:val}})
        ]);
        setSearchRes({
          ...g.data,
          users:(u.data.results||[]).filter(x=>x.role!=="organization")
        });
        setOpenSearch(true);
      }catch{/* ignore */}
      finally{ setLoading(false); }
    },400);
  };

  /* ===== 4. helpers ===== */
  const goCalendar = () => navigate("/events/calendar");
  const goAddUser  = () => navigate("/admin/register");

  /* ============ JSX ============ */
  return (
    <div className="topbar" ref={boxRef}>
      {/* поиск */}
      <div className="search-wrapper">
        <input className="search-input" placeholder="Search"
               value={q} onChange={onSearch}
               onFocus={()=>searchRes&&setOpenSearch(true)}/>
        <img src={searchIcon} className="search-icon" alt=""/>
      </div>
      {openSearch&&q&&(
        <SearchDropdown
          query={q}
          loading={loading}
          data={searchRes}
          onClose={()=>setOpenSearch(false)}
        />
      )}

      {/* иконки */}
      <div className="topbar-icons">
        <button onClick={goCalendar} className="icon-button" title="Календарь">
          <img src={calendarIcon} className="topbar-icon" alt=""/>
        </button>

        <button onClick={()=>setOpenBell(b=>!b)}
                className="icon-button" title="Уведомления">
          <img src={bellIcon} className="topbar-icon" alt=""/>
          {notifs.length>0&&<span className="notif-badge">{notifs.length}</span>}
        </button>

        {openBell&&user&&(
          <NotificationsDropdown
            items={notifs}
            onNavigate={(link,id)=>{
              navigate(link);
              setNotifs(p=>p.filter(n=>n.id!==id));
              setOpenBell(false);
            }}
            onClose={()=>setOpenBell(false)}
            onMarkRead={id=>setNotifs(p=>p.filter(n=>n.id!==id))}
          />
        )}

        {user?.role==="admin"&&(
          <button onClick={goAddUser} className="add-user-btn">ADD USER</button>
        )}
      </div>
    </div>
  );
}
