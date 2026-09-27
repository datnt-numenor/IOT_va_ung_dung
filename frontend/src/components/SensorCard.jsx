import { formatChartTime } from "../utils/dateTime";

function SensorCard({ title, value, unit, icon, type, isLive, lastSeen }) {
  const updatedAt = lastSeen ? formatChartTime(lastSeen) : "--:--:--";

  return (
    <article className={`sensor-card ${type}`}>
      <div className="sensor-card-header">
        <div className={`sensor-icon ${type}`}>{icon}</div>
        <div className="sensor-card-title">
          <span className="sensor-name">{title}</span>
          <span className={`sensor-live-badge ${isLive ? "live" : "idle"}`}>
            <i aria-hidden="true" />
            {isLive ? "Trực tiếp" : "Gần nhất"}
          </span>
        </div>
      </div>

      <div className="sensor-value">
        <strong>{value}</strong>
        <span>{unit}</span>
      </div>

      <div className="sensor-card-footer">
        <span>{isLive ? "Đang nhận dữ liệu từ ESP32" : "Không có tín hiệu mới"}</span>
        <time dateTime={lastSeen || undefined}>{updatedAt}</time>
      </div>
    </article>
  );
}

export default SensorCard;
