import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

// Socket.IO tự kết nối lại khi mất mạng; Dashboard gọi connect() khi mở trang.
export const socket = io(SOCKET_URL, { autoConnect: false });
