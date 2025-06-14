import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile } from "../store/authSlice";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import UserPanel from "./UserPanel";
import PolicyModal from "./PolicyModal";
import { Outlet } from "react-router-dom";
import "../assets/css/Layout.css";

export default function Layout() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  // только после того, как флаг is_policy_accepted в Redux станет true
  const isPolicyAccepted = useSelector((s) => s.auth.user?.is_policy_accepted);

  useEffect(() => {
    if (token && isPolicyAccepted) {
      dispatch(fetchProfile());
    }
  }, [dispatch, token, isPolicyAccepted]);

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
      <UserPanel />
      <PolicyModal />
    </div>
  );
}
