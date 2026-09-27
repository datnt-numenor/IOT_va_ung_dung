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
`iot/devices/+/command`, and acknowledges each command on the matching
`iot/devices/{id}/status` topic.

The `light` field is the raw 12-bit value returned by `analogRead(GPIO32)`, so
its unit is `ADC` and its nominal range is `0` to `4095`. It is not a lux value;
converting it to lux requires calibration against a reference light meter and
the electrical characteristics of the photoresistor circuit.
