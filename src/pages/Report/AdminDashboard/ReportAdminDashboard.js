import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Users, FileSpreadsheet, ClipboardList, Activity } from "lucide-react";
import { paginateData, PaginationControls } from "../../../utils/pagination";
import Navbar from "../../../components/NavbarComp";
import { useNavigate } from "react-router-dom";

const ReportAdminDashboard = () => {
  const navigate = useNavigate();
  const [overallData, setOverallData] = useState(null);
  const [quizzesData, setQuizzesData] = useState([]);
  const [surveysData, setSurveysData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("quizzes");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token"); // Get the token from localStorage

        if (!token) {
          throw new Error("Authentication token not found");
        }

        const [overall, quizzes, surveys] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/analytics/overall", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/admin/analytics/quizzes", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/admin/analytics/surveys", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setOverallData(overall.data);
        setQuizzesData(quizzes.data);
        setSurveysData(surveys.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch dashboard data"
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const quizPaginatedData = paginateData(
    quizzesData,
    currentPage,
    itemsPerPage
  );
  const surveyPaginatedData = paginateData(
    surveysData,
    currentPage,
    itemsPerPage
  );

  // Reset current page when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 p-4 text-center font-semibold">{error}</div>
    );

  const StatCard = ({ title, value, icon: Icon, trend }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend && <span className="text-sm text-gray-500 mt-1">{trend}</span>}
      </div>
    </div>
  );

  const quizChart = quizzesData.map((quiz) => ({
    name:
      quiz.quizTitle.length > 20
        ? quiz.quizTitle.substring(0, 20) + "..."
        : quiz.quizTitle,
    attempts: quiz.totalAttempts,
    participants: quiz.participantCount,
  }));

  const surveyChart = surveysData.map((survey) => ({
    name:
      survey.surveyTitle.length > 20
        ? survey.surveyTitle.substring(0, 20) + "..."
        : survey.surveyTitle,
    responses: survey.totalResponses,
    participants: survey.participantCount,
    avgQuestions: survey.averageQuestionsAttempted,
  }));

  return (
    <>
      <>
        <Navbar />
      </>
      <>
        <div className="p-8 mx-auto bg-gray-50 min-h-screen">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">
            Dashboard Overview
          </h1>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              title="Total Users"
              value={overallData.overview.totalUsers}
              icon={Users}
            />
            <StatCard
              title="Total Quizzes"
              value={overallData.overview.totalQuizzes}
              icon={FileSpreadsheet}
            />
            <StatCard
              title="Total Surveys"
              value={overallData.overview.totalSurveys}
              icon={ClipboardList}
            />
            <StatCard
              title="Active Sessions"
              value={overallData.overview.activeSessions}
              icon={Activity}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Quiz Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Quiz Performance
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quizChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="attempts"
                      fill="#8884d8"
                      name="Total Attempts"
                    />
                    <Bar
                      dataKey="participants"
                      fill="#82ca9d"
                      name="Participants"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Survey Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Survey Performance
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={surveyChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="responses"
                      fill="#8884d8"
                      name="Total Responses"
                    />
                    <Bar
                      dataKey="participants"
                      fill="#82ca9d"
                      name="Participants"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* User Trend */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              User Growth Trend
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overallData.userTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey={(d) => `${d._id.month}/${d._id.year}`}
                    label={{ value: "Month/Year", position: "bottom" }}
                  />
                  <YAxis
                    label={{
                      value: "Users",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    name="Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
                  {quizzesData.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-600 py-1 px-2 rounded-full text-xs">
                      {quizzesData.length}
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
                  {surveysData.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-600 py-1 px-2 rounded-full text-xs">
                      {surveysData.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === "quizzes" && (
                <>
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left p-4 font-medium text-gray-600">
                              Quiz Title
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
                          {quizPaginatedData.currentItems.map((quiz) => (
                            <tr
                              key={quiz._id}
                              className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() =>
                                navigate(
                                  `/admin/quizzes-reports/quizzes/${quiz._id}`
                                )
                              }
                            >
                              <td className="p-4">{quiz.quizTitle}</td>
                              <td className="p-4">{quiz.totalAttempts}</td>
                              <td className="p-4">{quiz.lastAttempt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={quizPaginatedData.totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}

              {activeTab === "surveys" && (
                <>
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left p-4 font-medium text-gray-600">
                              Survey Title
                            </th>
                            <th className="text-left p-4 font-medium text-gray-600">
                              Responses
                            </th>
                            <th className="text-left p-4 font-medium text-gray-600">
                              Last Attempt
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {surveyPaginatedData.currentItems.map((survey) => (
                            <tr
                              key={survey._id}
                              className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() =>
                                navigate(
                                  `/admin/surveys-reports/surveys/${survey._id}`
                                )
                              }
                            >
                              <td className="p-4">{survey.surveyTitle}</td>
                              <td className="p-4">{survey.totalResponses}</td>
                              <td className="p-4">{survey.lastAttempt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={surveyPaginatedData.totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </>
    </>
  );
};

export default ReportAdminDashboard;
