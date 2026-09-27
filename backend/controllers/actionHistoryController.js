const service = require("../services/actionHistoryService");
const { positiveInteger, enumValue, parseSort } = require("../utils/query");

const sortColumns = {
  id: "ah.id", deviceName: "d.name", performedBy: "u.full_name",
  action: "ah.action", status: "ah.status", requestedAt: "ah.requested_at",
};

async function getActionHistory(req, res) {
  const page = positiveInteger(req.query.page, 1, "page");
  const size = positiveInteger(req.query.size, 10, "size", 100);
  const deviceId = req.query.deviceId
    ? positiveInteger(req.query.deviceId, null, "deviceId") : null;
  const action = enumValue(req.query.action, ["ON", "OFF"], "action", null);
  const status = enumValue(
    req.query.status, ["LOADING", "ON", "OFF", "FAILED"], "status", null,
  );
  const sort = parseSort(req.query.sort, sortColumns, "requestedAt", "DESC");
  res.json(await service.getActionHistory({
    time: String(req.query.time || "").trim(), deviceId, action, status, page, size,
    sortColumn: sortColumns[sort.key], sortDirection: sort.direction,
  }));
}

module.exports = { getActionHistory };
