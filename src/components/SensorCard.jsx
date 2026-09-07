function SensorCard({
  title,
  value,
  unit,
  trend,
  trendType,
  icon,
  type,
  sparklinePoints,
  updatedText = "Cập nhật 2 giây trước",
}) {
  return (
    <div className="sensor-card">
      <div className="sensor-card-top">
        <div className={`sensor-icon ${type}`}>{icon}</div>

        <div className="sensor-main">
          <span className="sensor-name">{title}</span>

          <div className="sensor-value">
            <strong>{value}</strong>
            <span>{unit}</span>
          </div>
        </div>

        <div className={`sensor-sparkline ${type}`}>
          <svg viewBox="0 0 108 42">
            <polyline
              points={sparklinePoints}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="sensor-card-bottom">
        <span className={`sensor-trend ${trendType}`}>{trend}</span>

        <span className="sensor-updated">{updatedText}</span>
      </div>
    </div>
  );
}

export default SensorCard;
