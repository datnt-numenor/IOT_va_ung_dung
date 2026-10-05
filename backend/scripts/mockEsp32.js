const mqtt = require("mqtt");

const brokerUrl = process.env.MQTT_URL || "mqtt://127.0.0.1:1883";
const client = mqtt.connect(brokerUrl, { clientId: `mock-esp32-${process.pid}` });
const deviceStatus = new Map([[1, "OFF"], [2, "OFF"], [3, "OFF"]]);
const TOPIC_COMMAND = process.env.MQTT_COMMAND_TOPIC || "iot/devices/command";
const TOPIC_STATUS = process.env.MQTT_STATUS_TOPIC || "iot/devices/status";
const TOPIC_SYNC = process.env.MQTT_SYNC_TOPIC || "iot/devices/sync";
let sample = 0;

function publishSensors() {
  sample += 1;
  client.publish("iot/sensors/data", JSON.stringify({
    timestamp: new Date().toISOString(),
    temperature: 26 + (sample % 7) * 0.4,
    humidity: 58 + (sample % 9),
    light: 360 + (sample % 8) * 25,
  }), { qos: 1 });
}

client.on("connect", () => {
  console.log(`Mock ESP32 connected to ${brokerUrl}`);
  client.subscribe(TOPIC_COMMAND);
  // Like the real firmware: ask the backend to replay the last known device states.
  client.publish(TOPIC_SYNC, JSON.stringify({
    clientId: "mock-esp32",
    deviceIds: [...deviceStatus.keys()],
  }), { qos: 1 });
  publishSensors();
});

client.on("message", (topic, buffer) => {
  if (topic !== TOPIC_COMMAND) return;
  try {
    const command = JSON.parse(buffer.toString());
    const deviceId = Number(command.deviceId);
    if (!deviceStatus.has(deviceId) || !["ON", "OFF"].includes(command.action)) return;
    setTimeout(() => {
      deviceStatus.set(deviceId, command.action);
      client.publish(TOPIC_STATUS, JSON.stringify({
        actionId: command.actionId,
        deviceId,
        status: command.action,
        source: command.source || "USER",
      }), { qos: 1 });
      console.log(`Device ${deviceId} acknowledged ${command.action}`);
    }, 300);
  } catch (error) {
    console.error("Invalid command:", error.message);
  }
});

const timer = setInterval(publishSensors, Number(process.env.SENSOR_INTERVAL_MS || 2000));

function shutdown() {
  clearInterval(timer);
  client.end(false, {}, () => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
