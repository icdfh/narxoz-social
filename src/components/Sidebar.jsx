import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import apiClient from "../utils/apiClient";

import logo from "../assets/images/logo3.svg";

import homeDefault from "../assets/icons/home.svg";
import homeHover   from "../assets/icons/home-hover.svg";
import friendsDefault  from "../assets/icons/friends.svg";
import friendsHover    from "../assets/icons/friends-hover.svg";
import postsDefault    from "../assets/icons/posts.svg";
import postsHover      from "../assets/icons/posts-hover.svg";
import messagesDefault from "../assets/icons/messages.svg";
import messagesHover   from "../assets/icons/messages-hover.svg";
import groupsDefault   from "../assets/icons/groups.svg";
import groupsHover     from "../assets/icons/groups-hover.svg";
import settingsDefault from "../assets/icons/settings.svg";
import settingsHover   from "../assets/icons/settings-hover.svg";
import logoutIcon      from "../assets/icons/logout.svg";

const Sidebar = () => {
  const currentUser = useSelector((s) => s.auth.user);
  const [notifCount, setNotifCount] = useState(0);
  const [friendReqCount, setFriendReqCount] = useState(0);

  useEffect(() => {
    apiClient.get("/notifications/")
      .then((res) => setNotifCount(res.data.count || 0))
      .catch(() => {});
    apiClient.get("/friends/incoming/")
      .then((res) => {
        const pending = (res.data || []).filter((r) => r.status === "pending");
        setFriendReqCount(pending.length);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { to: "/home",      default: homeDefault,    hover: homeHover,    alt: "Home" },
    { to: "/friends",   default: friendsDefault, hover: friendsHover, alt: "Friends",   badge: friendReqCount },
    { to: "/posts/create", default: postsDefault, hover: postsHover, alt: "Add Post" },
    { to: "/messages",  default: messagesDefault,hover: messagesHover,alt: "Messages" },
    { to: "/groups",    default: groupsDefault,  hover: groupsHover,  alt: "Groups" },
    { to: "/settings",  default: settingsDefault,hover: settingsHover,alt: "Settings",  badge: notifCount },
  ];

  const [hovered, setHovered] = useState(null);

  return (
    <div className="sidebar">
      <img src={logo} alt="Logo" className="sidebar-logo" />

      {navItems.map((item, idx) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) =>
            `icon-wrapper ${isActive ? "active" : ""}`
          }
          onMouseEnter={() => setHovered(idx)}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="icon-container">
            <img
              src={hovered === idx ? item.hover : item.default}
              alt={item.alt}
              className="icon-img"
            />
            {item.badge > 0 && (
              <span className="icon-badge">{item.badge}</span>
            )}
          </div>
        </NavLink>
      ))}

      <NavLink to="/logout" className="icon-wrapper logout-btn">
        <img src={logoutIcon} alt="Logout" className="logout" />
      </NavLink>
    </div>
  );
};

export default Sidebar;
