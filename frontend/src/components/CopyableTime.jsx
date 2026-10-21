import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { formatDateTime } from "../utils/dateTime";

const COPIED_FEEDBACK_MS = 1500;

async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Trình duyệt không cho dùng Clipboard API (ví dụ trang http không phải localhost).
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    if (!document.execCommand("copy")) throw new Error("Copy command was rejected");
  } finally {
    document.body.removeChild(area);
  }
}

// Hiển thị thời gian đã định dạng (YYYY-MM-DD HH:mm:ss, giờ Việt Nam) kèm nút sao chép.
// Chuỗi này khớp với định dạng ô tìm kiếm theo thời gian nên có thể dán lại để lọc.
function CopyableTime({ value }) {
  const text = formatDateTime(value);
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!value) return text;

  async function handleCopy() {
    try {
      await writeClipboard(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      setCopied(false);
    }
  }

  return (
    <span className="copyable-time">
      <span>{text}</span>
      <button
        type="button"
        className="copy-button"
        data-copied={copied}
        onClick={handleCopy}
        aria-label={`Sao chép thời gian ${text}`}
        title={copied ? "Đã sao chép" : "Sao chép"}
      >
        {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      </button>
      <span className="visually-hidden" role="status">
        {copied ? "Đã sao chép" : ""}
      </span>
    </span>
  );
}

export default CopyableTime;
