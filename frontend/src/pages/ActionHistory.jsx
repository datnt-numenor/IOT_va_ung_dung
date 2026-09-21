import { useState } from "react";

import MainLayout from "../components/MainLayout";
import actionHistory from "../data/actionHistory";

const deviceLabels = { Light: "Đèn phòng", Fan: "Quạt thông gió", AC: "Điều hòa" };
const actionLabels = { ON: "BẬT", OFF: "TẮT" };

function ActionHistory() {
  const [filters, setFilters] = useState({
    time: "",
    device: "",
    action: "",
    status: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    time: "",
    device: "",
    action: "",
    status: "",
  });

  const [sortKey, setSortKey] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const filteredData = actionHistory.filter((item) => {
    const time = appliedFilters.time.trim().toLowerCase();

    return (
      (!time || item.time.toLowerCase().includes(time)) &&
      (!appliedFilters.device || item.device === appliedFilters.device) &&
      (!appliedFilters.action || item.action === appliedFilters.action) &&
      (!appliedFilters.status || item.status === appliedFilters.status)
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let aValue = a[sortKey];
    let bValue = b[sortKey];

    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1;
    }

    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1;
    }

    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const startIndex = (currentPage - 1) * rowsPerPage;

  const endIndex = startIndex + rowsPerPage;

  const paginatedData = sortedData.slice(startIndex, endIndex);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  function updateFilter(field, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
  }

  function handleSearch(event) {
    event.preventDefault();
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
  }

  function resetFilters() {
    const emptyFilters = { time: "", device: "", action: "", status: "" };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  }

  function getVisiblePages() {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  }

  const sortMark = (key) => (sortKey === key ? (sortDirection === "asc" ? " ↑" : " ↓") : " ↕");

  return (
    <MainLayout
      title="Action History"
      subtitle="Lịch sử điều khiển và phản hồi thiết bị"
    >
      <section className="panel filter-panel action-filter-panel">
        <h2>Bộ lọc lịch sử thiết bị</h2>

        <form className="search-bar action-search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="YYYY-MM-DD HH:mm"
            value={filters.time}
            onChange={(event) => updateFilter("time", event.target.value)}
          />

          <select value={filters.device} onChange={(event) => updateFilter("device", event.target.value)}>
            <option value="">Tất cả thiết bị</option>
            <option value="Light">Đèn phòng</option>
            <option value="Fan">Quạt thông gió</option>
            <option value="AC">Điều hòa</option>
          </select>

          <select value={filters.action} onChange={(event) => updateFilter("action", event.target.value)}>
            <option value="">Action: Tất cả</option>
            <option value="ON">Bật</option>
            <option value="OFF">Tắt</option>
          </select>

          <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
            <option value="">Status: Tất cả</option>
            <option value="ON">ON</option>
            <option value="OFF">OFF</option>
            <option value="LOADING">LOADING</option>
            <option value="FAILED">FAILED</option>
          </select>

          <button type="submit" className="primary-button">Tìm kiếm</button>
          <button type="button" className="secondary-button" onClick={resetFilters}>Đặt lại</button>
        </form>

        <p className="filter-hint">
          Action = yêu cầu của người dùng · Status = phản hồi thực tế từ ESP32.
        </p>
      </section>

      <section className="panel table-panel action-table-panel">
        <div className="panel-heading">
          <h2>Lịch sử bật/tắt thiết bị</h2>
          <span>{sortedData.length} hoạt động · đồng bộ MQTT</span>
        </div>

        <div className="table-scroll">
          <table className="data-table action-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("id")}>ID{sortMark("id")}</th>
                <th onClick={() => handleSort("device")}>THIẾT BỊ{sortMark("device")}</th>
                <th>NGƯỜI THỰC HIỆN</th>
                <th onClick={() => handleSort("action")}>ACTION{sortMark("action")}</th>
                <th onClick={() => handleSort("status")}>STATUS{sortMark("status")}</th>
                <th onClick={() => handleSort("time")}>THỜI GIAN{sortMark("time")}</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>{deviceLabels[item.device] || item.device}</td>
                  <td>Nguyễn Tiến Đạt</td>
                  <td className={`action-value ${item.action.toLowerCase()}`}>{actionLabels[item.action] || item.action}</td>
                  <td><span className={`status-badge ${item.status.toLowerCase()}`}>{item.status}</span></td>
                  <td>{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span className="pagination-info">
            Hiển thị {sortedData.length ? startIndex + 1 : 0}–{Math.min(endIndex, sortedData.length)} trong {sortedData.length} hoạt động
          </span>

          <div className="pagination-tools">
            <label className="rows-per-page">
              Số dòng / trang:
              <select value={rowsPerPage} onChange={(event) => { setRowsPerPage(Number(event.target.value)); setCurrentPage(1); }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </label>

            <div className="pagination">
              <button onClick={() => setCurrentPage((prev) => prev - 1)} disabled={currentPage === 1} aria-label="Trang trước">‹</button>
              {getVisiblePages().map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={currentPage === page ? "page-active" : ""}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage((prev) => prev + 1)} disabled={currentPage >= totalPages} aria-label="Trang sau">›</button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

export default ActionHistory;
