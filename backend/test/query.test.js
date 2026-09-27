const test = require("node:test");
const assert = require("node:assert/strict");
const { positiveInteger, enumValue, parseSort } = require("../utils/query");

test("positiveInteger applies defaults and rejects invalid values", () => {
  assert.equal(positiveInteger(undefined, 10, "size", 100), 10);
  assert.equal(positiveInteger("20", 10, "size", 100), 20);
  assert.throws(() => positiveInteger("0", 10, "size", 100), /size must/);
  assert.throws(() => positiveInteger("101", 10, "size", 100), /size must/);
});

test("enumValue distinguishes required and optional values", () => {
  assert.equal(enumValue("ON", ["ON", "OFF"], "action"), "ON");
  assert.equal(enumValue(undefined, ["ON", "OFF"], "action", null), null);
  assert.throws(() => enumValue(undefined, ["ON", "OFF"], "action"), /required/);
});

test("parseSort only accepts allowlisted columns and directions", () => {
  const columns = { id: "table.id", time: "table.time" };
  assert.deepEqual(parseSort("time,asc", columns, "id"), { key: "time", direction: "ASC" });
  assert.throws(() => parseSort("password,DESC", columns, "id"), /Unsupported/);
});
