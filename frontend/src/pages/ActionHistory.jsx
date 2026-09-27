import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import MainLayout from "../components/MainLayout";
import { formatDateTime } from "../utils/dateTime";

const actionLabels = { ON: "BẬT", OFF: "TẮT" };
const sortFields = {
  id: "id", deviceName: "deviceName", performedBy: "performedBy",
  action: "action", status: "status", requestedAt: "requestedAt",
};
const emptyFilters = { time: "", deviceId: "", action: "", status: "" };

function ActionHistory() {
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [sortKey, setSortKey] = useState("requestedAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [data, setData] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({
      page: String(currentPage), size: String(rowsPerPage),
      sort: `${sortFields[sortKey]},${sortDirection}`,
    });
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    apiRequest(`/action-history?${query}`, { signal: controller.signal })
      .then((result) => {
        setData(result.content);
        setTotalElements(result.totalElements);
        setTotalPages(result.totalPages);
        setError("");
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      });
    return () => controller.abort();
  }, [appliedFilters, currentPage, rowsPerPage, sortKey, sortDirection]);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }
  function handleSearch(event) {
    event.preventDefault();
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
  }
  function resetFilters() {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  }
  function handleSort(key) {
    if (sortKey === key) setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDirection("asc"); }
    setCurrentPage(1);
  }
  function getVisiblePages() {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    if (currentPage <= 3) return [1, 2, 3];
    if (currentPage >= totalPages - 2) return [totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 1, currentPage, currentPage + 1];
  }

  const startIndex = totalElements ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * rowsPerPage, totalElements);
  const sortMark = (key) => sortKey === key ? (sortDirection === "asc" ? " ↑" : " ↓") : " ↕";

  return (
    <MainLayout title="Action History" subtitle="Lịch sử điều khiển và phản hồi thiết bị">
      <div className="records-page">
        <section className="panel filter-panel action-filter-panel">
          <h2>Bộ lọc lịch sử thiết bị</h2>
          <form className="search-bar action-search-bar" onSubmit={handleSearch}>
            <input type="text" placeholder="YYYY-MM-DD HH:mm" value={filters.time}
              onChange={(event) => updateFilter("time", event.target.value)} />
            <select value={filters.deviceId} onChange={(event) => updateFilter("deviceId", event.target.value)}>
              <option value="">Tất cả thiết bị</option><option value="1">Đèn phòng</option>
              <option value="2">Quạt thông gió</option><option value="3">Điều hòa</option>
            </select>
            <select value={filters.action} onChange={(event) => updateFilter("action", event.target.value)}>
              <option value="">Action: Tất cả</option><option value="ON">Bật</option><option value="OFF">Tắt</option>
            </select>
            <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
              <option value="">Status: Tất cả</option><option value="ON">ON</option>
              <option value="OFF">OFF</option><option value="LOADING">LOADING</option><option value="FAILED">FAILED</option>
            </select>
            <button type="submit" className="primary-button">Tìm kiếm</button>
            <button type="button" className="secondary-button" onClick={resetFilters}>Đặt lại</button>
          </form>
        </section>

        <section className="panel table-panel action-table-panel">
          <div className="panel-heading"><h2>Lịch sử bật/tắt thiết bị</h2><span>{totalElements} hoạt động · đồng bộ MySQL</span></div>
          {error ? <div className="api-error" role="alert">{error}</div> : null}
          <div className="table-scroll">
            <table className="data-table action-table">
              <thead><tr>
                <th onClick={() => handleSort("id")}>ID{sortMark("id")}</th>
                <th onClick={() => handleSort("deviceName")}>THIẾT BỊ{sortMark("deviceName")}</th>
                <th onClick={() => handleSort("performedBy")}>NGƯỜI THỰC HIỆN{sortMark("performedBy")}</th>
                <th onClick={() => handleSort("action")}>ACTION{sortMark("action")}</th>
                <th onClick={() => handleSort("status")}>STATUS{sortMark("status")}</th>
                <th onClick={() => handleSort("requestedAt")}>THỜI GIAN{sortMark("requestedAt")}</th>
              </tr></thead>
              <tbody>{data.map((item) => <tr key={item.id}>
                <td>#{item.id}</td><td>{item.deviceName}</td><td>{item.performedBy}</td>
                <td className={`action-value ${item.action.toLowerCase()}`}>{actionLabels[item.action] || item.action}</td>
                <td><span className={`status-badge ${item.status.toLowerCase()}`}>{item.status}</span></td>
                <td>{formatDateTime(item.requestedAt)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="table-footer">
            <span className="pagination-info">Hiển thị {startIndex}–{endIndex} trong {totalElements} hoạt động</span>
            <div className="pagination-tools">
              <label className="rows-per-page">Số dòng / trang:
                <select value={rowsPerPage} onChange={(event) => {
                  setRowsPerPage(Number(event.target.value)); setCurrentPage(1);
                }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
              </label>
              <div className="pagination">
                <button onClick={() => setCurrentPage((page) => page - 1)} disabled={currentPage === 1} aria-label="Trang trước">‹</button>
                {totalPages > 5 && currentPage > 3 ? <><button onClick={() => setCurrentPage(1)}>1</button><span>...</span></> : null}
                {getVisiblePages().map((page) => <button key={page} onClick={() => setCurrentPage(page)} className={currentPage === page ? "page-active" : ""}>{page}</button>)}
                {totalPages > 5 && currentPage < totalPages - 2 ? <><span>...</span><button onClick={() => setCurrentPage(totalPages)}>{totalPages}</button></> : null}
                <button onClick={() => setCurrentPage((page) => page + 1)} disabled={currentPage >= totalPages} aria-label="Trang sau">›</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

export default ActionHistory;
