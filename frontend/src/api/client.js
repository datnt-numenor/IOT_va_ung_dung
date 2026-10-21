import { AUTH_EXPIRED_EVENT } from "../auth/authContext";
import { getToken } from "../auth/tokenStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    // 401 ở API khác (không phải chính lần đăng nhập) nghĩa là phiên đã hết hạn.
    if (response.status === 401 && !path.startsWith("/auth/login")) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new Error(body.message || `HTTP ${response.status}`);
  }
  return body;
}

export { API_BASE_URL };
