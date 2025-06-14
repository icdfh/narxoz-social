import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../utils/apiClient";

// Получить непрочитанные
export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (_, thunkAPI) => {
    const res = await apiClient.get("/notifications/");
    const data = res.data;
    const arr = Array.isArray(data) ? data : data.results || [];
    return arr.map((n) => ({
      ...n,
      timestampFormatted: new Date(n.created_at).toLocaleTimeString("ru-RU", {
        hour:   "2-digit",
        minute: "2-digit",
      }),
    }));
  }
);

// Пометить одно прочитанным
export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id, thunkAPI) => {
    await apiClient.post(`/notifications/read/${id}/`);
    return id;
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
  },
  reducers: {
    // Очистить все заявки в друзья
    clearFriendRequests(state) {
      state.items = state.items.filter((n) => n.type !== "friend_request");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, { payload }) => {
        state.items = payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, { payload: id }) => {
        state.items = state.items.filter((n) => n.id !== id);
      });
  },
});

export const { clearFriendRequests } = notificationsSlice.actions;
export default notificationsSlice.reducer;
