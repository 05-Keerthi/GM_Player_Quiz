import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Navbar from "../../components/NavbarComp";
import { useReportContext } from "../../context/ReportContext";
import { paginateData, PaginationControls } from "../../utils/pagination";
import QuizDetailsModal from "../../models/QuizDetailsModal";

ChartJS.register(ArcElement, Tooltip, Legend);

const UserReport = () => {
  const { userId } = useParams();
  const { getUserReports, reports, loading, error } = useReportContext();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    if (userId) {
      getUserReports(userId);
    }
  }, [userId]);

  const handleQuizClick = (quiz) => {
    setSelectedQuiz(quiz);
  };

  const handleCloseModal = () => {
    setSelectedQuiz(null);
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
            <p className="text-xl font-semibold mb-4">{error}</p>
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

  if (!reports || reports.length === 0) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <p className="text-2xl text-gray-500">No quizzes taken yet</p>
        </div>
      </>
    );
  }

  const { currentItems, totalPages } = paginateData(
    reports,
    currentPage,
    itemsPerPage
  );

  const totalQuizzes = reports.length;
  const totalScore = reports.reduce(
    (sum, report) => sum + report.totalScore,
    0
  );
  const averageScore = (totalScore / totalQuizzes).toFixed(2);

  const totalCorrectAnswers = reports.reduce(
    (sum, report) => sum + report.correctAnswers,
    0
  );
  const totalIncorrectAnswers = reports.reduce(
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold text-center text-indigo-600 mb-8">
          Quiz Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-indigo-600 mb-4">
              Total Quizzes Taken
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
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h2 className="text-3xl font-bold text-center text-indigo-600 mb-8">
              Quiz History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-indigo-600 text-white uppercase tracking-wider">
                    <th className="px-6 py-3 text-left">Quiz Title</th>
                    <th className="px-6 py-3 text-left">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((report) => (
                    <tr
                      key={report._id}
                      className="hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleQuizClick(report)}
                    >
                      <td className="px-6 py-4">
                        {report.quiz?.title || "N/A"}
                      </td>
                      <td className="px-6 py-4">{report.totalScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <QuizDetailsModal
        open={Boolean(selectedQuiz)}
        onClose={handleCloseModal}
        quiz={selectedQuiz}
      />
    </div>
  );
};

export default UserReport;
