// components/Leaderboard.jsx
import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useLeaderboardContext } from '../../context/leaderboardContext';

const Leaderboard = ({ sessionId, userId, isAdmin }) => {
  const { getLeaderboard, getUserScore } = useLeaderboardContext();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userScore, setUserScore] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        if (isAdmin) {
          const data = await getLeaderboard(sessionId);
          setLeaderboardData(data.leaderboard);
        } else {
          const data = await getUserScore(sessionId, userId);
          setUserScore(data.user);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };

    const interval = setInterval(fetchLeaderboard, 5000); // Update every 5 seconds
    fetchLeaderboard(); // Initial fetch

    return () => clearInterval(interval);
  }, [sessionId, userId, isAdmin]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h2 className="text-xl font-bold">
          {isAdmin ? 'Leaderboard' : 'Your Score'}
        </h2>
      </div>

      {isAdmin ? (
        <div className="space-y-4">
          {leaderboardData.map((player, index) => (
            <div 
              key={player._id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg">{index + 1}</span>
                <span>{player.username}</span>
              </div>
              <span className="font-semibold">{player.score} pts</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {userScore?.score || 0}
          </div>
          <div className="text-gray-600">Points</div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;