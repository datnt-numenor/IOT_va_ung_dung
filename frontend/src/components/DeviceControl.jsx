function DeviceControl({ name, status, onToggle, icon }) {
  const isUnknown = !status;
  const isLoading = status === "LOADING";
  const isOn = status === "ON";

  return (
    <div className="device-item">
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

      <button
        // Đang chờ ESP32 phản hồi: nút dùng kiểu "on" (xanh, gạt sang phải); vì bị disabled nên tự nhạt màu.
        className={`toggle-switch ${isOn || isLoading ? "on" : ""}`}
        onClick={onToggle}
        disabled={isLoading || isUnknown}
        aria-busy={isLoading}
        aria-label={`${isOn ? "Tắt" : "Bật"} ${name}`}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  );
}

export default DeviceControl;
