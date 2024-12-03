// AdminLobby.js
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSessionContext } from "../../context/sessionContext";
import { Loader2, ChevronRight } from "lucide-react";
import io from "socket.io-client";
import Navbar from "../../components/NavbarComp";

const AdminLobby = () => {
  const [searchParams] = useSearchParams();
  const [showPin, setShowPin] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [questions, setQuestions] = useState([]);
  const [socket, setSocket] = useState(null);

  const {
    createSession,
    getSessionPlayers,
    startSession,
    getSessionQuestions,
    loading,
  } = useSessionContext();

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
        setSessionData(data);

        if (socket) {
          socket.emit("create-session", {
            sessionId: data._id,
            joinCode: data.joinCode,
          });

          socket.on("session-created", (sessionInfo) => {
            console.log("Session created:", sessionInfo);
          });
        }

        setTimeout(() => setShowPin(true), 1000);

        const questionsData = await getSessionQuestions(
          data.joinCode,
          data._id
        );
        setQuestions(questionsData.questions);
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
      socket.on("update-session", async () => {
        try {
          const response = await getSessionPlayers(
            sessionData.joinCode,
            sessionData._id
          );
          setPlayers(response?.players || []);
        } catch (error) {
          console.error("Failed to fetch players:", error);
        }
      });

      socket.on("answer-updated", (answerDetails) => {
        console.log("Answer received:", answerDetails);
        // Handle answer updates if needed
      });
    }

    return () => {
      if (socket) {
        socket.off("update-session");
        socket.off("answer-updated");
      }
    };
  }, [socket, sessionData]);

  const handleStartSession = async () => {
    try {
      await startSession(sessionData.joinCode, sessionData._id);
      setCurrentQuestionIndex(0);

      if (socket) {
        socket.emit("start-session", { sessionId: sessionData._id });

        if (questions.length > 0) {
          socket.emit("change-question", {
            sessionId: sessionData._id,
            question: questions[0],
          });
        }
      }
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      if (socket) {
        socket.emit("change-question", {
          sessionId: sessionData._id,
          question: questions[nextIndex],
        });
      }
    }
  };
  return (
    <div className="min-h-screen bg-purple-100">
      <div className="fixed top-0 w-full z-50">
        <Navbar />
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        {!showPin ? (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-8">
              Setting up session
            </h1>
            <div className="flex items-center gap-2 text-xl text-gray-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              Loading Game PIN
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl">
            {/* Game PIN Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
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

            {/* Session Controls */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              {currentQuestionIndex === -1 ? (
                <button
                  onClick={handleStartSession}
                  disabled={players.length === 0}
                  className="w-full py-6 text-xl bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Start Session
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </h3>
                    <button
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Next Question <ChevronRight className="ml-2" />
                    </button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">
                      {questions[currentQuestionIndex]?.question}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Players Section */}
            <div className="space-y-6">
              <div className="bg-indigo-600 text-white text-xl font-semibold py-4 px-6 rounded-lg text-center">
                Players ({players.length})
              </div>

              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {players.map((player, index) => (
                    <div
                      key={index}
                      className="bg-indigo-100 rounded-lg p-4 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-indigo-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg font-bold">
                            {player.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-indigo-900 font-semibold truncate">
                          {player.username}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLobby;
