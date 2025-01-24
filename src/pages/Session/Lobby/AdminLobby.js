// AdminLobby.js
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useSessionContext } from "../../../context/sessionContext";
import { Loader2, Users } from "lucide-react";
import io from "socket.io-client";
import Navbar from "../../../components/NavbarComp";
import InviteModal from "../../../models/InviteModal";

const AdminLobby = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const [showPin, setShowPin] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const { startSession, loading } = useSessionContext();

  const quizId = searchParams.get("quizId");

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

  // Initialize session using passed data
  useEffect(() => {
    if (socket && state?.sessionData) {
      console.log("Initializing session with data:", state.sessionData);
      setSessionData(state.sessionData);
      setPlayers(state.sessionData.players || []);

      socket.emit("create-session", {
        sessionId: state.sessionData._id,
        joinCode: state.sessionData.joinCode,
      });

      setTimeout(() => setShowPin(true), 1000);
    }
  }, [socket, state]);

  // Listen for player updates
  useEffect(() => {
    if (!socket || !sessionData) return;

    const handlePlayerJoined = (data) => {
      console.log("Player joined:", data);
      setPlayers((currentPlayers) => {
        const newPlayer = data.user || data;
        if (!newPlayer || !newPlayer._id) return currentPlayers;

        if (!currentPlayers.some((p) => p._id === newPlayer._id)) {
          return [...currentPlayers, newPlayer];
        }
        return currentPlayers;
      });
    };

    socket.on("player-joined", handlePlayerJoined);

    return () => {
      socket.off("player-joined", handlePlayerJoined);
    };
  }, [socket, sessionData]);

  const handleStartSession = async () => {
    try {
      setError(null);
      const response = await startSession(
        sessionData.joinCode,
        sessionData._id
      );
      console.log("Start session response:", response);

      if (socket) {
        socket.emit("session-started", {
          sessionId: sessionData._id,
          questions: response.questions,
          slides: response.slides,
          order: response.session?.quiz?.order || [],
        });
      }

      // Navigate to start page
      navigate(
        `/start?quizId=${response.session.quiz._id}&sessionId=${sessionData._id}&joinCode=${sessionData.joinCode}&in_progress=true`
      );
    } catch (error) {
      console.error("Failed to start session:", error);
      setError("Failed to start session. Please try again.");
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
          joinCode: sessionData.joinCode,
        });
      });

      setInviteModalOpen(false);
    } catch (error) {
      console.error("Error processing invitations:", error);
      setError("Failed to process invitations. Please try again.");
    }
  };

  const renderPlayers = () => (
    <div className="space-y-6">
      <div className="bg-indigo-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <span className="text-xl font-semibold" data-testid="players-count">
              Players ({players?.length || 0})
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setInviteModalOpen(true)}
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Invite
            </button>
            <button
              onClick={handleStartSession}
              disabled={loading || !players?.length}
              data-testid="start-button"
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </div>
              ) : (
                "Start Game"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {players?.map((player) => {
            const playerId = player?._id || player?.id || "unknown";
            const username = player?.username || player?.name || "Anonymous";
            const initial = username[0]?.toUpperCase() || "?";

            return (
              <div
                key={playerId}
                className="bg-indigo-50 rounded-lg p-4 flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {initial}
                    </span>
                  </div>
                  <p className="text-indigo-900 font-semibold truncate">
                    {username}
                  </p>
                </div>
              </div>
            );
          })}
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
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
              <div className="text-center">
                <h1
                  className="text-4xl font-bold text-gray-800 mb-8"
                  data-testid="loading-title"
                >
                  Setting up session
                </h1>
                <div
                  className="flex items-center gap-2 text-xl text-gray-600"
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
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
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

                  <div className="text-center px-8">
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
                      {sessionData?.joinCode}
                    </h1>
                  </div>

                  <div className="w-32 h-32">
                    <img
                      src={sessionData?.qrCodeImageUrl}
                      alt="QR Code"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>

              {renderPlayers()}
            </div>
          )}
        </div>
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        sessionData={{
          sessionId: sessionData?._id,
          joinCode: sessionData?.joinCode,
        }}
        onInvite={handleInviteUsers}
      />
    </div>
  );
};

export default AdminLobby;
