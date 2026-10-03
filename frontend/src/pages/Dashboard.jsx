import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { socket } from "../api/socket";
import DeviceControl from "../components/DeviceControl";
import MainLayout from "../components/MainLayout";
import SensorCard from "../components/SensorCard";
import SensorChart from "../components/SensorChart";
import { CHART_POINTS, getDeviceIcon, getSensorStyle } from "../config/presentation";
import { formatChartTime } from "../utils/dateTime";

function mergeChartSeries(series, types) {
  const points = new Map();
  for (const type of types) {
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
  const [sensors, setSensors] = useState([]);
  const [devices, setDevices] = useState([]);
  const [sensorValues, setSensorValues] = useState({});
  const [chartData, setChartData] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState({});
  const [esp32Status, setEsp32Status] = useState({
    online: false,
    lastSeen: null,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const [sensorList, deviceList] = await Promise.all([
          apiRequest("/sensors", { signal: controller.signal }),
          apiRequest("/devices", { signal: controller.signal }),
        ]);
        const [realtime, chart, presence] = await Promise.all([
          apiRequest("/sensors/realtime", { signal: controller.signal }),
          apiRequest(`/sensor-data/chart?limit=${CHART_POINTS}`, { signal: controller.signal }),
          apiRequest("/sensors/status", { signal: controller.signal }),
        ]);
        setSensors(sensorList.data);
        setDevices(deviceList.data);
        setSensorValues(Object.fromEntries(realtime.data.map((item) => [item.sensorType, item.value])));
        setChartData(mergeChartSeries(chart.series, sensorList.data.map((sensor) => sensor.type)));
        setEsp32Status(presence);
        setDeviceStatus(Object.fromEntries(deviceList.data.map((device) => [device.id, device.currentStatus])));
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
        return [...current, point].slice(-CHART_POINTS);
      });
    }

    async function refreshDevice(deviceId) {
      try {
        const result = await apiRequest(`/devices/${deviceId}/status`);
        setDeviceStatus((current) => ({ ...current, [deviceId]: result.currentStatus }));
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    function handleDeviceUpdate(event) {
      if (event.status === "FAILED") {
        setError(`Thiết bị #${event.deviceId} không phản hồi`);
        refreshDevice(event.deviceId);
        return;
      }
      setDeviceStatus((current) => ({
        ...current,
        [event.deviceId]: event.currentStatus || event.status,
      }));
      setError("");
    }

    function handleEsp32Status(status) {
      setEsp32Status(status);
    }

    function handleReconnect() {
      loadDashboard();
    }

    loadDashboard();
    socket.connect();
    socket.on("connect", handleReconnect);
    socket.on("sensor:update", handleSensorUpdate);
    socket.on("device:update", handleDeviceUpdate);
    socket.on("esp32:status", handleEsp32Status);

    return () => {
      controller.abort();
      socket.off("connect", handleReconnect);
      socket.off("sensor:update", handleSensorUpdate);
      socket.off("device:update", handleDeviceUpdate);
      socket.off("esp32:status", handleEsp32Status);
      socket.disconnect();
    };
  }, []);

  async function handleToggleDevice(device) {
    const currentStatus = deviceStatus[device.id];
    if (!currentStatus || currentStatus === "LOADING") return;
    const action = currentStatus === "ON" ? "OFF" : "ON";
    setDeviceStatus((current) => ({ ...current, [device.id]: "LOADING" }));
    setError("");
    try {
      await apiRequest(`/devices/${device.id}/actions`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
    } catch (requestError) {
      setDeviceStatus((current) => ({ ...current, [device.id]: currentStatus }));
      setError(requestError.message);
    }
  }

  return (
    <MainLayout
      title="Dashboard"
      subtitle="Giám sát phòng học theo thời gian thực"
      esp32Status={esp32Status}
      contentClassName="dashboard-content"
    >
      <div className="dashboard-page">
        {error ? <div className="api-error" role="alert">{error}</div> : null}

        <div className="sensor-grid">
          {sensors.map((sensor) => {
            const Icon = getSensorStyle(sensor.type).icon;
            return (
              <SensorCard key={sensor.id} title={sensor.name.toUpperCase()}
                value={sensorValues[sensor.type] ?? "—"} unit={sensor.unit}
                icon={<Icon size={24} strokeWidth={2} />} type={sensor.type}
                isLive={esp32Status.online} lastSeen={esp32Status.lastSeen} />
            );
          })}
        </div>

        <div className="dashboard-main-row">
          <div className="dashboard-chart-panel">
            <h2>Dữ liệu cảm biến thời gian thực</h2>
            <p className="dashboard-chart-subtitle">Ba thang đo độc lập, cập nhật trực tiếp từ ESP32</p>
            <SensorChart data={chartData} sensors={sensors} />
          </div>

          <div className="device-panel">
            <h2>Điều khiển thiết bị</h2>
            <p className="device-panel-subtitle">Trạng thái phản hồi từ ESP32</p>
            <div className="device-list">
              {devices.map((device) => {
                const Icon = getDeviceIcon(device.type);
                return (
                  <DeviceControl key={device.id} name={device.name}
                    status={deviceStatus[device.id]}
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
