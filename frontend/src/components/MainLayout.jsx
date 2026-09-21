import Sidebar from "./Sidebar";

function MainLayout({ children, title, subtitle, showEsp32Status = false }) {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-main">
        <header className="page-header">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          {showEsp32Status && (
            <div className="esp32-status">
              <div className="esp32-status-top">
                <span className="status-dot"></span>
                <strong>ESP32 đã kết nối</strong>
              </div>

              <span>Cập nhật lần cuối: 2 giây trước</span>
            </div>
          )}
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;
