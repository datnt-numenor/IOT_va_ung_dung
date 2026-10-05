const mqtt = require("mqtt");

let client;

// Three fixed topics; the device is identified by `deviceId` inside the payload.
function getTopics() {
  return {
    sensor: process.env.MQTT_SENSOR_TOPIC || "iot/sensors/data",
    command: process.env.MQTT_COMMAND_TOPIC || "iot/devices/command",
    status: process.env.MQTT_STATUS_TOPIC || "iot/devices/status",
    // ESP32 asks the backend to replay the last known state after (re)connecting.
    sync: process.env.MQTT_SYNC_TOPIC || "iot/devices/sync",
  };
}

function startMqtt({ onSensorData, onDeviceStatus, onSyncRequest }) {
  const brokerUrl = process.env.MQTT_URL;
  if (!brokerUrl) {
    console.warn("MQTT_URL is not configured; MQTT integration is disabled");
    return null;
  }

  client = mqtt.connect(brokerUrl, {
    clientId: process.env.MQTT_CLIENT_ID || `iot-backend-${process.pid}`,
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    reconnectPeriod: 2000,
  });

  client.on("connect", () => {
    const { sensor, status, sync } = getTopics();
    const topics = [sensor, status, sync];
    client.subscribe(topics, (error) => {
      if (error) console.error("MQTT subscribe failed:", error.message);
      else console.log(`MQTT subscribed: ${topics.join(", ")}`);
    });
  });

  client.on("message", async (topic, buffer) => {
    try {
      const payload = JSON.parse(buffer.toString());
      const { sensor, status, sync } = getTopics();
      if (topic === sensor) await onSensorData(payload);
      else if (topic === status) await onDeviceStatus(payload);
      else if (topic === sync) await onSyncRequest(payload);
    } catch (error) {
      console.error(`Rejected MQTT message on ${topic}:`, error.message);
    }
  });

  client.on("error", (error) => console.error("MQTT error:", error.message));
  return client;
}

function publish(topic, payload) {
  return new Promise((resolve, reject) => {
    if (!client?.connected) return reject(new Error("MQTT broker is unavailable"));
    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function closeMqtt() {
  return new Promise((resolve) => {
    if (!client) return resolve();
    client.end(false, {}, resolve);
  });
}

module.exports = { getTopics, startMqtt, publish, closeMqtt };
