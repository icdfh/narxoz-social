import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PostList from "../components/PostList";

function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleCreatePost = () => {
    navigate("/posts/create");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", color: "black", padding: "15px" }}>
      {/* Верхняя панель с заголовком и кнопкой */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid #ddd",
        }}
      >
        <Typography variant="h5" component="h1">
          Posts
        </Typography>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#D50032",
            "&:hover": { backgroundColor: "#C4002B" },
            fontWeight: "bold",
            fontSize: "1.1rem",
          }}
          onClick={handleCreatePost}
        >
          Create Post
        </Button>
      </Box>

      {/* Список постов */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <PostList />
      </Box>
    </Box>
  );
}

export default Home;
