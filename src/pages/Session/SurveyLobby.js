import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useSurveySessionContext } from "../../context/surveySessionContext";
import { Loader2, ChevronRight, Users } from "lucide-react";
import io from "socket.io-client";
import Navbar from "../../components/NavbarComp";
import InviteModal from "../../models/InviteModal";

const SurveyLobby = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const [showPin, setShowPin] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [socket, setSocket] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  const { startSurveySession, nextQuestion, loading } =
    useSurveySessionContext();

  const surveyId = searchParams.get("surveyId");
  const sessionId = searchParams.get("sessionId");

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  // Initialize session using passed data
  useEffect(() => {
    if (socket && state?.sessionData) {
      setSessionData(state?.sessionData);
      if (state?.sessionData?.participants) {
        setParticipants(state.sessionData.participants);
      }

      socket.emit("create-survey-session", {
        sessionId: sessionId,
        surveyJoinCode: state?.sessionData?.surveyJoinCode,
      });

      setTimeout(() => setShowPin(true), 1000);
    }
  }, [socket, sessionId, state]);

  // Listen for participant updates
  useEffect(() => {
    if (socket && sessionData) {
      socket.on("participant-joined", (data) => {
        console.log("Participant joined:", data);
        setParticipants((currentParticipants) => {
          const newParticipant = data.user || data;
          if (!newParticipant) return currentParticipants;

          if (!currentParticipants.some((p) => p._id === newParticipant._id)) {
            return [...currentParticipants, newParticipant];
          }
          return currentParticipants;
        });
      });

      socket.on("participant-left", (data) => {
        console.log("Participant left:", data);
        setParticipants((currentParticipants) =>
          currentParticipants.filter((p) => p._id !== data.userId)
        );
      });

      socket.on("response-submitted", (responseDetails) => {
        console.log("Response received:", responseDetails);
      });

      return () => {
        socket.off("participant-joined");
        socket.off("participant-left");
        socket.off("response-submitted");
      };
    }
  }, [socket, sessionData]);

  const handleStartSession = async () => {
    try {
      const response = await startSurveySession(sessionId);
      console.log("Start session response:", response);

      setQuestions(response.questions || []);

      navigate(
        `/survey-start?surveyId=${surveyId}&sessionId=${sessionId}&in_progress=true`
      );

      if (socket) {
        socket.emit("survey-session-started", {
          sessionId: sessionId,
          questions: response.questions,
        });
      }
    } catch (error) {
      console.error("Failed to start survey session:", error);
    }
  };

  const handleNextQuestion = async () => {
    try {
      const response = await nextQuestion(sessionId);
      console.log("Next question response:", response);

      if (response.question) {
        setCurrentQuestion(response.question);

        if (socket) {
          socket.emit("next-question", {
            sessionId: sessionId,
            question: response.question,
          });
        }
      }
    } catch (error) {
      console.error("Failed to get next question:", error);
    }
  };

  const handleInviteUsers = (selectedUsers) => {
    if (socket && sessionData) {
      selectedUsers.forEach((user) => {
        socket.emit("invite-user-survey", {
          sessionId: sessionId,
          userId: user._id,
          surveyJoinCode: sessionData.surveyJoinCode,
        });
      });
    }
  };

  const renderCurrentQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Current Question</h3>
          <button
            onClick={handleNextQuestion}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="ml-2" />
          </button>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div>
            <h4 className="font-medium text-xl mb-4">
              {currentQuestion.title}
            </h4>
            {currentQuestion.imageUrl && (
              <img
                src={currentQuestion.imageUrl}
                alt="Question"
                className="mb-4 rounded-lg max-w-full h-auto"
              />
            )}
            {currentQuestion.type === "multiple_choice" && (
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options?.map((option) => (
                  <div
                    key={option._id}
                    className="p-4 rounded-lg border bg-white"
                  >
                    {option.text}
                  </div>
                ))}
              </div>
            )}
            {currentQuestion.type === "open_ended" && (
              <div className="p-4 rounded-lg border bg-white">
                <p className="text-gray-500">Open-ended response question</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderParticipants = () => (
    <div className="space-y-6">
      <div className="bg-indigo-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <span className="text-xl font-semibold">
              Participants ({participants?.length || 0})
            </span>
          </div>
          <div className="flex gap-2">
            <div>
              <button
                onClick={() => setInviteModalOpen(true)}
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Invite
              </button>
            </div>
            <div>
              {!currentQuestion && (
                <button
                  onClick={handleStartSession}
                  disabled={loading || !participants?.length}
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
      </div>

      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {participants?.map((participant) => {
            const participantId =
              participant?._id || participant?.id || "unknown";
            const username =
              participant?.username || participant?.name || "Anonymous";
            const initial = username[0]?.toUpperCase() || "?";

            return (
              <div
                key={participantId}
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
                  Setting up survey session
                </h1>
                <div className="flex items-center gap-2 text-xl text-gray-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Loading Survey PIN
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
                    <p className="text-xl text-gray-600">Survey PIN:</p>
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

              {/* Participants Section */}
              {renderParticipants()}

              {/* Current Question Display */}
              {currentQuestion && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  {renderCurrentQuestion()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        sessionData={sessionData}
        onInvite={handleInviteUsers}
      />
    </div>
  );
};

export default SurveyLobby;