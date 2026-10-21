import { io } from "socket.io-client";
import { AUTH_EXPIRED_EVENT } from "../auth/authContext";
import { getToken } from "../auth/tokenStorage";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

// Socket.IO tự kết nối lại khi mất mạng; Dashboard gọi connect() khi mở trang.
// `auth` là hàm để mỗi lần (kết nối lại) đều gửi token mới nhất.
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: (callback) => callback({ token: getToken() }),
});

socket.on("connect_error", (error) => {
  if (error.message === "Authentication required") {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
});
