// UserLobby.js
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSessionContext } from "../../../context/sessionContext";

import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useAuthContext } from "../../../context/AuthContext";

const UserLobby = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuthContext();
  const [currentItem, setCurrentItem] = useState(null);
  const [currentItemType, setCurrentItemType] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [socket, setSocket] = useState(null);
  const { joinSession, loading: sessionLoading } = useSessionContext();

  const joinCode = searchParams.get("code");
  const sessionId = searchParams.get("sessionId");

  // Initialize socket and join session
  useEffect(() => {
    if (isAuthenticated && user && joinCode && sessionId) {
      const newSocket = io(`${process.env.REACT_APP_API_URL}`);
      setSocket(newSocket);

      newSocket.emit("join-session", {
        sessionId,
        joinCode,
        userId: user._id,
        username: user.username,
      });

      return () => newSocket.disconnect();
    }
  }, [isAuthenticated, user, joinCode, sessionId]);

  // Listen for game events
  useEffect(() => {
    if (socket) {
      socket.on("session-started", (data) => {
        console.log("Session started data:", data);
        navigate(
          `/play?quizId=${data.session.quiz._id}&sessionId=${sessionId}`
        );
      });

      socket.on("next-item", ({ type, item }) => {
        console.log("Next item received:", { type, item });
        setCurrentItem(item);
        setCurrentItemType(type);
        setSelectedAnswer(null);
      });

      socket.on("session-ended", () => {
        navigate("/results");
      });

      return () => {
        socket.off("session-started");
        socket.off("next-item");
        socket.off("session-ended");
      };
    }
  }, [socket, navigate, sessionId]);

  const handleAnswerSubmit = (option) => {
    if (currentItemType !== "question" || selectedAnswer || !user) return;

    setSelectedAnswer(option);
    if (socket) {
      socket.emit("answer-submitted", {
        sessionId,
        answerDetails: {
          answer: option.text,
          questionId: currentItem._id,
          userId: user._id,
        },
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-purple-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 role="status" className="w-6 h-6 animate-spin" />
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

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-purple-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Joining session...</span>
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

  return (
    <div className="min-h-screen bg-purple-100 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
        <div className="p-6 border-b">
          {currentItemType === "question" ? (
            <>
              <h2 className="text-xl font-bold">{currentItem.title}</h2>
              {currentItem.imageUrl && (
                <img
                  src={currentItem.imageUrl}
                  alt="Question"
                  className="mt-4 rounded-lg w-full"
                />
              )}
            </>
          ) : (
            <div>
              <h2 className="text-xl font-bold mb-2">{currentItem.title}</h2>
              <p className="text-gray-700">{currentItem.content}</p>
              {currentItem.imageUrl && (
                <img
                  src={currentItem.imageUrl}
                  alt={currentItem.title}
                  className="mt-4 rounded-lg w-full"
                />
              )}
            </div>
          )}
        </div>
        {currentItemType === "question" && (
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
        )}
      </div>
    </div>
  );
};

export default UserLobby;
