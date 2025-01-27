import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAnswerContext } from "../../../context/answerContext";
import ContentDisplay from "../../../components/Session/ContentDisplay";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useAuthContext } from "../../../context/AuthContext";
import FinalLeaderboard from "../FinalLeaderboard";
import  SurveyProgress from "../../../components/Session/Progress";
const UserPlay = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuthContext();
  const { submitAnswer } = useAnswerContext();
  const [currentItem, setCurrentItem] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [socket, setSocket] = useState(null);
  const [isLastItem, setIsLastItem] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false);
 const [progress, setProgress] = useState(0);
  const sessionId = searchParams.get("sessionId");
  const joinCode = searchParams.get("joinCode");
const [totalQuestions, setTotalQuestions] = useState(0);
  // Save session state to sessionStorage
  const saveSessionState = (data) => {
    const sessionState = {
      currentItem: data.item,
      isLastItem: data.isLastItem,
      timeLeft: data.initialTime,
      progress: data.progress,
      sessionId,
      joinCode,
      timestamp: Date.now(),
    };
    sessionStorage.setItem("quizSessionState", JSON.stringify(sessionState));
  };

  // Get session state from sessionStorage
  const getSessionState = () => {
    try {
      const state = JSON.parse(sessionStorage.getItem("quizSessionState"));
      if (!state) return null;

      // Check if session is not expired (24 hours)
      const SESSION_EXPIRY = 24 * 60 * 60 * 1000;
      if (Date.now() - state.timestamp > SESSION_EXPIRY) {
        sessionStorage.removeItem("quizSessionState");
        return null;
      }

      return state;
    } catch {
      return null;
    }
  };

  // Clear session state
  const clearSessionState = () => {
    sessionStorage.removeItem("quizSessionState");
  };

  // Initialize session from storage or URL parameters
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      const savedState = getSessionState();
      if (savedState) {
        setCurrentItem(savedState.currentItem);
        setIsLastItem(savedState.isLastItem);
        setTimeLeft(savedState.timeLeft);
        setProgress(savedState.progress);
      } else {
        navigate("/login");
      }
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Socket connection with reconnection logic
  useEffect(() => {
    if (isAuthenticated && user && sessionId) {
      const newSocket = io(`${process.env.REACT_APP_API_URL}`);
      setSocket(newSocket);

      const userData = {
        sessionId,
        userId: user.id,
        username: user.username,
        isReconnection: true, // Flag for reconnection
      };

      newSocket.on("connect", () => {
        newSocket.emit("join-session", userData);
      });

      // Handle reconnection
      newSocket.on("reconnect", () => {
        newSocket.emit("join-session", userData);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user, sessionId]);

  // Handle socket events and state persistence
  useEffect(() => {
    if (!socket) return;
  
    socket.on("next-item", (data) => {
      const { type, item, isLastItem: lastItem, initialTime, progress } = data;
  
      // Handle progress tracking
      if (progress) {
        const [current, total] = progress.split('/').map(Number);
        setTotalQuestions(total);
        setProgress(progress);
      } else {
        // Fallback progress calculation if not provided
        const calculatedProgress = `${(currentItem ? 2 : 1)}/0`;
        setProgress(calculatedProgress);
      }
  
      const completeItem = {
        ...item,
        type: type === "slide" ? "classic" : item.type,
      };
  
      // Save to session storage
      saveSessionState({
        item: completeItem,
        isLastItem: lastItem,
        initialTime: initialTime || (type === "slide" ? 0 : item.timer || 30),
      });
  
      setCurrentItem(completeItem);
      setTimeLeft(initialTime || (type === "slide" ? 0 : item.timer || 30));
      setIsLastItem(lastItem);
      setTimerActive(type !== "slide");
      setHasSubmitted(false);
      setIsTimeUp(false);
      setQuestionStartTime(type !== "slide" ? Date.now() : null);
    });
  
    // Existing socket event listeners remain the same
    socket.on("timer-sync", (data) => {
      const { timeLeft: newTime } = data;
      setTimeLeft(newTime);
      setTimerActive(newTime > 0);
      if (newTime <= 0) {
        setIsTimeUp(true);
      }
    });
  
    socket.on("quiz-completed", () => {
      setShowFinalLeaderboard(true);
      clearSessionState();
    });
  
    socket.on("session-ended", () => {
      clearSessionState();
      navigate("/session/quiz/" + sessionId);
    });
  
    socket.on("disconnect", () => {
      setTimerActive(false);
    });
  
    return () => {
      socket.off("next-item");
      socket.off("timer-sync");
      socket.off("quiz-completed");
      socket.off("session-ended");
      socket.off("disconnect");
    };
  }, [socket, navigate]);
  
  // Render progress function (similar to survey play)
  const renderProgress = () => {
    if (!progress) return "Loading...";
    
    const [current, total] = progress.split('/').map(Number);
    return total > 0 ? progress : `${current}/${totalQuestions || '...'}`;
  };

  const handleSubmitAnswer = async (answer) => {
    if (
      !currentItem ||
      currentItem.type === "classic" ||
      timeLeft <= 0 ||
      isTimeUp ||
      hasSubmitted ||
      !answer ||
      !questionStartTime ||
      !user
    ) {
      return;
    }

    try {
      const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
      let answerToSubmit;

      // Handle different question types
      if (currentItem.type === "multiple_select") {
        answerToSubmit = answer.answer;
      } else if (currentItem.type === "open_ended") {
        answerToSubmit = answer.answer;
      } else if (currentItem.type === "poll") {
        // For poll questions, send the selected option text
        answerToSubmit = answer.text;
      } else {
        answerToSubmit = answer.text;
      }

      const answerData = {
        answer: answerToSubmit,
        userId: user._id,
        timeTaken,
      };

      await submitAnswer(sessionId, currentItem._id, answerData);
      setHasSubmitted(true);

      if (socket) {
        const answerDetails = {
          questionId: currentItem._id,
          userId: user.id,
          answer: answerToSubmit,
          timeTaken,
          type: currentItem.type,
        };

        socket.emit("answer-submitted", {
          sessionId,
          answerDetails,
        });
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 role="status" className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (showFinalLeaderboard) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <FinalLeaderboard
          sessionId={sessionId}
          userId={user.id}
          isAdmin={false}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl px-6">
        <SurveyProgress 
            progress={renderProgress()} 
            className="mb-4" 
          />
          <ContentDisplay
            item={currentItem}
            isAdmin={false}
            onSubmitAnswer={handleSubmitAnswer}
            timeLeft={timeLeft}
            isLastItem={isLastItem}
            isTimeUp={isTimeUp}
            hasSubmitted={hasSubmitted}
            socket={socket}
          />
        </div>
      </div>
    </div>
  );
};

export default UserPlay;
