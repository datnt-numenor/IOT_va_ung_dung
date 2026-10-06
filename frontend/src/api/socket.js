const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000/ws";

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 10000;

// Small wrapper around the browser WebSocket: event-name routing
// ({ type, data } envelopes) and automatic reconnect with backoff.
function createRealtimeClient(url) {
  const listeners = new Map();
  let ws = null;
  let shouldConnect = false;
  let retry = 0;
  let reconnectTimer = null;

  function emitLocal(type, data) {
    for (const handler of listeners.get(type) || []) handler(data);
  }

  function scheduleReconnect() {
    if (!shouldConnect || reconnectTimer) return;
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** retry, RECONNECT_MAX_MS);
    retry += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      open();
    }, delay);
  }

  function open() {
    if (!shouldConnect || ws) return;
    const socket = new WebSocket(url);
    ws = socket;

    socket.onopen = () => {
      retry = 0;
      emitLocal("connect");
    };
    socket.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        if (type) emitLocal(type, data);
      } catch {
        // ignore malformed frames
      }
    };
    socket.onclose = () => {
      if (ws === socket) ws = null;
      emitLocal("disconnect");
      scheduleReconnect();
    };
    socket.onerror = () => socket.close();
  }

  return {
    connect() {
      shouldConnect = true;
      open();
    },
    disconnect() {
      shouldConnect = false;
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
      retry = 0;
      if (ws) {
        const socket = ws;
        ws = null;
        socket.onclose = null;
        socket.close();
      }
    },
    on(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
    },
    off(type, handler) {
      listeners.get(type)?.delete(handler);
    },
  };
}

export const socket = createRealtimeClient(WS_URL);
