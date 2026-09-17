import { useState } from "react";
import MainLayout from "../components/MainLayout";
import sensorData from "../data/sensorData";

const sensorLabels = {
  Temperature: "Nhiệt độ",
  Humidity: "Độ ẩm",
  Light: "Ánh sáng",
};

const sensorByField = {
  temperature: "Temperature",
  humidity: "Humidity",
  light: "Light",
};

function DataSensor() {
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedSearchField, setAppliedSearchField] = useState("all");
  const [searchMode, setSearchMode] = useState("all");

  const [sortKey, setSortKey] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredData = sensorData.filter((item) => {
    const keyword = appliedSearch.trim().toLowerCase();

    if (appliedSearchField === "all") {
      if (!keyword) {
        return true;
      }

      return (
        item.sensor.toLowerCase().includes(keyword) ||
        (sensorLabels[item.sensor] || "").toLowerCase().includes(keyword) ||
        String(item.value).includes(keyword) ||
        item.unit.toLowerCase().includes(keyword) ||
        item.time.toLowerCase().includes(keyword)
      );
    }

    if (appliedSearchField === "time") {
      return !keyword || item.time.toLowerCase().includes(keyword);
    }

    if (sensorByField[appliedSearchField]) {
      return item.sensor === sensorByField[appliedSearchField];
    }

    return true;
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

  function handleSearch(event) {
    event.preventDefault();

    const keyword = search.trim();

    if (searchMode === "field" && searchField !== "all") {
      setAppliedSearch("");
      setAppliedSearchField(searchField);
      setSearch("");
    } else if (keyword) {
      setAppliedSearch(keyword);
      setAppliedSearchField("all");
      setSearchField("all");
      setSearchMode("keyword");
    } else {
      setAppliedSearch("");
      setAppliedSearchField("all");
      setSearchField("all");
      setSearchMode("all");
    }

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
      title="Data Sensor"
      subtitle="Tra cứu lịch sử giá trị theo từng loại cảm biến"
    >
      <section className="panel filter-panel sensor-filter-panel">
        <h2>Tìm kiếm và lọc dữ liệu</h2>

        <form className="search-bar sensor-search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder={searchField === "time" ? "YYYY-MM-DD HH:mm:ss" : "Nhập giá trị cần tìm..."}
            value={search}
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              setSearchMode(value.trim() ? "keyword" : searchField === "all" ? "all" : "field");
            }}
          />

          <select
            value={searchField}
            onChange={(event) => {
              const value = event.target.value;
              setSearchField(value);
              setSearchMode(value === "all" ? (search.trim() ? "keyword" : "all") : "field");
            }}
          >
            <option value="all">Tất cả</option>
            <option value="time">Thời gian</option>
            <option value="temperature">Nhiệt độ</option>
            <option value="humidity">Độ ẩm</option>
            <option value="light">Ánh sáng</option>
          </select>

          <button type="submit" className="primary-button">
            Tìm kiếm
          </button>
        </form>

        <p className="filter-hint">
          Mặc định: tìm tất cả · Dropdown: Thời gian / Nhiệt độ / Độ ẩm /
          Ánh sáng · Thời gian: YYYY-MM-DD HH:mm:ss
        </p>
      </section>

      <section className="panel table-panel">
        <div className="panel-heading">
          <h2>Dữ liệu cảm biến</h2>
          <span>{sortedData.length} bản ghi · cập nhật 2 giây trước</span>
        </div>

        <div className="table-scroll">
          <table className="data-table sensor-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("id")}>ID{sortMark("id")}</th>
                <th onClick={() => handleSort("sensor")}>LOẠI CẢM BIẾN{sortMark("sensor")}</th>
                <th onClick={() => handleSort("value")}>GIÁ TRỊ{sortMark("value")}</th>
                <th>ĐƠN VỊ</th>
                <th onClick={() => handleSort("time")}>THỜI GIAN ĐO{sortMark("time")}</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>{sensorLabels[item.sensor] || item.sensor}</td>
                  <td>{item.value}</td>
                  <td>{item.unit}</td>
                  <td>{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span className="pagination-info">
            Hiển thị {sortedData.length ? startIndex + 1 : 0}–{Math.min(endIndex, sortedData.length)} trong {sortedData.length} bản ghi
          </span>

          <div className="pagination-tools">
            <label className="rows-per-page">
              Số dòng / trang:
              <select
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </label>

            <div className="pagination">
              <button onClick={() => setCurrentPage((prev) => prev - 1)} disabled={currentPage === 1} aria-label="Trang trước">‹</button>
              {currentPage > 3 && <span>...</span>}
              {getVisiblePages().map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={currentPage === page ? "page-active" : ""}>{page}</button>
              ))}
              {currentPage < totalPages - 2 && <span>...</span>}
              <button onClick={() => setCurrentPage((prev) => prev + 1)} disabled={currentPage >= totalPages} aria-label="Trang sau">›</button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

export default DataSensor;
