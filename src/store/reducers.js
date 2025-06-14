// reducers.js или rootReducer.js
import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import postsReducer from "./postSlice"; // название файла может быть postsSlice, но импорт корректный
import organizationReducer from "./organizationSlice";
import notificationsReducer from "./notificationsSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  posts: postsReducer,
  organizations: organizationReducer,
  notifications: notificationsReducer,
  // сюда можно добавить другие редьюсеры, например friends, messages и т.д.
});

export default rootReducer;
