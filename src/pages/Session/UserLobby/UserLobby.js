import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useAuthContext } from "../../../context/AuthContext";
import { useSessionContext } from "../../../context/sessionContext";

const CACHE_KEY = "quiz_session_data";
const SOCKET_RECONNECTION_ATTEMPTS = 3;

const UserLobby = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuthContext();
  const { joinSession, loading: sessionLoading } = useSessionContext();

  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);

  const joinCode = searchParams.get("code");
  const sessionId = searchParams.get("sessionId");

  // Initialize quiz data from cache
  const [quizData, setQuizData] = useState(() => {
    try {
      const sessionData = sessionStorage.getItem("quizData");
      if (sessionData) {
        return JSON.parse(sessionData);
      }

      const localData = localStorage.getItem(CACHE_KEY);
      if (localData) {
        const parsedData = JSON.parse(localData);
        if (Date.now() - parsedData.timestamp < 24 * 60 * 60 * 1000) {
          sessionStorage.setItem("quizData", JSON.stringify(parsedData.data));
          return parsedData.data;
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
      return null;
    } catch (error) {
      console.error("Cache initialization error:", error);
      return null;
    }
  });

  // Cache quiz data with timestamp
  const cacheQuizData = (data) => {
    try {
      const quizInfo = {
        title: data.quiz.title,
        description: data.quiz.description,
        totalQuestions: data.quiz.questions?.length || 0,
        categories: data.quiz.categories || [],
        order: data.quiz.order || [],
        status: data.status,
      };

      sessionStorage.setItem("quizData", JSON.stringify(quizInfo));
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: quizInfo,
          timestamp: Date.now(),
          sessionId,
        })
      );
      setQuizData(quizInfo);
    } catch (error) {
      console.error("Cache storage error:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user && joinCode && sessionId) {
      const newSocket = io(`${process.env.REACT_APP_API_URL}`, {
        reconnectionAttempts: SOCKET_RECONNECTION_ATTEMPTS,
        reconnectionDelay: 1000,
      });
      setSocket(newSocket);

      newSocket.emit("join-session", {
        sessionId,
        joinCode,
        userId: user._id,
        username: user.username,
        isReconnection: true,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected");
        setError(null);
        setReconnectionAttempts(0);
      });

      newSocket.on("reconnect_attempt", (attempt) => {
        setReconnectionAttempts(attempt);
        setError(
          `Reconnection attempt ${attempt}/${SOCKET_RECONNECTION_ATTEMPTS}`
        );
      });

      newSocket.on("reconnect_failed", () => {
        setError(
          "Connection lost. Please refresh the page or check your internet connection."
        );
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user, joinCode, sessionId]);

  useEffect(() => {
    if (!socket) return;

    socket.on("session-started", (data) => {
      if (data.session?.quiz) {
        cacheQuizData(data.session);
      }
      navigate(`/play?quizId=${data.session.quiz._id}&sessionId=${sessionId}`);
    });

    socket.on("session-ended", () => {
      sessionStorage.removeItem("quizData");
      localStorage.removeItem(CACHE_KEY);
      navigate("/join");
    });

    socket.on("quiz-data-update", (data) => {
      cacheQuizData(data);
    });

    return () => {
      socket.off("session-started");
      socket.off("session-ended");
      socket.off("quiz-data-update");
    };
  }, [socket, navigate, sessionId]);

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

  return (
    <div className="min-h-screen bg-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Waiting for Host</h2>
            {reconnectionAttempts > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Reconnection attempt: {reconnectionAttempts}/
                {SOCKET_RECONNECTION_ATTEMPTS}
              </p>
            )}
          </div>
        </div>

        <div className="p-6">
          {quizData ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">{quizData.title}</h3>
                <p className="text-gray-600">{quizData.description}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Categories:</h4>
                    <div className="space-y-2">
                      {quizData.categories.map((category) => (
                        <div
                          key={category._id}
                          className="p-2 bg-white rounded border border-gray-200"
                        >
                          <p className="font-medium">{category.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  <p className="text-gray-600 mt-2">
                    The quiz will begin when the host starts the session
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-blue-600 hover:text-blue-700 underline"
              >
                Try reconnecting
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserLobby;
