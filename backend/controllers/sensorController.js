const sensorService = require("../services/sensorService");
const esp32PresenceService = require("../services/esp32PresenceService");
const { positiveInteger, enumValue, parseSort } = require("../utils/query");
const HttpError = require("../utils/httpError");

const sortColumns = {
  id: "sd.id", sensorType: "s.type", value: "sd.value",
  unit: "s.unit", measuredAt: "sd.measured_at",
};

async function getRealtime(req, res) {
  res.json(await sensorService.getRealtime());
}

function getEsp32Status(req, res) {
  res.json(esp32PresenceService.getStatus());
}

async function getChart(req, res) {
  const limit = positiveInteger(req.query.limit, 20, "limit", 500);
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  if (from && Number.isNaN(from.getTime())) throw new HttpError(400, "Invalid from timestamp");
  if (to && Number.isNaN(to.getTime())) throw new HttpError(400, "Invalid to timestamp");
  if (from && to && from > to) throw new HttpError(400, "from must not be after to");
  res.json(await sensorService.getChart({ from, to, limit }));
}

async function getHistory(req, res) {
  const field = enumValue(req.query.field,
    ["all", "time", "temperature", "humidity", "light"], "field", "all");
  const page = positiveInteger(req.query.page, 1, "page");
  const size = positiveInteger(req.query.size, 10, "size", 100);
  const sort = parseSort(req.query.sort, sortColumns, "id", "DESC");
  res.json(await sensorService.getHistory({
    field, keyword: String(req.query.keyword || "").trim(), page, size,
    sortColumn: sortColumns[sort.key], sortDirection: sort.direction,
  }));
}

module.exports = { getRealtime, getEsp32Status, getChart, getHistory };
