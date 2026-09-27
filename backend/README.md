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

- `GET /api/v1/health`
- `GET /api/v1/sensors/realtime`
- `GET /api/v1/sensor-data/chart?from=&to=&limit=20`
- `GET /api/v1/sensor-data?field=&keyword=&page=1&size=10&sort=id,DESC`
- `GET /api/v1/devices/:deviceId/status`
- `POST /api/v1/devices/:deviceId/actions` with `{ "action": "ON" }`
- `GET /api/v1/action-history?time=&deviceId=&action=&status=&page=1&size=10&sort=requestedAt,DESC`

Device actions use `DEFAULT_USER_ID`, or the numeric `x-user-id` header when
authentication is added. Socket.IO emits `sensor:update` and `device:update`.

## MQTT payloads

Sensor data on `iot/sensors/data`:

```json
{"timestamp":"2026-08-15T04:20:30Z","temperature":27.4,"humidity":65,"light":420}
```

Device response on `iot/devices/{deviceId}/status`:

```json
{"actionId":326,"status":"ON"}
```

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
