import { useState, useEffect } from "react";
import io from "socket.io-client";
import { Loader2 } from "lucide-react";
import { useLeaderboardContext } from "../context/leaderboardContext";

const LeaderboardDisplay = ({ sessionId, userId, isAdmin }) => {
  const [scores, setScores] = useState([]);
  const [userScore, setUserScore] = useState(null);
  const { getLeaderboard, getUserScore } = useLeaderboardContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = io("http://localhost:5000");

    const initializeScores = async () => {
      try {
        if (isAdmin) {
          const response = await getLeaderboard(sessionId);
          setScores(response.leaderboard || []);
        } else if (userId) {
          const response = await getUserScore(sessionId, userId);
          setUserScore(response.user || null);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    socket.on("answer-submitted", initializeScores);
    socket.emit("join-leaderboard", { sessionId });
    initializeScores();

    return () => socket.disconnect();
  }, [sessionId, userId, isAdmin]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
        {scores.length === 0 ? (
          <p className="text-gray-500 text-center">No scores yet</p>
        ) : (
          <div className="space-y-2">
            {scores.map((entry) => (
              <div
                key={entry.user._id}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">#{entry.rank}</span>
                  <span>{entry.user.username}</span>
                </div>
                <div className="font-semibold">{entry.totalPoints} pts</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-2">Your Score</h2>
      {!userScore ? (
        <p className="text-gray-500 text-center">No score yet</p>
      ) : (
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">Rank: #{userScore.rank || "-"}</p>
            <p className="text-gray-600">
              Username: {userScore.user?.username}
            </p>
          </div>
          <div className="text-2xl font-bold">
            {userScore.totalPoints || 0} pts
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardDisplay;
