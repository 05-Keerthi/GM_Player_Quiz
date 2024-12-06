import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useSessionContext } from "../../context/sessionContext";
import ContentDisplay from "../../components/ContentDisplay";
import FinalLeaderboard from "./FinalLeaderboard";

const AdminStart = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { nextQuestion, endSession, loading } = useSessionContext();
  const [currentItem, setCurrentItem] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [socket, setSocket] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [isLastItem, setIsLastItem] = useState(false);
  const [isQuizEnded, setIsQuizEnded] = useState(false);
  const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false);

  const quizId = searchParams.get("quizId");
  const sessionId = searchParams.get("sessionId");
  const joinCode = searchParams.get("joinCode");

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);
    newSocket.emit("create-session", { sessionId });
    return () => newSocket.disconnect();
  }, [sessionId]);

  useEffect(() => {
    if (socket) {
      socket.on("timer-sync", ({ timeLeft: newTime }) => {
        setTimeLeft(newTime);
      });
      return () => {
        socket.off("timer-sync");
      };
    }
  }, [socket]);

  const handleNext = async () => {
    try {
      if (!joinCode) {
        console.error("Join code is missing");
        return;
      }

      const response = await nextQuestion(joinCode, sessionId);

      if (response.item) {
        setCurrentItem(response.item);
        setTimeLeft(
          response.item.type === "bullet_points" ? 0 : response.item.timer || 30
        );
        setTimerActive(response.item.type !== "bullet_points");
        setIsLastItem(response.isLastItem || false);

        if (socket) {
          socket.emit("next-item", {
            sessionId,
            type: response.type,
            item: response.item,
            isLastItem: response.isLastItem || false,
          });
        }
      } else {
        // No more items, show leaderboard
        setIsQuizEnded(true);
        setShowFinalLeaderboard(true);
        if (socket) {
          socket.emit("quiz-completed", { sessionId });
        }
      }
    } catch (error) {
      if (
        error.response?.data?.message === "No more items left in the session"
      ) {
        setIsQuizEnded(true);
        setShowFinalLeaderboard(true);
        if (socket) {
          socket.emit("quiz-completed", { sessionId });
        }
      } else {
        console.error("Error getting next item:", error);
      }
    }
  };

  const handleEndQuiz = async () => {
    try {
      if (!joinCode) {
        console.error("Join code is missing");
        return;
      }

      await endSession(joinCode, sessionId);

      if (socket) {
        socket.emit("end-session", { sessionId });
      }

      // Navigate to dashboard or home
      navigate("/quizzes");
    } catch (error) {
      console.error("Error ending quiz:", error);
    }
  };

  if (showFinalLeaderboard) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <FinalLeaderboard sessionId={sessionId} isAdmin={true} />
        <button
          onClick={handleEndQuiz}
          className="mt-8 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          End Session
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl px-6">
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <ContentDisplay
              item={currentItem}
              isAdmin={true}
              onNext={handleNext}
              timeLeft={timeLeft}
              isLastItem={isLastItem}
              onEndQuiz={handleEndQuiz}
              isQuizEnded={isQuizEnded}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStart;
