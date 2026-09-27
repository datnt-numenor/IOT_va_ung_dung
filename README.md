# IoT Smart Room

Hệ thống giám sát dữ liệu cảm biến và điều khiển thiết bị cho phòng học thông minh.

## Cấu trúc dự án

```text
iot-smart-room/
├── frontend/   # React + Vite
└── backend/    # Node.js + Express + MySQL
```

Frontend và backend là hai ứng dụng npm độc lập. Hãy chạy lệnh trong đúng thư mục tương ứng.

## Yêu cầu

- Node.js và npm
- MySQL cho các API backend sử dụng cơ sở dữ liệu

## Chạy frontend

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Frontend mặc định chạy tại `http://localhost:5173`.

Tài khoản demo hiện tại:

- Tên đăng nhập: `admin`
- Mật khẩu: `123456`

## Chạy backend

Tạo file môi trường cục bộ từ file mẫu:

```powershell
cd backend
Copy-Item .env.example .env
```

Cập nhật thông tin kết nối MySQL trong `.env`, sau đó cài dependency và chạy server:

```powershell
npm.cmd ci
npm.cmd run dev
```

Backend mặc định chạy tại `http://localhost:3000`. Khởi tạo database bằng
`npm.cmd run db:init` và `npm.cmd run db:seed`; với database thử nghiệm cũ của
dự án, dùng `npm.cmd run db:migrate-legacy` để giữ lại dữ liệu trong các bảng
`*_legacy`. API chính dùng prefix `/api/v1`:

- `/api/v1/sensors/realtime`
- `/api/v1/sensor-data` và `/api/v1/sensor-data/chart`
- `/api/v1/devices/:deviceId/status` và `/api/v1/devices/:deviceId/actions`
- `/api/v1/action-history`

Chi tiết payload MQTT, WebSocket và query API nằm trong `backend/README.md`.

Để chạy trọn luồng local khi chưa có ESP32/Mosquitto thật:

```powershell
cd backend
npm.cmd run e2e:start
```

Lệnh này khởi động broker kiểm thử, backend, ESP32 simulator và frontend tại
`http://127.0.0.1:5173`.

## Kiểm tra frontend

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
```

Không commit các thư mục `node_modules`, `dist` hoặc file `.env`. Chỉ sử dụng `.env.example` để mô tả các biến môi trường cần thiết.
