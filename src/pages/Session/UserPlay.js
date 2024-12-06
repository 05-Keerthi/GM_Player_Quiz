import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAnswerContext } from "../../context/answerContext";
import ContentDisplay from "../../components/ContentDisplay";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useAuthContext } from "../../context/AuthContext";
import FinalLeaderboard from "./FinalLeaderboard";

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

  const sessionId = searchParams.get("sessionId");

  // Debug logs for initial props and state
  useEffect(() => {
    console.log("Initial state:", {
      sessionId,
      user,
      isAuthenticated,
      showFinalLeaderboard,
    });
  }, [sessionId, user, isAuthenticated, showFinalLeaderboard]);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      console.log("Redirecting to login - not authenticated");
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated && user && sessionId) {
      console.log("Initializing socket connection");
      const newSocket = io("http://localhost:5000");
      setSocket(newSocket);

      const userData = {
        sessionId,
        userId: user.id,
        username: user.username,
      };
      console.log("Emitting join-session with data:", userData);
      newSocket.emit("join-session", userData);

      return () => {
        console.log("Disconnecting socket");
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user, sessionId]);

  
  useEffect(() => {
    if (socket) {
      socket.on("connect", () => {
        console.log("Socket connected with ID:", socket.id);
      });

      socket.on("next-item", (data) => {
        console.log("Received next-item:", data);
        const { type, item, isLastItem: lastItem, initialTime } = data;
        setCurrentItem(item);
        setTimeLeft(
          initialTime || (item.type === "bullet_points" ? 0 : item.timer || 30)
        );
        setIsLastItem(lastItem);
        setTimerActive(item.type !== "bullet_points");
        setHasSubmitted(false);
        setIsTimeUp(false);
        if (item.type !== "bullet_points") {
          setQuestionStartTime(Date.now());
        } else {
          setQuestionStartTime(null);
        }
      });

      socket.on("timer-sync", (data) => {
        console.log("Received timer-sync:", data);
        const { timeLeft: newTime } = data;
        setTimeLeft(newTime);
        setTimerActive(newTime > 0);
        if (newTime <= 0) {
          setIsTimeUp(true);
        }
      });

      socket.on("quiz-completed", () => {
        console.log("Received quiz-completed event");
        setShowFinalLeaderboard(true);
      });

      socket.on("session-ended", () => {
        console.log("Received session-ended event");
        setTimerActive(false);
        setIsTimeUp(true);
        navigate("/join");
      });

      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });

      return () => {
        console.log("Cleaning up socket listeners");
        socket.off("next-item");
        socket.off("timer-sync");
        socket.off("session-ended");
        socket.off("quiz-completed");
        socket.off("error");
        socket.off("disconnect");
      };
    }
  }, [socket, navigate]);

  const handleSubmitAnswer = async (option) => {
    if (
      currentItem.type === "bullet_points" ||
      timeLeft <= 0 || // Check if time is up
      isTimeUp ||
      hasSubmitted ||
      !option ||
      !questionStartTime ||
      !user
    ) {
      console.log("Submit answer prevented due to:", {
        type: currentItem?.type,
        timeLeft,
        isTimeUp,
        hasSubmitted,
        hasOption: !!option,
        hasQuestionStartTime: !!questionStartTime,
        hasUser: !!user,
      });
      return;
    }

    try {
      console.log("Submitting answer:", option);
      const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);

      const answerData = {
        answer: option.text,
        userId: user._id,
        timeTaken,
      };

      console.log("Submitting answer with data:", answerData);
      await submitAnswer(sessionId, currentItem._id, answerData);

      setHasSubmitted(true);

      if (socket) {
        const answerDetails = {
          questionId: currentItem._id,
          userId: user.id,
          answer: option.text,
          timeTaken,
        };
        console.log("Emitting answer-submitted with details:", answerDetails);
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
    console.log("Auth loading...");
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("Not authenticated, returning null");
    return null;
  }

  if (showFinalLeaderboard) {
    console.log("Showing final leaderboard with:", {
      sessionId,
      userId: user?.id,
    });
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

  console.log("Rendering main quiz view");
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl px-6">
          <ContentDisplay
            item={currentItem}
            isAdmin={false}
            onSubmitAnswer={handleSubmitAnswer}
            timeLeft={timeLeft}
            isLastItem={isLastItem}
            isTimeUp={isTimeUp}
            hasSubmitted={hasSubmitted}
          />
        </div>
      </div>
    </div>
  );
};

export default UserPlay;
