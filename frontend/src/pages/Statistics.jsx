import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/useAuth";
import AlertSettings from "../components/AlertSettings";
import AlertStats from "../components/AlertStats";
import MainLayout from "../components/MainLayout";

const REFRESH_MS = 10000;

function Statistics() {
  // Chỉ admin được đổi ngưỡng X; backend vẫn kiểm tra lại bằng 403.
  const { user } = useAuth();
  const canEdit = user?.role === "admin";
  const [alert, setAlert] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Lấy ngưỡng và trạng thái cảnh báo hiện tại, làm mới định kỳ để nhãn "Đang cảnh báo / Bình thường" không cũ.
  useEffect(() => {
    function load() {
      apiRequest("/alerts/status")
        .then((status) => {
          setAlert(status);
          setError("");
        })
        .catch((requestError) => setError(requestError.message));
    }
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  // Thông báo lưu thành công đặt ở trang (không đặt trong form) vì form được key={threshold} nên bị tạo lại khi ngưỡng đổi.
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  function handleSaved(status) {
    setAlert(status);
    setNotice(`Đã lưu ngưỡng X = ${status.threshold}`);
  }

  return (
    <MainLayout
      title="Thống kê"
      subtitle="Số lần cảnh báo ánh sáng theo ngày"
      contentClassName="statistics-content fit-content"
    >
      {error ? (
        <div className="api-error" role="alert">
          {error}
        </div>
      ) : null}
      {alert ? (
        <AlertSettings
          key={alert.threshold}
          alert={alert}
          canEdit={canEdit}
          onSaved={handleSaved}
        />
      ) : null}
      {notice ? (
        <div className="alert-toast" role="status">
          {notice}
        </div>
      ) : null}
      <AlertStats />
    </MainLayout>
  );
}

export default Statistics;
