import { useState } from "react";
import { apiRequest } from "../api/client";

// Cài ngưỡng X của cảnh báo ánh sáng: giá trị ánh sáng > X thì LED cảnh báo nhấp nháy.
// Component được dùng kèm key={threshold} nên ô nhập tự đặt lại khi ngưỡng đổi từ nơi khác.
function AlertSettings({ alert, canEdit, onSaved }) {
  const [draft, setDraft] = useState(String(alert.threshold ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const threshold = Number(draft);
    if (draft.trim() === "" || !Number.isFinite(threshold)) {
      setError("Nhập một số hợp lệ");
      return;
    }
    setSaving(true);
    setError("");
    try {
      onSaved(
        await apiRequest("/alerts/threshold", {
          method: "PUT",
          body: JSON.stringify({ threshold }),
        }),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="alert-settings" onSubmit={handleSubmit}>
      <div className="alert-settings-header">
        <h3>Cảnh báo ánh sáng</h3>
      </div>
      <p className="alert-settings-hint">
        LED cảnh báo nhấp nháy khi ánh sáng lớn hơn ngưỡng X.
      </p>
      <div className="alert-settings-row">
        <label htmlFor="alert-threshold">Ngưỡng X</label>
        <input
          id="alert-threshold"
          type="number"
          min="0"
          max="1365"
          step="any"
          value={draft}
          disabled={!canEdit || saving}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" disabled={!canEdit || saving}>
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
      {!canEdit ? (
        <p className="alert-settings-hint">Chỉ admin được đổi ngưỡng.</p>
      ) : null}
      {error ? (
        <p className="alert-settings-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export default AlertSettings;
