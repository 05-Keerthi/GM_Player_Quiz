// SurveyJoin.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSurveySessionContext } from "../../context/surveySessionContext";

const SurveyJoin = () => {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const { joinSurveySession, loading } = useSurveySessionContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!joinCode.trim()) {
      setError("Please enter a Game PIN");
      return;
    }

    try {
      const response = await joinSurveySession(joinCode);
      if (response.session) {
        navigate(
          `/survey-user-lobby?code=${joinCode}&sessionId=${response.session._id}`
        );
      } else {
        setError("Invalid response from server");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid Game PIN");
    }
  };

  return (
    <div className="min-h-screen bg-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">Ready to join?</h1>
        <p className="text-gray-600 text-center mb-8">
          Enter your game PIN below
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Game PIN"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-3xl tracking-wider"
              maxLength={6}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || joinCode.length < 6}
            className="w-full bg-blue-600 text-white py-4 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xl"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Joining...
              </>
            ) : (
              "Join"
            )}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500 text-center">
          Game PINs are 6 digits long
        </p>
      </div>
    </div>
  );
};

export default SurveyJoin;
