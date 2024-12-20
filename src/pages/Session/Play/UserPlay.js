// UserPlay.js
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAnswerContext } from "../../../context/answerContext";
import ContentDisplay from "../../../components/Session/ContentDisplay";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useAuthContext } from "../../../context/AuthContext";
import FinalLeaderboard from "../FinalLeaderboard";

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

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated && user && sessionId) {
      const newSocket = io("http://localhost:5000");
      setSocket(newSocket);

      const userData = {
        sessionId,
        userId: user.id,
        username: user.username,
      };
      newSocket.emit("join-session", userData);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user, sessionId]);

  useEffect(() => {
    if (socket) {
      socket.on("next-item", (data) => {
        console.log("Received next-item data:", data);
        const { type, item, isLastItem: lastItem, initialTime } = data;

        // Create a complete item object combining both item data and type
        const completeItem = {
          ...item,
          type: type === "slide" ? "classic" : item.type, // Handle slide type
        };

        setCurrentItem(completeItem);
        setTimeLeft(initialTime || (type === "slide" ? 0 : item.timer || 30));
        setIsLastItem(lastItem);
        setTimerActive(type !== "slide");
        setHasSubmitted(false);
        setIsTimeUp(false);

        if (type !== "slide") {
          setQuestionStartTime(Date.now());
        } else {
          setQuestionStartTime(null);
        }
      });

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
      });

      socket.on("session-ended", () => {
        setTimerActive(false);
        setIsTimeUp(true);
        navigate("/join");
      });

      return () => {
        socket.off("next-item");
        socket.off("timer-sync");
        socket.off("session-ended");
        socket.off("quiz-completed");
      };
    }
  }, [socket, navigate]);

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

      const answerData = {
        answer: currentItem.type === "open_ended" ? answer.answer : answer.text,
        userId: user._id,
        timeTaken,
      };

      await submitAnswer(sessionId, currentItem._id, answerData);
      setHasSubmitted(true);

      if (socket) {
        const answerDetails = {
          questionId: currentItem._id,
          userId: user.id,
          answer:
            currentItem.type === "open_ended" ? answer.answer : answer.text,
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
          <Loader2 className="w-6 h-6 animate-spin" />
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
