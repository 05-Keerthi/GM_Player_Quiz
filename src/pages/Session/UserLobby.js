// UserLobby.js
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSessionContext } from "../../context/sessionContext";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";

const UserLobby = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [socket, setSocket] = useState(null);
  const { joinSession, loading } = useSessionContext();

  const joinCode = searchParams.get("code");
  const sessionId = searchParams.get("sessionId");

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  // Initialize socket and join session
  useEffect(() => {
    if (isAuthenticated && joinCode && sessionId) {
      const newSocket = io("http://localhost:5000");
      setSocket(newSocket);

      newSocket.emit("join-session", { sessionId, joinCode });

      newSocket.on("update-session", async (data) => {
        console.log("Session update:", data);
        try {
          await joinSession(joinCode, sessionId);
        } catch (err) {
          console.error("Failed to join session:", err);
        }
      });

      // Clean up socket connection
      return () => newSocket.disconnect();
    }
  }, [isAuthenticated, joinCode, sessionId]);

  // Listen for game events
  useEffect(() => {
    if (socket) {
      socket.on("session-started", () => {
        console.log("Quiz started!");
      });

      socket.on("question-changed", ({ question }) => {
        console.log("New question received:", question);
        setCurrentQuestion(question);
        setSelectedAnswer(null);
      });

      socket.on("session-ended", () => {
        console.log("Quiz ended");
        navigate("/results"); // Make sure you have a results route
      });

      // Clean up event listeners
      return () => {
        socket.off("session-started");
        socket.off("question-changed");
        socket.off("session-ended");
      };
    }
  }, [socket, navigate]);

  const handleAnswerSubmit = async (answer) => {
    setSelectedAnswer(answer);
    try {
      if (socket) {
        socket.emit("answer-submitted", {
          sessionId,
          answerDetails: {
            answer,
            questionId: currentQuestion._id,
            userId: localStorage.getItem("userId"),
          },
        });
      }
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }
  };

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Authentication Required</h2>
          </div>
          <div className="space-y-4">
            <p className="text-gray-600">
              Please log in or register to join the session.
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-purple-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Joining session...</span>
        </div>
      </div>
    );
  }

  // Waiting for quiz to start
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <div className="text-center py-6">
            <h2 className="text-xl font-semibold mb-2">
              Waiting for session to start...
            </h2>
            <p className="text-gray-600">
              The host will begin the session shortly
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Quiz question display
  return (
    <div className="min-h-screen bg-purple-100 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">{currentQuestion.question}</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSubmit(option)}
                disabled={selectedAnswer !== null}
                className={`h-24 text-lg rounded-lg border transition-colors ${
                  selectedAnswer === option
                    ? "bg-blue-100 border-blue-500 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLobby;
