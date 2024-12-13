//SuvrveyUserLobby.js
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useSurveySessionContext } from "../../../context/surveySessionContext";
import { useAuthContext } from "../../../context/AuthContext";

const SurveyUserLobby = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuthContext();
  const [currentItem, setCurrentItem] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isLastItem, setIsLastItem] = useState(false);
  const { loading: sessionLoading } = useSurveySessionContext();
  const joinCode = searchParams.get("code");
  const sessionId = searchParams.get("sessionId");

  useEffect(() => {
    if (isAuthenticated && user && joinCode && sessionId) {
      const newSocket = io("http://localhost:5000");
      setSocket(newSocket);
  
      // Join the survey session with full user details
      newSocket.emit("join-survey-session", {
        sessionId,
        userId: user._id,
        username: user.username,
        email: user.email  // Add email to the emission
      });
  
      return () => newSocket.disconnect();
    }
  }, [isAuthenticated, user, joinCode, sessionId]);

  // Listen for survey session events
  useEffect(() => {
    if (socket) {
      socket.on("survey-session-started", (data) => {
        console.log("survey Session started data:", data);
        navigate(
          `/survey-play?surveyId=${data.surveyId}&sessionId=${sessionId}`
        );
      });

      // Handle next survey question
      socket.on("next-survey-question", ({ item }) => {
        console.log("Next survey question:", { item });
        setCurrentItem(item);
        setSelectedAnswer(null);
      });

      // Handle survey session end
      socket.on("survey-session-ended", () => {
        navigate("/survey-results");
      });

      return () => {
        socket.off("survey-session-started");
        socket.off("next-survey-question");
        socket.off("survey-session-ended");
      };
    }
  }, [socket, navigate, sessionId]);

  const handleAnswerSubmit = (option) => {
    if (currentItem !== "question" || selectedAnswer || !user) return;

    setSelectedAnswer(option);

    if (socket) {
      socket.emit("survey-submit-answer", {
        sessionId,
        answerDetails: {
          answer: option.text,
          questionId: currentItem._id,
          userId: user._id,
        },
      });
    }
  };

  // Loading and authentication states remain similar to previous implementation
  if (authLoading) {
    return (
      <div className="min-h-screen bg-purple-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Authentication Required</h2>
          </div>
          <div className="space-y-4">
            <p className="text-gray-600">
              Please log in or register to join the survey session.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="w-full border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-purple-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Joining survey session...</span>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="min-h-screen bg-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <div className="text-center py-6">
            <h2 className="text-xl font-semibold mb-2">
              Waiting for survey to start...
            </h2>
            <p className="text-gray-600">
              The host will begin the survey shortly
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-100 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">{currentItem.title}</h2>
          {currentItem.imageUrl && (
            <img
              src={currentItem.imageUrl}
              alt="Survey Question"
              className="mt-4 rounded-lg w-full"
            />
          )}
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {currentItem.options?.map((option) => (
              <button
                key={option._id}
                onClick={() => handleAnswerSubmit(option)}
                disabled={selectedAnswer !== null}
                className={`h-24 text-lg rounded-lg border transition-colors ${
                  selectedAnswer === option
                    ? "bg-blue-100 border-blue-500 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
        {isLastItem && (
          <div className="p-4 text-center text-gray-600">
            This is the last question in the survey
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyUserLobby;
