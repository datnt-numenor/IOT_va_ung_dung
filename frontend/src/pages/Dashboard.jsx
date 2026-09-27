import { useEffect, useState } from "react";
import {
  Droplets,
  Fan,
  Lightbulb,
  Snowflake,
  Sun,
  Thermometer,
} from "lucide-react";

import { apiRequest } from "../api/client";
import { socket } from "../api/socket";
import DeviceControl from "../components/DeviceControl";
import MainLayout from "../components/MainLayout";
import SensorCard from "../components/SensorCard";
import SensorChart from "../components/SensorChart";
import { formatChartTime } from "../utils/dateTime";

const devices = [
  { id: 1, key: "light", name: "Đèn phòng", icon: Lightbulb },
  { id: 2, key: "fan", name: "Quạt thông gió", icon: Fan },
  { id: 3, key: "ac", name: "Điều hòa", icon: Snowflake },
];

function mergeChartSeries(series) {
  const points = new Map();
  for (const type of ["temperature", "humidity", "light"]) {
    for (const item of series[type] || []) {
      const point = points.get(item.time) || { timestamp: item.time };
      point[type] = item.value;
      points.set(item.time, point);
    }
  }
  return [...points.values()]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((point) => ({ ...point, time: formatChartTime(point.timestamp) }));
}

function Dashboard() {
  const [sensorValues, setSensorValues] = useState({
    temperature: "—",
    humidity: "—",
    light: "—",
  });
  const [chartData, setChartData] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState({
    light: "OFF",
    fan: "OFF",
    ac: "OFF",
  });
  const [esp32Status, setEsp32Status] = useState({
    online: false,
    lastSeen: null,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const [realtime, chart, presence, ...statuses] = await Promise.all([
          apiRequest("/sensors/realtime", { signal: controller.signal }),
          apiRequest("/sensor-data/chart?limit=20", { signal: controller.signal }),
          apiRequest("/sensors/status", { signal: controller.signal }),
          ...devices.map((device) =>
            apiRequest(`/devices/${device.id}/status`, { signal: controller.signal }),
          ),
        ]);
        setSensorValues((current) => {
          const next = { ...current };
          realtime.data.forEach((item) => { next[item.sensorType] = item.value; });
          return next;
        });
        setChartData(mergeChartSeries(chart.series));
        setEsp32Status(presence);
        setDeviceStatus((current) => {
          const next = { ...current };
          statuses.forEach((status, index) => {
            next[devices[index].key] = status.currentStatus;
          });
          return next;
        });
        setError("");
      } catch (requestError) {
        if (requestError.name !== "AbortError") setError(requestError.message);
      }
    }

    function handleSensorUpdate(event) {
      setSensorValues((current) => {
        const next = { ...current };
        event.data.forEach((item) => { next[item.sensorType] = item.value; });
        return next;
      });
      setChartData((current) => {
        const point = { timestamp: event.timestamp, time: formatChartTime(event.timestamp) };
        event.data.forEach((item) => { point[item.sensorType] = item.value; });
        return [...current, point].slice(-20);
      });
    }

    async function refreshDevice(deviceId) {
      const device = devices.find((item) => item.id === deviceId);
      if (!device) return;
      try {
        const result = await apiRequest(`/devices/${deviceId}/status`);
        setDeviceStatus((current) => ({ ...current, [device.key]: result.currentStatus }));
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    function handleDeviceUpdate(event) {
      const device = devices.find((item) => item.id === event.deviceId);
      if (!device) return;
      if (event.status === "FAILED") {
        setError(`Thiết bị ${device.name} không phản hồi`);
        refreshDevice(event.deviceId);
        return;
      }
      setDeviceStatus((current) => ({
        ...current,
        [device.key]: event.currentStatus || event.status,
      }));
      setError("");
    }

    function handleEsp32Status(status) {
      setEsp32Status(status);
    }

    loadDashboard();
    socket.connect();
    socket.on("sensor:update", handleSensorUpdate);
    socket.on("device:update", handleDeviceUpdate);
    socket.on("esp32:status", handleEsp32Status);

    return () => {
      controller.abort();
      socket.off("sensor:update", handleSensorUpdate);
      socket.off("device:update", handleDeviceUpdate);
      socket.off("esp32:status", handleEsp32Status);
      socket.disconnect();
    };
  }, []);

  async function handleToggleDevice(device) {
    const currentStatus = deviceStatus[device.key];
    if (currentStatus === "LOADING") return;
    const action = currentStatus === "ON" ? "OFF" : "ON";
    setDeviceStatus((current) => ({ ...current, [device.key]: "LOADING" }));
    setError("");
    try {
      await apiRequest(`/devices/${device.id}/actions`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
    } catch (requestError) {
      setDeviceStatus((current) => ({ ...current, [device.key]: currentStatus }));
      setError(requestError.message);
    }
  }

  return (
    <MainLayout
      title="Dashboard"
      subtitle="Giám sát phòng học theo thời gian thực"
      esp32Status={esp32Status}
    >
      <div className="dashboard-page">
        {error ? <div className="api-error" role="alert">{error}</div> : null}

        <div className="sensor-grid">
          <SensorCard title="NHIỆT ĐỘ" value={sensorValues.temperature} unit="°C"
            icon={<Thermometer size={24} strokeWidth={2} />} type="temperature"
            isLive={esp32Status.online} lastSeen={esp32Status.lastSeen} />
          <SensorCard title="ĐỘ ẨM" value={sensorValues.humidity} unit="%"
            icon={<Droplets size={24} strokeWidth={2} />} type="humidity"
            isLive={esp32Status.online} lastSeen={esp32Status.lastSeen} />
          <SensorCard title="ÁNH SÁNG" value={sensorValues.light} unit="ADC"
            icon={<Sun size={24} strokeWidth={2} />} type="light"
            isLive={esp32Status.online} lastSeen={esp32Status.lastSeen} />
        </div>

        <div className="dashboard-main-row">
          <div className="dashboard-chart-panel">
            <h2>Dữ liệu cảm biến thời gian thực</h2>
            <p className="dashboard-chart-subtitle">Ba thang đo độc lập, cập nhật trực tiếp từ ESP32</p>
            <SensorChart data={chartData} />
          </div>

          <div className="device-panel">
            <h2>Điều khiển thiết bị</h2>
            <p className="device-panel-subtitle">Trạng thái phản hồi từ ESP32</p>
            <div className="device-list">
              {devices.map((device) => {
                const Icon = device.icon;
                return (
                  <DeviceControl key={device.id} name={device.name}
                    status={deviceStatus[device.key]}
                    onToggle={() => handleToggleDevice(device)}
                    icon={<Icon size={22} strokeWidth={2} />} />
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}

export default Dashboard;
