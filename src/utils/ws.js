// src/utils/ws.js
export const makeWsUrl = (path, token) => {
  const base =
    import.meta.env.VITE_WS_URL ||
    (import.meta.env.MODE === "production"
       ? "wss://159.65.124.242/ws/"
       : "ws://localhost:8000/ws/");
  return `${base}${path}?token=${token}`;
};
