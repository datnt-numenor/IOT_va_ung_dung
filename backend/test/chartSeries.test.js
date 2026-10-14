const test = require("node:test");
const assert = require("node:assert/strict");
const { alignChartSeries } = require("../services/sensorService");

const point = (time, value) => ({ time, value });

test("keeps every series when the total number of timestamps fits the limit", () => {
  const series = {
    temperature: [point("2026-10-14T05:00:00.000Z", 27)],
    light: [point("2026-10-14T05:00:00.000Z", 300), point("2026-10-14T05:00:02.000Z", 310)],
  };
  assert.deepEqual(alignChartSeries(series, 5), series);
});

test("drops stale points of a sensor that stopped reporting", () => {
  const series = {
    temperature: [point("2026-10-14T05:15:11.000Z", 26.7), point("2026-10-14T05:15:13.000Z", 26.7)],
    light: [
      point("2026-10-14T07:51:45.000Z", 330),
      point("2026-10-14T07:51:47.000Z", 334),
      point("2026-10-14T07:51:49.000Z", 340),
    ],
  };
  const aligned = alignChartSeries(series, 3);
  assert.deepEqual(aligned.temperature, []);
  assert.equal(aligned.light.length, 3);
});

test("applies the same time window to all series", () => {
  const series = {
    temperature: [point("t1", 1), point("t2", 2), point("t3", 3), point("t4", 4)],
    light: [point("t2", 20), point("t3", 30), point("t4", 40), point("t5", 50)],
  };
  const aligned = alignChartSeries(series, 3);
  assert.deepEqual(aligned.temperature.map((p) => p.time), ["t3", "t4"]);
  assert.deepEqual(aligned.light.map((p) => p.time), ["t3", "t4", "t5"]);
});
