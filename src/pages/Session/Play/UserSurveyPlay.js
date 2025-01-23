import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSurveyAnswerContext } from "../../../context/surveyAnswerContext";
import { useSurveySessionContext } from "../../../context/surveySessionContext";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useAuthContext } from "../../../context/AuthContext";
import SurveyContentDisplay from "../../../components/Session/SurveyContentDisplay";
import SurveyProgress from "../../../components/Session/Progress";

const UserSurveyPlay = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuthContext();
  const { checkGuestStatus } = useSurveySessionContext();
  const { submitSurveyAnswer } = useSurveyAnswerContext();
  const [timerActive, setTimerActive] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [socket, setSocket] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLastItem, setIsLastItem] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSurveyEnded, setIsSurveyEnded] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState(null);
  const [progress, setProgress] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  const sessionId = searchParams.get("sessionId");
  const joinCode = searchParams.get("joinCode");

  // Session state management functions
  const saveSessionState = (data) => {
    const sessionState = {
      currentItem: data.item,
      isLastItem: data.isLastQuestion,
      timeLeft: data.initialTime,
      progress: data.progress,
      sessionId,
      joinCode,
      guestData: activeUser?.isGuest ? activeUser : null,
      timestamp: Date.now(),
    };
    sessionStorage.setItem("surveySessionState", JSON.stringify(sessionState));
  };

  const getSessionState = () => {
    try {
      const state = JSON.parse(sessionStorage.getItem("surveySessionState"));
      if (!state) return null;

      // Check if session is not expired (24 hours)
      const SESSION_EXPIRY = 24 * 60 * 60 * 1000;
      if (Date.now() - state.timestamp > SESSION_EXPIRY) {
        sessionStorage.removeItem("surveySessionState");
        return null;
      }

      return state;
    } catch {
      return null;
    }
  };

  const clearSessionState = () => {
    sessionStorage.removeItem("surveySessionState");
  };

  // Initialize session and user state
  useEffect(() => {
    const setupUser = async () => {
      const savedState = getSessionState();

      if (savedState) {
        // Restore from saved state
        if (savedState.guestData) {
          setActiveUser(savedState.guestData);
        } else if (isAuthenticated && user) {
          setActiveUser(user);
        }
        setCurrentItem(savedState.currentItem);
        setIsLastItem(savedState.isLastItem);
        setTimeLeft(savedState.timeLeft);
        setProgress(savedState.progress);
      } else {
        // Normal user setup
        if (isAuthenticated && user) {
          setActiveUser(user);
        } else {
          const guestUser = checkGuestStatus();
          if (guestUser) {
            setActiveUser(guestUser);
          }
        }
      }
    };

    setupUser();
  }, [isAuthenticated, user, checkGuestStatus]);

  // Socket connection with reconnection logic
  useEffect(() => {
    if (!activeUser || !sessionId) return;

    const newSocket = io(`${process.env.REACT_APP_API_URL}`);

    const connectData = {
      sessionId,
      userId: activeUser._id || activeUser.id,
      username: activeUser.username,
      isGuest: activeUser.isGuest || false,
      isReconnection: true,
    };

    newSocket.on("connect", () => {
      newSocket.emit("join-survey-session", connectData);
    });

    // Handle reconnection
    newSocket.on("reconnect", () => {
      newSocket.emit("join-survey-session", connectData);
    });

    // Handle disconnection
    newSocket.on("disconnect", () => {
      setTimeLeft(0);
      setTimerActive(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [activeUser, sessionId]);

  // Socket event handlers with state persistence
  useEffect(() => {
    if (!socket) return;

    socket.on("next-survey-question", (data) => {
      const { type, question, isLastQuestion, initialTime, progress } = data;

      if (!question) return;

      // Extract total questions from progress if available
      if (progress) {
        const [current, total] = progress.split('/').map(Number);
        setTotalQuestions(total);
        setProgress(progress);
      } else {
        // Fallback progress calculation
        const calculatedProgress = `${(currentItem ? 2 : 1)}/0`;
        setProgress(calculatedProgress);
      }

      const transformedItem = type === "slide"
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
            answerOptions: question.answerOptions?.map((option) => ({
              _id: option._id,
              optionText: option.optionText || option.text,
              color: option.color,
            })),
          };

      setCurrentItem(transformedItem);
      setTimeLeft(initialTime || 30);
      setIsLastItem(isLastQuestion);
      setHasSubmitted(false);
      setQuestionStartTime(type !== "slide" ? Date.now() : null);
    });


    socket.on("timer-sync", (data) => {
      if (data && typeof data.timeLeft === "number") {
        setTimeLeft(data.timeLeft);
      }
    });

    socket.on("survey-completed", () => {
      console.log("Survey completed");
      setIsSurveyEnded(true);
      clearSessionState();
    });

    socket.on("survey-session-ended", () => {
      clearSessionState();
      setIsSurveyEnded(true);
      setTimeout(() => navigate("/"), 2000);
    });

    return () => {
      socket.off("next-survey-question");
      socket.off("timer-sync");
      socket.off("survey-completed");
      socket.off("survey-session-ended");
    };
  }, [socket, navigate]);
  const renderProgress = () => {
    if (!progress) return "Loading...";
    
    const [current, total] = progress.split('/').map(Number);
    return total > 0 ? progress : `${current}/${totalQuestions || '...'}`;
  };
  const handleSubmitAnswer = async (answer) => {
    if (
      !currentItem ||
      currentItem.type === "slide" ||
      timeLeft <= 0 ||
      !answer ||
      !questionStartTime ||
      !activeUser
    ) {
      console.log("Submit answer conditions not met:", {
        hasCurrentItem: !!currentItem,
        isSlide: currentItem?.type === "slide",
        timeLeft,
        hasAnswer: !!answer,
        hasQuestionStartTime: !!questionStartTime,
        hasActiveUser: !!activeUser,
      });
      return;
    }

    try {
      console.log("Submitting/Updating answer:", {
        answer,
        activeUser,
        isUpdate: hasSubmitted,
      });

      const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
      const answerText =
        answer.answer ||
        answer.text ||
        (Array.isArray(answer) ? answer.join(",") : answer);

      // Check if the new answer is different from the last submitted answer
      if (hasSubmitted && answerText === lastSubmittedAnswer) {
        console.log("Same answer submitted, skipping update");
        return;
      }

      const response = await submitSurveyAnswer(sessionId, currentItem._id, {
        answer: answerText,
        timeTaken,
        isGuest: activeUser.isGuest || false,
        guestUserId: activeUser.isGuest ? activeUser._id : undefined,
      });

      setHasSubmitted(true);
      setLastSubmittedAnswer(answerText);

      if (socket) {
        socket.emit("survey-submit-answer", {
          sessionId,
          questionId: currentItem._id,
          userId: activeUser._id || activeUser.id,
          answer: answerText,
          timeTaken,
          isGuest: activeUser.isGuest || false,
          isUpdate: hasSubmitted,
        });
      }

      console.log("Answer submission successful:", response);
    } catch (error) {
      console.error("Error submitting answer:", error);
      // Don't reset hasSubmitted if it was an update attempt
      if (!hasSubmitted) {
        setHasSubmitted(false);
      }
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

          <SurveyProgress 
            progress={renderProgress()} 
            className="mb-4" 
          />
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
