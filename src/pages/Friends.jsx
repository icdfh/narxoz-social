/*  src/pages/Friends.jsx
    --------------------------------------------------------------
    ▸ страница «Друзья» с вкладками All / Incoming / Outgoing / Declined
    ▸ поиск, табы, прямой чат, модалки AddFriend и Report
    ▸ никаких «жёстких» URL — используется baseURL из apiClient
    -------------------------------------------------------------- */

import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate }      from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import apiClient                  from "../utils/apiClient";
import AddFriendModal             from "../components/AddFriendModal";
import ReportModal                from "../components/ReportModal";
import {
  fetchNotifications,
  clearFriendRequests
} from "../store/notificationsSlice";

import friendsIcon    from "../assets/icons/friends.svg";
import threeDotsIcon  from "../assets/icons/more.svg";
import chatIcon       from "../assets/icons/Chats.svg";
import searchIcon     from "../assets/icons/search.svg";

import "../assets/css/Friends.css";

const TABS = ["All", "Incoming", "Outgoing", "Declined"];
// базовый адрес бэка = axios.baseURL без /api/
const BACKEND_URL = apiClient.defaults.baseURL.replace(/\/api\/?$/, "");

/** строит абсолютную ссылку на аватар/медиа */
const buildUrl = (path) => {
  if (!path) return "/avatar.jpg";
  if (/^https?:\/\//.test(path)) return path;
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${BACKEND_URL}${clean}`;
};

export default function Friends() {
  const dispatch    = useDispatch();
  const currentUser = useSelector((s) => s.auth.user);
  const navigate    = useNavigate();

  const [activeTab,     setActiveTab]     = useState("All");
  const [friends,       setFriends]       = useState([]);
  const [incoming,      setIncoming]      = useState([]);
  const [outgoing,      setOutgoing]      = useState([]);
  const [declined,      setDeclined]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [menuUser,   setMenuUser]   = useState(null);
  const [menuPos,    setMenuPos]    = useState({ x: 0, y: 0 });
  const menuRef      = useRef();

  const [reportParams, setReportParams] = useState(null);

  /** загрузить все списки друзей/заявок */
  const loadAll = async () => {
    setLoading(true);
    try {
      const [fRes, incRes, outRes] = await Promise.all([
        apiClient.get("/friends/list/"),
        apiClient.get("/friends/incoming/"),
        apiClient.get("/friends/outgoing/"),
      ]);
      const allFriends = fRes.data || [];
      setFriends(allFriends);
      const inc = incRes.data  || [];
      const out = outRes.data  || [];
      setIncoming( inc.filter(r => r.status === "pending") );
      setOutgoing( out.filter(r => r.status === "pending") );
      setDeclined([ 
        ...inc.filter(r => r.status === "declined"),
        ...out.filter(r => r.status === "declined")
      ]);
    } catch (e) {
      console.error("Ошибка при загрузке друзей:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  /** закрыть контекстное меню кликом вне */
  useEffect(() => {
    const handler = e => {
      if (menuRef.current?.contains(e.target) === false) {
        setMenuUser(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /** действия с заявками */
  const accept = (id) => {
    setIncoming(i => i.filter(r => r.id !== id));
    dispatch(clearFriendRequests());
    dispatch(fetchNotifications());
    apiClient.post(`/friends/respond/${id}/`, { action: "accept" }).then(loadAll);
  };
  const decline = (id) => {
    setIncoming(i => i.filter(r => r.id !== id));
    dispatch(clearFriendRequests());
    dispatch(fetchNotifications());
    apiClient.post(`/friends/respond/${id}/`, { action: "decline" }).then(loadAll);
  };
  const cancel = (id) => {
    setOutgoing(o => o.filter(r => r.id !== id));
    dispatch(clearFriendRequests());
    dispatch(fetchNotifications());
    apiClient.delete(`/friends/cancel/${id}/`).then(loadAll);
  };
  const remove = (id) => {
    setFriends(f => f.filter(u => u.id !== id));
    apiClient.delete(`/friends/remove/${id}/`).then(loadAll);
  };
  const resend = (r) => {
    setDeclined(d => d.filter(x => x.id !== r.id));
    dispatch(clearFriendRequests());
    dispatch(fetchNotifications());
    apiClient.delete(`/friends/cancel/${r.id}/`)
      .then(() => {
        const tid = r.from_user.id === currentUser.id
          ? r.to_user.id
          : r.from_user.id;
        return apiClient.post(`/friends/send/${tid}/`);
      })
      .then(loadAll);
  };

  /** поиск на вкладке All */
  useEffect(() => {
    if (activeTab === "All" && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setFilteredUsers(
        friends.filter(u =>
          (u.full_name || "").toLowerCase().includes(q) ||
          (u.nickname  || "").toLowerCase().includes(q)
        )
      );
    } else {
      setFilteredUsers([]);
    }
  }, [searchQuery, activeTab, friends]);

  /** открыть direct-чат */
  const openDirectChat = async (userId) => {
    try {
      const { data } = await apiClient.post(`/chats/direct/${userId}/`);
      navigate(`/messages/${data.chat_id}`);
    } catch (e) {
      console.error("Не удалось открыть чат:", e.response || e);
    }
  };

  /** рендер карточки пользователя */
  const renderCard = (user, extra, actions) => (
    <div className="friend-card" key={user.id}>
      <Link to={`/profile/${user.id}`} className="friend-left">
        <div className="avatar-wrap">
          <img
            src={buildUrl(user.avatar_path || user.avatar_url)}
            className="friend-avatar"
            alt={user.nickname}
          />
          <span className={`friend-status ${user.is_online ? "online" : "offline"}`} />
        </div>
        <div className="friend-info">
          <span className="friend-name">{user.full_name}</span>
          <span className="friend-nick">@{user.nickname}</span>
          {extra && <span className="friend-extra">{extra}</span>}
        </div>
      </Link>
      <div className="friend-right">
        {actions}
        <img
          src={chatIcon}
          className="friend-chat"
          alt="Chat"
          onClick={() => openDirectChat(user.id)}
        />
      </div>
    </div>
  );

  /** вывод списка в зависимости от таба */
  const renderList = () => {
    if (loading) {
      return <div className="friends-empty">Загрузка…</div>;
    }

    switch (activeTab) {
      case "All": {
        const list = searchQuery.trim() ? filteredUsers : friends;
        if (!list.length) {
          return <div className="friends-empty">Нет друзей</div>;
        }
        return list.map(u =>
          renderCard(
            u,
            null,
            <img
              src={threeDotsIcon}
              className="friend-more"
              alt="More"
              onClick={e => {
                e.stopPropagation();
                setMenuUser(u);
                setMenuPos({ x: e.clientX, y: e.clientY });
              }}
            />
          )
        );
      }
      case "Incoming":
        if (!incoming.length) {
          return <div className="friends-empty">Нет входящих заявок</div>;
        }
        return incoming.map(r =>
          renderCard(
            r.from_user,
            "хочет добавить вас",
            <>
              <button className="friend-accept-btn" onClick={() => accept(r.id)}>
                Принять
              </button>
              <button className="friend-decline-btn" onClick={() => decline(r.id)}>
                Отклонить
              </button>
            </>
          )
        );
      case "Outgoing":
        if (!outgoing.length) {
          return <div className="friends-empty">Нет исходящих заявок</div>;
        }
        return outgoing.map(r =>
          renderCard(
            r.to_user,
            "ожидает подтверждения",
            <button className="friend-cancel-btn" onClick={() => cancel(r.id)}>
              Отменить
            </button>
          )
        );
      case "Declined":
        if (!declined.length) {
          return <div className="friends-empty">Нет отклонённых заявок</div>;
        }
        return declined.map(r => {
          const isOut = r.from_user.id === currentUser.id;
          const u = isOut ? r.to_user : r.from_user;
          const txt = isOut ? "Ваша заявка отклонена" : "Вы отклонили заявку";
          return renderCard(
            u,
            txt,
            isOut ? (
              <button className="friend-resend-btn" onClick={() => resend(r)}>
                Повторить
              </button>
            ) : null
          );
        });
      default:
        return null;
    }
  };

  const counts = {
    All     : friends.length,
    Incoming: incoming.length,
    Outgoing: outgoing.length,
    Declined: declined.length
  };

  return (
    <div className="friends-page">
      <div className="friends-header">
        <div className="friends-header-left">
          <img src={friendsIcon} className="friends-icon" alt="Friends" />
          <span className="friends-title">Friends</span>
          <div className="friends-tabs">
            {TABS.map(t => (
              <button
                key={t}
                className={`friends-tab ${activeTab === t ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(t);
                  setSearchQuery("");
                }}
              >
                {t}
                <span className="tab-badge">{counts[t]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="friends-header-right">
          <div className="friends-search">
            <input
              type="text"
              className="friends-search-input"
              placeholder="Search friends…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <img src={searchIcon} className="friends-search-icon" alt="Search" />
          </div>
          <AddFriendModal
            existingFriends     = {friends.map(u => u.id)}
            outgoingRequests    = {outgoing.map(r => r.to_user.id)}
            incomingRequests    = {incoming.map(r => r.from_user.id)}
            onFriendAdded       = {loadAll}
          />
        </div>
      </div>

      <div className="friends-list">
        {renderList()}
      </div>

      {menuUser && (
        <div
          ref={menuRef}
          className="friend-menu"
          style={{ top: menuPos.y, left: menuPos.x }}
        >
          <button onClick={() => {
            navigate(`/profile/${menuUser.id}`);
            setMenuUser(null);
          }}>
            Просмотреть
          </button>
          <button onClick={() => {
            remove(menuUser.id);
            setMenuUser(null);
          }}>
            Удалить
          </button>
          <button onClick={() => {
            setReportParams({
              targetType: "user",
              objectId  : menuUser.id,
              avatar    : buildUrl(menuUser.avatar_path || menuUser.avatar_url),
              fullName  : menuUser.full_name,
              nickname  : menuUser.nickname,
              login     : menuUser.login,
            });
            setMenuUser(null);
          }}>
            Пожаловаться
          </button>
        </div>
      )}

      {reportParams && (
        <ReportModal
          {...reportParams}
          onClose   = {() => setReportParams(null)}
          onSuccess = {() => setReportParams(null)}
        />
      )}
    </div>
  );
}
