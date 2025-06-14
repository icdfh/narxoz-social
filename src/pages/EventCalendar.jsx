import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";

import cls from "./EventCalendar.module.css";
import apiClient from "../utils/apiClient";
import EventDrawer from "../components/events/EventDrawer";
import EventFormModal from "../components/events/EventFormModal";
import TabBar from "../components/ui/TabBar";
import { useMySubscriptions } from "../hooks/useEvents";

import starIcon from "../assets/icons/star.svg";   // ⭐
import listIcon from "../assets/icons/list.svg";   // 📋

import "react-big-calendar/lib/css/react-big-calendar.css";

/* helpers */
const localizer = momentLocalizer(moment);
const Dot = ({ color }) => <span className={cls.dot} style={{ background: color }} />;
const MonthEvent = ({ event }) => (
  <div className={cls.monthItem}>
    <Dot color={event.color} />
    <span className={cls.titleTxt}>{event.title}</span>
  </div>
);

/* табы (для своего календаря) */
const ORIG_TABS = {
  all: { label: "All", urls: ["/events/active/", "/events/finished/"] },
  active:   { label: "Active",   urls: ["/events/active/"] },
  finished: { label: "Finished", urls: ["/events/finished/"] },
  mine:     { label: "My",       urls: ["/events/my/"] },
  subs:     { label: "Subs",     urls: ["/events/my/active-subscriptions/"] },
};

export default function EventCalendar() {
  const { userId } = useParams();                    // чужой календарь?
  const navigate   = useNavigate();
  const role       = useSelector((s) => s.auth.user?.role);

  const mayCreate  = !userId && ["teacher","organization","moderator","admin"].includes(role);
  const isMod      = ["moderator","admin"].includes(role);

  /* state */
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState(userId ? "only" : "all");
  const [selected, setSelected] = useState(null);
  const [curDate,  setCurDate]  = useState(new Date());
  const [showCreate, setShowCreate] = useState(false);

  const { subs, loading: subsLoad, subscribe, unsubscribe } = useMySubscriptions();

  /* таб-конфиг */
  const TAB_CFG = userId ? { only:{ label:"User", urls:[`/events/by-user/${userId}/`] } } : ORIG_TABS;

  /* fetch */
  const fetchEvents = useCallback(async (key) => {
    setLoading(true);
    const urls  = TAB_CFG[key].urls;
    const resps = await Promise.all(urls.map((u) => apiClient.get(u)));

    const meId = JSON.parse(localStorage.getItem("user") || "{}")?.id ?? null;
    const raw  = resps.flatMap((r) => Array.isArray(r.data) ? r.data : r.data.results || []);
    const norm = key==="subs" ? raw.map((s)=>s.event) : raw;

    setEvents(norm.map((e)=>({
      id:e.id,title:e.title,start:new Date(e.start_at),end:new Date(e.end_at||e.start_at),
      start_at:e.start_at,end_at:e.end_at,description:e.description,
      created_by:e.created_by,owned:e.created_by.id===meId,
      color:"#E56AE3",textColor:"#000"
    })));
    setLoading(false);
  }, [TAB_CFG]);

  useEffect(()=>{ fetchEvents(tab); }, [tab, fetchEvents]);
  const reload = () => fetchEvents(tab);

  const monthList = () => {
    const base = moment(curDate);
    return Array.from({length:6},(_,i)=>{ const m=base.clone().add(i-2,"months"); return{date:m.toDate(),label:m.format("MMMM"),active:i===2};});
  };

  if (loading || subsLoad) return <p style={{padding:24}}>Loading…</p>;

  return (
    <section className={cls.wrapper}>
      {/* месяцы слева */}
      <aside className={cls.side}>
        {monthList().map(m=>(
          <div key={m.label} className={m.active?cls.monthActive:cls.month} onClick={()=>setCurDate(m.date)}>
            {m.label}
          </div>
        ))}
      </aside>

      {/* контент */}
      <div className={cls.content}>
        {/* ряд кнопок */}
        <div className={cls.btnRow}>
          {mayCreate && <button className={cls.createBtn} onClick={()=>setShowCreate(true)}>＋ Create</button>}

          {!userId && (
            <>
              <button className={cls.iconBtn} onClick={()=>navigate("/events/subscriptions")} title="My subs">
                <img src={starIcon} alt="subs"/>
              </button>

              {isMod && (
                <button className={cls.iconBtn} onClick={()=>navigate("/events/reminders")} title="Reminders log">
                  <img src={listIcon} alt="log"/>
                </button>
              )}
            </>
          )}
        </div>

        {/* табы (если это ваш календарь) */}
        {Object.keys(TAB_CFG).length>1 && (
          <TabBar
            tabs={Object.entries(TAB_CFG).map(([k,v])=>({key:k,label:v.label}))}
            current={tab}
            onChange={setTab}
          />
        )}

        {/* календарь */}
        <Calendar
          localizer={localizer}
          date={curDate}
          onNavigate={setCurDate}
          defaultView="month"
          events={events}
          components={{ month:{ event: MonthEvent } }}
          eventPropGetter={(ev)=>({style:{background:"transparent",border:"none",padding:0,color:ev.textColor}})}
          onSelectEvent={(e)=>setSelected(e.resource??e)}
          style={{height:"60vh"}}
        />
      </div>

      {/* Drawer + Create modal */}
      <EventDrawer
        open={!!selected} event={selected} onClose={()=>setSelected(null)}
        onSubscribe={subscribe} onUnsubscribe={unsubscribe}
        isSubscribed={subs.has(selected?.id)} reload={reload} meRole={role}
      />

      <EventFormModal open={showCreate} onClose={()=>setShowCreate(false)} onSuccess={reload}/>
    </section>
  );
}
