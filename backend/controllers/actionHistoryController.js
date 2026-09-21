const actionHistoryService = require("../services/actionHistoryService");

function getActionHistory(req, res) {
  const page = req.query.page !== undefined ? Number(req.query.page) : 1;

  const limit = req.query.limit !== undefined ? Number(req.query.limit) : 10;

  const device = req.query.device;
  const action = req.query.action;
  const status = req.query.status;
  const time = req.query.time;

  const sortKey = req.query.sort_key || "id";
  const sortDir = (req.query.sort_dir || "DESC").toUpperCase();

  const allowedSortKeys = ["id", "device", "user", "action", "status", "time"];

  if (page < 1) {
    return res.status(400).json({
      message: "page must be greater than 0",
    });
  }

  if (limit < 1) {
    return res.status(400).json({
      message: "limit must be greater than 0",
    });
  }

  if (!allowedSortKeys.includes(sortKey)) {
    return res.status(400).json({
      message: "Invalid sort_key",
    });
  }

  if (!["ASC", "DESC"].includes(sortDir)) {
    return res.status(400).json({
      message: "Invalid sort_dir",
    });
  }

  const result = actionHistoryService.getActionHistory({
    page,
    limit,
    device,
    action,
    status,
    time,
    sortKey,
    sortDir,
  });

  return res.status(200).json(result);
}

module.exports = {
  getActionHistory,
};
