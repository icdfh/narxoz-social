import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile } from "./store/authSlice";

import Layout               from "./components/Layout";
import Home                 from "./pages/Home";

import CreatePost           from "./pages/CreatePost";
import PostDetail           from "./pages/PostDetail";
import PostDetailModal      from "./components/PostDetailModal";
import PostEdit             from "./pages/PostEdit";

import Login                from "./pages/Login";
import Logout               from "./pages/Logout";
import RegisterUser         from "./pages/RegisterUser";
import ForgotPassword       from "./pages/ForgotPassword";
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm";

import EditProfile          from "./pages/EditProfile";
import AnotherUserProfile   from "./pages/AnotherUserProfile";
import Friends              from "./pages/Friends";
import Organizations        from "./pages/Organizations";

import Messages             from "./pages/Messages";
import DirectChat           from "./pages/DirectChat";
import GroupDetail          from "./pages/GroupDetail";
import GroupChat            from "./pages/GroupChat";

import EventCalendar        from "./pages/EventCalendar";
import MySubscriptions      from "./pages/MySubscriptions";
import RemindersPage        from "./pages/RemindersPage";

import ErrorBoundary        from "./components/ErrorBoundary";

import SettingsLayout       from "./components/SettingsLayout";
import AccountSettings      from "./pages/settings/AccountSettings";
import NotificationsSettings from "./pages/settings/NotificationsSettings";
import PrivacySettings      from "./pages/settings/PrivacySettings";
import ReportSettings       from "./pages/settings/ReportSettings";
import ComplaintDetail      from "./pages/ComplaintDetail";

/* —————————————————————————————————————————— */

function App() {
  const dispatch = useDispatch();
  const isAuth   = useSelector(s => s.auth.isAuthenticated);
  const user     = useSelector(s => s.auth.user);
  const [ready, setReady] = useState(false);

  /* загружаем профиль (если токен есть) */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(fetchProfile()).finally(() => setReady(true));
    } else {
      setReady(true);
    }

    /* запрет контекст-меню над сообщениями */
    const ctxHandler = e => {
      if (e.target.closest(".message-bubble")) e.preventDefault();
    };
    document.addEventListener("contextmenu", ctxHandler);
    return () => document.removeEventListener("contextmenu", ctxHandler);
  }, [dispatch]);

  if (!ready) return null;

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ModalSwitch isAuth={isAuth} user={user} />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

/* ——— отделяем модалки, чтобы работал background-router ——— */
function ModalSwitch({ isAuth, user }) {
  const location   = useLocation();
  const background = location.state && location.state.background;

  return (
    <>
      {/* основные страницы */}
      <Routes location={background || location}>
        {/* ——— публичные ——— */}
        <Route path="/login"           element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/reset-password/:uid/:token"
          element={<ResetPasswordConfirm />}
        />
        <Route path="/admin/register"  element={<RegisterUser />} />
        <Route path="/logout"          element={<Logout />} />

        {/* ——— защищённые ——— */}
        <Route
          path="/"
          element={isAuth ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route path="home" element={<Home />} />

          {/* посты */}
          <Route path="posts/create"   element={<CreatePost />} />
          <Route path="posts/:id"      element={<PostDetail />} />
          <Route path="posts/:id/edit" element={<PostEdit />} />

          {/* события */}
          <Route path="events/calendar"       element={<EventCalendar />} />
          <Route path="events/user/:userId"   element={<EventCalendar />} />
          <Route path="events/subscriptions"  element={<MySubscriptions />} />
          <Route path="events/reminders"      element={<RemindersPage />} />

          {/* профиль */}
          <Route path="profile/edit"   element={<EditProfile />} />
          <Route path="profile/:id"    element={<AnotherUserProfile />} />

          {/* друзья и организации */}
          <Route path="friends"        element={<Friends />} />
          <Route path="organizations"  element={<Organizations />} />
          <Route path="groups"         element={<Organizations />} />
          <Route path="groups/:chatId"       element={<GroupDetail />} />
          <Route path="groups/:chatId/chat"  element={<GroupChat />} />

          {/* чаты */}
          <Route path="messages"          element={<Messages />} />
          <Route path="messages/:chatId"  element={<DirectChat />} />

          {/* настройки */}
          <Route path="settings" element={<SettingsLayout />}>
            <Route index              element={<Navigate to="account" replace />} />
            <Route path="account"     element={<AccountSettings />} />
            <Route path="notifications"
                   element={<NotificationsSettings />} />
            <Route path="privacy"     element={<PrivacySettings />} />
            <Route path="report"      element={<ReportSettings />} />
            <Route path="report/:id"  element={<ComplaintDetail />} />

            {/* админские жалобы */}
            {user?.role === "admin" && (
              <>
                <Route path="complaints"     element={<ReportSettings />} />
                <Route path="complaints/:id" element={<ComplaintDetail />} />
              </>
            )}
          </Route>
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>

      {/* модалка просмотра поста (если открывали через navigate state.background) */}
      {background && (
        <Routes>
          <Route path="posts/:id" element={<PostDetailModal />} />
        </Routes>
      )}
    </>
  );
}

export default App;
