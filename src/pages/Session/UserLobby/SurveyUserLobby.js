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
  const { checkGuestStatus } = useSurveySessionContext();

  const [socket, setSocket] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [isWaiting, setIsWaiting] = useState(true);
  const [error, setError] = useState(null);

  const joinCode = searchParams.get("code");
  const sessionId = searchParams.get("sessionId");

  // Set active user
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

  // Socket initialization
  useEffect(() => {
    if (activeUser && sessionId) {
      const newSocket = io(`${process.env.REACT_APP_API_URL}`);
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Socket connected, joining session");
        newSocket.emit("join-survey-session", {
          sessionId,
          userId: activeUser._id || activeUser.id,
          username: activeUser.username,
          isGuest: activeUser.isGuest || false,
        });
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setError("Connection error. Please try again.");
      });

      return () => newSocket.disconnect();
    }
  }, [activeUser, sessionId]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on("survey-session-started", (data) => {
      console.log("Survey session started:", data);
      navigate(
        `/survey-play?surveyId=${data.session.surveyQuiz._id}&sessionId=${sessionId}`
      );
    });

    socket.on("survey-session-ended", () => {
      navigate("/joinsurvey");
    });

    return () => {
      socket.off("survey-session-started");
      socket.off("survey-session-ended");
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
      <div className="min-h-screen bg-purple-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Session Error</h2>
          <p className="text-gray-600">Please rejoin the survey session.</p>
          <button
            onClick={() => navigate("/joinsurvey")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Join Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center">
          {activeUser.isGuest && (
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                Guest: {activeUser.username}
              </span>
            </div>
          )}
          <h2 className="text-2xl font-bold mb-4">Waiting for Host</h2>
          <p className="text-gray-600 mb-6">
            The survey will begin when the host starts the session
          </p>
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
          {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default SurveyUserLobby;
