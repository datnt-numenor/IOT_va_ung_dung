const test = require("node:test");
const assert = require("node:assert/strict");

const presence = require("../services/esp32PresenceService");

test("ESP32 becomes online after a heartbeat and offline after the timeout", async (t) => {
  process.env.ESP32_OFFLINE_TIMEOUT_MS = "25";
  t.after(() => {
    presence.close();
    delete process.env.ESP32_OFFLINE_TIMEOUT_MS;
  });

  presence.recordHeartbeat();
  assert.equal(presence.getStatus().online, true);
  assert.ok(presence.getStatus().lastSeen);

  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(presence.getStatus().online, false);
});
