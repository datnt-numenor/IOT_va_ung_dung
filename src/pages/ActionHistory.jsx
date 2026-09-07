import { useState } from "react";

import MainLayout from "../components/MainLayout";
import actionHistory from "../data/actionHistory";

function ActionHistory() {
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("all");

  const [sortKey, setSortKey] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const filteredData = actionHistory.filter((item) => {
    const keyword = search.toLowerCase();

    if (searchField === "all") {
      return (
        item.device.toLowerCase().includes(keyword) ||
        item.action.toLowerCase().includes(keyword) ||
        item.status.toLowerCase().includes(keyword) ||
        item.time.toLowerCase().includes(keyword)
      );
    }

    if (searchField === "device") {
      return item.device.toLowerCase().includes(keyword);
    }

    if (searchField === "action") {
      return item.action.toLowerCase().includes(keyword);
    }

    if (searchField === "status") {
      return item.status.toLowerCase().includes(keyword);
    }

    if (searchField === "time") {
      return item.time.toLowerCase().includes(keyword);
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

  return (
    <MainLayout>
      <h1>Action History</h1>

      <div className="search-bar">
        <select
          value={searchField}
          onChange={(event) => {
            setSearchField(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All</option>
          <option value="device">Device</option>
          <option value="action">Action</option>
          <option value="status">Status</option>
          <option value="time">Time</option>
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("id")}>ID</th>

              <th onClick={() => handleSort("device")}>Device</th>

              <th onClick={() => handleSort("action")}>Action</th>

              <th onClick={() => handleSort("status")}>Status</th>

              <th onClick={() => handleSort("time")}>Time</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.device}</td>
                <td>{item.action}</td>
                <td>
                  <span className={`status-badge ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          onClick={() => setCurrentPage((prev) => prev - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        <span>
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>

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
      </div>
    </MainLayout>
  );
}

export default ActionHistory;
