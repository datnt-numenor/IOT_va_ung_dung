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

Backend mặc định chạy tại `http://localhost:3000` với các nhóm endpoint:

- `/api/devices`
- `/api/sensors`
- `/api/action-history`

## Kiểm tra frontend

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
```

Không commit các thư mục `node_modules`, `dist` hoặc file `.env`. Chỉ sử dụng `.env.example` để mô tả các biến môi trường cần thiết.
