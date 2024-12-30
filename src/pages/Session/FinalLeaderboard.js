import React, { useState, useEffect } from "react";
import { Loader2, Trophy, Medal } from "lucide-react";
import { useLeaderboardContext } from "../../context/leaderboardContext";
import { useNotificationContext } from "../../context/notificationContext"; // Assuming this context exists

const FinalLeaderboard = ({ sessionId, userId, isAdmin }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userScore, setUserScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false); // To control the popup visibility
  const { getLeaderboard, getUserScore } = useLeaderboardContext();
  const { sendNotificationToUsers } = useNotificationContext(); // Assuming this method exists

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        console.log("Fetching data for:", { sessionId, userId, isAdmin });

        if (isAdmin) {
          const response = await getLeaderboard(sessionId);
          console.log("Admin leaderboard response:", response);
          setLeaderboardData(response.leaderboard || []);
        } else if (userId) {
          const response = await getUserScore(sessionId, userId);
          console.log("User score response:", response);
          setUserScore(response.user);
          console.log("Setting user score to:", response.user);
        }
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
         
        },
        body: JSON.stringify({
          type: "quiz_result", 
          sessionId: sessionId,
          users: leaderboardData.map(entry => entry.user._id)
        }),
      });
  
      if (!response.ok) {
        // Log the error response
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
    setShowPopup(false); // Close the popup without sending results
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Final Results
          </h1>
          <p className="text-gray-600">
            Quiz completed! Here are the final standings.
          </p>
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
                className="flex items-center justify-between p-4 rounded-lg transition-colors"
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
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {entry.totalPoints} pts
                </div>
              </div>
            ))}

            <button
              className="mt-6 bg-blue-500 text-white py-2 px-4 rounded"
              onClick={() => setShowPopup(true)} // Open the popup
            >
              Send Results 
            </button>

            {showPopup && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Are you sure you want to send the results to all users?
                  </h3>
                  <div className="flex gap-4">
                    <button
                      className="bg-blue-500 text-white py-2 px-4 rounded"
                      onClick={handleSendResults}
                    >
                      Yes, Send Results
                    </button>
                    <button
                      className="bg-gray-400 text-white py-2 px-4 rounded"
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
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quiz Complete!</h2>
        <p className="text-gray-600 mt-2">Here's how you did</p>
      </div>

      {!userScore ? (
        <div className="text-center text-gray-500 py-4">
          <p>No score recorded</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <p className="text-4xl font-bold text-blue-600 mb-2">
              {userScore.totalPoints} pts
            </p>
            <p className="text-gray-600">Final Score</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
              {userScore.rank === 1 ? (
                <Trophy className="w-10 h-10 text-yellow-500" />
              ) : userScore.rank === 2 ? (
                <Medal className="w-10 h-10 text-gray-400" />
              ) : userScore.rank === 3 ? (
                <Medal className="w-10 h-10 text-yellow-700" />
              ) : (
                <span className="text-gray-600 font-semibold">
                  #{userScore.rank}
                </span>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xl font-semibold text-gray-800">
                #{userScore.rank}
              </p>
              <p className="text-gray-400 font-semibold">Your Rank</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalLeaderboard;
