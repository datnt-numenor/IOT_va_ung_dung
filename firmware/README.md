# ESP32 Smart Room firmware

Open `esp32-smart-room/esp32-smart-room.ino` in Arduino IDE and fill the local
Wi-Fi/MQTT credentials before uploading. Never commit real credentials.

## Wiring

| Function | ESP32 pin |
| --- | --- |
| DHT11 data | GPIO27 |
| Light sensor analog output | GPIO32 |
| Room-light simulation LED | GPIO23 |
| Fan simulation LED | GPIO22 |
| Air-conditioner simulation LED | GPIO21 |

Connect each LED through a 220–330 ohm resistor and use a shared GND.

The firmware publishes sensor readings to `iot/sensors/data`, subscribes to
`iot/devices/command` and acknowledges each command on `iot/devices/status`.
The device is identified by `deviceId` in the payload, so the topics stay the
same when devices are added.

After every MQTT (re)connect the ESP32 publishes `{"clientId","deviceIds"}` on
`iot/devices/sync` (retrying every 5 s until all devices are restored). The
backend replays each device's last known state as a command with
`"actionId":0` and `"source":"SYNC"`.

The `light` field is reported on a **0–1365 "lux" scale**. The firmware reads
the 12-bit value from `analogRead(GPIO32)` and divides it by 3 in `adcToLux()`:
`lux = ADC / 3`. The photoresistor module used here returns a higher ADC value
when the room is darker, so the number is **large in the dark and small in the
light**. This is a relative index, not a calibrated measurement from a light
meter (real lux grows with brightness); the unit label is kept as `lux` for
display only.

When the constants change, update `backend/scripts/convertLightToLux.js` too,
so that stored history uses the same conversion.
