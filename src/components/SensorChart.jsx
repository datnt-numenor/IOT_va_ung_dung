import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function SensorChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid stroke="#e7edf5" vertical={false} />

        <XAxis
          dataKey="time"
          tick={{
            fontSize: 10,
            fill: "#616e85",
          }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis hide domain={[0, 80]} />

        <Tooltip />

        <Line
          type="monotone"
          dataKey="temperature"
          stroke="#f97316"
          strokeWidth={2.5}
          dot={false}
        />

        <Line
          type="monotone"
          dataKey="humidity"
          stroke="#06b6d4"
          strokeWidth={2.5}
          dot={false}
        />

        <Line
          type="monotone"
          dataKey="light"
          stroke="#2563eb"
          strokeWidth={2.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default SensorChart;
