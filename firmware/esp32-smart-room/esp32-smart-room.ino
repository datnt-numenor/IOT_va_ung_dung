#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ======================================================
// 1. PHẦN CỨNG
// ======================================================

// Cảm biến
#define DHT_PIN 27
#define DHT_TYPE DHT11
#define LIGHT_PIN 32

// Ba LED mô phỏng ba thiết bị: 1 = đèn phòng, 2 = quạt, 3 = điều hòa.
// Thứ tự trong mảng chính là deviceId - 1.
const uint8_t LED_PINS[] = {23, 22, 21};
const int LED_COUNT = 3;

// Đánh dấu thiết bị nào đã được backend khôi phục trạng thái sau khi kết nối MQTT
bool syncReceived[LED_COUNT] = {false, false, false};

// ======================================================
// 2. WI-FI VÀ MQTT
// ======================================================

// Điền thông tin thật trên máy của bạn. KHÔNG commit mật khẩu thật lên Git.
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_SERVER = "YOUR_MQTT_SERVER";
const int MQTT_PORT = 2912;
const char* MQTT_USERNAME = "YOUR_MQTT_USERNAME";
const char* MQTT_PASSWORD = "YOUR_MQTT_PASSWORD";
const char* MQTT_CLIENT_ID = "ESP32_YOUR_STUDENT_ID";

// ======================================================
// 3. MQTT TOPIC
// ======================================================

// Ba topic cố định; thiết bị được xác định bằng "deviceId" trong payload JSON.
const char* TOPIC_SENSOR = "iot/sensors/data";      // ESP32 -> backend: dữ liệu cảm biến
const char* TOPIC_COMMAND = "iot/devices/command";  // backend -> ESP32: lệnh bật/tắt
const char* TOPIC_STATUS = "iot/devices/status";    // ESP32 -> backend: phản hồi sau khi thực hiện lệnh
// Topic thứ 4: sau khi (kết nối lại) MQTT, ESP32 xin backend gửi lại trạng thái cuối của các thiết bị
const char* TOPIC_SYNC = "iot/devices/sync";

// ======================================================
// 4. KHỞI TẠO ĐỐI TƯỢNG VÀ TIMER
// ======================================================

DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

const unsigned long SENSOR_INTERVAL = 2000;      // gửi dữ liệu cảm biến mỗi 2 giây
const unsigned long SYNC_RETRY_INTERVAL = 5000;  // gửi lại yêu cầu đồng bộ mỗi 5 giây nếu chưa đủ
unsigned long lastSensorPublish = 0;
unsigned long lastSyncRequest = 0;

// ======================================================
// 5. HÀM TIỆN ÍCH
// ======================================================

// Đổi deviceId (1..LED_COUNT) thành số chân GPIO của LED tương ứng.
// Trả về -1 nếu deviceId không hợp lệ, để các hàm khác bỏ qua thay vì bật nhầm chân.
int getLedPin(int deviceId) {
  if (deviceId < 1 || deviceId > LED_COUNT) return -1;
  return LED_PINS[deviceId - 1];
}

// Kiểm tra backend đã gửi lại trạng thái cho đủ tất cả thiết bị hay chưa.
// Trả về true khi mọi phần tử của syncReceived đều đã được đánh dấu.
bool isSyncCompleted() {
  for (int i = 0; i < LED_COUNT; i++) {
    if (!syncReceived[i]) return false;
  }
  return true;
}

// Bật (state = true) hoặc tắt (state = false) LED của thiết bị deviceId và in ra Serial.
// Không làm gì nếu deviceId không hợp lệ.
void setLedState(int deviceId, bool state) {
  int ledPin = getLedPin(deviceId);
  if (ledPin == -1) return;
  digitalWrite(ledPin, state ? HIGH : LOW);
  Serial.print("LED ");
  Serial.print(deviceId);
  Serial.print(": ");
  Serial.println(state ? "ON" : "OFF");
}

// ======================================================
// 6. KẾT NỐI WI-FI
// ======================================================

// Kết nối ESP32 vào Wi-Fi ở chế độ station. Hàm chặn cho đến khi kết nối thành công,
// được gọi lại từ loop() nếu Wi-Fi bị rớt.
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Dang ket noi WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP ESP32: ");
  Serial.println(WiFi.localIP());
}

// ======================================================
// 7. GỬI PHẢN HỒI VÀ YÊU CẦU ĐỒNG BỘ
// ======================================================

// Gửi phản hồi trạng thái thiết bị lên TOPIC_STATUS để backend cập nhật database.
//   actionId : mã hành động backend đã gửi xuống (0 nếu là lệnh SYNC)
//   deviceId : thiết bị vừa được điều khiển
//   status   : "ON", "OFF" hoặc "FAILED"
//   source   : "USER" (người dùng bấm) hoặc "SYNC" (backend khôi phục trạng thái)
void publishLedResponse(long actionId, int deviceId, const char* status, const char* source) {
  JsonDocument response;
  response["actionId"] = actionId;
  response["deviceId"] = deviceId;
  response["status"] = status;
  response["source"] = source;

  char payload[192];
  serializeJson(response, payload, sizeof(payload));
  bool published = mqttClient.publish(TOPIC_STATUS, payload, false);

  Serial.print(published ? "Da phan hoi " : "Phan hoi that bai ");
  Serial.print(TOPIC_STATUS);
  Serial.print(": ");
  Serial.println(payload);
}

// Yêu cầu backend gửi lại trạng thái cuối của tất cả thiết bị.
// Được gọi sau mỗi lần kết nối MQTT và được thử lại trong loop() cho đến khi đủ.
// Chỉ cập nhật lastSyncRequest khi publish thành công.
void requestStateSync() {
  JsonDocument request;
  request["clientId"] = MQTT_CLIENT_ID;
  JsonArray deviceIds = request["deviceIds"].to<JsonArray>();
  for (int id = 1; id <= LED_COUNT; id++) deviceIds.add(id);

  char payload[192];
  serializeJson(request, payload, sizeof(payload));
  if (mqttClient.publish(TOPIC_SYNC, payload, false)) {
    Serial.print("Da gui yeu cau dong bo: ");
    Serial.println(payload);
    lastSyncRequest = millis();
  } else {
    Serial.println("Gui yeu cau dong bo that bai");
  }
}

// ======================================================
// 8. NHẬN LỆNH MQTT
// ======================================================

// Hàm callback của PubSubClient, chạy mỗi khi nhận được tin nhắn trên topic đã subscribe.
// Xử lý lệnh trên TOPIC_COMMAND:
//   1. Parse JSON {actionId, deviceId, action, source}.
//   2. Bỏ qua lệnh sai deviceId/action, hoặc lệnh người dùng thiếu actionId.
//   3. Bật/tắt LED, rồi phản hồi kết quả lên TOPIC_STATUS.
// Lệnh có source = "SYNC" (actionId = 0) là backend khôi phục trạng thái, không phải thao tác của người dùng.
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Nhan tu topic ");
  Serial.print(topic);
  Serial.print(": ");
  for (unsigned int i = 0; i < length; i++) Serial.print((char)payload[i]);
  Serial.println();

  if (strcmp(topic, TOPIC_COMMAND) != 0) return;

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
  const char* source = control["source"] | "USER";
  bool isSyncCommand = strcmp(source, "SYNC") == 0;

  // deviceId sai hoặc thiếu action: bỏ qua, backend cũng sẽ không nhận phản hồi cho thiết bị lạ
  if (getLedPin(deviceId) == -1 || action == nullptr) {
    Serial.println("Thieu hoac sai deviceId/action");
    return;
  }
  // Lệnh người dùng bắt buộc có actionId > 0; lệnh SYNC dùng actionId = 0
  if (!isSyncCommand && actionId <= 0) {
    Serial.println("Lenh nguoi dung thieu actionId");
    return;
  }

  if (strcmp(action, "ON") == 0 || strcmp(action, "OFF") == 0) {
    setLedState(deviceId, strcmp(action, "ON") == 0);
    if (isSyncCommand) syncReceived[deviceId - 1] = true;
    publishLedResponse(actionId, deviceId, action, source);
  } else {
    // Action không phải ON/OFF: báo FAILED để backend không treo ở trạng thái LOADING
    publishLedResponse(actionId, deviceId, "FAILED", source);
    return;
  }

  if (isSyncCommand && isSyncCompleted()) Serial.println("Da khoi phuc xong trang thai cac LED");
}

// ======================================================
// 9. KẾT NỐI MQTT
// ======================================================

// Kết nối tới MQTT broker bằng username/password và subscribe TOPIC_COMMAND.
// Hàm chặn và thử lại mỗi 2 giây cho đến khi thành công. Khi vừa kết nối, xóa cờ syncReceived
// rồi gửi yêu cầu đồng bộ để backend khôi phục trạng thái LED sau khi ESP32 khởi động lại.
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Dang ket noi MQTT...");
    if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println("thanh cong");
      if (mqttClient.subscribe(TOPIC_COMMAND)) {
        for (int i = 0; i < LED_COUNT; i++) syncReceived[i] = false;
        requestStateSync();
      } else {
        Serial.println("Subscribe command topic that bai");
      }
    } else {
      Serial.print("that bai, state = ");
      Serial.println(mqttClient.state());
      delay(2000);
    }
  }
}

// ======================================================
// 10. GỬI DỮ LIỆU CẢM BIẾN
// ======================================================

// Đọc DHT11 (nhiệt độ, độ ẩm) và cảm biến ánh sáng (ADC 12-bit, 0..4095),
// rồi publish JSON lên TOPIC_SENSOR. Được gọi mỗi SENSOR_INTERVAL.
// Nếu DHT11 đọc lỗi thì vẫn gửi giá trị ánh sáng, tránh việc web báo ESP32 offline.
void publishSensorData() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int lightValue = analogRead(LIGHT_PIN);

  JsonDocument data;
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Khong doc duoc DHT11, chi gui anh sang");
  } else {
    data["temperature"] = temperature;
    data["humidity"] = humidity;
  }
  data["light"] = lightValue;

  char payload[192];
  serializeJson(data, payload, sizeof(payload));
  bool published = mqttClient.publish(TOPIC_SENSOR, payload, false);

  Serial.print(published ? "Da publish " : "Publish that bai ");
  Serial.print(TOPIC_SENSOR);
  Serial.print(": ");
  Serial.println(payload);
}

// ======================================================
// 11. SETUP VÀ LOOP
// ======================================================

// Chạy một lần khi khởi động: cấu hình chân LED và tắt hết (trạng thái an toàn trong lúc chờ
// backend khôi phục), khởi động cảm biến, kết nối Wi-Fi rồi MQTT.
void setup() {
  Serial.begin(115200);
  delay(1000);

  for (int id = 1; id <= LED_COUNT; id++) {
    pinMode(getLedPin(id), OUTPUT);
    setLedState(id, false);
  }

  dht.begin();
  analogReadResolution(12);
  analogSetPinAttenuation(LIGHT_PIN, ADC_11db);

  connectWiFi();
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(256);
  mqttClient.setKeepAlive(30);
  connectMQTT();
}

// Chạy lặp liên tục: giữ kết nối Wi-Fi/MQTT, xử lý tin nhắn đến, gửi lại yêu cầu đồng bộ
// nếu backend chưa phản hồi đủ, và gửi dữ liệu cảm biến mỗi 2 giây.
void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();

  if (!isSyncCompleted() && millis() - lastSyncRequest >= SYNC_RETRY_INTERVAL) {
    requestStateSync();
  }

  if (millis() - lastSensorPublish >= SENSOR_INTERVAL) {
    lastSensorPublish = millis();
    publishSensorData();
  }
}
