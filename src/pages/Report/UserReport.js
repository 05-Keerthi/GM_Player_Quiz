import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Navbar from "../../components/NavbarComp";
import { useReportContext } from "../../context/ReportContext";
import { paginateData, PaginationControls } from "../../utils/pagination";
import QuizDetailsModal from "../../models/QuizDetailsModal";
import SurveyDetailsModal from "../../models/SurveyDetailsModal";

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

const UserReport = () => {
  const { userId } = useParams();
  const { getUserReports, reports, loading, error } = useReportContext();
  const [currentQuizPage, setCurrentQuizPage] = useState(1);
  const [currentSurveyPage, setCurrentSurveyPage] = useState(1);
  const [quizSearchFilter, setQuizSearchFilter] = useState("");
  const [surveySearchFilter, setSurveySearchFilter] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const itemsPerPage = 5;

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

  const handleSurveyClick = (survey) => {
    setSelectedSurvey(survey);
  };

  const handleCloseSurveyModal = () => {
    setSelectedSurvey(null);
  };

  // Prepare data for weekly line chart
  const prepareWeeklyData = () => {
    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // Get date range for past week
    const today = new Date();
    const pastWeek = new Date(today);
    pastWeek.setDate(today.getDate() - 7);

    // Initialize data structure with weekdays
    const weeklyData = weekdays.reduce((data, weekday) => {
      data[weekday] = { weekday, quizzes: 0, surveys: 0 };
      return data;
    }, {});

    // Filter and process reports from the past week
    const recentQuizzes = quizReports.filter(
      (report) => new Date(report.completedAt) >= pastWeek
    );
    const recentSurveys = surveyReports.filter(
      (report) => new Date(report.completedAt) >= pastWeek
    );

    // Count quizzes by weekday
    recentQuizzes.forEach((report) => {
      const weekday = weekdays[new Date(report.completedAt).getDay()];
      weeklyData[weekday].quizzes++;
    });

    // Count surveys by weekday
    recentSurveys.forEach((report) => {
      const weekday = weekdays[new Date(report.completedAt).getDay()];
      weeklyData[weekday].surveys++;
    });

    // Convert to array and maintain weekday order
    return weekdays.map((weekday) => weeklyData[weekday]);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div
          data-testid="loading-spinner"
          className="flex justify-center items-center h-screen"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div
          data-testid="error-message"
          className="flex justify-center items-center h-screen text-red-500"
        >
          <div className="text-center">
            <p className="text-xl font-semibold mb-4">{error}</p>
            <button
              data-testid="retry-button"
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
        <div
          data-testid="no-data-message"
          className="flex justify-center items-center h-screen"
        >
          <p className="text-2xl text-gray-500">
            No quizzes or surveys taken yet
          </p>
        </div>
      </>
    );
  }

  // Filter and paginate reports
  const filterReports = (reports, searchFilter) => {
    if (!searchFilter) return reports;

    const searchTerm = searchFilter.toLowerCase();
    return reports.filter((report) => {
      const quizTitle =
        report.quiz?.title?.toLowerCase() ||
        report.surveyQuiz?.title?.toLowerCase() ||
        "";
      return quizTitle.includes(searchTerm);
    });
  };

  // Separate quiz and survey reports
  const quizReports = reports.filter((report) => report.quiz);
  const surveyReports = reports.filter((report) => report.surveyQuiz);

  // Apply search filters
  const filteredQuizReports = filterReports(quizReports, quizSearchFilter);
  const filteredSurveyReports = filterReports(
    surveyReports,
    surveySearchFilter
  );

  // Paginate quiz and survey reports separately
  const { currentItems: currentQuizItems, totalPages: totalQuizPages } =
    paginateData(filteredQuizReports, currentQuizPage, itemsPerPage);
  const { currentItems: currentSurveyItems, totalPages: totalSurveyPages } =
    paginateData(filteredSurveyReports, currentSurveyPage, itemsPerPage);

  // Calculate statistics
  const totalQuizzes = quizReports.length;
  const totalSurveys = surveyReports.length;
  const totalScore = quizReports.reduce(
    (sum, report) => sum + report.totalScore,
    0
  );
  const averageScore =
    totalQuizzes > 0 ? (totalScore / totalQuizzes).toFixed(2) : 0;

  const totalCorrectAnswers = quizReports.reduce(
    (sum, report) => sum + report.correctAnswers,
    0
  );
  const totalIncorrectAnswers = quizReports.reduce(
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
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-2xl font-semibold text-gray-600 mb-4">Reports</div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div
            data-testid="total-quizzes-card"
            className="bg-white shadow-lg rounded-lg p-6"
          >
            <h3 className="text-xl font-semibold text-indigo-600 mb-4">
              Total Quizzes
            </h3>
            <p
              data-testid="total-quizzes-value"
              className="text-4xl font-bold text-gray-800"
            >
              {totalQuizzes}
            </p>
          </div>
          <div
            data-testid="total-surveys-card"
            className="bg-white shadow-lg rounded-lg p-6"
          >
            <h3 className="text-xl font-semibold text-indigo-600 mb-4">
              Total Surveys
            </h3>
            <p
              data-testid="total-surveys-value"
              className="text-4xl font-bold text-gray-800"
            >
              {totalSurveys}
            </p>
          </div>
          <div
            data-testid="total-score-card"
            className="bg-white shadow-lg rounded-lg p-6"
          >
            <h3 className="text-xl font-semibold text-indigo-600 mb-4">
              Total Score
            </h3>
            <p
              data-testid="total-score-value"
              className="text-4xl font-bold text-gray-800"
            >
              {totalScore}
            </p>
          </div>
          <div
            data-testid="average-score-card"
            className="bg-white shadow-lg rounded-lg p-6"
          >
            <h3 className="text-xl font-semibold text-indigo-600 mb-4">
              Average Score
            </h3>
            <p
              data-testid="average-score-value"
              className="text-4xl font-bold text-gray-800"
            >
              {averageScore}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pie Chart */}
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h2 className="text-3xl font-bold text-center text-indigo-600 mb-8">
              Quiz Performance Overview
            </h2>
            <div className="flex justify-center">
              <div data-testid="pie-chart-container" className="w-80">
                <Pie data={chartData} />
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h2 className="text-3xl font-bold text-center text-indigo-600 mb-8">
              Weekly Activity Comparison
            </h2>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareWeeklyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekday" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="quizzes"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="surveys"
                    stroke="#82ca9d"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quiz Reports Table */}
        <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-center text-indigo-600 mb-8">
            Quiz History
          </h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by Quiz Title"
              value={quizSearchFilter}
              onChange={(e) => setQuizSearchFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="overflow-x-auto">
            <table
              data-testid="quiz-history-table"
              className="w-full table-auto border-collapse"
            >
              <thead>
                <tr className="bg-indigo-600 text-white uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Quiz Title</th>
                  <th className="px-6 py-3 text-left">Score</th>
                  <th className="px-6 py-3 text-left">Completed At</th>
                </tr>
              </thead>
              <tbody>
                {currentQuizItems.map((report) => (
                  <tr
                    key={report._id}
                    data-testid="quiz-history-row"
                    className="hover:bg-gray-100 cursor-pointer border-b"
                    onClick={() => handleQuizClick(report)}
                  >
                    <td className="px-6 py-4">{report.quiz?.title || "N/A"}</td>
                    <td className="px-6 py-4">{report.totalScore}</td>
                    <td className="px-6 py-4">
                      {new Date(report.completedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalQuizPages > 1 && (
            <div className="mt-8 flex justify-center">
              <PaginationControls
                currentPage={currentQuizPage}
                totalPages={totalQuizPages}
                onPageChange={(page) => setCurrentQuizPage(page)}
              />
            </div>
          )}
        </div>

        {/* Survey Reports Table */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h2 className="text-3xl font-bold text-center text-indigo-600 mb-8">
            Survey History
          </h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by Survey Title"
              value={surveySearchFilter}
              onChange={(e) => setSurveySearchFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="overflow-x-auto">
            <table
              data-testid="survey-history-table"
              className="w-full table-auto border-collapse"
            >
              <thead>
                <tr className="bg-indigo-600 text-white uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Survey Title</th>
                  <th className="px-6 py-3 text-left">Questions</th>
                  <th className="px-6 py-3 text-left">Completed At</th>
                </tr>
              </thead>
              <tbody>
                {currentSurveyItems.map((report) => (
                  <tr
                    key={report._id}
                    data-testid="survey-history-row"
                    className="hover:bg-gray-100 cursor-pointer border-b"
                    onClick={() => handleSurveyClick(report)}
                  >
                    <td className="px-6 py-4">
                      {report.surveyQuiz?.title || "N/A"}
                    </td>
                    <td className="px-6 py-4">{report.surveyTotalQuestions}</td>
                    <td className="px-6 py-4">
                      {new Date(report.completedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalSurveyPages > 1 && (
            <div className="mt-8 flex justify-center">
              <PaginationControls
                currentPage={currentSurveyPage}
                totalPages={totalSurveyPages}
                onPageChange={(page) => setCurrentSurveyPage(page)}
              />
            </div>
          )}
        </div>
      </div>

      <QuizDetailsModal
        open={Boolean(selectedQuiz)}
        onClose={handleCloseModal}
        quiz={selectedQuiz}
      />

      <SurveyDetailsModal
        open={Boolean(selectedSurvey)}
        onClose={handleCloseSurveyModal}
        survey={selectedSurvey}
      />
    </div>
  );
};

export default UserReport;
