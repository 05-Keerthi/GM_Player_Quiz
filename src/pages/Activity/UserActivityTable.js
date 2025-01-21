import React, { useState, useEffect } from "react";
import { paginateData, PaginationControls } from "../../utils/pagination";

const UserActivityTable = () => {
  const [userActivityLogs, setUserActivityLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchUserActivityLogs = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/activity-logs/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user activity logs");
        }

        const data = await response.json();
        setUserActivityLogs(data.activityLogs);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserActivityLogs();
  }, []);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to the first page when search query changes
  };

  const filteredLogs = userActivityLogs.filter((log) =>
    log.activityType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { currentItems, totalPages } = paginateData(
    filteredLogs,
    currentPage,
    itemsPerPage
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="bg-white p-6 rounded-[50px] shadow-sm mt-6">
      <h3 className="text-gray-500 text-lg mb-4">User Activity Logs</h3>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by activity type"
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="table-auto w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">User Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Mobile</th>
              <th className="px-6 py-3">Activity</th>
              <th className="px-6 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((log) => (
              <tr key={log._id} className="bg-white border-b">
                <td className="px-6 py-4">{log.details.username}</td>
                <td className="px-6 py-4">{log.details.email}</td>
                <td className="px-6 py-4">{log.details.mobile}</td>
                <td className="px-6 py-4">{log.activityType}</td>
                <td className="px-6 py-4">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default UserActivityTable;