// UserPlay.js
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAnswerContext } from "../../context/answerContext";
import ContentDisplay from "../../components/ContentDisplay";
import io from "socket.io-client";

const UserPlay = () => {
  const [searchParams] = useSearchParams();
  const { submitAnswer } = useAnswerContext();
  const [currentItem, setCurrentItem] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [socket, setSocket] = useState(null);
  const [isLastItem, setIsLastItem] = useState(false);
  const [timerActive, setTimerActive] = useState(false);

  const sessionId = searchParams.get("sessionId");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    if (sessionId && userId) {
      newSocket.emit("join-session", {
        sessionId,
        userId,
        username: localStorage.getItem("username"),
      });
    }

    return () => newSocket.disconnect();
  }, [sessionId, userId]);

  useEffect(() => {
    if (socket) {
      socket.on("next-item", ({ type, item, isLastItem: lastItem }) => {
        console.log("Received next item:", item);
        setCurrentItem(item);
        setTimeLeft(item.type === 'bullet_points' ? 0 : (item.timer || 30));
        setIsLastItem(lastItem);
        setTimerActive(item.type !== 'bullet_points');
      });

      socket.on("timer-sync", ({ timeLeft: newTime }) => {
        setTimeLeft(newTime);
        setTimerActive(newTime > 0);
      });

      socket.on("session-ended", () => {
        setTimerActive(false);
        // Handle session end - can add navigation or show completion screen
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
          if (prevTime <= 0) {
            setTimerActive(false);
            clearInterval(intervalId);
            return 0;
          }
          return prevTime - 1;
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
    if (currentItem.type === 'bullet_points') return; // Don't submit answers for slides
    
    try {
      await submitAnswer(sessionId, currentItem._id, {
        answer: option.text,
        userId,
      });

      if (socket) {
        socket.emit("answer-submitted", {
          sessionId,
          answerDetails: {
            questionId: currentItem._id,
            userId,
            answer: option.text,
          },
        });
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

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
          />
        </div>
      </div>
    </div>
  );
};

export default UserPlay;
