import { useEffect, useState } from "react";

// Chiều cao một dòng dữ liệu và dòng tiêu đề của .data-table (khớp CSS ở .fit-content), gồm cả khoảng cách giữa các dòng.
export const TABLE_ROW_HEIGHT = 40;
export const TABLE_HEADER_HEIGHT = 42;
const MIN_ROWS = 3;

// Tính số dòng vừa khít khung chứa bảng để trang không phải cuộn; cập nhật khi cửa sổ đổi kích thước.
// Trả về null cho tới khi đo được lần đầu để trang không tải dữ liệu hai lần.
export function useFitRows(containerRef) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const update = () => {
      const available = element.clientHeight - TABLE_HEADER_HEIGHT;
      setRows(Math.max(MIN_ROWS, Math.floor(available / TABLE_ROW_HEIGHT)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  return rows;
}
