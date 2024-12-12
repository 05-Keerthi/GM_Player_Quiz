import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useSessionContext } from "../../context/sessionContext";
import { useSurveySessionContext } from "../../context/surveySessionContext";
import { Loader2, ChevronRight, Users } from "lucide-react";
import io from "socket.io-client";
import Navbar from "../../components/NavbarComp";
import InviteModal from "../../models/InviteModal";

const UnifiedAdminLobby = () => {
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
  const [attendees, setAttendees] = useState([]);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  const {
    startSession,
    nextQuestion,
    loading: quizLoading,
  } = useSessionContext();
  const {
    startSurveySession,
    nextSurveyQuestion,
    loading: surveyLoading,
  } = useSurveySessionContext();

  const sessionType = searchParams.get("type"); // 'quiz' or 'survey'
  const sessionId = searchParams.get("sessionId");
  const contentId = searchParams.get("quizId") || searchParams.get("surveyId");

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  // Initialize session using passed data
  useEffect(() => {
    if (socket && state?.sessionData) {
      setSessionData(state.sessionData);
      if (state.sessionData.players || state.sessionData.participants) {
        setAttendees(
          state.sessionData.players || state.sessionData.participants || []
        );
      }

      const eventName =
        sessionType === "survey" ? "create-survey-session" : "create-session";
      const eventData = {
        sessionId: state.sessionData._id,
        [sessionType === "survey" ? "surveyJoinCode" : "joinCode"]:
          sessionType === "survey"
            ? state.sessionData.surveyJoinCode
            : state.sessionData.joinCode,
      };

      socket.emit(eventName, eventData);
      setTimeout(() => setShowPin(true), 1000);
    }
  }, [socket, state, sessionType]);

  // Listen for attendee updates
  useEffect(() => {
    if (socket && sessionData) {
      const joinEvent =
        sessionType === "survey" ? "participant-joined" : "player-joined";
      const leaveEvent =
        sessionType === "survey" ? "participant-left" : "player-left";
      const responseEvent =
        sessionType === "survey" ? "response-submitted" : "answer-submitted";

      socket.on(joinEvent, (data) => {
        console.log("Attendee joined:", data);
        setAttendees((current) => {
          const newAttendee = data.user || data;
          if (!newAttendee) return current;
          if (!current.some((p) => p._id === newAttendee._id)) {
            return [...current, newAttendee];
          }
          return current;
        });
      });

      socket.on(leaveEvent, (data) => {
        console.log("Attendee left:", data);
        setAttendees((current) => current.filter((p) => p._id !== data.userId));
      });

      socket.on(responseEvent, (details) => {
        console.log("Response received:", details);
      });

      return () => {
        socket.off(joinEvent);
        socket.off(leaveEvent);
        socket.off(responseEvent);
      };
    }
  }, [socket, sessionData, sessionType]);

  const handleStartSession = async () => {
    try {
      let response;
      if (sessionType === "survey") {
        response = await startSurveySession(sessionData.surveyJoinCode);
        setQuestions(response.questions || []);
      } else {
        response = await startSession(sessionData.joinCode, sessionData._id);
        setQuestions(response.questions || []);
        setSlides(response.slides || []);
      }

      console.log("Start session response:", response);

      const navPath =
        sessionType === "survey"
          ? `/survey-start?surveyId=${contentId}&sessionId=${sessionId}&in_progress=true`
          : `/start?quizId=${contentId}&sessionId=${sessionId}&joinCode=${sessionData.joinCode}&in_progress=true`;

      navigate(navPath);

      if (socket) {
        const eventData =
          sessionType === "survey"
            ? { sessionId: sessionData._id, questions: response.questions }
            : {
                sessionId: sessionData._id,
                questions: response.questions,
                slides: response.slides,
              };

        socket.emit(`${sessionType}-session-started`, eventData);
      }
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const handleNextItem = async () => {
    try {
      let response;
      if (sessionType === "survey") {
        response = await nextSurveyQuestion(sessionId);
        if (response.question) {
          setCurrentItem(response.question);
          setCurrentItemType("question");
        }
      } else {
        response = await nextQuestion(sessionData.joinCode, sessionData._id);
        if (response.item) {
          setCurrentItem(response.item);
          setCurrentItemType(response.type);
        }
      }

      console.log("Next item response:", response);

      if (socket) {
        const eventData =
          sessionType === "survey"
            ? { sessionId: sessionData._id, question: response.question }
            : {
                sessionId: sessionData._id,
                type: response.type,
                item: response.item,
              };

        socket.emit(
          sessionType === "survey" ? "next-question" : "next-item",
          eventData
        );
      }
    } catch (error) {
      console.error("Failed to get next item:", error);
    }
  };

  const handleInviteUsers = (selectedUsers) => {
    if (socket && sessionData) {
      selectedUsers.forEach((user) => {
        const eventData = {
          sessionId: sessionData._id,
          userId: user._id,
          [sessionType === "survey" ? "surveyJoinCode" : "joinCode"]:
            sessionType === "survey"
              ? sessionData.surveyJoinCode
              : sessionData.joinCode,
        };

        socket.emit(
          `invite-user${sessionType === "survey" ? "-survey" : ""}`,
          eventData
        );
      });
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
            disabled={quizLoading || surveyLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="ml-2" />
          </button>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div>
            <h4 className="font-medium text-xl mb-4">{currentItem.title}</h4>
            {currentItem.imageUrl && (
              <img
                src={currentItem.imageUrl}
                alt="Content"
                className="mb-4 rounded-lg max-w-full h-auto"
              />
            )}
            {currentItemType === "question" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {currentItem.options?.map((option) => (
                    <div
                      key={option._id}
                      className={`p-4 rounded-lg border ${
                        option.isCorrect && sessionType !== "survey"
                          ? "bg-green-50 border-green-500"
                          : "bg-white"
                      }`}
                    >
                      <span
                        className={
                          option.isCorrect && sessionType !== "survey"
                            ? "text-green-700"
                            : ""
                        }
                      >
                        {option.text}
                      </span>
                    </div>
                  ))}
                </div>
                {sessionType !== "survey" && (
                  <div className="mt-4 text-sm text-gray-500">
                    Points: {currentItem.points} | Timer: {currentItem.timer}s
                  </div>
                )}
              </>
            ) : (
              <div>
                <p className="text-gray-700">{currentItem.content}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAttendees = () => (
    <div className="space-y-6">
      <div className="bg-indigo-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <span className="text-xl font-semibold">
              {sessionType === "survey" ? "Participants" : "Players"} (
              {attendees?.length || 0})
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
              {!currentItem && (
                <button
                  onClick={handleStartSession}
                  disabled={quizLoading || surveyLoading || !attendees?.length}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {quizLoading || surveyLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting...
                    </div>
                  ) : (
                    `Start ${sessionType === "survey" ? "Survey" : "Game"}`
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {attendees?.map((attendee) => {
            const id = attendee?._id || attendee?.id || "unknown";
            const username =
              attendee?.username || attendee?.name || "Anonymous";
            const initial = username[0]?.toUpperCase() || "?";

            return (
              <div
                key={id}
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
                  Setting up {sessionType === "survey" ? "survey" : "game"}{" "}
                  session
                </h1>
                <div className="flex items-center gap-2 text-xl text-gray-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Loading {sessionType === "survey" ? "Survey" : "Game"} PIN
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
                    <p className="text-xl text-gray-600">
                      {sessionType === "survey" ? "Survey" : "Game"} PIN:
                    </p>
                    <h1 className="text-5xl font-bold tracking-wider text-gray-900">
                      {(sessionType === "survey"
                        ? sessionData?.surveyJoinCode
                        : sessionData?.joinCode
                      )
                        ?.match(/.{1,3}/g)
                        ?.join(" ")}
                    </h1>
                  </div>

                  <div className="w-32 h-32">
                    <img
                      src={
                        sessionType === "survey"
                          ? sessionData?.surveyQrCodeImageUrl
                          : sessionData?.qrCodeImageUrl
                      }
                      alt="QR Code"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>

              {renderAttendees()}

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
        sessionData={sessionData}
        onInvite={handleInviteUsers}
      />
    </div>
  );
};

export default UnifiedAdminLobby;
