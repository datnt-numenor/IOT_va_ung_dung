import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import MainLayout from "../components/MainLayout";
import { formatDateTime } from "../utils/dateTime";

const sensorLabels = {
  temperature: "Nhiệt độ",
  humidity: "Độ ẩm",
  light: "Ánh sáng",
};
const sortFields = { id: "id", sensorType: "sensorType", value: "value", measuredAt: "measuredAt" };

function DataSensor() {
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [appliedSearch, setAppliedSearch] = useState({ field: "all", keyword: "" });
  const [searchMode, setSearchMode] = useState("all");
  const [sortKey, setSortKey] = useState("id");
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
      field: appliedSearch.field,
      keyword: appliedSearch.keyword,
      page: String(currentPage),
      size: String(rowsPerPage),
      sort: `${sortFields[sortKey]},${sortDirection}`,
    });
    apiRequest(`/sensor-data?${query}`, { signal: controller.signal })
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
  }, [appliedSearch, currentPage, rowsPerPage, sortKey, sortDirection]);

  function handleSort(key) {
    if (sortKey === key) setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDirection("asc"); }
    setCurrentPage(1);
  }

  function handleSearch(event) {
    event.preventDefault();
    const keyword = search.trim();
    if (searchMode === "field" && searchField !== "all") {
      setAppliedSearch({ field: searchField, keyword: "" });
      setSearch("");
    } else if (keyword) {
      setAppliedSearch({ field: "all", keyword });
      setSearchField("all");
      setSearchMode("keyword");
    } else {
      setAppliedSearch({ field: "all", keyword: "" });
      setSearchField("all");
      setSearchMode("all");
    }
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
    <MainLayout title="Data Sensor" subtitle="Tra cứu lịch sử giá trị theo từng loại cảm biến">
      <div className="records-page">
        <section className="panel filter-panel sensor-filter-panel">
          <h2>Tìm kiếm và lọc dữ liệu</h2>
          <form className="search-bar sensor-search-bar" onSubmit={handleSearch}>
            <input type="text"
              placeholder={searchField === "time" ? "YYYY-MM-DD HH:mm:ss" : "Nhập giá trị cần tìm..."}
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                setSearch(value);
                setSearchMode(value.trim() ? "keyword" : searchField === "all" ? "all" : "field");
              }} />
            <select value={searchField} onChange={(event) => {
              const value = event.target.value;
              setSearchField(value);
              setSearchMode(value === "all" ? (search.trim() ? "keyword" : "all") : "field");
            }}>
              <option value="all">Tất cả</option>
              <option value="time">Thời gian</option>
              <option value="temperature">Nhiệt độ</option>
              <option value="humidity">Độ ẩm</option>
              <option value="light">Ánh sáng</option>
            </select>
            <button type="submit" className="primary-button">Tìm kiếm</button>
          </form>
        </section>

        <section className="panel table-panel">
          <div className="panel-heading">
            <h2>Dữ liệu cảm biến</h2>
            <span>{totalElements} bản ghi · dữ liệu từ MySQL</span>
          </div>
          {error ? <div className="api-error" role="alert">{error}</div> : null}
          <div className="table-scroll">
            <table className="data-table sensor-table">
              <thead><tr>
                <th onClick={() => handleSort("id")}>ID{sortMark("id")}</th>
                <th onClick={() => handleSort("sensorType")}>LOẠI CẢM BIẾN{sortMark("sensorType")}</th>
                <th onClick={() => handleSort("value")}>GIÁ TRỊ{sortMark("value")}</th>
                <th>ĐƠN VỊ</th>
                <th onClick={() => handleSort("measuredAt")}>THỜI GIAN ĐO{sortMark("measuredAt")}</th>
              </tr></thead>
              <tbody>
                {data.map((item) => <tr key={item.id}>
                  <td>#{item.id}</td><td>{sensorLabels[item.sensorType] || item.sensorType}</td>
                  <td>{item.value}</td><td>{item.unit}</td><td>{formatDateTime(item.measuredAt)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span className="pagination-info">Hiển thị {startIndex}–{endIndex} trong {totalElements} bản ghi</span>
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

export default DataSensor;
