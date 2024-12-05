// UserPlay.js
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAnswerContext } from "../../context/answerContext";
import ContentDisplay from "../../components/ContentDisplay";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useAuthContext } from "../../context/AuthContext";

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

      newSocket.emit("join-session", {
        sessionId,
        userId: user._id,
        username: user.username,
      });

      return () => newSocket.disconnect();
    }
  }, [isAuthenticated, user, sessionId]);

  useEffect(() => {
    if (socket) {
      socket.on("next-item", ({ type, item, isLastItem: lastItem }) => {
        console.log("Received next item:", item);
        setCurrentItem(item);
        setTimeLeft(item.type === "bullet_points" ? 0 : item.timer || 30);
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

      socket.on("timer-sync", ({ timeLeft: newTime }) => {
        setTimeLeft(newTime);
        setTimerActive(newTime > 0);
        if (newTime <= 0) {
          setIsTimeUp(true);
        }
      });

      socket.on("session-ended", () => {
        setTimerActive(false);
        setIsTimeUp(true);
        console.log("Quiz has ended");
      });

      return () => {
        socket.off("next-item");
        socket.off("timer-sync");
        socket.off("session-ended");
      };
    }
  }, [socket]);

  useEffect(() => {
    let intervalId;

    if (timerActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            setTimerActive(false);
            setIsTimeUp(true);
            clearInterval(intervalId);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timerActive]);

  const handleSubmitAnswer = async (option) => {
    if (
      currentItem.type === "bullet_points" ||
      isTimeUp ||
      hasSubmitted ||
      !option ||
      !questionStartTime ||
      !user
    ) {
      return;
    }

    try {
      const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);

      await submitAnswer(sessionId, currentItem._id, {
        answer: option.text,
        userId: user._id,
        timeTaken,
      });

      setHasSubmitted(true);

      if (socket) {
        socket.emit("answer-submitted", {
          sessionId,
          answerDetails: {
            questionId: currentItem._id,
            userId: user._id,
            answer: option.text,
            timeTaken,
          },
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
