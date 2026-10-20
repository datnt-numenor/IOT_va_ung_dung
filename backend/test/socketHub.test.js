const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const { io: connect } = require("socket.io-client");
const socketHub = require("../realtime/socketHub");

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
}

test("broadcasts named events to Socket.IO clients and rejects unknown origins", async () => {
  const server = http.createServer();
  socketHub.attachSocketServer(server, { allowedOrigins: ["http://allowed.test"] });
  const port = await listen(server);
  const url = `http://127.0.0.1:${port}`;

  const client = connect(url, { transports: ["websocket"], extraHeaders: { origin: "http://allowed.test" } });
  await new Promise((resolve, reject) => { client.once("connect", resolve); client.once("connect_error", reject); });
  const received = new Promise((resolve) => client.once("sensor:update", resolve));
  const payload = { timestamp: "2026-10-06T00:00:00Z", data: [] };
  socketHub.emitSensorUpdate(payload);
  assert.deepStrictEqual(await received, payload);

  const blocked = connect(url, {
    transports: ["websocket"],
    extraHeaders: { origin: "http://evil.test" },
    reconnection: false,
  });
  const error = await new Promise((resolve) => blocked.once("connect_error", resolve));
  assert.ok(error);

  client.close();
  blocked.close();
  await socketHub.closeSocketServer();
});
