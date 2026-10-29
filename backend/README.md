# IoT Smart Room backend

Backend follows the API and data model in the project report: Express, MySQL,
MQTT (Mosquitto) and Socket.IO.

## Setup

```powershell
Copy-Item .env.example .env
npm.cmd ci
npm.cmd run db:init
npm.cmd run db:seed
npm.cmd run dev
```

For the older three-table prototype already used by this repository, run
`npm.cmd run db:migrate-legacy` instead of `db:init` and `db:seed`. It preserves
the old tables as `*_legacy`, creates the report schema, and copies the data.

The seed creates the three sensors, three devices and demo user ID `1`.
Configure a Mosquitto broker through `MQTT_URL`. If it is omitted, read-only
REST APIs still work, while device control returns `503` because commands
cannot be confirmed by ESP32.

## REST API

- `GET /api/v1/health` (public)
- `POST /api/v1/auth/login` with `{ "username", "password", "remember" }` (public)
  returns `{ token, user }`
- `GET /api/v1/auth/me`
- `GET /api/v1/sensors/realtime`
- `GET /api/v1/sensor-data/chart?from=&to=&limit=20`
- `GET /api/v1/sensor-data?field=&keyword=&page=1&size=10&sort=id,DESC`
- `GET /api/v1/devices/:deviceId/status`
- `POST /api/v1/devices/:deviceId/actions` with `{ "action": "ON" }`
- `GET /api/v1/action-history?time=&deviceId=&action=&status=&page=1&size=10&sort=requestedAt,DESC`

## Authentication

Every API except `/health` and `/auth/login` needs `Authorization: Bearer
<token>`; the Socket.IO handshake needs the same token in `auth.token`. Tokens
are JWTs signed with `JWT_SECRET` (set it to at least 16 random characters, the
backend refuses to start without it) and expire after 8 hours, or 7 days when
the login request sets `remember`. Passwords are stored as bcrypt hashes; a
legacy SHA-256 hash from an older seed is accepted once and upgraded to bcrypt
on that user's first successful login. More than 10 failed logins per IP in 15
minutes returns `429`.

Device actions are recorded for the user in the token (`req.user.id`).

### Authorization (roles)

Each user has a `role` (`admin` or `viewer`, column `users.role`), carried in
the token. `POST /api/v1/devices/:deviceId/actions` is the only write action
and requires the `admin` role: no token returns `401`, a `viewer` returns
`403`. Read-only APIs are open to any signed-in user. Tokens issued before
roles existed are rejected, so users must sign in again.

Existing databases add the column once with `npm.cmd run db:add-user-role`
(the `admin` account becomes admin, new accounts default to viewer). Create
another account with:

```powershell
$env:NEW_USER_PASSWORD = "<password>"; npm.cmd run user:create -- <username> "<Full name>" viewer
```

## Light alert

When the light value is greater than the threshold X (setting
`light_alert_threshold`, default 500, same scale as the displayed light value),
the backend sends `ON` to the warning LED (device 4, `WARN_01`); the firmware
blinks it. The alert ends, with an `OFF` command, once the value drops below 95%
of X. Every start and stop is a normal `action_history` row made by the
`system` account, so it shows up in the Action History filter (device "Đèn cảnh
báo") and the daily count is derived from the `ON` rows.

- `GET /api/v1/alerts/status` returns `{ active, since, value, threshold, deviceId }`
- `GET /api/v1/alerts/stats?days=7` returns the number of alerts per day (Vietnam time)
- `PUT /api/v1/alerts/threshold` with `{ "threshold": 900 }` (admin only)

Socket.IO also emits `alert:update` with the same payload as `/alerts/status`.
Existing databases add the settings table, device 4 and the `system` account
once with `npm.cmd run db:add-alert-feature`.

## Socket.IO

Clients connect with `socket.io-client` to `http://<host>:3000` (the browser
`Origin` must be listed in `FRONTEND_ORIGIN`). The server emits these named
events, each carrying a JSON payload:

- `sensor:update` — new readings after they are stored in MySQL
- `device:update` — `LOADING`, `ON`, `OFF` or `FAILED` for a device action
- `esp32:status` — `{ online, lastSeen, timeoutMs }`

Socket.IO handles the heartbeat and reconnection itself; the frontend only
calls `socket.connect()` and re-fetches the dashboard on every `connect` event.

## MQTT payloads

Sensor data on `iot/sensors/data`:

```json
{"timestamp":"2026-08-15T04:20:30Z","temperature":27.4,"humidity":65,"light":420}
```

Device command on `iot/devices/command` (backend to ESP32; the device is
identified by `deviceId`, so adding a device does not add a topic):

```json
{"actionId":326,"deviceId":1,"action":"ON"}
```

Device response on `iot/devices/status`:

```json
{"actionId":326,"deviceId":1,"status":"ON"}
```

State sync on `iot/devices/sync`: after (re)connecting, the ESP32 publishes
`{"clientId":"ESP32_...","deviceIds":[1,2,3]}`. The backend replays the last
known state of each device on `iot/devices/command` with `"actionId":0` and
`"source":"SYNC"`; the ESP32 answers on `iot/devices/status` with the same
`source`, and the backend ignores that reply (no `action_history` row).

Existing databases created before this change must drop the old topic columns
(`devices.command_topic`, `devices.status_topic`, `sensors.mqtt_topic`) once:
`npm.cmd run db:drop-topic-columns`.

`FAILED` is an action status only, never a device status. Existing databases
must tighten the `devices` check constraint once:
`npm.cmd run db:tighten-device-status`.

Run validation tests with `npm.cmd test`.

## Complete local E2E

When physical ESP32 and Mosquitto are not available, run the deterministic
development stack from this directory:

```powershell
npm.cmd run e2e:start
```

It starts an MQTT-compatible local test broker, the Express/Socket.IO backend,
an ESP32 simulator and Vite. Open `http://127.0.0.1:5173`. Production still
uses Mosquitto through `MQTT_URL`; the test broker is a development dependency.
