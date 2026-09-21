const sensorService = require("../services/sensorService");

async function getSensors(req, res) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const searchField = req.query.search_field;
  const searchValue = req.query.search_value;

  const sortKey = req.query.sort_key || "id";
  const sortDir = (req.query.sort_dir || "ASC").toUpperCase();

  const allowedSearchFields = ["id", "sensor", "value", "unit", "time"];

  const allowedSortKeys = ["id", "sensor", "value", "unit", "time"];

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

  if (searchField && !allowedSearchFields.includes(searchField)) {
    return res.status(400).json({
      message: "Invalid search_field",
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

  try {
    const result = await sensorService.getSensors({
      page,
      limit,
      searchField,
      searchValue,
      sortKey,
      sortDir,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }

  return res.status(200).json(result);
}

module.exports = {
  getSensors,
};
