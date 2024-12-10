import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSessionContext } from "../../context/sessionContext";
import { Loader2, ChevronRight, Users } from "lucide-react";
import io from "socket.io-client";
import Navbar from "../../components/NavbarComp";

const AdminLobby = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPin, setShowPin] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [socket, setSocket] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentItemType, setCurrentItemType] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [slides, setSlides] = useState([]);
  const [players, setPlayers] = useState([]);

  const { createSession, startSession, nextQuestion, loading } =
    useSessionContext();

  const quizId = searchParams.get("quizId");

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  // Initialize session and listen for socket events
  useEffect(() => {
    const initSession = async () => {
      try {
        const data = await createSession(quizId);
        console.log("Session created:", data);
        setSessionData(data);

        if (data.players) {
          setPlayers(data.players);
        }

        if (socket) {
          socket.emit("create-session", {
            sessionId: data._id,
            joinCode: data.joinCode,
          });
        }

        setTimeout(() => setShowPin(true), 1000);
      } catch (error) {
        console.error("Failed to initialize session:", error);
      }
    };

    if (socket) {
      initSession();
    }
  }, [quizId, socket]);

  // Listen for player updates
  useEffect(() => {
    if (socket && sessionData) {
      socket.on("player-joined", (data) => {
        console.log("Player joined:", data);
        setPlayers((currentPlayers) => {
          // Check the structure of the incoming data
          const newPlayer = data.user || data; // Handle both possible structures
          if (!newPlayer) return currentPlayers;

          // Only add if player isn't already in the list
          if (!currentPlayers.some((p) => p._id === newPlayer._id)) {
            return [...currentPlayers, newPlayer];
          }
          return currentPlayers;
        });
      });

      socket.on("player-left", (data) => {
        console.log("Player left:", data);
        setPlayers((currentPlayers) =>
          currentPlayers.filter((p) => p._id !== data.userId)
        );
      });

      socket.on("answer-submitted", (answerDetails) => {
        console.log("Answer received:", answerDetails);
        // Handle answer submission if needed
      });

      return () => {
        socket.off("player-joined");
        socket.off("player-left");
        socket.off("answer-submitted");
      };
    }
  }, [socket, sessionData]);

  const handleStartSession = async () => {
    try {
      const response = await startSession(
        sessionData.joinCode,
        sessionData._id
      );
      console.log("Start session response:", response);

      setQuestions(response.questions || []);
      setSlides(response.slides || []);

      // Replace the existing logic with navigation to Start page
      navigate(
        `/start?quizId=${quizId}&sessionId=${sessionData._id}&joinCode=${sessionData.joinCode}&in_progress=true`
      );
      if (socket) {
        socket.emit("session-started", {
          sessionId: sessionData._id,
          questions: response.questions,
          slides: response.slides,
        });
      }
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const handleNextItem = async () => {
    try {
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

  // Update the renderPlayers function with safer data handling
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
            <div>
              <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                Invite
              </button>
            </div>
            <div>
            {!currentItem && (
            <button
              onClick={handleStartSession}
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
      </div>

      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {players?.map((player) => {
            // Extract display information safely
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
          }) || null}
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
              {/* Game PIN Card */}
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

              {/* Players Section */}
              {renderPlayers()}

              {/* Current Item Display */}
              {currentItem && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  {renderCurrentItem()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLobby;
