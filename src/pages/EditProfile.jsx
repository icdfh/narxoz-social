/*  src/pages/EditProfile.jsx
    --------------------------------------------------------------
    ▸ страница редактирования профиля (nickname + аватар)
    ▸ никаких «жёстких» URL — используется baseURL из apiClient
    -------------------------------------------------------------- */

import React, { useEffect, useState } from "react";
import {
  Container,
  TextField,
  Typography,
  Button,
  Avatar,
  CircularProgress,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";

/* базовый адрес бэка = axios.baseURL без trailing /api/ */
const BACKEND_URL = apiClient.defaults.baseURL.replace(/\/api\/?$/, "");

export default function EditProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    nickname : "",
    email    : "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [loading,    setLoading]    = useState(true);

  /* ───── загрузка текущего пользователя ───── */
  useEffect(() => {
    apiClient
      .get("/users/profile/")
      .then(({ data }) => {
        setForm({
          full_name: data.full_name || "",
          nickname : data.nickname  || "",
          email    : data.email     || "",
        });

        /* превью существующего аватара */
        if (data.avatar_path || data.avatar_url) {
          const raw   = data.avatar_path || data.avatar_url;  // "/media/avatars/ava.jpg"
          const clean = raw.startsWith("/") ? raw.slice(1) : raw;
          setPreview(`${BACKEND_URL}${clean}`);               // "https://host/media/avatars/ava.jpg"
        }
      })
      .finally(() => setLoading(false));
  }, []);

  /* ───── изменения полей ───── */
  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ───── выбор нового аватара ───── */
  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file)); // локальный превью
    }
  };

  /* ───── submit ───── */
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("nickname", form.nickname.trim());
      if (avatarFile) fd.append("avatar_path", avatarFile);

      await apiClient.put("/users/update/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Профиль обновлён");
      navigate(0);                       // перезагрузка страницы
    } catch {
      alert("Ошибка при обновлении профиля");
      setLoading(false);
    }
  };

  /* ───── UI ───── */
  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Редактировать профиль
      </Typography>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="ФИО"
            name="full_name"
            value={form.full_name}
            InputProps={{ readOnly: true }}
            fullWidth
          />

          <TextField
            label="Email"
            name="email"
            value={form.email}
            InputProps={{ readOnly: true }}
            fullWidth
          />

          <TextField
            label="Никнейм"
            name="nickname"
            value={form.nickname}
            onChange={handleChange}
            fullWidth
          />

          <Box display="flex" alignItems="center" gap={2}>
            <Avatar src={preview || "/avatar.jpg"} sx={{ width: 64, height: 64 }} />
            <Button variant="outlined" component="label">
              Загрузить аватар
              <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
            </Button>
          </Box>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ alignSelf: "flex-start" }}
          >
            Сохранить
          </Button>
        </Box>
      </form>
    </Container>
  );
}
