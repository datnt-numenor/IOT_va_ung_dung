import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiRequest } from "../api/client";

const RANGES = [7, 14, 30];
const REFRESH_MS = 10000;
const ALERT_COLOR = "#ef4444";
const TODAY_COLOR = "#b91c1c";

function formatDay(date) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

// Thống kê số lần cảnh báo ánh sáng mỗi ngày (theo ngày, không theo tháng): biểu đồ cột + tổng.
// Số lần = số lần LED cảnh báo được bật trong ngày (giờ Việt Nam), lấy từ lịch sử bật tắt.
function AlertStats() {
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    apiRequest(`/alerts/stats?days=${days}`)
      .then((result) => {
        setStats(result);
        setError("");
      })
      .catch((requestError) => setError(requestError.message));
  }, [days]);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const items = stats?.days ?? [];
  const today = items.at(-1);
  const chartData = items.map((item) => ({
    ...item,
    label: item.date === today?.date ? "Hôm nay" : formatDay(item.date),
  }));

  return (
    <section className="panel alert-stats-panel">
      <div className="panel-heading">
        <h2>Thống kê cảnh báo ánh sáng theo ngày</h2>
        <span className="alert-stats-tools">
          <label htmlFor="alert-stats-range">Khoảng thời gian</label>
          <select
            id="alert-stats-range"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            {RANGES.map((range) => (
              <option key={range} value={range}>
                {range} ngày
              </option>
            ))}
          </select>
        </span>
      </div>

      {error ? (
        <div className="api-error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="alert-stats-summary">
        <div>
          <span>Hôm nay</span>
          <strong>{today?.total ?? "—"}</strong>
        </div>
        <div>
          <span>Tổng {days} ngày</span>
          <strong>{stats?.total ?? "—"}</strong>
        </div>
        <div>
          <span>Trung bình / ngày</span>
          <strong>{stats ? (stats.total / days).toFixed(1) : "—"}</strong>
        </div>
      </div>

      <div className="alert-stats-chart" aria-label="Biểu đồ số lần cảnh báo mỗi ngày">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
              tick={{ fontSize: 11, fontWeight: 600, fill: "#475569" }}
              tickLine={false}
              axisLine={{ stroke: "#94a3b8" }}
            />
            <YAxis
              // Trục cột tối thiểu 0–100; nếu một ngày có hơn 100 lần cảnh báo thì trục tự nới ra để cột không bị cắt.
              domain={[0, (dataMax) => Math.max(100, dataMax)]}
              allowDecimals={false}
              tick={{ fontSize: 11, fontWeight: 600, fill: "#475569" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "#f1f5f9" }}
              formatter={(value) => [`${value} lần`, "Cảnh báo"]}
              labelFormatter={(label) => `Ngày: ${label}`}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}>
              {chartData.map((item) => (
                <Cell key={item.date} fill={item.date === today?.date ? TODAY_COLOR : ALERT_COLOR} />
              ))}
              <LabelList dataKey="total" position="top" fontSize={11} fontWeight={700} fill="#131b29" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default AlertStats;
