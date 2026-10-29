// Giới hạn hợp lý cho các cảm biến đã biết; loại cảm biến không có trong danh sách này được chấp nhận nguyên trạng.
// Ánh sáng là ADC / 3 nên tối đa 4095 / 3 = 1365.
const VALUE_RANGES = { temperature: [-40, 80], humidity: [0, 100], light: [0, 1365] };

module.exports = { VALUE_RANGES };
