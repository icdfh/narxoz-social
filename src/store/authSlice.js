// src/store/authSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../utils/apiClient";
import { loginUser, logoutUser, getProfile } from "../services/authService";

// ───────── сохранение в localStorage ─────────
const saveUserLS = (u) =>
  localStorage.setItem(
    "pp_user",
    JSON.stringify({ id: u.id, is_policy_accepted: u.is_policy_accepted })
  );
const loadUserLS = () => {
  try {
    return JSON.parse(localStorage.getItem("pp_user"));
  } catch {
    return null;
  }
};

// ───────── THUNK’Ы ─────────

// LOGIN
export const login = createAsyncThunk(
  "auth/login",
  async ({ login, password }, thunkAPI) => {
    try {
      return await loginUser(login, password);
    } catch (e) {
      return thunkAPI.rejectWithValue(e.message);
    }
  }
);

// LOGOUT
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, thunkAPI) => {
    const { auth } = thunkAPI.getState();
    try {
      await apiClient.post(
        "/users/logout/",
        { refresh: auth.refresh },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
    } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("pp_user");
    return true;
  }
);

// FETCH PROFILE
export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, thunkAPI) => {
    try {
      return await getProfile();
    } catch (e) {
      if (e.response?.status === 403) {
        return thunkAPI.rejectWithValue("PP_REQUIRED");
      }
      return thunkAPI.rejectWithValue(e.message);
    }
  }
);

// REGISTER USER
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (formData, thunkAPI) => {
    try {
      const { data } = await apiClient.post("/users/register/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Ошибка регистрации"
      );
    }
  }
);

// REQUEST PASSWORD RESET
export const requestPasswordReset = createAsyncThunk(
  "auth/requestPasswordReset",
  async ({ login, email }, thunkAPI) => {
    try {
      const { data } = await apiClient.post("/users/password-reset/", {
        login,
        email,
      });
      return data.message;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.error || "Ошибка сброса пароля"
      );
    }
  }
);

// RESET PASSWORD CONFIRM
export const resetPasswordConfirm = createAsyncThunk(
  "auth/resetPasswordConfirm",
  async (
    { uid, token, new_password, confirm_new_password },
    thunkAPI
  ) => {
    try {
      const { data } = await apiClient.post(
        "/users/password-reset/confirm/",
        { uid, token, new_password, confirm_new_password }
      );
      return data.message;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.error || "Ошибка подтверждения пароля"
      );
    }
  }
);

// ACCEPT PRIVACY POLICY
export const acceptPolicy = createAsyncThunk(
  "auth/acceptPolicy",
  async (_, thunkAPI) => {
    try {
      await apiClient.post("/users/accept-policy/");
      return true;
    } catch {
      return thunkAPI.rejectWithValue("Не удалось принять политику");
    }
  }
);

// UPDATE PROFILE
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (formData, thunkAPI) => {
    try {
      const { data } = await apiClient.put("/users/update/", formData);
      return data;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.error || e.message
      );
    }
  }
);

// ───────── SLICE ─────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    isAuthenticated: false,
    token: localStorage.getItem("token") || null,
    refresh: localStorage.getItem("refresh") || null,
    user: loadUserLS(),
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearAuthMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // LOGIN
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = payload.access;
        state.refresh = payload.refresh;
        state.user = payload.user;
        localStorage.setItem("token", payload.access);
        localStorage.setItem("refresh", payload.refresh);
        saveUserLS(payload.user);
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });

    // FETCH PROFILE
    builder
      .addCase(fetchProfile.fulfilled, (state, { payload }) => {
        state.user = payload;
        saveUserLS(payload);
      })
      .addCase(fetchProfile.rejected, (state, { payload }) => {
        if (payload === "PP_REQUIRED") {
          state.user = state.user || {};
          state.user.is_policy_accepted = false;
        } else {
          state.error = payload;
        }
      });

    // REGISTER USER
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });

    // REQUEST PASSWORD RESET
    builder
      .addCase(requestPasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.successMessage = payload;
      })
      .addCase(requestPasswordReset.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });

    // RESET PASSWORD CONFIRM
    builder
      .addCase(resetPasswordConfirm.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(resetPasswordConfirm.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.successMessage = payload;
      })
      .addCase(resetPasswordConfirm.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });

    // ACCEPT POLICY
    builder.addCase(acceptPolicy.fulfilled, (state) => {
      if (state.user) {
        state.user.is_policy_accepted = true;
        saveUserLS(state.user);
      }
    });

    // UPDATE PROFILE
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, { payload }) => {
        state.loading = false;
        const prevAccepted = state.user?.is_policy_accepted;
        state.user = { ...payload, is_policy_accepted: prevAccepted };
        saveUserLS(state.user);
      })
      .addCase(updateProfile.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });

    // LOGOUT
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.refresh = null;
      state.user = null;
    });
  },
});

export const { clearAuthMessages } = authSlice.actions;
export default authSlice.reducer;
