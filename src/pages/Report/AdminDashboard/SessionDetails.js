import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../../components/NavbarComp";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ArrowBigLeft } from "lucide-react";

const SessionDetails = () => {
  const navigate = useNavigate();
  const { type, sessionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isQuiz = type === "quizzes";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/admin/analytics/${type}/session/${sessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch session details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId, type]);

  const handleBackNavigation = () => {
    const id = isQuiz
      ? data.sessionDetails.quiz._id
      : data.sessionDetails.surveyQuiz._id;
    navigate(`/admin/${type}-reports/${type}/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center font-semibold">{error}</div>
    );
  }

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
          onClick={handleBackNavigation}
          className="text-blue-600 hover:text-blue-800 flex items-center text-xl font-semibold mb-4"
        >
          <ArrowBigLeft />
          <span className="hidden sm:inline">Back to {`${type}-reports`}</span>
          <span className="sm:hidden">Back</span>
        </button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isQuiz
              ? data.sessionDetails.quiz.title
              : data.sessionDetails.surveyQuiz.title}
          </h1>
          <p className="text-gray-600">
            Host:{" "}
            {isQuiz
              ? data.sessionDetails.host.username
              : data.sessionDetails.surveyHost.username}
          </p>
          <div className="mt-2 flex gap-4 text-sm text-gray-600">
            <span>
              Join Code:{" "}
              {isQuiz
                ? data.sessionDetails.joinCode
                : data.sessionDetails.surveyJoinCode}
            </span>
            <span>•</span>
            <span>
              Status:{" "}
              {isQuiz
                ? data.sessionDetails.status
                : data.sessionDetails.surveyStatus}
            </span>
            <span>•</span>
            <span>
              Created:{" "}
              {new Date(data.sessionDetails.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Session Stats */}
        {isQuiz && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Participants"
              value={data.sessionStats.totalParticipants}
            />
            <StatCard
              title="Average Score"
              value={data.sessionStats.averageScore}
            />
            <StatCard
              title="Highest Score"
              value={data.sessionStats.highestScore}
            />
            <StatCard
              title="Lowest Score"
              value={data.sessionStats.lowestScore}
            />
          </div>
        )}

        {/* Leaderboard for Quiz */}
        {isQuiz && data.leaderboard && data.leaderboard.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-4">Rank</th>
                    <th className="text-left p-4">Player</th>
                    <th className="text-left p-4">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leaderboard.map((entry) => (
                    <tr key={entry.rank} className="border-t border-gray-100">
                      <td className="p-4">{entry.rank}</td>
                      <td className="p-4">{entry.player.username}</td>
                      <td className="p-4">{entry.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Question Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Question Analytics</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.questionAnalytics}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="questionTitle"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {isQuiz ? (
                  <>
                    <Bar
                      dataKey="successRate"
                      fill="#8884d8"
                      name="Success Rate (%)"
                    />
                    <Bar
                      dataKey="averageTimeTaken"
                      fill="#82ca9d"
                      name="Avg Time (s)"
                    />
                  </>
                ) : (
                  <Bar
                    dataKey="totalResponses"
                    fill="#8884d8"
                    name="Total Responses"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Question List */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">
              Detailed Question Analysis
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-4">Question</th>
                    {isQuiz ? (
                      <>
                        <th className="text-left p-4">Total Attempts</th>
                        <th className="text-left p-4">Correct Answers</th>
                        <th className="text-left p-4">Success Rate</th>
                      </>
                    ) : (
                      <>
                        <th className="text-left p-4">Total Responses</th>
                        <th className="text-left p-4">Average Time</th>
                        <th className="text-left p-4">Responses</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.questionAnalytics.map((question) => (
                    <tr key={question._id} className="border-t border-gray-100">
                      <td className="p-4">{question.questionTitle}</td>
                      {isQuiz ? (
                        <>
                          <td className="p-4">{question.totalAttempts}</td>
                          <td className="p-4">{question.correctAnswers}</td>
                          <td className="p-4">{question.successRate}%</td>
                        </>
                      ) : (
                        <>
                          <td className="p-4">{question.totalResponses}</td>
                          <td className="p-4">
                            {question.averageTimeTaken
                              ? `${question.averageTimeTaken}s`
                              : "N/A"}
                          </td>
                          <td className="p-4">
                            {question.responses
                              ? question.responses.join(", ")
                              : "No responses"}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionDetails;
