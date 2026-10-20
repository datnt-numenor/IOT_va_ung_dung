require("dotenv").config();

const mysql = require("mysql2/promise");

// Giá trị ánh sáng được lưu theo công thức của firmware (adcToLux): lux = ADC / LUX_DIVISOR (0–1365).
// Hằng số phải khớp với firmware. Đây là chỉ số tương đối đặt tên lux, không phải lux đo bằng lux kế.
const ADC_MAX = 4095;
const LUX_DIVISOR = 3;
const LUX_MAX = ADC_MAX / LUX_DIVISOR;
// Thang trung gian 0–3000 đã dùng trước đây: lux = (ADC_MAX - ADC) / ADC_MAX * 3000 (đảo chiều).
const OLD_SCALE_MAX = 3000;

// Chạy MỘT lần, khi ESP32 và backend đã dừng. Có hai chế độ:
//   --from=adc          dữ liệu đang là ADC thô (sensors.unit = 'ADC')      -> lux = ADC / 3
//   --from=scale3000    dữ liệu đang ở thang 0–3000 đảo chiều (unit = 'lux') -> lux = ADC / 3
// Trước khi sửa, script sao lưu các bản ghi ánh sáng sang bảng sensor_data_light_backup_<mốc thời gian>.
async function main() {
  const mode = (process.argv.find((arg) => arg.startsWith("--from=")) || "--from=adc").slice("--from=".length);
  if (!["adc", "scale3000"].includes(mode)) throw new Error("Use --from=adc or --from=scale3000");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [[sensor]] = await connection.execute("SELECT id, unit FROM sensors WHERE type = 'light'");
    if (!sensor) throw new Error("Light sensor metadata was not found");
    const [[range]] = await connection.execute(
      "SELECT MIN(value) AS min, MAX(value) AS max, COUNT(*) AS total FROM sensor_data WHERE sensor_id = ?",
      [sensor.id],
    );

    // Hai chốt chặn để không quy đổi hai lần.
    if (mode === "adc" && sensor.unit !== "ADC") {
      throw new Error(`Light unit is '${sensor.unit}', not 'ADC'; refusing to convert from raw ADC`);
    }
    if (mode === "scale3000" && (sensor.unit !== "lux" || Number(range.max) <= LUX_MAX)) {
      throw new Error(
        `Refusing to rescale: expected unit 'lux' with values above ${LUX_MAX} (found '${sensor.unit}', max ${range.max})`,
      );
    }

    const backup = `sensor_data_light_backup_${Date.now()}`;
    await connection.query(`CREATE TABLE \`${backup}\` AS SELECT * FROM sensor_data WHERE sensor_id = ?`, [sensor.id]);
    console.log(`Backed up ${range.total} light reading(s) to ${backup}`);

    await connection.beginTransaction();
    // ADC thô -> ADC / 3; thang 0–3000 -> ADC = ADC_MAX - value * ADC_MAX / 3000 -> ADC / 3.
    const expression =
      mode === "adc"
        ? "ROUND(GREATEST(0, LEAST(?, value)) / ?, 2)"
        : "ROUND((? - GREATEST(0, LEAST(?, value)) * ? / ?) / ?, 2)";
    const params =
      mode === "adc"
        ? [ADC_MAX, LUX_DIVISOR, sensor.id]
        : [ADC_MAX, OLD_SCALE_MAX, ADC_MAX, OLD_SCALE_MAX, LUX_DIVISOR, sensor.id];
    const [result] = await connection.query(
      `UPDATE sensor_data SET value = ${expression} WHERE sensor_id = ?`,
      params,
    );
    await connection.execute("UPDATE sensors SET unit = 'lux' WHERE id = ?", [sensor.id]);
    await connection.commit();

    console.log(`Converted ${result.affectedRows} light reading(s) to the ADC / ${LUX_DIVISOR} scale`);
    const [[after]] = await connection.execute(
      "SELECT MIN(value) AS min, MAX(value) AS max FROM sensor_data WHERE sensor_id = ?",
      [sensor.id],
    );
    console.table([after]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
