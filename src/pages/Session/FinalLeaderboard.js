import React, { useState, useEffect } from "react";
import { Loader2, Trophy, Medal } from "lucide-react";
import { useLeaderboardContext } from "../../context/leaderboardContext";

const FinalLeaderboard = ({ sessionId, isAdmin, userId }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const { getLeaderboard } = useLeaderboardContext();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const response = await getLeaderboard(sessionId);
        setLeaderboardData(response.leaderboard || []);
      } catch (error) {
        console.error("Error in fetchLeaderboardData:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [sessionId]);

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
      <div className="flex items-center justify-center p-4">
        <Loader2 role="status" className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const userScore = userId
    ? leaderboardData.find((entry) => entry.user._id === userId)
    : null;
  const userRank = userId
    ? leaderboardData.findIndex((entry) => entry.user._id === userId) + 1
    : null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 mx-auto mt-6 w-full max-w-lg">
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Final Results
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Quiz completed! Here are the final standings.
        </p>
      </div>

      {userId && userScore && (
        <div className="mb-6 sm:mb-8 space-y-4 border-b-4 border-black pb-4">
          <div className="bg-blue-50 rounded-lg p-4 sm:p-6 text-center">
            <p className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">
              {userScore.totalPoints} pts
            </p>
            <p className="text-sm sm:text-base text-gray-600">
              Your Final Score
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 flex items-center justify-center">
              {userRank === 1 ? (
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />
              ) : userRank === 2 ? (
                <Medal className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              ) : userRank === 3 ? (
                <Medal className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-700" />
              ) : (
                <span className="text-gray-600 font-semibold">#{userRank}</span>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
              <p className="text-lg sm:text-xl font-semibold text-gray-800">
                #{userRank}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 font-semibold">
                Your Rank
              </p>
            </div>
          </div>
        </div>
      )}

      {leaderboardData.length === 0 ? (
        <div className="text-center text-gray-500 py-6 sm:py-8">
          <p>No participants in this quiz</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 max-h-[32rem] overflow-y-auto pr-2">
          {leaderboardData.map((entry, index) => (
            <div
              key={entry.user._id}
              className={`flex items-center justify-between p-2 sm:p-3 rounded-lg transition-colors ${
                entry.user._id === userId
                  ? "bg-blue-50 border-4 border-blue-500"
                  : "border border-gray-100"
              }`}
              style={{
                backgroundColor:
                  index === 0
                    ? "#FEF9C3"
                    : index === 1
                    ? "#F3F4F6"
                    : index === 2
                    ? "#FEF3C7"
                    : "white",
              }}
            >
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex-shrink-0 w-6 sm:w-8 text-center">
                  {index === 0 ? (
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                  ) : index === 1 ? (
                    <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  ) : index === 2 ? (
                    <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-700" />
                  ) : (
                    <span className="text-sm sm:text-base text-gray-600 font-semibold">
                      #{index + 1}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                    {entry.user.username}
                  </p>
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600 ml-2">
                {entry.totalPoints} pts
              </div>
            </div>
          ))}

          {isAdmin && (
            <>
              <button
                className="mt-6 bg-blue-500 text-white py-2 px-4 rounded mx-auto block w-full sm:w-auto"
                onClick={() => setShowPopup(true)}
              >
                Send Results
              </button>
              {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4 z-50">
                  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg max-w-sm w-full">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
                      Are you sure you want to send the results to all users?
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <button
                        className="bg-blue-500 text-white py-2 px-4 rounded w-full sm:w-auto"
                        onClick={handleSendResults}
                      >
                        Yes, Send Results
                      </button>
                      <button
                        className="bg-gray-400 text-white py-2 px-4 rounded w-full sm:w-auto"
                        onClick={handlePopupClose}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FinalLeaderboard;
