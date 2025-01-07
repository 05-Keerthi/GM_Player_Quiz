// AdminLobby.js
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useSessionContext } from "../../../context/sessionContext";
import { Loader2, ChevronRight, Users } from "lucide-react";
import io from "socket.io-client";
import Navbar from "../../../components/NavbarComp";
import InviteModal from "../../../models/InviteModal";
import { useNotificationContext } from "../../../context/notificationContext";

const AdminLobby = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const [showPin, setShowPin] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [socket, setSocket] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentItemType, setCurrentItemType] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [slides, setSlides] = useState([]);
  const [players, setPlayers] = useState([]);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [setShowPopup] = useState(false);
  const { startSession, nextQuestion, loading } = useSessionContext();
  const { createNotification } = useNotificationContext();

  const quizId = searchParams.get("quizId");

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(`${process.env.REACT_APP_API_URL}`);
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Initialize session using passed data
  useEffect(() => {
    if (socket && state?.sessionData) {
      setSessionData(state.sessionData);
      if (state.sessionData.players) {
        setPlayers(state.sessionData.players);
      }

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
        if (!newPlayer) return currentPlayers;

        if (!currentPlayers.some((p) => p._id === newPlayer._id)) {
          return [...currentPlayers, newPlayer];
        }
        return currentPlayers;
      });
    };

    const handlePlayerLeft = (data) => {
      console.log("Player left:", data);
      setPlayers((currentPlayers) =>
        currentPlayers.filter((p) => p._id !== data.userId)
      );
    };

    const handleAnswerSubmitted = (answerDetails) => {
      console.log("Answer received:", answerDetails);
      // Handle answer submission logic here
    };

    socket.on("player-joined", handlePlayerJoined);
    socket.on("player-left", handlePlayerLeft);
    socket.on("answer-submitted", handleAnswerSubmitted);

    return () => {
      socket.off("player-joined", handlePlayerJoined);
      socket.off("player-left", handlePlayerLeft);
      socket.off("answer-submitted", handleAnswerSubmitted);
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

      setQuestions(response.questions || []);
      setSlides(response.slides || []);

      const order = response.session?.quiz?.order || [];

      // Emit socket event for session start
      if (socket) {
        socket.emit("session-started", {
          sessionId: sessionData._id,
          questions: response.questions,
          slides: response.slides,
          order: order,
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

  const handleNextItem = async () => {
    try {
      setError(null);
      const response = await nextQuestion(
        sessionData.joinCode,
        sessionData._id
      );
      console.log("Next item response:", response);

      if (response.item) {
        setCurrentItem(response.item);
        setCurrentItemType(response.type);

        if (socket) {
          socket.emit("next-item", {
            sessionId: sessionData._id,
            type: response.type,
            item: response.item,
          });
        }
      }
    } catch (error) {
      console.error("Failed to get next item:", error);
      setError("Failed to get next item. Please try again.");
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

  const handleSessionUpdate = async () => {
    try {
      if (!sessionData || !sessionData.quiz) {
        console.error("No session data available");
        return;
      }

      const notificationData = {
        type: "session_update",
        sessionId: sessionData._id,
        quizTitle: sessionData.quiz.title,
        message: `The session for "${sessionData.quiz.title}" has started. If you have not yet joined the quiz, you will not be able to participate.`,
      };

      await createNotification(notificationData);
      console.log("Session update notification sent successfully");
      return true;
    } catch (error) {
      console.error("Error sending session update notification:", error);
      return false;
    }
  };

  const renderCurrentItem = () => {
    if (!currentItem) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            Current {currentItemType === "question" ? "Question" : "Slide"}
          </h3>
          <button
            onClick={handleNextItem}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="ml-2" />
          </button>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          {currentItemType === "question" ? (
            <div>
              <h4 className="font-medium text-xl mb-4">{currentItem.title}</h4>
              {currentItem.imageUrl && (
                <img
                  src={currentItem.imageUrl}
                  alt="Question"
                  className="mb-4 rounded-lg max-w-full h-auto"
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                {currentItem.options?.map((option) => (
                  <div
                    key={option._id}
                    className={`p-4 rounded-lg border ${
                      option.isCorrect
                        ? "bg-green-50 border-green-500"
                        : "bg-white"
                    }`}
                  >
                    <span className={option.isCorrect ? "text-green-700" : ""}>
                      {option.text}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Points: {currentItem.points} | Timer: {currentItem.timer}s
              </div>
            </div>
          ) : (
            <div>
              <h4 className="font-medium text-xl mb-2">{currentItem.title}</h4>
              <p className="text-gray-700 mb-4">{currentItem.content}</p>
              {currentItem.imageUrl && (
                <img
                  src={currentItem.imageUrl}
                  alt={currentItem.title}
                  className="rounded-lg max-w-full h-auto"
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPlayers = () => (
    <div className="space-y-6">
      <div className="bg-indigo-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <span className="text-xl font-semibold">
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
            {!currentItem && (
              <button
                onClick={async () => {
                  try {
                    await handleSessionUpdate();
                    await handleStartSession();
                  } catch (error) {
                    console.error(
                      "Error sending session update or starting session:",
                      error
                    );
                    setError("Failed to start session. Please try again.");
                  }
                }}
                disabled={loading || !players?.length}
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
            )}
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
                <h1 className="text-4xl font-bold text-gray-800 mb-8">
                  Setting up session
                </h1>
                <div className="flex items-center gap-2 text-xl text-gray-600">
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
                    <h2 className="text-xl text-gray-700">Join at</h2>
                    <p className="text-2xl font-bold text-gray-900">
                      www.gmplay.com
                    </p>
                  </div>

                  <div className="text-center px-8">
                    <p className="text-xl text-gray-600">Game PIN:</p>
                    <h1 className="text-5xl font-bold tracking-wider text-gray-900">
                      {sessionData?.joinCode?.match(/.{1,3}/g)?.join(" ")}
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

              {currentItem && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  {renderCurrentItem()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        sessionData={{
          sessionId: sessionData?._id,
          joinCode: sessionData?.joinCode, // Changed from surveyJoinCode to joinCode
        }}
        onInvite={handleInviteUsers}
      />
    </div>
  );
};

export default AdminLobby;
