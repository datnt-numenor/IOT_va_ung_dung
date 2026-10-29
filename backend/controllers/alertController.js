const alertService = require("../services/alertService");
const settingsService = require("../services/settingsService");
const { positiveInteger } = require("../utils/query");

async function getStatus(req, res) {
  res.json(await alertService.getStatus());
}

async function getStats(req, res) {
  const days = positiveInteger(req.query.days, 7, "days", 90);
  res.json(await alertService.getDailyStats(days));
}

async function setThreshold(req, res) {
  await settingsService.setAlertThreshold(req.body?.threshold);
  await alertService.reevaluate();
  res.json(await alertService.getStatus());
}

module.exports = { getStatus, getStats, setThreshold };
