const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const { io: connect } = require("socket.io-client");
const socketHub = require("../realtime/socketHub");

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
}

const allowed = { transports: ["websocket"], extraHeaders: { origin: "http://allowed.test" } };

test("broadcasts named events to authenticated clients and rejects unknown origins or tokens", async () => {
  const server = http.createServer();
  socketHub.attachSocketServer(server, {
    allowedOrigins: ["http://allowed.test"],
    verifyToken: (token) => {
      if (token !== "good-token") throw new Error("bad token");
      return { id: 1, username: "admin" };
    },
  });
  const port = await listen(server);
  const url = `http://127.0.0.1:${port}`;

  const client = connect(url, { ...allowed, auth: { token: "good-token" } });
  await new Promise((resolve, reject) => { client.once("connect", resolve); client.once("connect_error", reject); });
  const received = new Promise((resolve) => client.once("sensor:update", resolve));
  const payload = { timestamp: "2026-10-06T00:00:00Z", data: [] };
  socketHub.emitSensorUpdate(payload);
  assert.deepStrictEqual(await received, payload);

  const wrongOrigin = connect(url, {
    transports: ["websocket"],
    extraHeaders: { origin: "http://evil.test" },
    auth: { token: "good-token" },
    reconnection: false,
  });
  assert.ok(await new Promise((resolve) => wrongOrigin.once("connect_error", resolve)));

  const noToken = connect(url, { ...allowed, reconnection: false });
  const error = await new Promise((resolve) => noToken.once("connect_error", resolve));
  assert.strictEqual(error.message, "Authentication required");

  client.close();
  wrongOrigin.close();
  noToken.close();
  await socketHub.closeSocketServer();
});
