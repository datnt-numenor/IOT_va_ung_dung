const initialActionHistory = [
  {
    id: 1,
    device: "Light",
    action: "ON",
    status: "ON",
    time: "2026-09-07 15:20:00",
  },
  {
    id: 2,
    device: "Fan",
    action: "ON",
    status: "LOADING",
    time: "2026-09-07 15:21:10",
  },
  {
    id: 3,
    device: "AC",
    action: "OFF",
    status: "OFF",
    time: "2026-09-07 15:22:20",
  },
  {
    id: 4,
    device: "Light",
    action: "OFF",
    status: "OFF",
    time: "2026-09-07 15:23:30",
  },
  {
    id: 5,
    device: "Fan",
    action: "OFF",
    status: "OFF",
    time: "2026-09-07 15:24:40",
  },
];

const devices = ["Light", "Fan", "AC"];
const actions = ["ON", "OFF"];
const statuses = ["ON", "OFF", "LOADING", "FAILED"];

const formatDateTime = (date) =>
  date.toISOString().replace("T", " ").slice(0, 19);

const additionalActionHistory = Array.from({ length: 42 }, (_, index) => {
  const id = initialActionHistory.length + index + 1;
  const occurredAt = new Date(
    Date.UTC(2026, 8, 7, 15, 24, 40 + (index + 1) * 70),
  );

  return {
    id,
    device: devices[index % devices.length],
    action: actions[Math.floor(index / devices.length) % actions.length],
    status:
      statuses[
        Math.floor(index / (devices.length * actions.length)) % statuses.length
      ],
    time: formatDateTime(occurredAt),
  };
});

const actionHistory = [...initialActionHistory, ...additionalActionHistory];

export default actionHistory;
