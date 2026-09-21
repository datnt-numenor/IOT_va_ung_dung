const db = require("../config/db");

async function getSensors(options) {
  const { page, limit, searchField, searchValue, sortKey, sortDir } = options;

  const offset = (page - 1) * limit;

  let whereClause = "";
  const values = [];

  if (searchField && searchValue) {
    whereClause = `WHERE ${searchField} LIKE ?`;
    values.push(`%${searchValue}%`);
  }

  const countSql = `
    SELECT COUNT(*) AS total
    FROM sensor_data
    ${whereClause}
  `;

  const [countRows] = await db.execute(countSql, values);

  const total = countRows[0].total;
  const totalPages = Math.ceil(total / limit);

  const dataSql = `
    SELECT id, sensor, value, unit, time
    FROM sensor_data
    ${whereClause}
    ORDER BY ${sortKey} ${sortDir}
    LIMIT ? OFFSET ?
  `;

  const dataValues = [...values, limit, offset];

  const [rows] = await db.execute(dataSql, dataValues);

  return {
    page,
    limit,
    total,
    totalPages,
    data: rows,
  };
}

module.exports = {
  getSensors,
};
