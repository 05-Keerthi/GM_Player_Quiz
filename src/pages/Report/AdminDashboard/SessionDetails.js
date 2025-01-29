import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../../components/NavbarComp";
import { ArrowBigLeft, Trophy } from "lucide-react";
import { paginateData, PaginationControls } from "../../../utils/pagination";

// Podium Step Component
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

// Top Performers Component
const TopPerformers = ({ leaderboard }) => {
  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-8">Top Performers</h2>
      <div className="flex items-end justify-center gap-4 h-64">
        {topThree.map((entry, index) => (
          <PodiumStep
            key={index}
            rank={index + 1}
            username={entry.player.username}
            score={entry.score}
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

const SessionDetails = () => {
  const navigate = useNavigate();
  const { type, sessionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isQuiz = type === "quizzes";

  // Pagination states
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [questionsPage, setQuestionsPage] = useState(1);
  const itemsPerPage = 10;

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

  // Paginate the leaderboard and questions data
  const paginatedLeaderboard = paginateData(
    data.leaderboard || [],
    leaderboardPage,
    itemsPerPage
  );

  const paginatedQuestions = paginateData(
    data.questionAnalytics || [],
    questionsPage,
    itemsPerPage
  );

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

        {/* Top Performers Podium and Full Leaderboard */}
        {isQuiz && data.leaderboard && data.leaderboard.length > 0 && (
          <>
            <TopPerformers leaderboard={data.leaderboard} />
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Full Leaderboard</h2>
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
                    {paginatedLeaderboard.currentItems.map((entry) => (
                      <tr key={entry.rank} className="border-t border-gray-100">
                        <td className="p-4">{entry.rank}</td>
                        <td className="p-4">{entry.player.username}</td>
                        <td className="p-4">{entry.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.leaderboard.length > itemsPerPage && (
                  <PaginationControls
                    currentPage={leaderboardPage}
                    totalPages={paginatedLeaderboard.totalPages}
                    onPageChange={setLeaderboardPage}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* Question Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
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
                  {paginatedQuestions.currentItems.map((question) => (
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
              {data.questionAnalytics.length > itemsPerPage && (
                <PaginationControls
                  currentPage={questionsPage}
                  totalPages={paginatedQuestions.totalPages}
                  onPageChange={setQuestionsPage}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionDetails;
