// DetailedAdminReportDashboard.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Navbar from "../../../components/NavbarComp";
import { paginateData, PaginationControls } from "../../../utils/pagination";
import { ArrowBigLeft, Trophy } from "lucide-react";

// TopPerformers Component
const PodiumStep = ({ rank, username, score, delay }) => {
  const heights = {
    1: "h-48",
    2: "h-32",
    3: "h-24",
  };

  const medals = {
    1: "bg-yellow-400",
    2: "bg-gray-300",
    3: "bg-amber-600",
  };

  return (
    <div
      className={`flex flex-col items-center justify-end ${
        rank === 1 ? "order-2" : rank === 2 ? "order-1" : "order-3"
      }`}
    >
      {/* User Avatar and Score */}
      <div
        className={`flex flex-col items-center mb-2 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] transition-all`}
        style={{ animationDelay: `${delay + 0.3}s` }}
      >
        <div
          className={`w-12 h-12 rounded-full ${medals[rank]} flex items-center justify-center mb-2`}
        >
          {rank === 1 ? (
            <Trophy className="w-6 h-6 text-white" />
          ) : (
            <span className="text-white font-bold text-xl">{rank}</span>
          )}
        </div>
        <span className="font-semibold text-sm">{username}</span>
        <span className="text-gray-600 text-xs">{score} pts</span>
      </div>

      {/* Podium Step */}
      <div
        className={`w-24 ${heights[rank]} bg-gradient-to-b from-blue-500 to-blue-600 rounded-t-lg 
                    transform origin-bottom opacity-0 animate-[scaleUp_0.5s_ease-out_forwards]`}
        style={{ animationDelay: `${delay}s` }}
      />
    </div>
  );
};

const TopPerformers = ({ performers }) => {
  // Sort performers by score in descending order and take top 3
  const topThree = [...performers]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-8">Top Performers</h2>
      <div className="flex items-end justify-center gap-4 h-64">
        {topThree.map((performer, index) => (
          <PodiumStep
            key={index}
            rank={index + 1}
            username={performer.username}
            score={performer.score}
            delay={index * 0.2}
          />
        ))}
      </div>
      <style>{`
        @keyframes scaleUp {
          from {
            transform: scaleY(0);
            opacity: 0;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Main Dashboard Component
const DetailedAdminReportDashboard = () => {
  const navigate = useNavigate();
  const { type, id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/admin/analytics/${type}/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || `Failed to fetch ${type} details`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, id]);

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

  const isQuiz = type === "quizzes";
  const details = isQuiz ? data.quizDetails : data.surveyDetails;
  const stats = data.overallStats;
  const sessionData = data.sessionStats.map((stat) => ({
    name: stat.status,
    value: stat.count,
  }));

  // Paginate the session list
  const { currentItems: paginatedSessions, totalPages } = paginateData(
    data.sessionList,
    currentPage,
    itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  const StatCard = ({ title, value }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="p-8 mx-auto bg-gray-50 min-h-screen">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 flex items-center text-xl font-semibold mb-4"
        >
          <ArrowBigLeft />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </button>
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          {details.title}
        </h1>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {isQuiz ? (
            <>
              <StatCard title="Total Attempts" value={stats.totalAttempts} />
              <StatCard title="Average Score" value={`${stats.averageScore}`} />
              <StatCard title="Highest Score" value={`${stats.highestScore}`} />
              <StatCard title="Lowest Score" value={`${stats.lowestScore}`} />
            </>
          ) : (
            <>
              <StatCard title="Total Responses" value={stats.totalResponses} />
              <StatCard
                title="Participant Count"
                value={stats.participantCount}
              />
              <StatCard
                title="Avg Questions Attempted"
                value={stats.avgQuestionsAttempted}
              />
              <StatCard
                title="Avg Questions Skipped"
                value={stats.avgQuestionsSkipped}
              />
            </>
          )}
        </div>

        {/* Charts */}
        <div
          className={`grid grid-cols-1 ${
            isQuiz ? "md:grid-cols-2" : ""
          } gap-6 mb-8`}
        >
          {/* Session Status Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              Session Status Distribution
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sessionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sessionData.map((entry, index) => (
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

          {/* Top Performers Podium (Quiz only) */}
          {isQuiz && data.topPerformers && (
            <TopPerformers performers={data.topPerformers} />
          )}
        </div>

        {/* Session List with Pagination */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-lg font-semibold p-6">Recent Sessions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-4">Host</th>
                  <th className="text-left p-4">Join Code</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Created At</th>
                  <th className="text-left p-4">Players</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSessions.map((session) => {
                  const isSurvey = "surveyHost" in session;
                  return (
                    <tr
                      key={session._id}
                      className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                      onClick={() => {
                        const path = `/${type}/session/${session._id}`;
                        navigate(path);
                      }}
                    >
                      <td className="p-4">
                        {isSurvey
                          ? session.surveyHost.username
                          : session.host.username}
                      </td>
                      <td className="p-4">
                        {isSurvey ? session.surveyJoinCode : session.joinCode}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            (isSurvey
                              ? session.surveyStatus
                              : session.status) === "completed"
                              ? "bg-green-100 text-green-800"
                              : (isSurvey
                                  ? session.surveyStatus
                                  : session.status) === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {isSurvey ? session.surveyStatus : session.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">{session.playerCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DetailedAdminReportDashboard;
