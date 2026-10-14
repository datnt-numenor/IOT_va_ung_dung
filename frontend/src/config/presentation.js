import {
  Droplets,
  Fan,
  Gauge,
  Lightbulb,
  Plug,
  Snowflake,
  Sun,
  Thermometer,
} from "lucide-react";

export const CHART_POINTS = 20;

const sensorStyles = {
  temperature: { icon: Thermometer, color: "#f97316" },
  humidity: { icon: Droplets, color: "#06b6d4" },
  // `axis` chọn trục Y trên biểu đồ chung; mặc định là trục trái.
  light: { icon: Sun, color: "#2563eb", axis: "right" },
};
const fallbackSensorStyle = { icon: Gauge, color: "#8b5cf6" };

const deviceIcons = { light: Lightbulb, fan: Fan, air_conditioner: Snowflake };

export function getSensorStyle(type) {
  return sensorStyles[type] || fallbackSensorStyle;
}

export function getDeviceIcon(type) {
  return deviceIcons[type] || Plug;
}
