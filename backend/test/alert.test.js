const test = require("node:test");
const assert = require("node:assert/strict");

const db = require("../config/db");
const deviceService = require("../services/deviceService");
const settingsService = require("../services/settingsService");
const alertService = require("../services/alertService");

const calls = [];
let controlResult = () => ({});

// Thay các phụ thuộc bằng bản giả để chỉ kiểm tra logic ngưỡng, không đụng MySQL hay MQTT.
db.execute = async (sql) => {
  if (sql.includes("FROM users")) return [[{ id: 99 }]];
  if (sql.includes("FROM devices")) return [[{ status: "OFF" }]];
  return [[]];
};
settingsService.getAlertThreshold = async () => 1000;
deviceService.controlDevice = async (args) => {
  calls.push(args);
  const outcome = controlResult();
  if (outcome instanceof Error) throw outcome;
  return outcome;
};

test.beforeEach(async () => {
  calls.length = 0;
  controlResult = () => ({});
  await alertService.init(); // đưa trạng thái về "không cảnh báo"
});

test("turns the warning LED on once when light goes above the threshold", async () => {
  await alertService.evaluate(900);
  assert.equal(calls.length, 0);

  await alertService.evaluate(1200);
  assert.deepEqual(calls, [{ deviceId: alertService.WARNING_DEVICE_ID, action: "ON", userId: 99 }]);

  await alertService.evaluate(1300); // vẫn vượt ngưỡng: không bật lại, không ghi thêm lịch sử
  assert.equal(calls.length, 1);
  assert.equal((await alertService.getStatus()).active, true);
});

test("turns it off only after the value drops below 95% of the threshold", async () => {
  await alertService.evaluate(1200);
  await alertService.evaluate(990); // dưới ngưỡng nhưng chưa dưới 95% (950): giữ nguyên
  assert.equal(calls.length, 1);

  await alertService.evaluate(940);
  assert.deepEqual(calls.map((call) => call.action), ["ON", "OFF"]);
  assert.equal((await alertService.getStatus()).active, false);
});

test("a failed command is retried later instead of on every reading", async () => {
  controlResult = () => Object.assign(new Error("MQTT broker is unavailable"), { status: 503 });
  const originalError = console.error;
  console.error = () => {};
  try {
    await alertService.evaluate(1200);
    await alertService.evaluate(1300); // trong thời gian chờ thử lại: bỏ qua
  } finally {
    console.error = originalError;
  }
  assert.equal(calls.length, 1);
  assert.equal((await alertService.getStatus()).active, false);
});

test("nobody can control the warning LED manually, not even an admin", async () => {
  const deviceController = require("../controllers/deviceController");
  const request = {
    params: { deviceId: String(alertService.WARNING_DEVICE_ID) },
    body: { action: "ON" },
    user: { id: 1, username: "admin", role: "admin" },
  };
  await assert.rejects(
    () => deviceController.controlDevice(request, { status: () => ({ json: () => {} }) }),
    (error) => error.status === 403,
  );
  assert.equal(calls.length, 0);
});

test("daily stats cover each of the last days and fill missing days with 0", async () => {
  const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  db.execute = async () => [[{ day: today, total: 3 }]];

  const stats = await alertService.getDailyStats(7);
  assert.equal(stats.days.length, 7);
  assert.equal(stats.days.at(-1).date, today);
  assert.equal(stats.days.at(-1).total, 3);
  assert.equal(stats.days[0].total, 0);
  assert.equal(stats.total, 3);
});
