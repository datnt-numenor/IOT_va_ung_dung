#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Sensors
#define DHT_PIN 27
#define DHT_TYPE DHT11
#define LIGHT_SENSOR_PIN 32

// LEDs simulate the three controlled devices shown in the web application.
#define ROOM_LIGHT_PIN 23
#define FAN_LED_PIN 22
#define AC_LED_PIN 21

// Fill these locally. Never commit real credentials.
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_SERVER = "YOUR_MQTT_SERVER";
const int MQTT_PORT = 2912;
const char* MQTT_USERNAME = "YOUR_MQTT_USERNAME";
const char* MQTT_PASSWORD = "YOUR_MQTT_PASSWORD";

const char* TOPIC_SENSOR = "iot/sensors/data";
const char* TOPIC_CONTROL = "iot/devices/+/command";

DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastPublish = 0;
const unsigned long PUBLISH_INTERVAL = 2000;

int getDevicePin(int deviceId) {
  switch (deviceId) {
    case 1: return ROOM_LIGHT_PIN;
    case 2: return FAN_LED_PIN;
    case 3: return AC_LED_PIN;
    default: return -1;
  }
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Dang ket noi WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi da ket noi");
  Serial.print("IP ESP32: ");
  Serial.println(WiFi.localIP());
}

void publishDeviceResponse(int deviceId, long actionId, const char* status) {
  char responseTopic[64];
  snprintf(responseTopic, sizeof(responseTopic), "iot/devices/%d/status", deviceId);

  JsonDocument response;
  response["actionId"] = actionId;
  response["status"] = status;

  char payload[128];
  serializeJson(response, payload, sizeof(payload));
  bool published = mqttClient.publish(responseTopic, payload, false);

  Serial.print(published ? "Da phan hoi " : "Phan hoi that bai ");
  Serial.print(responseTopic);
  Serial.print(": ");
  Serial.println(payload);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Nhan tu topic ");
  Serial.print(topic);
  Serial.print(": ");
  for (unsigned int i = 0; i < length; i++) Serial.print((char)payload[i]);
  Serial.println();

  JsonDocument control;
  DeserializationError error = deserializeJson(control, payload, length);
  if (error) {
    Serial.print("Payload JSON khong hop le: ");
    Serial.println(error.c_str());
    return;
  }

  long actionId = control["actionId"] | 0;
  int deviceId = control["deviceId"] | 0;
  const char* action = control["action"];
  int outputPin = getDevicePin(deviceId);

  if (actionId <= 0 || outputPin < 0 || action == nullptr) {
    Serial.println("Lenh dieu khien thieu hoac khong hop le");
    if (actionId > 0 && deviceId > 0) publishDeviceResponse(deviceId, actionId, "FAILED");
    return;
  }

  if (strcmp(action, "ON") == 0) {
    digitalWrite(outputPin, HIGH);
    publishDeviceResponse(deviceId, actionId, "ON");
  } else if (strcmp(action, "OFF") == 0) {
    digitalWrite(outputPin, LOW);
    publishDeviceResponse(deviceId, actionId, "OFF");
  } else {
    publishDeviceResponse(deviceId, actionId, "FAILED");
  }
}

void connectMQTT() {
  while (!mqttClient.connected()) {
    String clientId = "ESP32-B23DCCN139-";
    clientId += WiFi.macAddress();
    Serial.print("Dang ket noi MQTT...");
    bool connected = mqttClient.connect(
      clientId.c_str(),
      MQTT_USERNAME,
      MQTT_PASSWORD
    );

    if (connected) {
      Serial.println("thanh cong");
      mqttClient.subscribe(TOPIC_CONTROL);
      Serial.print("Da subscribe: ");
      Serial.println(TOPIC_CONTROL);
    } else {
      Serial.print("that bai, state = ");
      Serial.println(mqttClient.state());
      delay(2000);
    }
  }
}

void publishSensorData() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int lightValue = analogRead(LIGHT_SENSOR_PIN);

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Khong doc duoc DHT11");
    return;
  }

  JsonDocument data;
  data["temperature"] = temperature;
  data["humidity"] = humidity;
  data["light"] = lightValue;

  char payload[192];
  serializeJson(data, payload, sizeof(payload));
  bool published = mqttClient.publish(TOPIC_SENSOR, payload, false);

  Serial.print(published ? "Da publish " : "Publish that bai ");
  Serial.print(TOPIC_SENSOR);
  Serial.print(": ");
  Serial.println(payload);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(ROOM_LIGHT_PIN, OUTPUT);
  pinMode(FAN_LED_PIN, OUTPUT);
  pinMode(AC_LED_PIN, OUTPUT);
  digitalWrite(ROOM_LIGHT_PIN, LOW);
  digitalWrite(FAN_LED_PIN, LOW);
  digitalWrite(AC_LED_PIN, LOW);

  dht.begin();
  analogReadResolution(12);
  analogSetPinAttenuation(LIGHT_SENSOR_PIN, ADC_11db);

  connectWiFi();
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(256);
  connectMQTT();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();

  if (millis() - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = millis();
    publishSensorData();
  }
}
