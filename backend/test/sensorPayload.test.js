const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizePayload } = require("../services/sensorService");

test("normalizes the MQTT sensor payload", () => {
  const result = normalizePayload({
    timestamp: "2026-08-15T04:20:30.000Z",
    temperature: 27.4,
    humidity: "65",
    light: 420,
  });
  assert.equal(result.readings.length, 3);
  assert.deepEqual(result.readings[1], { type: "humidity", value: 65 });
});

test("rejects MQTT payloads without usable readings", () => {
  assert.throws(() => normalizePayload({ temperature: "bad" }), /numeric/);
  assert.throws(() => normalizePayload({ unknown: 1 }), /no supported/);
});
