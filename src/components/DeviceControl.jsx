function DeviceControl({ name, status, onToggle, icon }) {
  const isLoading = status === "LOADING";
  const isOn = status === "ON";

  return (
    <div className="device-item">
      <div className="device-left">
        <div className="device-icon">{icon}</div>

        <div>
          <h3>{name}</h3>

          <div className="device-status-row">
            <span className={`device-status ${status.toLowerCase()}`}>
              {status}
            </span>

            {isLoading && <span className="loading-dot">◌</span>}
          </div>
        </div>
      </div>

      <button
        className={`toggle-switch ${isOn ? "on" : ""}`}
        onClick={onToggle}
        disabled={isLoading}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  );
}

export default DeviceControl;
