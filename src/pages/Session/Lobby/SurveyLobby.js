//SurveyLobby.js
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useSurveySessionContext } from "../../../context/surveySessionContext";
import { Loader2, ChevronRight, Users } from "lucide-react";
import io from "socket.io-client";
import Navbar from "../../../components/NavbarComp";
import InviteModal from "../../../models/InviteModal";

const SurveyLobby = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const [showPin, setShowPin] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [socket, setSocket] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [surveyPlayers, setSurveyPlayers] = useState([]);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const { startSurveySession, nextSurveyQuestion, loading } =
    useSurveySessionContext();

  const surveyId = searchParams.get("surveyId");

  // Initialize socket connection
  useEffect(() => {
    console.log("Initializing socket connection");
    const newSocket = io("http://localhost:5000");
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

      // Initialize empty players array from session data
      setSurveyPlayers(state.sessionData.surveyPlayers || []);

      socket.emit("create-survey-session", {
        sessionId: state.sessionData._id,
        joinCode: state.sessionData.surveyJoinCode,
      });

      setTimeout(() => setShowPin(true), 1000);
    }
  }, [socket, state]);

  //Listen for surveyPlayers updates
  useEffect(() => {
    if (!socket || !sessionData) return;
  
    const handleSurveyPlayersJoined = (data) => {
      console.log("Survey player joined data:", data);
      setSurveyPlayers((currentSurveyPlayers) => {
        // Make sure we're getting the full user object from the data
        const newPlayer = data.user || data;
        if (!newPlayer || !newPlayer._id) return currentSurveyPlayers;
  
        // Check if player already exists and add with full details if not
        if (!currentSurveyPlayers.some((p) => p._id === newPlayer._id)) {
          return [...currentSurveyPlayers, {
            _id: newPlayer._id,
            username: newPlayer.username,
            email: newPlayer.email
          }];
        }
        return currentSurveyPlayers;
      });
    };
  
    socket.on("user-joined-survey", handleSurveyPlayersJoined);
  
    return () => {
      socket.off("user-joined-survey", handleSurveyPlayersJoined);
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

      setQuestions(response.questions || []);

      if (socket) {
        socket.emit("survey-session-started", {
          sessionId: sessionData._id,
          questions: response.questions,
        });
      }

      // Navigate to start session page
      navigate(
        `/start-survey?quizId=${surveyId}&sessionId=${sessionData._id}&joinCode=${sessionData.surveyJoinCode}&in_progress=true`
      );
    } catch (error) {
      console.error("Failed to start survey session:", error);
      setError("Failed to start survey session. Please try again.");
    }
  };

  const handleNextItem = async () => {
    try {
      setError(null);
      const response = await nextSurveyQuestion(
        sessionData.surveyJoinCode,
        sessionData._id
      );
      console.log("Next item response:", response);

      if (response.item) {
        setCurrentItem(response.item);

        if (socket) {
          socket.emit("next-survey-question", {
            sessionId: sessionData._id,
            item: response.item,
          });
        }
      }
    } catch (error) {
      console.error("Failed to get next survey question:", error);
      setError("Failed to get next survey question. Please try again.");
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

  const renderCurrentItem = () => {
    if (!currentItem) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Current question</h3>
          <button
            onClick={handleNextItem}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="ml-2" />
          </button>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          {currentItem ? (
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
                  <div key={option._id} className={`p-4 rounded-lg border`}>
                    <span>{option.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Timer: {currentItem.timer}s
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

  const renderSurveyPlayers = () => (
    <div className="space-y-6">
      <div className="bg-indigo-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <span className="text-xl font-semibold">
              Players ({surveyPlayers?.length || 0})
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
                onClick={handleStartSession}
                disabled={loading || !surveyPlayers?.length}
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          {surveyPlayers.map((participant) => {
            console.log("Rendering participant:", participant); // Debug log
            const playerId = participant._id || participant.id || "unknown";
            const username =
              participant.username || participant.name || "Anonymous";
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
                      {sessionData?.surveyJoinCode?.match(/.{1,3}/g)?.join(" ")}
                    </h1>
                  </div>

                  <div className="w-32 h-32">
                    <img
                      src={sessionData?.surveyQrCodeImageUrl}
                      alt="QR Code"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>

              {renderSurveyPlayers()}

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
          joinCode: sessionData?.surveyJoinCode,
        }}
        onInvite={handleInviteUsers}
      />
    </div>
  );
};

export default SurveyLobby;
