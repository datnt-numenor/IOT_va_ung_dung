const actionHistory = [
  {
    id: 1,
    device: "light",
    user: "Nguyễn Tiến Đạt",
    action: "ON",
    status: "ON",
    time: "2026-09-17 18:00:00",
  },
  {
    id: 2,
    device: "fan",
    user: "Nguyễn Tiến Đạt",
    action: "ON",
    status: "LOADING",
    time: "2026-09-17 18:02:00",
  },
  {
    id: 3,
    device: "ac",
    user: "Nguyễn Tiến Đạt",
    action: "OFF",
    status: "OFF",
    time: "2026-09-17 18:05:00",
  },
  {
    id: 4,
    device: "light",
    user: "Nguyễn Tiến Đạt",
    action: "OFF",
    status: "OFF",
    time: "2026-09-17 18:10:00",
  },
];

function getActionHistory(options) {
  const { page, limit, device, action, status, time, sortKey, sortDir } =
    options;

  let result = [...actionHistory];

  if (device) {
    result = result.filter((item) => item.device === device);
  }

  if (action) {
    result = result.filter((item) => item.action === action);
  }

  if (status) {
    result = result.filter((item) => item.status === status);
  }

  if (time) {
    result = result.filter((item) => item.time.includes(time));
  }

  result.sort((a, b) => {
    if (a[sortKey] < b[sortKey]) {
      return sortDir === "ASC" ? -1 : 1;
    }

    if (a[sortKey] > b[sortKey]) {
      return sortDir === "ASC" ? 1 : -1;
    }

    return 0;
  });

  const total = result.length;
  const totalPages = Math.ceil(total / limit);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const data = result.slice(startIndex, endIndex);

  return {
    page,
    limit,
    total,
    totalPages,
    data,
  };
}

function addActionHistory(record) {
  const newRecord = {
    id: actionHistory.length + 1,
    ...record,
  };

  actionHistory.push(newRecord);

  return newRecord;
}

module.exports = {
  getActionHistory,
  addActionHistory,
};
