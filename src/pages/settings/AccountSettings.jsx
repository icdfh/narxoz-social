import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProfile,
  acceptPolicy,   // оставляем (флаг согласия)
} from "../../store/authSlice";
import {
  Box,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Typography,
} from "@mui/material";
import apiClient from "../../utils/apiClient";
import "../../assets/css/AccountSettings.css";

function AccountSettings() {
  const dispatch       = useDispatch();
  const user           = useSelector((s) => s.auth.user);
  const policyAccepted = user?.is_policy_accepted;

  const [form, setForm] = useState({ full_name: "", email: "", nickname: "" });
  const [preview, setPreview] = useState("/avatar.jpg");
  const [avatar,  setAvatar]  = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const fileRef = useRef();

  /* ---------- загрузка профиля ---------- */
  useEffect(() => {
    if (!policyAccepted) return;
    setLoading(true);
    dispatch(fetchProfile())
      .unwrap()
      .then((d) => {
        setForm({ full_name: d.full_name, email: d.email, nickname: d.nickname });
        setPreview(
          d.avatar_path ? `http://127.0.0.1:8000${d.avatar_path}` : "/avatar.jpg"
        );
      })
      .finally(() => setLoading(false));
  }, [dispatch, policyAccepted]);

  /* ---------- handlers ---------- */
  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setAvatar(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  /* ---------- submit ---------- */
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (avatar) {
        /* ----- multipart, когда есть файл ----- */
        const fd = new FormData();
        fd.append("nickname", form.nickname);
        fd.append("avatar_path", avatar);
        fd.append("full_name", form.full_name);
        fd.append("email", form.email);

        await apiClient.put("/users/update/", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        /* ----- обычный JSON, когда файла нет ----- */
        await apiClient.put("/users/update/", {
          nickname:  form.nickname,
          full_name: form.full_name,
          email:     form.email,
        });
      }

      await dispatch(acceptPolicy()).unwrap(); // флаг согласия
      await dispatch(fetchProfile()).unwrap(); // перезагрузить данные
      alert("Профиль обновлён!");
      setAvatar(null);
      fileRef.current.value = null;
    } catch (err) {
      const msg =
        err?.response?.data
          ? JSON.stringify(err.response.data, null, 2)
          : err.message;
      alert("Ошибка:\n" + msg);
      console.error("Update error:", msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box className="account-center">
        <CircularProgress />
      </Box>
    );
  }

  /* ---------- UI ---------- */
  return (
    <Box className="account-settings">
      <Typography variant="h5" className="acc-title">
        Настройки аккаунта
      </Typography>

      <Box component="form" className="acc-form" onSubmit={submit}>
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
          onChange={onChange}
          fullWidth
        />

        <Box className="acc-avatar-row">
          <Avatar src={preview} sx={{ width: 80, height: 80 }} />
          <Button
            variant="outlined"
            component="label"
            disabled={saving}
            className="acc-upload-btn"
          >
            Загрузить
            <input hidden accept="image/*" type="file" onChange={onFile} ref={fileRef} />
          </Button>
          {avatar && (
            <Button
              variant="text"
              onClick={() => {
                setAvatar(null);
                setPreview(
                  user.avatar_path
                    ? `http://127.0.0.1:8000${user.avatar_path}`
                    : "/avatar.jpg"
                );
                fileRef.current.value = null;
              }}
            >
              Отменить
            </Button>
          )}
        </Box>

        <Button
          type="submit"
          variant="contained"
          className="acc-save-btn"
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : "Сохранить"}
        </Button>
      </Box>
    </Box>
  );
}

export default AccountSettings;
