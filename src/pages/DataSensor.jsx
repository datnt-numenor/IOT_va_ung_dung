import { useState } from "react";
import MainLayout from "../components/MainLayout";
import sensorData from "../data/sensorData";

function DataSensor() {
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("all");

  const [sortKey, setSortKey] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(1);

  const filteredData = sensorData.filter((item) => {
    const keyword = search.toLowerCase();

    if (searchField === "all") {
      return (
        item.sensor.toLowerCase().includes(keyword) ||
        String(item.value).includes(keyword) ||
        item.unit.toLowerCase().includes(keyword) ||
        item.time.toLowerCase().includes(keyword)
      );
    }

    if (searchField === "time") {
      return item.time.toLowerCase().includes(keyword);
    }

    if (searchField === "temperature") {
      return (
        item.sensor === "Temperature" && String(item.value).includes(keyword)
      );
    }

    if (searchField === "humidity") {
      return item.sensor === "Humidity" && String(item.value).includes(keyword);
    }

    if (searchField === "light") {
      return item.sensor === "Light" && String(item.value).includes(keyword);
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

  function getVisiblePages() {
    const pages = [];

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  }
  return (
    <MainLayout>
      <h1>Data Sensor</h1>

      <div className="search-bar">
        <select
          value={searchField}
          onChange={(event) => {
            setSearchField(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All</option>
          <option value="time">Time</option>
          <option value="temperature">Temperature</option>
          <option value="humidity">Humidity</option>
          <option value="light">Light</option>
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
              <th onClick={() => handleSort("sensor")}>Sensor</th>
              <th onClick={() => handleSort("value")}>Value</th>
              <th>Unit</th>
              <th onClick={() => handleSort("time")}>Time</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.sensor}</td>
                <td>{item.value}</td>
                <td>{item.unit}</td>
                <td>{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            First
          </button>

          <button
            onClick={() => setCurrentPage((prev) => prev - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {currentPage > 3 && <span>...</span>}

          {getVisiblePages().map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? "page-active" : ""}
            >
              {page}
            </button>
          ))}

          {currentPage < totalPages - 2 && <span>...</span>}

          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last
          </button>
        </div>
      </div>
    </MainLayout>
  );
}

export default DataSensor;
