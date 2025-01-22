import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useReportContext } from "../../context/ReportContext";
import { useAuthContext } from "../../context/AuthContext";
import Navbar from "../../components/NavbarComp";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PaginationControls } from "../../utils/pagination";

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

  const [filteredQuizReports, setFilteredQuizReports] = useState([]);
  const [filteredSurveyReports, setFilteredSurveyReports] = useState([]);
  const [currentQuizPage, setCurrentQuizPage] = useState(1);
  const [currentSurveyPage, setCurrentSurveyPage] = useState(1);
  const [reportsPerPage] = useState(5);
  const [quizSearchFilter, setQuizSearchFilter] = useState("");
  const [surveySearchFilter, setSurveySearchFilter] = useState("");
  const [weeklyData, setWeeklyData] = useState([]);

  // Calculate current reports for pagination
  const indexOfLastQuizReport = currentQuizPage * reportsPerPage;
  const indexOfFirstQuizReport = indexOfLastQuizReport - reportsPerPage;
  const currentQuizReports = filteredQuizReports.slice(
    indexOfFirstQuizReport,
    indexOfLastQuizReport
  );

  const indexOfLastSurveyReport = currentSurveyPage * reportsPerPage;
  const indexOfFirstSurveyReport = indexOfLastSurveyReport - reportsPerPage;
  const currentSurveyReports = filteredSurveyReports.slice(
    indexOfFirstSurveyReport,
    indexOfLastSurveyReport
  );

  // Handle page change
  const handleQuizPageChange = (page) => setCurrentQuizPage(page);
  const handleSurveyPageChange = (page) => setCurrentSurveyPage(page);

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
    return () => clearError();
  }, [quizId, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      let quizReports = reports.filter((report) => report.quiz);
      let surveyReports = reports.filter((report) => report.surveyQuiz);

      if (quizSearchFilter) {
        const searchTerm = quizSearchFilter.toLowerCase();
        quizReports = quizReports.filter((report) => {
          const quizTitle = report.quiz?.title.toLowerCase() || "";
          const username = report.user?.username.toLowerCase() || "";
          return (
            quizTitle.includes(searchTerm) || username.includes(searchTerm)
          );
        });
      }

      if (surveySearchFilter) {
        const searchTerm = surveySearchFilter.toLowerCase();
        surveyReports = surveyReports.filter((report) => {
          const surveyTitle = report.surveyQuiz?.title.toLowerCase() || "";
          const username = report.user?.username.toLowerCase() || "";
          return (
            surveyTitle.includes(searchTerm) || username.includes(searchTerm)
          );
        });
      }

      setFilteredQuizReports(quizReports);
      setFilteredSurveyReports(surveyReports);
      setCurrentQuizPage(1);
      setCurrentSurveyPage(1);
    }
  }, [reports, quizSearchFilter, surveySearchFilter, isAdmin]);

  useEffect(() => {
    const today = new Date();
    const pastWeek = new Date(today);
    pastWeek.setDate(today.getDate() - 7);

    const filteredReportsForWeek = reports.filter(
      (report) => new Date(report.completedAt) >= pastWeek
    );

    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const groupedData = weekdays.reduce((data, weekday) => {
      data[weekday] = { weekday, quizzes: 0, surveys: 0 };
      return data;
    }, {});

    filteredReportsForWeek.forEach((report) => {
      const weekday = weekdays[new Date(report.completedAt).getDay()];
      if (report.quiz) {
        groupedData[weekday].quizzes++;
      } else if (report.surveyQuiz) {
        groupedData[weekday].surveys++;
      }
    });

    setWeeklyData(Object.values(groupedData));
  }, [reports]);

  // Calculate statistics
  const totalQuizzes = filteredQuizReports.length;
  const totalSurveys = filteredSurveyReports.length;
  const totalScore = filteredQuizReports.reduce(
    (sum, report) => sum + report.totalScore,
    0
  );
  const averageScore =
    totalQuizzes > 0 ? (totalScore / totalQuizzes).toFixed(2) : 0;

  const totalCorrectAnswers = filteredQuizReports.reduce(
    (sum, report) => sum + report.correctAnswers,
    0
  );
  const totalIncorrectAnswers = filteredQuizReports.reduce(
    (sum, report) => sum + report.incorrectAnswers,
    0
  );

  const pieChartData = [
    { name: "Correct Answers", value: totalCorrectAnswers },
    { name: "Incorrect Answers", value: totalIncorrectAnswers },
  ];

  const COLORS = ["#10B981", "#EF4444"];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          Loading...
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen text-red-500">
          Error: {error.message}
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="text-2xl font-semibold text-gray-600 mb-4">Reports</div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-indigo-600 mb-4">
              Total Quiz Sessions
            </h3>
            <p className="text-4xl font-bold text-gray-800">{totalQuizzes}</p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-indigo-600 mb-4">
              Total Survey Sessions
            </h3>
            <p className="text-4xl font-bold text-gray-800">{totalSurveys}</p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-indigo-600 mb-4">
              Total Quiz Score
            </h3>
            <p className="text-4xl font-bold text-gray-800">{totalScore}</p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-indigo-600 mb-4">
              Avg Quiz Score
            </h3>
            <p className="text-4xl font-bold text-gray-800">{averageScore}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pie Chart */}
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h2 className="text-3xl font-bold text-center text-indigo-600 mb-8">
              Quiz Answers Overview
            </h2>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h2 className="text-3xl font-bold text-center text-indigo-600 mb-8">
              Weekly Sessions Comparison
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="weekday" />
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

        {/* Quiz Reports Table */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h2 className="text-3xl font-bold text-center text-indigo-600 mb-8">
            Quiz Reports
          </h2>
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              placeholder="Search by Quiz Title or Username"
              value={quizSearchFilter}
              onChange={(e) => setQuizSearchFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 w-full"
            />
          </div>
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
                {currentQuizReports.map((report) => (
                  <tr
                    key={report._id}
                    className="border-b border-gray-200 hover:bg-gray-100"
                  >
                    <td className="px-6 py-4">{report.quiz?.title || "N/A"}</td>
                    <td className="px-6 py-4">
                      {report.user?.username || "N/A"}
                    </td>
                    <td className="px-6 py-4">{report.totalQuestions}</td>
                    <td className="px-6 py-4">
                      <span className="text-green-500">
                        {report.correctAnswers}
                      </span>
                      {" / "}
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
          <div className="mt-4">
            <PaginationControls
              currentPage={currentQuizPage}
              totalPages={Math.ceil(
                filteredQuizReports.length / reportsPerPage
              )}
              onPageChange={handleQuizPageChange}
            />
          </div>
        </div>

        {/* Survey Reports Table */}
        <div className="bg-white shadow-lg rounded-lg p-8 mt-8">
          <h2 className="text-3xl font-bold text-center text-indigo-600 mb-8">
            Survey Reports
          </h2>
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              placeholder="Search by Survey Title or Username"
              value={surveySearchFilter}
              onChange={(e) => setSurveySearchFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 w-full"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
                  <th className="px-6 py-4 text-left">Survey</th>
                  <th className="px-6 py-4 text-left">User</th>
                  <th className="px-6 py-4 text-left">Questions</th>
                  <th className="px-6 py-4 text-left">Completed</th>
                </tr>
              </thead>
              <tbody>
                {currentSurveyReports.map((report) => (
                  <tr
                    key={report._id}
                    className="border-b border-gray-200 hover:bg-gray-100"
                  >
                    <td className="px-6 py-4">
                      {report.surveyQuiz?.title || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {report.user?.username || "N/A"}
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
          <div className="mt-4">
            <PaginationControls
              currentPage={currentSurveyPage}
              totalPages={Math.ceil(
                filteredSurveyReports.length / reportsPerPage
              )}
              onPageChange={handleSurveyPageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
