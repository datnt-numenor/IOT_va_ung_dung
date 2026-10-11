import { useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getSensorStyle } from "../config/presentation";

// Chỉ hàng cuối hiện trục thời gian; hai hàng trên chừa chỗ trống cùng chiều cao để vùng vẽ của cả ba bằng nhau.
const TIME_AXIS_HEIGHT = 22;
// Lề hai bên đủ rộng cho nửa nhãn giờ đầu/cuối trục thời gian, tránh bị cắt mất ký tự.
const SIDE_MARGIN = 28;

function getDomain(data, key) {
  const values = data.map((item) => Number(item[key])).filter(Number.isFinite);
  if (!values.length) return [0, 1];

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = maximum - minimum;
  const padding = span > 0 ? Math.max(span * 0.2, Math.abs(maximum) * 0.01) : Math.max(Math.abs(maximum) * 0.05, 1);
  return [minimum - padding, maximum + padding];
}

function getLatestValue(data, key) {
  for (let index = data.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(Number(data[index][key]))) return data[index][key];
  }
  return "—";
}

function SensorChart({ data, sensors }) {
  // Chỉ số điểm đang được trỏ vào; dùng chung cho cả ba hàng để xem cùng một thời điểm.
  const [hoverIndex, setHoverIndex] = useState(null);
  const series = sensors.map((sensor) => ({
    key: sensor.type,
    label: sensor.name,
    unit: sensor.unit,
    color: getSensorStyle(sensor.type).color,
  }));

  const hoveredTime = hoverIndex !== null ? data[hoverIndex]?.time : null;

  if (!data.length) {
    return <div className="sensor-chart-empty">Đang chờ dữ liệu cảm biến...</div>;
  }

  return (
    <div className="sensor-chart-stack" aria-label="Biểu đồ dữ liệu cảm biến theo thời gian">
      {series.map((item, index) => {
        const hovered = hoverIndex !== null ? data[hoverIndex]?.[item.key] : undefined;
        const shownValue = Number.isFinite(Number(hovered)) ? hovered : getLatestValue(data, item.key);
        const showTimeAxis = index === series.length - 1;
        const gradientId = `sensor-gradient-${item.key}`;

        return (
          <div className={`sensor-chart-row ${item.key}`} key={item.key}>
            <div className="sensor-chart-row-label" style={{ color: item.color }}>
              <span>{item.label}</span>
              <strong>{shownValue} {item.unit}</strong>
              <small className="sensor-chart-row-time">{hoveredTime ? `Tại ${hoveredTime}` : "Mới nhất"}</small>
            </div>

            <div className="sensor-chart-canvas">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  syncId="sensor-charts"
                  margin={{ top: 12, right: SIDE_MARGIN, bottom: showTimeAxis ? 0 : TIME_AXIS_HEIGHT, left: SIDE_MARGIN }}
                  onMouseMove={(state) => {
                    const index = Number(state?.activeTooltipIndex);
                    setHoverIndex(Number.isInteger(index) ? index : null);
                  }}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={item.color} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={item.color} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    hide={!showTimeAxis}
                    interval="preserveStartEnd"
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#475569" }}
                    axisLine={false}
                    tickLine={false}
                    height={TIME_AXIS_HEIGHT}
                  />
                  <YAxis hide domain={getDomain(data, item.key)} />
                  <Tooltip
                    cursor={{ stroke: item.color, strokeOpacity: 0.18 }}
                    content={() => null}
                  />
                  <Area
                    type="monotone"
                    dataKey={item.key}
                    name={item.label}
                    stroke={item.color}
                    strokeWidth={2.5}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                    connectNulls
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SensorChart;
