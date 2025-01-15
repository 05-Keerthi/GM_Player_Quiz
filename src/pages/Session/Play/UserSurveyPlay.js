import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSurveyAnswerContext } from "../../../context/surveyAnswerContext";
import { useSurveySessionContext } from "../../../context/surveySessionContext";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useAuthContext } from "../../../context/AuthContext";
import SurveyContentDisplay from "../../../components/Session/SurveyContentDisplay";

const UserSurveyPlay = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuthContext();
  const { checkGuestStatus } = useSurveySessionContext();
  const { submitSurveyAnswer } = useSurveyAnswerContext();

  const [activeUser, setActiveUser] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [socket, setSocket] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLastItem, setIsLastItem] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSurveyEnded, setIsSurveyEnded] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);

  const sessionId = searchParams.get("sessionId");

  // Set active user
  useEffect(() => {
    const setupUser = () => {
      if (isAuthenticated && user) {
        console.log("Setting authenticated user:", { user });
        setActiveUser(user);
      } else {
        const guestUser = checkGuestStatus();
        console.log("Checking guest status:", { guestUser });
        if (guestUser) {
          setActiveUser(guestUser);
        }
      }
    };

    setupUser();
  }, [isAuthenticated, user, checkGuestStatus]);

  // Socket initialization
  useEffect(() => {
    if (!activeUser || !sessionId) return;

    console.log("Initializing socket with user:", {
      userId: activeUser._id || activeUser.id,
      username: activeUser.username,
      isGuest: activeUser.isGuest,
      sessionId,
    });

    const newSocket = io(`${process.env.REACT_APP_API_URL}`);

    newSocket.on("connect", () => {
      console.log("Socket connected successfully");
      newSocket.emit("join-survey-session", {
        sessionId,
        userId: activeUser._id || activeUser.id,
        username: activeUser.username,
        isGuest: activeUser.isGuest || false,
      });
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    setSocket(newSocket);

    return () => {
      console.log("Cleaning up socket connection");
      newSocket.disconnect();
    };
  }, [activeUser, sessionId]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNextQuestion = (data) => {
      console.log("Received next question data:", data);
      const { type, question, isLastQuestion, initialTime } = data;

      if (!question) {
        console.log("No question data received");
        return;
      }

      const transformedItem =
        type === "slide"
          ? {
              _id: question._id,
              type: "slide",
              title: question.surveyTitle || question.title,
              content: question.surveyContent || question.content,
              imageUrl: question.imageUrl,
              surveyQuiz: question.surveyQuiz,
            }
          : {
              _id: question._id,
              title: question.title,
              type: type || "single_select",
              imageUrl: question.imageUrl,
              description: question.description,
              timer: initialTime || 30,
              answerOptions: (question.answerOptions || []).map((option) => ({
                _id: option._id,
                optionText: option.optionText || option.text,
                color: option.color,
              })),
            };

      console.log("Setting transformed item:", transformedItem);
      setCurrentItem(transformedItem);
      setTimeLeft(initialTime || 30);
      setIsLastItem(isLastQuestion);
      setHasSubmitted(false);
      setQuestionStartTime(type !== "slide" ? Date.now() : null);
    };

    const handleTimerSync = (data) => {
      if (data && typeof data.timeLeft === "number") {
        setTimeLeft(data.timeLeft);
      }
    };

    const handleAnswerConfirmed = (data) => {
      if (data.status === "success") {
        setHasSubmitted(true);
      }
    };

    const handleSurveyCompleted = () => {
      console.log("Survey completed");
      setIsSurveyEnded(true);
    };

    const handleSessionEnded = () => {
      console.log("Survey session ended");
      setIsSurveyEnded(true);
      setTimeout(() => navigate("/joinsurvey"), 2000);
    };

    // Register event handlers
    socket.on("next-survey-question", handleNextQuestion);
    socket.on("timer-sync", handleTimerSync);
    socket.on("answer-submission-confirmed", handleAnswerConfirmed);
    socket.on("survey-completed", handleSurveyCompleted);
    socket.on("survey-session-ended", handleSessionEnded);

    return () => {
      // Cleanup event handlers
      socket.off("next-survey-question", handleNextQuestion);
      socket.off("timer-sync", handleTimerSync);
      socket.off("answer-submission-confirmed", handleAnswerConfirmed);
      socket.off("survey-completed", handleSurveyCompleted);
      socket.off("survey-session-ended", handleSessionEnded);
    };
  }, [socket, navigate]);

  const handleSubmitAnswer = async (answer) => {
    if (
      !currentItem ||
      currentItem.type === "slide" ||
      timeLeft <= 0 ||
      hasSubmitted ||
      !answer ||
      !questionStartTime ||
      !activeUser
    ) {
      console.log("Submit answer conditions not met:", {
        hasCurrentItem: !!currentItem,
        isSlide: currentItem?.type === "slide",
        timeLeft,
        hasSubmitted,
        hasAnswer: !!answer,
        hasQuestionStartTime: !!questionStartTime,
        hasActiveUser: !!activeUser,
      });
      return;
    }

    try {
      console.log("Submitting answer:", { answer, activeUser });
      setHasSubmitted(true);
      const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
      const answerText =
        answer.answer ||
        answer.text ||
        (Array.isArray(answer) ? answer.join(",") : answer);

      await submitSurveyAnswer(sessionId, currentItem._id, {
        answer: answerText,
        timeTaken,
        isGuest: activeUser.isGuest || false,
        guestUserId: activeUser.isGuest ? activeUser._id : undefined,
      });

      if (socket) {
        socket.emit("survey-submit-answer", {
          sessionId,
          questionId: currentItem._id,
          userId: activeUser._id || activeUser.id,
          answer: answerText,
          timeTaken,
          isGuest: activeUser.isGuest || false,
        });
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      setHasSubmitted(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
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

  if (isSurveyEnded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Survey Completed!</h2>
          <p className="text-gray-600">Thank you for your participation.</p>
          {activeUser.isGuest && (
            <p className="mt-2 text-sm text-blue-600">
              Participated as guest: {activeUser.username}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl px-6">
          {activeUser.isGuest && (
            <div className="mb-4 text-center">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                Guest: {activeUser.username}
              </span>
            </div>
          )}
          <SurveyContentDisplay
            item={currentItem}
            isAdmin={false}
            onSubmitAnswer={handleSubmitAnswer}
            timeLeft={timeLeft}
            isLastItem={isLastItem}
            isSurveyEnded={isSurveyEnded}
            isSubmitted={hasSubmitted}
            socket={socket}
          />
        </div>
      </div>
    </div>
  );
};

export default UserSurveyPlay;
