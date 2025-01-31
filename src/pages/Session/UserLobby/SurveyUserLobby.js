import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useSurveySessionContext } from "../../../context/surveySessionContext";
import { useAuthContext } from "../../../context/AuthContext";

const CACHE_KEY = "survey_session_data";
const SOCKET_RECONNECTION_ATTEMPTS = 3;

const SurveyUserLobby = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuthContext();
  const { checkGuestStatus } = useSurveySessionContext();

  const [socket, setSocket] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [error, setError] = useState(null);
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);

  // Enhanced cache initialization
  const [surveyData, setSurveyData] = useState(() => {
    try {
      // Try to get data from sessionStorage first
      const sessionData = sessionStorage.getItem("surveyData");
      if (sessionData) {
        return JSON.parse(sessionData);
      }

      // Fallback to localStorage if sessionStorage is empty
      const localData = localStorage.getItem(CACHE_KEY);
      if (localData) {
        const parsedData = JSON.parse(localData);
        // Validate cache timestamp (24 hours)
        if (Date.now() - parsedData.timestamp < 24 * 60 * 60 * 1000) {
          // Sync with sessionStorage
          sessionStorage.setItem("surveyData", JSON.stringify(parsedData.data));
          return parsedData.data;
        } else {
          // Clear expired cache
          localStorage.removeItem(CACHE_KEY);
        }
      }
      return null;
    } catch (error) {
      console.error("Cache initialization error:", error);
      return null;
    }
  });

  const sessionId = searchParams.get("sessionId");

  // Cache survey data with timestamp
  const cacheSurveyData = (data) => {
    try {
      // Store in both sessionStorage and localStorage
      sessionStorage.setItem("surveyData", JSON.stringify(data));
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
          sessionId,
        })
      );
      setSurveyData(data);
    } catch (error) {
      console.error("Cache storage error:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      setActiveUser(user);
    } else {
      const guestUser = checkGuestStatus();
      if (guestUser) {
        setActiveUser(guestUser);
      }
    }
  }, [isAuthenticated, user, checkGuestStatus]);

  useEffect(() => {
    if (activeUser && sessionId) {
      const newSocket = io(`${process.env.REACT_APP_API_URL}`, {
        reconnectionAttempts: SOCKET_RECONNECTION_ATTEMPTS,
        reconnectionDelay: 1000,
      });
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Socket connected");
        setError(null);
        setReconnectionAttempts(0);

        newSocket.emit("join-survey-session", {
          sessionId,
          userId: activeUser._id || activeUser.id,
          username: activeUser.username,
          isGuest: activeUser.isGuest || false,
          isReconnection: true,
        });
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

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setError("Connection error. Attempting to reconnect...");
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [activeUser, sessionId]);

  // Handle survey session events
  useEffect(() => {
    if (!socket) return;

    socket.on("survey-session-started", (data) => {
      // Cache the latest survey data before navigation
      if (data.session?.surveyQuiz) {
        cacheSurveyData({
          title: data.session.surveyQuiz.title,
          description: data.session.surveyQuiz.description,
          categories: data.session.surveyQuiz.categories,
        });
      }
      navigate(
        `/survey-play?surveyId=${data.session.surveyQuiz._id}&sessionId=${sessionId}`
      );
    });

    socket.on("survey-session-ended", () => {
      // Clear cache when session ends
      sessionStorage.removeItem("surveyData");
      localStorage.removeItem(CACHE_KEY);
      navigate("/joinsurvey");
    });

    socket.on("survey-data-update", (data) => {
      // Handle any real-time updates to survey data
      cacheSurveyData(data);
    });

    return () => {
      socket.off("survey-session-started");
      socket.off("survey-session-ended");
      socket.off("survey-data-update");
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

  if (!activeUser) {
    return (
      <div className="min-h-screen bg-purple-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
          <p className="text-center text-red-600">
            Connection error. Please reconnect to continue.
          </p>
          <div className="mt-4 text-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try reconnecting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="text-center">
            {activeUser?.isGuest && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  Guest: {activeUser.username}
                </span>
              </div>
            )}
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
          {surveyData ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">
                  {surveyData.title}
                </h3>
                <p className="text-gray-600">{surveyData.description}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold mb-2">Categories:</h4>
                <div className="space-y-2">
                  {surveyData.categories.map((category) => (
                    <div
                      key={category._id}
                      className="bg-gray-50 p-3 rounded-lg"
                    >
                      <p className="font-medium">{category.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  <p className="text-gray-600 mt-2">
                    The survey will begin when the host starts the session
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
            <div
              className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center"
              role="alert"
            >
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

export default SurveyUserLobby;
