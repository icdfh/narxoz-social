/*  src/components/CommentSection.jsx
    --------------------------------------------------------------
    ▸ вывод комментариев к посту + форма добавления
    ▸ стилизация под Narxoz-UI (MUI Paper / List …)
    -------------------------------------------------------------- */

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
  fetchComments,
  createComment,
  deleteComment,
} from "../store/postSlice";

import apiClient from "../utils/apiClient";

import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Button,
  Typography,
  Divider,
} from "@mui/material";

import deleteIconSvg from "../assets/icons/delete_icon.svg";

/* ───────── helpers ──────────────────────────────────────────── */
// адрес бэка = baseURL axios-клиента без /api/
const BACKEND_URL = apiClient.defaults.baseURL.replace(/\/api\/?$/, "");

/** собираем абсолютный URL для медиа (аватар и т.п.) */
const absUrl = (p) =>
  !p
    ? ""
    : /^https?:\/\//.test(p)           // уже абсолютная
      ? p
      : `${BACKEND_URL}${p.startsWith("/") ? "" : "/"}${p}`;

/* ───────── компонент ───────────────────────────────────────── */
export default function CommentSection({ postId }) {
  const dispatch    = useDispatch();
  const currentNick = useSelector((s) => s.auth.user?.nickname);

  const comments = useSelector(
    (s) => s.posts.commentsByPost[postId] || [],
    shallowEqual
  );

  /* draft для поля ввода */
  const [draft, setDraft] = useState("");

  /* map { userId : avatarUrl } */
  const [avMap, setAvMap] = useState({});

  /* первый запрос комментариев */
  useEffect(() => {
    dispatch(fetchComments(postId));
  }, [dispatch, postId]);

  /* догружаем аватары авторов, которых ещё нет в avMap */
  useEffect(() => {
    const missing = comments
      .map((c) => c.author ?? c.author_id)
      .filter((id) => id && !avMap[id]);

    if (!missing.length) return;

    (async () => {
      const map = { ...avMap };
      await Promise.all(
        missing.map(async (id) => {
          try {
            const { data } = await apiClient.get(`/users/profile/${id}/`);
            map[id] = absUrl(data.avatar_path || data.avatar_url);
          } catch {
            map[id] = ""; // fallback: инициалы
          }
        })
      );
      setAvMap(map);
    })();
  }, [comments, avMap]);

  /* ───────── handlers ───────── */
  const submit = (e) => {
    e.preventDefault();
    const txt = draft.trim();
    if (!txt) return;
    dispatch(createComment({ postId, content: txt })).then(() => setDraft(""));
  };

  const remove = (id) => dispatch(deleteComment({ postId, commentId: id }));

  /* ───────── JSX ───────── */
  return (
    <Box sx={{ mt: 2, p: 2.5 }}>
      <Typography variant="h6" sx={{ mb: 1, color: "#fff", fontWeight: 500 }}>
        Комментарии&nbsp;({comments.length})
      </Typography>

      {/* список комментариев */}
      <Paper
        elevation={2}
        sx={{
          bgcolor: "rgba(255,255,255,0.08)",
          borderRadius: 2,
          maxHeight: 300,
          overflowY: "auto",
        }}
      >
        <List disablePadding>
          {comments.length ? (
            comments.map((c, idx) => {
              const uid = c.author ?? c.author_id;
              const ava = avMap[uid];

              return (
                <React.Fragment key={c.id}>
                  <ListItem sx={{ px: 2, py: 1.2 }}>
                    <ListItemAvatar>
                      {ava ? (
                        <Avatar src={ava} sx={{ width: 32, height: 32 }} />
                      ) : (
                        <Avatar
                          sx={{ bgcolor: "#D50032", width: 32, height: 32 }}
                        >
                          {c.author_nickname[0]?.toUpperCase()}
                        </Avatar>
                      )}
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "#fff" }}
                        >
                          {c.author_nickname}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          sx={{ color: "#ddd", mt: 0.3 }}
                        >
                          {c.content}
                        </Typography>
                      }
                    />

                    {c.author_nickname === currentNick && (
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          sx={{ p: 0.3 }}
                          onClick={() => remove(c.id)}
                        >
                          <img
                            src={deleteIconSvg}
                            alt="delete"
                            style={{ width: 18, height: 18 }}
                          />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>

                  {idx < comments.length - 1 && (
                    <Divider sx={{ background: "rgba(255,255,255,0.15)" }} />
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <Box sx={{ p: 2 }}>
              <Typography
                variant="body2"
                sx={{ color: "#eee", fontStyle: "italic" }}
              >
                Комментариев пока нет
              </Typography>
            </Box>
          )}
        </List>
      </Paper>

      {/* форма добавления */}
      {currentNick && (
        <Box
          component="form"
          onSubmit={submit}
          sx={{ display: "flex", gap: 1.2, mt: 2 }}
        >
          <TextField
            variant="filled"
            size="small"
            placeholder="Написать комментарий…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            InputProps={{ disableUnderline: true }}
            sx={{
              flex: 1,
              bgcolor: "#fff",
              borderRadius: 1,

              /* корневой FilledInput */
              "& .MuiFilledInput-root": {
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
              },

              /* сам input: ровно по центру */
              "& .MuiFilledInput-input": {
                paddingTop: "10px",
                paddingBottom: "10px",
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            sx={{
              bgcolor: "#fff",
              color: "#D50032",
              fontWeight: 600,
              px: 2.5,
              "&:hover": { bgcolor: "#f5f5f5" },
            }}
          >
            Отправить
          </Button>
        </Box>
      )}
    </Box>
  );
}
