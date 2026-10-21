const SESSION_KEY = "iot-room-session";

function readFrom(storage) {
  try {
    const session = JSON.parse(storage.getItem(SESSION_KEY));
    return session?.token ? session : null;
  } catch {
    return null;
  }
}

// "Ghi nhớ đăng nhập" lưu vào localStorage (giữ sau khi đóng trình duyệt), ngược lại dùng sessionStorage.
export function getSession() {
  return readFrom(localStorage) || readFrom(sessionStorage);
}

export function getToken() {
  return getSession()?.token ?? null;
}

export function saveSession(session, remember) {
  clearSession();
  (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
