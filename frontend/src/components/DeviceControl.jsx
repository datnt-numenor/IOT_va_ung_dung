// `lockedReason`: thiết bị không điều khiển tay được (ví dụ LED cảnh báo tự chạy theo ngưỡng).
// `variant="warning"` đổi màu biểu tượng; `alerting` làm biểu tượng nhấp nháy khi đang cảnh báo.
function DeviceControl({
  name,
  status,
  onToggle,
  icon,
  readOnly = false,
  lockedReason = "",
  variant = "",
  alerting = false,
}) {
  const isUnknown = !status;
  const isLoading = status === "LOADING";
  const isOn = status === "ON";
  const locked = readOnly || Boolean(lockedReason);

  return (
    <div className={`device-item ${variant} ${alerting ? "alerting" : ""}`.trim()}>
      <div className="device-left">
        <div className="device-icon">{icon}</div>

        <div>
          <h3>{name}</h3>

          <div className="device-status-row">
            <span className={`device-status ${(status || "unknown").toLowerCase()}`}>
              {status || "—"}
            </span>

            {isLoading && <span className="loading-dot">◌</span>}
          </div>
        </div>
      </div>

      {lockedReason ? (
        // Thiết bị không điều khiển tay được (đèn cảnh báo): không có công tắc, chỉ hiện nhãn "Tự động".
        <span className="device-auto-badge" title={lockedReason}>
          Tự động
        </span>
      ) : (
        <button
          // Đang chờ ESP32 phản hồi: nút dùng kiểu "on" (xanh, gạt sang phải); vì bị disabled nên tự nhạt màu.
          className={`toggle-switch ${isOn || isLoading ? "on" : ""}`}
          onClick={onToggle}
          disabled={isLoading || isUnknown || locked}
          title={readOnly ? "Bạn không có quyền điều khiển thiết bị" : undefined}
          aria-busy={isLoading}
          aria-label={`${isOn ? "Tắt" : "Bật"} ${name}`}
        >
          <span className="toggle-thumb" />
        </button>
      )}
    </div>
  );
}

export default DeviceControl;
