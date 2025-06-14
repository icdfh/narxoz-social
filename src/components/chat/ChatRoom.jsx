/*  src/components/chat/ChatRoom.jsx  */

import React, {
  useEffect, useRef, useState, useCallback
} from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";

import MessageBubble      from "./MessageBubble";
import ChatInput          from "./ChatInput";
import Modal              from "../common/Modal";
import ManageMembersModal from "./ManageMembersModal";
import ReportModal        from "../../components/ReportModal";
import ChatShareModal     from "./ChatShareModal";

import "../../assets/css/ChatRoom.css";
import searchIcon from "../../assets/icons/search.svg";
import moreIcon   from "../../assets/icons/more.svg";

/* ───────────────────────────────────────── helpers ───────────────────────────────────────── */
const BACKEND_URL = apiClient.defaults.baseURL.replace(/\/api\/?$/, "");
const buildAvatarUrl = p =>
  p && /^https?:\/\//.test(p) ? p : p ? BACKEND_URL + p : "/avatar.jpg";

const tzTime = iso => {
  const hasTZ = /Z$|[+\-]\d{2}:\d{2}$/.test(iso);
  const d = new Date(hasTZ ? iso : iso + "Z");
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Almaty",
  });
};

const mergeUnique = (prev, inc, append = false) => {
  const ids = new Set(prev.map(m => m.id));
  const uniq = inc.filter(m => !ids.has(m.id));
  return append ? [...prev, ...uniq] : [...uniq, ...prev];
};

/* ───────────────────────────────────────── component ─────────────────────────────────────── */
export default function ChatRoom({ chatId }) {
  /* Redux */
  const user  = useSelector(s => s.auth.user);
  const token = useSelector(s => s.auth.token);

  const navigate = useNavigate();

  /* state */
  const [chats,setChats]         = useState([]);
  const [uMap,setUMap]           = useState({});
  const [info,setInfo]           = useState(null);
  const [peerProfile,setPeerProfile] = useState(null);

  const [msgs,setMsgs]           = useState([]);
  const [drafts,setDrafts]       = useState(
    JSON.parse(localStorage.getItem(`chatDrafts_${chatId}`)) || []
  );
  const [more,setMore]           = useState(true);

  const [openSearch,setOpenSearch] = useState(false);
  const [query,setQuery]           = useState("");
  const [filtered,setFiltered]     = useState([]);

  const [menuOpen,setMenuOpen]     = useState(false);
  const [reportParams,setReportParams] = useState(null);
  const [showManage,setShowManage] = useState(false);

  const [confirmDelete,setConfirmDelete] = useState(null);

  /* share-modal */
  const [shareOpen,setShareOpen] = useState(false);
  const [sharePayload,setSharePayload] = useState(null); // {share_type, share_id}
  const [toast,setToast] = useState("");

  /* refs */
  const wsRef = useRef(null);
  const retryRef = useRef(null);
  const listRef  = useRef(null);
  const menuRef  = useRef(null);

  /* ───── helpers ───── */
  const buildWSUrl = () => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const h     = location.hostname;
    const host  = ["localhost","127.0.0.1"].includes(h) ? `${h}:8000` : location.host;
    return `${proto}://${host}/ws/chat/${chatId}/?token=${encodeURIComponent(token)}`;
  };

  /* ───── API: чаты + users map ───── */
  const loadChats = useCallback(async () => {
    const { data } = await apiClient.get("/chats/allchats/");
    setChats(data);

    const missing = data
      .filter(c => c.type === "direct")
      .map(c => c.members.find(id => id !== user.id))
      .filter(id => id && !uMap[id]);

    if (missing.length) {
      const map = { ...uMap };
      await Promise.all(missing.map(async id => {
        try { map[id] = (await apiClient.get(`/users/profile/${id}/`)).data; }
        catch { map[id] = { is_online:false }; }
      }));
      setUMap(map);
    }
  }, [user.id,uMap]);

  const loadInfo = async () =>
    setInfo((await apiClient.get(`/chats/${chatId}/detail/`)).data);

  const loadHistory = async before => {
    let url = `/chats/${chatId}/messages/?limit=20`;
    if (before) url += `&before=${before}`;
    const { data } = await apiClient.get(url);
    if (!data.length) return setMore(false);
    setMsgs(prev => mergeUnique(prev,data,false));
  };

  /* ───── WebSocket ───── */
  const connectWS = () => {
    try { wsRef.current = new WebSocket(buildWSUrl()); }
    catch { retryRef.current = setTimeout(connectWS,2000); return; }

    const sock = wsRef.current;

    sock.onmessage = ({ data }) => {
      const m = JSON.parse(data);
      setMsgs(prev => {
        const cleaned = prev.filter(x =>
          !(x.id.includes("-") && x.file_url && m.file_url && x.file_url === m.file_url)
        );
        const kept = drafts.filter(d => d.file_url !== m.file_url);
        localStorage.setItem(`chatDrafts_${chatId}`, JSON.stringify(kept));
        return mergeUnique(cleaned,[m],true);
      });
      setTimeout(() => {
        listRef.current?.scrollTo({ top:listRef.current.scrollHeight, behavior:"smooth" });
      },20);
    };

    sock.onclose = e => { if (!e.wasClean) retryRef.current = setTimeout(connectWS,2000); };
    sock.onerror = () => {}; // никаких логов
  };

  /* ───── init + re-init при смене token ───── */
  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadChats(); await loadInfo(); await loadHistory();
      setMsgs(prev => mergeUnique(prev,drafts,true));
      if (mounted) connectWS();
    })();
    return () => { mounted=false; wsRef.current?.close(); clearTimeout(retryRef.current); };
  }, [chatId,token,loadChats]);

  /* ───── профиль собеседника (direct) ───── */
  useEffect(() => {
    if (info?.type !== "direct") return;
    const peerId = info.members.find(id => id !== user.id);
    apiClient.get(`/users/profile/${peerId}/`)
      .then(r => setPeerProfile(r.data))
      .catch(()=>setPeerProfile(null));
  }, [info,user.id]);

  /* ───── закрыть header-menu кликом вне ───── */
  useEffect(() => {
    const outside = e => menuOpen && !menuRef.current?.contains(e.target) && setMenuOpen(false);
    document.addEventListener("mousedown",outside);
    return () => document.removeEventListener("mousedown",outside);
  }, [menuOpen]);

  /* ───── поиск по сообщениям ───── */
  useEffect(() => {
    if (openSearch && query.trim()){
      const q = query.toLowerCase();
      setFiltered(msgs.filter(m => (m.text||"").toLowerCase().includes(q)));
    } else setFiltered([]);
  }, [query,msgs,openSearch]);

  /* ───── отправка через WS ───── */
  const sendWS = payload => {
    const sock = wsRef.current; if (!sock) return;

    const msg = { type:"send", text:"" };

    if (payload.type==="text"){
      msg.text = payload.text;
    } else {
      msg.file_url = payload.url;
      msg.filename = payload.name;

      const draft = {
        id:payload.__localId, chat:chatId, sender:user.id,
        created_at:new Date().toISOString(),
        file_url:payload.url, file_name:payload.name
      };
      setMsgs(p => mergeUnique(p,[draft],true));
      const nd=[...drafts,draft];
      setDrafts(nd);
      localStorage.setItem(`chatDrafts_${chatId}`,JSON.stringify(nd));
    }

    const run = () => sock.send(JSON.stringify(msg));
    sock.readyState===WebSocket.OPEN ? run()
      : sock.addEventListener("open",run,{ once:true });
  };

  /* ───── delete message ───── */
  const onDeleteMessage = msg => setConfirmDelete(msg);
  const confirmDeleteYes = async () => {
    await apiClient.delete(`/chats/${chatId}/message/${confirmDelete.id}/delete/`);
    setMsgs(p => p.filter(m=>m.id!==confirmDelete.id));
    setConfirmDelete(null);
  };

  /* ───── friend remove / profile share ───── */
  const removeFriend = async () => {
    await apiClient.delete(`/friends/remove/${peerProfile.id}/`);
    setMenuOpen(false); navigate("/friends");
  };

  /* !!! «Поделиться профилем» теперь открывает ЧАТ-список */
  const shareProfile = () => {
    setSharePayload({ share_type:"profile", share_id:peerProfile.id });
    setShareOpen(true); setMenuOpen(false);
  };

  /* ───── direct-contacts для шаринга ───── */
  const directContacts = chats
    .filter(c=>c.type==="direct")
    .map(c=>{
      const peerId = c.members.find(id=>id!==user.id);
      const peer = uMap[peerId]||{};
      const raw  = peer.avatar_path ?? peer.avatar_url;
      return {
        chatId:c.id,
        nickname:peer.nickname,
        avatarUrl: raw ? buildAvatarUrl(raw) : "/avatar.jpg"
      };
    });

  /* ───── share message (вызывается из MessageBubble) ───── */
  const handleShareMenu = msg => {
    if (msg.id.includes("-")){
      setToast("⏳ Подождите, сообщение сохраняется"); setTimeout(()=>setToast(""),2000); return;
    }
    setSharePayload({ share_type:"message", share_id:msg.id });
    setShareOpen(true);
  };

  /* отправить payload в выбранный чат */
  const handleShareTo = async toId => {
    try {
      await apiClient.post(`/chats/${toId}/share/`, sharePayload);
      setToast("✅ Отправлено");
    } catch (e){
      setToast("❌ Ошибка");
    } finally {
      setShareOpen(false); setTimeout(()=>setToast(""),3000);
    }
  };

  /* ───── UI helpers ───── */
  const display = openSearch&&query.trim() ? filtered : msgs;
  const canMod  = ["admin","moderator","teacher","organization"].includes(user.role);

  /* ─────────────────────────────── JSX ─────────────────────────────── */
  return (
    <div className="chat-page">
      {/* sidebar */}
      <aside className="chat-sidebar">
        {chats.map(c=>{
          const active = c.id===chatId;
          const peerId = c.type==="direct" ? c.members.find(id=>id!==user.id) : null;
          const peer   = peerId ? uMap[peerId]||{} : {};
          return (
            <div key={c.id}
                 className={`sb-item ${active?"active":""}`}
                 onClick={()=>navigate(
                   c.type==="group" ? `/groups/${c.id}/chat` : `/messages/${c.id}`
                 )}>
              <div className="avatar-wrap sb-avatar-wrap">
                <img
                  src={buildAvatarUrl(
                    c.type==="group"
                      ? (info?.type==="group"&&info.id===c.id ? info.avatar_url : c.avatar_url)
                      : (peer.avatar_path ?? peer.avatar_url)
                  )}
                  className="sb-avatar" alt=""/>
                {peerId && <span className={`friend-status ${peer.is_online?"online":"offline"}`}/>}
              </div>
              <span className="sb-nick">{c.type==="group"?c.name:peer.nickname}</span>
            </div>
          );
        })}
      </aside>

      {/* main */}
      <div className="chat-main">
        {/* header */}
        <header className={`chat-header ${openSearch?"search-open":""}`}>
          <div className="hdr-left">
            {peerProfile ? (
              <div className="hdr-avatar-wrap">
                <img src={buildAvatarUrl(peerProfile.avatar_path??peerProfile.avatar_url)}
                     className="hdr-avatar" alt=""/>
                <span className={`friend-status ${peerProfile.is_online?"online":"offline"}`}/>
                <div className="hdr-details">
                  <div className="hdr-name">{peerProfile.full_name}</div>
                  <div className="hdr-status">@{peerProfile.nickname}</div>
                </div>
              </div>
            ) : info?.type==="group" && (
              <>
                <img src={buildAvatarUrl(info.avatar_url)} className="hdr-avatar" alt=""/>
                <div className="hdr-details"><div className="hdr-name"># {info.name}</div></div>
                {["admin","moderator","teacher"].includes(user.role) && (
                  <button onClick={()=>setShowManage(true)} className="hdr-manage-btn">⚙</button>
                )}
              </>
            )}
          </div>

          <div className="hdr-right">
            <button className="hdr-more-btn" onClick={()=>setMenuOpen(o=>!o)}>
              <img src={moreIcon} alt=""/>
            </button>

            {menuOpen&&peerProfile&&(
              <div className="chat-header-menu" ref={menuRef}>
                <button onClick={()=>{navigate(`/profile/${peerProfile.id}`); setMenuOpen(false);}}>
                  Просмотреть профиль
                </button>
                <button onClick={removeFriend}>Удалить из друзей</button>
                <button onClick={()=>setReportParams({
                  targetType:"user",
                  objectId:peerProfile.id,
                  avatar:buildAvatarUrl(peerProfile.avatar_path??peerProfile.avatar_url),
                  fullName:peerProfile.full_name,
                  nickname:peerProfile.nickname,
                  login:peerProfile.login,
                })}>
                  Пожаловаться
                </button>
                <button onClick={shareProfile}>Поделиться профилем</button>
              </div>
            )}

            <button className="hdr-search-btn" onClick={()=>setOpenSearch(o=>!o)}>
              <img src={searchIcon} alt=""/>
            </button>
            <input className="hdr-search-input" value={query}
                   onChange={e=>setQuery(e.target.value)}
                   placeholder="Search messages…"
                   onKeyDown={e=>e.key==="Escape"&&setOpenSearch(false)}/>
          </div>
        </header>

        {/* messages */}
        <div className="chat-messages" ref={listRef}
             onScroll={()=>{
               if (listRef.current.scrollTop<50&&more&&msgs.length){
                 loadHistory(msgs[0].id);
               }
             }}>
          {display.map(m=>(
            <MessageBubble key={m.id} msg={m}
                           currentUserId={user.id}
                           sender={uMap[m.sender]||{}}
                           formatTime={tzTime}
                           onDelete={canMod?onDeleteMessage:null}
                           onShare={handleShareMenu}/>
          ))}
        </div>

        <ChatInput chatId={chatId} onSend={sendWS}/>
      </div>

      {/* модалки */}
      {shareOpen&&(
        <ChatShareModal
          contacts={directContacts}
          onClose={()=>setShareOpen(false)}
          onSelect={handleShareTo}/>
      )}
      {toast&&<div className="chat-toast">{toast}</div>}

      {confirmDelete&&(
        <Modal title="Удалить сообщение?" onClose={()=>setConfirmDelete(null)}>
          <button onClick={()=>setConfirmDelete(null)}>Нет</button>
          <button onClick={confirmDeleteYes}
                  style={{background:"var(--accent)",color:"#fff"}}>Да</button>
        </Modal>
      )}

      {showManage&&(
        <ManageMembersModal chatId={chatId}
                            onClose={()=>setShowManage(false)}
                            onUpdated={()=>{setShowManage(false); loadInfo();}}/>
      )}

      {reportParams&&(
        <ReportModal {...reportParams}
                     onClose={()=>setReportParams(null)}
                     onSuccess={()=>setReportParams(null)}/>
      )}
    </div>
  );
}
