// src/utils/wsNotifyPath.js
export const WS_NOTIFY_PATH = "/ws/notify";       // без / в конце
// если на бэке всё-таки со слэшем, сделайте "/ws/notify/"

// src/components/Topbar.jsx
import { WS_NOTIFY_PATH } from "../utils/wsNotifyPath";

function getWsBase() {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const h     = window.location.hostname;
  const host  = ["localhost", "127.0.0.1"].includes(h) ? `${h}:8000` : window.location.host;
  return `${proto}://${host}${WS_NOTIFY_PATH}`;   // ⬅ путь без лишнего “/”
}
