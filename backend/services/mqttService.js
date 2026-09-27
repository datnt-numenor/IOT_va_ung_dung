const mqtt = require("mqtt");

let client;

function startMqtt({ onSensorData, onDeviceStatus }) {
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
    const topics = [
      process.env.MQTT_SENSOR_TOPIC || "iot/sensors/data",
      "iot/devices/+/status",
    ];
    client.subscribe(topics, (error) => {
      if (error) console.error("MQTT subscribe failed:", error.message);
      else console.log(`MQTT subscribed: ${topics.join(", ")}`);
    });
  });

  client.on("message", async (topic, buffer) => {
    try {
      const payload = JSON.parse(buffer.toString());
      const sensorTopic = process.env.MQTT_SENSOR_TOPIC || "iot/sensors/data";
      if (topic === sensorTopic) await onSensorData(payload);
      else {
        const match = topic.match(/^iot\/devices\/(\d+)\/status$/);
        if (match) await onDeviceStatus(Number(match[1]), payload);
      }
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

module.exports = { startMqtt, publish, closeMqtt };
