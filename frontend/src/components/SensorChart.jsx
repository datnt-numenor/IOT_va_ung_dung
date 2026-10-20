import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getSensorStyle } from "../config/presentation";

// Mỗi trục có thang cố định để đọc được giá trị: trục trái cho nhiệt độ/độ ẩm (0–100),
// trục phải cho ánh sáng (ADC chia 3 nên tối đa 1365; chọn 0–1600 để vạch chia tròn và thẳng hàng với trục trái).
const DOMAINS = { left: [0, 100], right: [0, 1600] };
const TICKS = { left: [0, 25, 50, 75, 100], right: [0, 400, 800, 1200, 1600] };
const AXIS_WIDTHS = { left: 38, right: 46 };
const TICK_COLOR = "#475569";
const TICK_STYLE = { fontSize: 11, fontWeight: 700, fill: TICK_COLOR };
const AXIS_LINE = { stroke: "#94a3b8" };

function getLatestValue(data, key) {
  for (let index = data.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(Number(data[index][key]))) return data[index][key];
  }
  return "—";
}

function SensorChart({ data, sensors }) {
  const series = sensors.map((sensor) => {
    const style = getSensorStyle(sensor.type);
    return {
      key: sensor.type,
      label: sensor.name,
      unit: sensor.unit,
      color: style.color,
      axis: style.axis || "left",
    };
  });
  const seriesByKey = Object.fromEntries(series.map((item) => [item.key, item]));
  const axesInUse = ["left", "right"].filter((axis) => series.some((item) => item.axis === axis));

  if (!data.length) {
    return <div className="sensor-chart-empty">Đang chờ dữ liệu cảm biến...</div>;
  }

  return (
    <div className="sensor-chart-combined">
      <div className="sensor-chart-legend" aria-label="Chú thích các đường trên biểu đồ">
        {series.map((item) => (
          <span className="sensor-chart-legend-item" style={{ "--series-color": item.color }} key={item.key}>
            <i aria-hidden="true" />
            <span>{item.label}</span>
            <strong>{getLatestValue(data, item.key)} {item.unit}</strong>
          </span>
        ))}
      </div>

      <div className="sensor-chart-canvas" aria-label="Biểu đồ dữ liệu cảm biến theo thời gian">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, bottom: 2, left: 4 }}>
            <CartesianGrid stroke="#e2e8f0" />
            <XAxis
              dataKey="time"
              interval="preserveStartEnd"
              minTickGap={28}
              tick={TICK_STYLE}
              axisLine={AXIS_LINE}
              tickLine={AXIS_LINE}
              height={26}
            />
            {axesInUse.map((axis) => (
              <YAxis
                key={axis}
                yAxisId={axis}
                orientation={axis}
                domain={DOMAINS[axis]}
                ticks={TICKS[axis]}
                tick={TICK_STYLE}
                axisLine={AXIS_LINE}
                tickLine={AXIS_LINE}
                width={AXIS_WIDTHS[axis]}
              />
            ))}
            <Tooltip
              cursor={{ stroke: TICK_COLOR, strokeOpacity: 0.3 }}
              formatter={(value, name, item) => [`${value} ${seriesByKey[item.dataKey]?.unit || ""}`, name]}
              labelFormatter={(label) => `Thời gian: ${label}`}
            />
            {series.map((item) => (
              <Line
                key={item.key}
                yAxisId={item.axis}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default SensorChart;
