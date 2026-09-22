import { useState } from "react";
import MainLayout from "../components/MainLayout";
import SensorCard from "../components/SensorCard";
import DeviceControl from "../components/DeviceControl";
import SensorChart from "../components/SensorChart";
import {
  Droplets,
  Fan,
  Lightbulb,
  Snowflake,
  Sun,
  Thermometer,
} from "lucide-react";

function Dashboard() {
  const [temperature, _setTemperature] = useState(28);
  const [humidity, _setHumidity] = useState(65);
  const [light, _setLight] = useState(420);

  const [deviceStatus, setDeviceStatus] = useState({
    light: "OFF",
    fan: "OFF",
    ac: "OFF",
  });

  const sensorData = [
    {
      time: "10:40",
      temperature: 38,
      humidity: 54,
      light: 28,
    },
    {
      time: "10:50",
      temperature: 56,
      humidity: 40,
      light: 34,
    },
    {
      time: "11:00",
      temperature: 36,
      humidity: 58,
      light: 48,
    },
    {
      time: "11:10",
      temperature: 62,
      humidity: 42,
      light: 30,
    },
    {
      time: "11:20",
      temperature: 44,
      humidity: 60,
      light: 50,
    },
  ];

  function handleToggleDevice(device) {
    const currentStatus = deviceStatus[device];

    const nextStatus = currentStatus === "ON" ? "OFF" : "ON";

    setDeviceStatus((prev) => ({
      ...prev,
      [device]: "LOADING",
    }));

    setTimeout(() => {
      setDeviceStatus((prev) => ({
        ...prev,
        [device]: nextStatus,
      }));
    }, 1500);
  }
  return (
    <MainLayout
      title="Dashboard"
      subtitle="Giám sát phòng học theo thời gian thực"
      showEsp32Status
    >
      <div className="dashboard-page">
        {/* SENSOR CARDS */}
        <div className="sensor-grid">
          <SensorCard
            title="NHIỆT ĐỘ"
            value={temperature}
            unit="°C"
            trend="↗ 1.8% trong 1 giờ"
            trendType="up"
            icon={<Thermometer size={24} strokeWidth={2} />}
            type="temperature"
            sparklinePoints="0,36 15,33 28,24 40,22 55,14 67,15 80,9 95,8 108,3"
          />

          <SensorCard
            title="ĐỘ ẨM"
            value={humidity}
            unit="%"
            trend="↘ 2.4% trong 1 giờ"
            trendType="down"
            icon={<Droplets size={24} strokeWidth={2} />}
            type="humidity"
            sparklinePoints="0,7 14,9 27,8 40,14 54,17 68,16 82,24 95,25 108,33"
          />

          <SensorCard
            title="ÁNH SÁNG"
            value={light}
            unit="lux"
            trend="↗ 6.2% trong 1 giờ"
            trendType="up"
            icon={<Sun size={24} strokeWidth={2} />}
            type="light"
            sparklinePoints="0,35 15,34 28,29 42,22 56,20 70,15 84,14 96,8 108,6"
          />
        </div>

        {/* MAIN ROW */}
        <div className="dashboard-main-row">
          <div className="dashboard-chart-panel">
            <h2>Dữ liệu cảm biến thời gian thực</h2>

            <div className="chart-legend">
              <span className="legend-item temperature">
                <i></i>
                Nhiệt độ
              </span>

              <span className="legend-item humidity">
                <i></i>
                Độ ẩm
              </span>

              <span className="legend-item light">
                <i></i>
                Ánh sáng
              </span>
            </div>

            <SensorChart data={sensorData} />
          </div>

          <div className="device-panel">
            <h2>Điều khiển thiết bị</h2>
            <p className="device-panel-subtitle">
              Trạng thái phản hồi từ ESP32
            </p>

            <div className="device-list">
              <DeviceControl
                name="Đèn phòng"
                status={deviceStatus.light}
                onToggle={() => handleToggleDevice("light")}
                icon={<Lightbulb size={22} strokeWidth={2} />}
              />

              <DeviceControl
                name="Quạt thông gió"
                status={deviceStatus.fan}
                onToggle={() => handleToggleDevice("fan")}
                icon={<Fan size={22} strokeWidth={2} />}
              />

              <DeviceControl
                name="Điều hòa"
                status={deviceStatus.ac}
                onToggle={() => handleToggleDevice("ac")}
                icon={<Snowflake size={22} strokeWidth={2} />}
              />
            </div>
          </div>
        </div>

        {/* SYSTEM SUMMARY */}
        <div className="system-summary">
          <h2>Tổng quan hệ thống</h2>

          <div className="summary-grid">
            <div className="summary-item">
              <strong>3</strong>
              <span>Cảm biến hoạt động</span>
            </div>

            <div className="summary-item">
              <strong>3</strong>
              <span>Thiết bị kết nối</span>
            </div>

            <div className="summary-item">
              <strong>1,248</strong>
              <span>Bản ghi hôm nay</span>
            </div>

            <div className="summary-item uptime">
              <strong>99.8%</strong>
              <span>Uptime MQTT</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Dashboard;
