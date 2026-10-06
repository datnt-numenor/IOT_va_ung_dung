const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const { WebSocket } = require("ws");
const socketHub = require("../realtime/socketHub");

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
}

test("broadcasts typed events to WebSocket clients and rejects unknown origins", async () => {
  const server = http.createServer();
  socketHub.attachWebSocketServer(server, { path: "/ws", allowedOrigins: ["http://allowed.test"] });
  const port = await listen(server);

  const client = new WebSocket(`ws://127.0.0.1:${port}/ws`, { origin: "http://allowed.test" });
  await new Promise((resolve, reject) => { client.once("open", resolve); client.once("error", reject); });
  const received = new Promise((resolve) => client.once("message", (raw) => resolve(JSON.parse(raw))));
  socketHub.emitSensorUpdate({ timestamp: "2026-10-06T00:00:00Z", data: [] });
  assert.deepStrictEqual(await received, {
    type: "sensor:update",
    data: { timestamp: "2026-10-06T00:00:00Z", data: [] },
  });

  const blocked = new WebSocket(`ws://127.0.0.1:${port}/ws`, { origin: "http://evil.test" });
  const status = await new Promise((resolve) => blocked.once("unexpected-response", (req, res) => resolve(res.statusCode)));
  assert.strictEqual(status, 401);

  client.close();
  await socketHub.closeWebSocketServer();
  await new Promise((resolve) => server.close(resolve));
});
