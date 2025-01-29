// Dashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ActivityTimeline from "./ActivityTimeline";
import PerformanceMetrics from "./PerformanceMetrics";
import { Calendar, Search, Download, RefreshCw } from "lucide-react";
import Navbar from "../../../components/NavbarComp";
import DistributionChart from "./DistributionChart";
import AttemptsChart from "./AttemptsChart";
import { paginateData, PaginationControls } from "../../../utils/pagination";

const Dashboard = () => {
  const [reports, setReports] = useState({ quizzes: [], surveys: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState("all");
  const [activeTab, setActiveTab] = useState("quizzes");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/reports/participated",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch reports");
      }
      setReports(data);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to fetch reports");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReports();
    setIsRefreshing(false);
  };

  const filterDataByTimeframe = (data) => {
    const now = new Date();
    const filtered = data.filter((item) => {
      const itemDate = new Date(item.lastAttempt);
      switch (timeframe) {
        case "week":
          return now - itemDate <= 7 * 24 * 60 * 60 * 1000;
        case "month":
          return now - itemDate <= 30 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    });
    return filtered;
  };

  const filterDataBySearch = (data) => {
    if (!searchTerm) return data;
    return data.filter((item) => {
      const title =
        item.QuizDetails?.quizTitle || item.SurveyDetails?.surveyTitle || "";
      const description = item.QuizDetails?.quizDescription || "";
      return (
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  const filteredQuizzes = filterDataBySearch(
    filterDataByTimeframe(reports.quizzes || [])
  );
  const filteredSurveys = filterDataBySearch(
    filterDataByTimeframe(reports.surveys || [])
  );

  const navigateToReport = (id, type) => {
    navigate(`/${type}-reports/${type}/${id}`);
  };

  const exportToCSV = () => {
    const data = activeTab === "quizzes" ? filteredQuizzes : filteredSurveys;
    const headers =
      activeTab === "quizzes"
        ? ["Quiz Title", "Description", "Attempts", "Last Attempt"]
        : ["Survey Title", "Attempts", "Last Attempt"];

    const csvContent = data.map((item) => {
      if (activeTab === "quizzes") {
        return [
          item.QuizDetails.quizTitle,
          item.QuizDetails.quizDescription,
          item.attempts,
          new Date(item.lastAttempt).toLocaleDateString(),
        ].join(",");
      } else {
        return [
          item.SurveyDetails.surveyTitle,
          item.attempts,
          new Date(item.lastAttempt).toLocaleDateString(),
        ].join(",");
      }
    });

    const csv = [headers.join(","), ...csvContent].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}-report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Get paginated data for current tab
  const getPaginatedData = () => {
    const data = activeTab === "quizzes" ? filteredQuizzes : filteredSurveys;
    return paginateData(data, currentPage, ITEMS_PER_PAGE);
  };

  // Reset pagination when tab, search, or timeframe changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, timeframe]);

  const { currentItems, totalPages } = getPaginatedData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg shadow">
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchReports}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            {/* Time Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <select
                className="border rounded-lg p-2 bg-white"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="month">Last 30 Days</option>
                <option value="week">Last 7 Days</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className={`p-2 text-gray-600 hover:text-gray-800 rounded-lg border bg-white
                  ${
                    isRefreshing
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }`}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={exportToCSV}
                className="p-2 text-gray-600 hover:text-gray-800 rounded-lg border bg-white hover:bg-gray-50"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-6">
          <PerformanceMetrics
            quizzes={filteredQuizzes}
            surveys={filteredSurveys}
            totalTime={reports.totalTime}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Distribution of Content</h2>
            <DistributionChart
              quizCount={filteredQuizzes.length}
              surveyCount={filteredSurveys.length}
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Top 5 Most Attempted</h2>
            <AttemptsChart
              quizzes={filteredQuizzes}
              surveys={filteredSurveys}
            />
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="mb-6">
          <ActivityTimeline
            quizzes={filteredQuizzes}
            surveys={filteredSurveys}
          />
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("quizzes")}
                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === "quizzes"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Quiz Reports
                {filteredQuizzes.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 py-1 px-2 rounded-full text-xs">
                    {filteredQuizzes.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("surveys")}
                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === "surveys"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Survey Reports
                {filteredSurveys.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 py-1 px-2 rounded-full text-xs">
                    {filteredSurveys.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "quizzes" && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-4 font-medium text-gray-600">
                          Quiz Title
                        </th>
                        <th className="text-left p-4 font-medium text-gray-600">
                          Description
                        </th>
                        <th className="text-left p-4 font-medium text-gray-600">
                          Attempts
                        </th>
                        <th className="text-left p-4 font-medium text-gray-600">
                          Last Attempt
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="text-center p-4 text-gray-500"
                          >
                            No quizzes found
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((quiz) => (
                          <tr
                            key={quiz.QuizId}
                            className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() =>
                              navigateToReport(quiz.QuizId, "quiz")
                            }
                          >
                            <td className="p-4">
                              {quiz.QuizDetails.quizTitle}
                            </td>
                            <td className="p-4">
                              {quiz.QuizDetails.quizDescription}
                            </td>
                            <td className="p-4">{quiz.attempts}</td>
                            <td className="p-4">
                              {new Date(quiz.lastAttempt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {currentItems.length > 0 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            )}

            {activeTab === "surveys" && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-4 font-medium text-gray-600">
                          Survey Title
                        </th>
                        <th className="text-left p-4 font-medium text-gray-600">
                          Attempts
                        </th>
                        <th className="text-left p-4 font-medium text-gray-600">
                          Last Attempt
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan="3"
                            className="text-center p-4 text-gray-500"
                          >
                            No surveys found
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((survey) => (
                          <tr
                            key={survey.SurveyId}
                            className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() =>
                              navigateToReport(survey.SurveyId, "survey")
                            }
                          >
                            <td className="p-4">
                              {survey.SurveyDetails.surveyTitle}
                            </td>
                            <td className="p-4">{survey.attempts}</td>
                            <td className="p-4">
                              {new Date(
                                survey.lastAttempt
                              ).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {currentItems.length > 0 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
