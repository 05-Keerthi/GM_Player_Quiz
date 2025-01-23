import React, { useState, useEffect } from "react";
import { Loader2, Trophy, Medal } from "lucide-react";
import { useLeaderboardContext } from "../../context/leaderboardContext";

const FinalLeaderboard = ({ sessionId, userId, isAdmin }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const { getLeaderboard } = useLeaderboardContext();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        console.log("Fetching data for:", { sessionId, userId, isAdmin });
        const response = await getLeaderboard(sessionId);
        console.log("Leaderboard response:", response);
        setLeaderboardData(response.leaderboard || []);
      } catch (error) {
        console.error("Error in fetchLeaderboardData:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [sessionId, userId, isAdmin]);

  const handleSendResults = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/notifications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: "quiz_result",
            sessionId: sessionId,
            users: leaderboardData.map((entry) => entry.user._id),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error details:", errorData);
        throw new Error(errorData.message || "Failed to send notifications");
      }

      const data = await response.json();
      console.log("Results sent successfully:", data);
      setShowPopup(false);
    } catch (error) {
      console.error("Error sending notifications:", error);
    }
  };

  const handlePopupClose = () => {
    setShowPopup(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 role="status" className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Find user's position and score
  const userEntry = leaderboardData.find((entry) => entry.user._id === userId);
  const userRank = userEntry ? leaderboardData.indexOf(userEntry) + 1 : null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Final Results</h1>
        <p className="text-gray-600">
          Quiz completed! Here are the final standings.
        </p>
        {!isAdmin && userEntry && (
          <div className="mt-4 bg-blue-50 rounded-lg p-4">
            <p className="text-xl font-semibold text-gray-800">
              Your Position: #{userRank}
            </p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {userEntry.totalPoints} pts
            </p>
          </div>
        )}
      </div>

      {leaderboardData.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No participants in this quiz</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaderboardData.map((entry, index) => (
            <div
              key={entry.user._id}
              className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                entry.user._id === userId
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : ""
              }`}
              style={{
                backgroundColor:
                  entry.user._id === userId
                    ? "#EFF6FF" // Keep blue tint for current user
                    : index === 0
                    ? "#FEF9C3"
                    : index === 1
                    ? "#F3F4F6"
                    : index === 2
                    ? "#FEF3C7"
                    : "white",
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 text-center">
                  {index === 0 ? (
                    <Trophy className="w-6 h-6 text-yellow-500" />
                  ) : index === 1 ? (
                    <Medal className="w-6 h-6 text-gray-400" />
                  ) : index === 2 ? (
                    <Medal className="w-6 h-6 text-yellow-700" />
                  ) : (
                    <span className="text-gray-600 font-semibold">
                      #{index + 1}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {entry.user.username}
                    {entry.user._id === userId && " (You)"}
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {entry.totalPoints} pts
              </div>
            </div>
          ))}

          {isAdmin && (
            <button
              className="mt-6 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              onClick={() => setShowPopup(true)}
            >
              Send Results
            </button>
          )}

          {showPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Are you sure you want to send the results to all users?
                </h3>
                <div className="flex gap-4">
                  <button
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                    onClick={handleSendResults}
                  >
                    Yes, Send Results
                  </button>
                  <button
                    className="bg-gray-400 text-white py-2 px-4 rounded hover:bg-gray-500 transition-colors"
                    onClick={handlePopupClose}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinalLeaderboard;
