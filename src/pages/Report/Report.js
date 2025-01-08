import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useReportContext } from "../../context/ReportContext";
import { useAuthContext } from "../../context/AuthContext";
import Navbar from "../../components/NavbarComp";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { PaginationControls } from "../../utils/pagination";

ChartJS.register(ArcElement, Tooltip, Legend);

const ReportsView = () => {
  const { quizId } = useParams();
  const { user } = useAuthContext();
  const isAdmin = user?.role === "admin";

  const {
    reports,
    loading,
    error,
    getAllReports,
    getReportByQuiz,
    clearError,
  } = useReportContext();

  const [filteredReports, setFilteredReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(5);
  const [quizTitleFilter, setQuizTitleFilter] = useState("");
  const [usernameFilter, setUsernameFilter] = useState("");

  // Calculate current reports for pagination
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(
    indexOfFirstReport,
    indexOfLastReport
  );

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        if (quizId) {
          await getReportByQuiz(quizId);
        } else if (isAdmin) {
          await getAllReports();
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
      }
    };

    fetchReports();

    return () => {
      clearError();
    };
  }, [quizId, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      let filtered = reports;

      filtered = filtered.filter((report) => {
        const matchesQuizTitle =
          !quizTitleFilter ||
          (report.quiz?.title || "")
            .toLowerCase()
            .includes(quizTitleFilter.toLowerCase());

        const matchesUsername =
          !usernameFilter ||
          (report.user?.username || "")
            .toLowerCase()
            .includes(usernameFilter.toLowerCase());

        return matchesQuizTitle && matchesUsername;
      });

      setFilteredReports(filtered);
      setCurrentPage(1);
    }
  }, [reports, quizTitleFilter, usernameFilter, isAdmin]);

  const totalQuizzes = filteredReports.length;
  const totalScore = filteredReports.reduce(
    (sum, report) => sum + report.totalScore,
    0
  );
  const averageScore =
    totalQuizzes > 0 ? (totalScore / totalQuizzes).toFixed(2) : 0;

  const totalCorrectAnswers = filteredReports.reduce(
    (sum, report) => sum + report.correctAnswers,
    0
  );
  const totalIncorrectAnswers = filteredReports.reduce(
    (sum, report) => sum + report.incorrectAnswers,
    0
  );

  const chartData = {
    labels: ["Correct Answers", "Incorrect Answers"],
    datasets: [
      {
        data: [totalCorrectAnswers, totalIncorrectAnswers],
        backgroundColor: ["#10B981", "#EF4444"],
        hoverBackgroundColor: ["#059669", "#DC2626"],
      },
    ],
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen text-red-500">
          <div className="text-center">
            <p className="text-xl font-semibold mb-4">{error.message}</p>
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold text-center text-indigo-600 mb-8">
          Quiz Reports
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-indigo-600 mb-4">
              Total Quizzes
            </h3>
            <p className="text-4xl font-bold text-gray-800">{totalQuizzes}</p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-indigo-600 mb-4">
              Total Score
            </h3>
            <p className="text-4xl font-bold text-gray-800">{totalScore}</p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-indigo-600 mb-4">
              Average Score
            </h3>
            <p className="text-4xl font-bold text-gray-800">{averageScore}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h2 className="text-3xl font-bold text-center text-indigo-600 mb-8">
              Answers Overview
            </h2>
            <div className="flex justify-center">
              <div className="w-80">
                <Pie data={chartData} />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg">
            <div className="flex flex-col md:flex-row items-center justify-between bg-indigo-600 text-white px-6 py-4 rounded-t-lg">
              <div className="mt-4 md:mt-0 flex flex-col md:flex-row md:space-x-4">
                <input
                  type="text"
                  placeholder="Filter by Quiz Title"
                  value={quizTitleFilter}
                  onChange={(e) => setQuizTitleFilter(e.target.value)}
                  className="border border-white bg-white text-indigo-600 rounded-md px-4 py-2 mb-2 md:mb-0"
                />
                <input
                  type="text"
                  placeholder="Filter by Username"
                  value={usernameFilter}
                  onChange={(e) => setUsernameFilter(e.target.value)}
                  className="border border-white bg-white text-indigo-600 rounded-md px-4 py-2"
                />
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <p className="text-xl text-center text-gray-500 py-8">
                No reports found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
                      <th className="px-6 py-4 text-left">Quiz</th>
                      <th className="px-6 py-4 text-left">User</th>
                      <th className="px-6 py-4 text-left">Questions</th>
                      <th className="px-6 py-4 text-left">Correct/Incorrect</th>
                      <th className="px-6 py-4 text-left">Score</th>
                      <th className="px-6 py-4 text-left">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReports.map((report) => (
                      <tr
                        key={report._id}
                        className="border-b border-gray-200 hover:bg-gray-100"
                      >
                        <td className="px-6 py-4">
                          {report.quiz?.title || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          {report.user?.username || "N/A"}
                        </td>
                        <td className="px-6 py-4">{report.totalQuestions}</td>
                        <td className="px-6 py-4">
                          <span className="text-green-500">
                            {report.correctAnswers}
                          </span>{" "}
                          /{" "}
                          <span className="text-red-500">
                            {report.incorrectAnswers}
                          </span>
                        </td>
                        <td className="px-6 py-4">{report.totalScore}</td>
                        <td className="px-6 py-4">
                          {new Date(report.completedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-6 py-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={Math.ceil(filteredReports.length / reportsPerPage)}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
