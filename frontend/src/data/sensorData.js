const initialSensorData = [
  {
    id: 1,
    sensor: "Temperature",
    value: 28,
    unit: "°C",
    time: "2026-08-31 18:20:00",
  },
  {
    id: 2,
    sensor: "Humidity",
    value: 65,
    unit: "%",
    time: "2026-08-31 18:20:05",
  },
  {
    id: 3,
    sensor: "Light",
    value: 420,
    unit: "lux",
    time: "2026-08-31 18:20:10",
  },
  {
    id: 4,
    sensor: "Temperature",
    value: 29,
    unit: "°C",
    time: "2026-08-31 18:20:15",
  },
  {
    id: 5,
    sensor: "Humidity",
    value: 66,
    unit: "%",
    time: "2026-08-31 18:20:20",
  },
];

const sensorDefinitions = [
  {
    sensor: "Light",
    unit: "lux",
    getValue: (index) => 250 + ((index * 37) % 551),
  },
  {
    sensor: "Temperature",
    unit: "°C",
    getValue: (index) => 24 + (index % 9),
  },
  {
    sensor: "Humidity",
    unit: "%",
    getValue: (index) => 55 + (index % 21),
  },
];

const formatDateTime = (date) =>
  date.toISOString().replace("T", " ").slice(0, 19);

const additionalSensorData = Array.from({ length: 48 }, (_, index) => {
  const id = initialSensorData.length + index + 1;
  const definition = sensorDefinitions[index % sensorDefinitions.length];
  const measuredAt = new Date(
    Date.UTC(2026, 7, 31, 18, 20, 20 + (index + 1) * 5),
  );

  return {
    id,
    sensor: definition.sensor,
    value: definition.getValue(index),
    unit: definition.unit,
    time: formatDateTime(measuredAt),
  };
});

const sensorData = [...initialSensorData, ...additionalSensorData];

export default sensorData;
