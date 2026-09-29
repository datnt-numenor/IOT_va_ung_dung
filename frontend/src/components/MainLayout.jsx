import { formatChartTime } from "../utils/dateTime";
import Sidebar from "./Sidebar";

function MainLayout({
  children,
  title,
  subtitle,
  esp32Status = null,
  contentClassName = "",
}) {
  const isOnline = Boolean(esp32Status?.online);
  const lastSeen = esp32Status?.lastSeen
    ? formatChartTime(esp32Status.lastSeen)
    : null;

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-main">
        <header className="page-header">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          {esp32Status ? (
            <div
              className={`esp32-status ${isOnline ? "online" : "offline"}`}
              role="status"
              aria-live="polite"
            >
              <div className="esp32-status-top">
                <span className="status-dot" aria-hidden="true" />
                <strong>{isOnline ? "ESP32 đã kết nối" : "ESP32 chưa kết nối"}</strong>
              </div>
              <span>
                {lastSeen ? `Tín hiệu cuối: ${lastSeen}` : "Đang chờ dữ liệu từ thiết bị"}
              </span>
            </div>
          ) : null}
        </header>

        <main className={`page-content ${contentClassName}`.trim()}>{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;
