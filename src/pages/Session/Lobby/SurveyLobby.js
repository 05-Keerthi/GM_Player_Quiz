// SurveyLobby.js
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useSurveySessionContext } from "../../../context/surveySessionContext";
import { Loader2, Users } from "lucide-react";
import io from "socket.io-client";
import Navbar from "../../../components/NavbarComp";
import SurveyInviteModal from "../../../models/SurveyInviteModal";

const PlayerCard = ({ participant }) => {
  const playerId = participant._id || participant.id || "unknown";
  const username = participant.username || participant.name || "Anonymous";
  const initial = username[0]?.toUpperCase() || "?";
  const isGuest = participant.isGuest;

  return (
    <div
      key={playerId}
      className="bg-indigo-50 rounded-lg p-4 flex items-center justify-center"
    >
      <div className="text-center">
        {isGuest && (
          <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full mb-2">
            Guest
          </span>
        )}
        <div className="w-12 h-12 mx-auto mb-2 bg-indigo-500 rounded-full flex items-center justify-center">
          <span className="text-white text-lg font-bold">{initial}</span>
        </div>
        <p className="text-indigo-900 font-semibold truncate">{username}</p>
      </div>
    </div>
  );
};

const SurveyLobby = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const [showPin, setShowPin] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [socket, setSocket] = useState(null);
  const [surveyPlayers, setSurveyPlayers] = useState([]);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const { startSurveySession, loading, getSurveySessionById } =
    useSurveySessionContext();
  const sessionId = searchParams.get("sessionId");

  // Initialize socket connection
  useEffect(() => {
    console.log("Initializing socket connection");
    const newSocket = io(`${process.env.REACT_APP_API_URL}`);
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        console.log("Disconnecting socket");
        newSocket.disconnect();
      }
    };
  }, []);

  // Fetch session data and initialize
  useEffect(() => {
    const initializeSession = async () => {
      try {
        let currentSessionData;

        if (state?.sessionData) {
          // Use data from navigation state if available
          currentSessionData = state.sessionData;
        } else if (sessionId) {
          // Fetch session data if page was refreshed
          const response = await getSurveySessionById(sessionId);
          currentSessionData = response.session;
        }

        if (currentSessionData) {
          setSessionData(currentSessionData);
          // Set initial players from session data
          setSurveyPlayers(currentSessionData.surveyPlayers || []);

          if (socket) {
            socket.emit("create-survey-session", {
              sessionId: currentSessionData._id,
              joinCode: currentSessionData.surveyJoinCode,
            });
          }

          setTimeout(() => setShowPin(true), 1000);
        }
      } catch (error) {
        console.error("Failed to initialize session:", error);
        setError("Failed to load session data. Please try refreshing.");
      }
    };

    if (socket) {
      initializeSession();
    }
  }, [socket, state, sessionId, getSurveySessionById]);

  // Listen for player updates
  useEffect(() => {
    if (!socket || !sessionData) return;

    const handleSurveyPlayerJoined = (data) => {
      console.log("Survey player joined:", data);
      setSurveyPlayers((currentPlayers) => {
        const newPlayer = data.user || data;
        if (!newPlayer || !newPlayer._id) return currentPlayers;

        if (!currentPlayers.some((p) => p._id === newPlayer._id)) {
          return [
            ...currentPlayers,
            {
              _id: newPlayer._id,
              username: newPlayer.username,
              email: newPlayer.email,
              isGuest: newPlayer.isGuest || false,
            },
          ];
        }
        return currentPlayers;
      });
    };

    socket.on("user-joined-survey", handleSurveyPlayerJoined);

    // Listen for current players list
    socket.on("current-survey-players", (data) => {
      console.log("Received current survey players:", data);
      if (Array.isArray(data)) {
        setSurveyPlayers(data);
      }
    });

    // Request current players when socket connects
    socket.emit("get-current-survey-players", { sessionId: sessionData._id });

    return () => {
      socket.off("user-joined-survey", handleSurveyPlayerJoined);
      socket.off("current-survey-players");
    };
  }, [socket, sessionData]);

  const handleStartSession = async () => {
    try {
      setError(null);
      const response = await startSurveySession(
        sessionData.surveyJoinCode,
        sessionData._id
      );
      console.log("Start Survey session response:", response);

      if (socket) {
        socket.emit("survey-session-started", {
          sessionId: sessionData._id,
          questions: response.questions,
        });
      }

      // Navigate to start session page
      navigate(
        `/start-survey?surveyId=${sessionData.surveyQuiz._id}&sessionId=${sessionData._id}&joinCode=${sessionData.surveyJoinCode}&in_progress=true`
      );
    } catch (error) {
      console.error("Failed to start survey session:", error);
      setError("Failed to start survey session. Please try again.");
    }
  };

  const handleInviteUsers = async (selectedUsers) => {
    try {
      setError(null);
      if (!socket || !sessionData?._id) {
        console.error("Missing socket or session data");
        return;
      }

      console.log("Processing invites for users:", selectedUsers);

      // Emit socket events for each selected user
      selectedUsers.forEach((user) => {
        socket.emit("invite-user", {
          sessionId: sessionData._id,
          userId: user._id,
          joinCode: sessionData.surveyJoinCode,
        });
      });

      setInviteModalOpen(false);
    } catch (error) {
      console.error("Error processing invitations:", error);
      setError("Failed to process invitations. Please try again.");
    }
  };

  const renderSurveyPlayers = () => (
    <div className="space-y-6">
      <div className="bg-indigo-600 text-white p-4 rounded-lg">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Users className="w-6 h-6" />
            <span className="text-xl font-semibold" data-testid="players-count">
              Players ({surveyPlayers?.length || 0})
            </span>
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <button
              onClick={() => setInviteModalOpen(true)}
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Invite
            </button>
            <button
              onClick={handleStartSession}
              disabled={loading || !surveyPlayers?.length}
              data-testid="start-button"
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </div>
              ) : (
                "Start Survey"
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {surveyPlayers.map((participant) => (
            <PlayerCard
              key={participant._id || participant.id || "unknown"}
              participant={participant}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-purple-100">
      <div className="fixed top-0 w-full z-50">
        <Navbar />
      </div>

      <div className="pt-16 p-4">
        <div className="max-w-3xl mx-auto">
          {!showPin ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1
                  className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8"
                  data-testid="loading-title"
                >
                  Setting up session
                </h1>
                <div
                  className="flex items-center gap-2 text-lg sm:text-xl text-gray-600"
                  data-testid="loading-status"
                >
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Loading Game PIN
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="flex flex-col mb-4 md:mb-0">
                    <h2
                      className="text-xl text-gray-700"
                      data-testid="join-text"
                    >
                      Join at
                    </h2>
                    <p className="text-2xl font-bold text-gray-900">
                      www.gmplay.com
                    </p>
                  </div>

                  <div className="text-center px-8 mb-4 md:mb-0">
                    <p
                      className="text-xl text-gray-600"
                      data-testid="pin-label"
                    >
                      Game PIN:
                    </p>
                    <h1
                      className="text-5xl font-bold tracking-wider text-gray-900"
                      data-testid="pin-value"
                    >
                      {sessionData?.surveyJoinCode}
                    </h1>
                  </div>

                  <div className="w-32 h-32 md:w-24 md:h-24">
                    <img
                      src={sessionData?.surveyQrCodeImageUrl}
                      alt="QR Code"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>

              {renderSurveyPlayers()}
            </div>
          )}
        </div>
      </div>

      <SurveyInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        sessionData={{
          sessionId: sessionData?._id,
          joinCode: sessionData?.surveyJoinCode,
        }}
        onInvite={handleInviteUsers}
      />
    </div>
  );
};

export default SurveyLobby;
