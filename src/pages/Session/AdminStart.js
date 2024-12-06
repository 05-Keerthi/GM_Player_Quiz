import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useSessionContext } from "../../context/sessionContext";
import ContentDisplay from "../../components/ContentDisplay";
import FinalLeaderboard from "./FinalLeaderboard";
import AdminAnswerCounts from "../../components/AnswerCountDisplay";

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
  const [timerInterval, setTimerInterval] = useState(null);

  const quizId = searchParams.get("quizId");
  const sessionId = searchParams.get("sessionId");
  const joinCode = searchParams.get("joinCode");

  // Initialize socket and fetch first question
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);
    newSocket.emit("create-session", { sessionId });

    const initializeQuiz = async () => {
      try {
        if (joinCode && sessionId) {
          const response = await nextQuestion(joinCode, sessionId);
          if (response.item) {
            setCurrentItem(response.item);
            const initialTime =
              response.item.type === "bullet_points"
                ? 0
                : response.item.timer || 30;
            setTimeLeft(initialTime);
            setTimerActive(response.item.type !== "bullet_points");
            setIsLastItem(response.isLastItem || false);

            // Emit both the item and initial timer value
            newSocket.emit("next-item", {
              sessionId,
              type: response.type,
              item: response.item,
              isLastItem: response.isLastItem || false,
              initialTime: initialTime,
            });

            // Start timer immediately for first question
            if (response.item.type !== "bullet_points") {
              startTimer(newSocket, sessionId, initialTime);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching first question:", error);
      }
    };

    initializeQuiz();

    return () => {
      if (timerInterval) clearInterval(timerInterval);
      newSocket.disconnect();
    };
  }, [sessionId, joinCode]);

  // Function to start timer
  const startTimer = (socketInstance, sessionId, initialTime) => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    setTimeLeft(initialTime);
    setTimerActive(true);

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;
        if (socketInstance) {
          socketInstance.emit("timer-sync", { sessionId, timeLeft: newTime });
        }
        if (newTime <= 0) {
          clearInterval(interval);
          setTimerActive(false);
        }
        return newTime;
      });
    }, 1000);

    setTimerInterval(interval);
  };

  const handleNext = async () => {
    try {
      if (!joinCode) {
        console.error("Join code is missing");
        return;
      }

      // Clear existing timer if any
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }

      const response = await nextQuestion(joinCode, sessionId);

      if (response.item) {
        setCurrentItem(response.item);
        const newTime =
          response.item.type === "bullet_points"
            ? 0
            : response.item.timer || 30;
        setTimeLeft(newTime);
        setTimerActive(response.item.type !== "bullet_points");
        setIsLastItem(response.isLastItem || false);

        if (socket) {
          socket.emit("next-item", {
            sessionId,
            type: response.type,
            item: response.item,
            isLastItem: response.isLastItem || false,
            initialTime: newTime,
          });

          // Start timer for new question
          if (response.item.type !== "bullet_points") {
            startTimer(socket, sessionId, newTime);
          }
        }
      } else {
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

      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }

      await endSession(joinCode, sessionId);

      if (socket) {
        socket.emit("end-session", { sessionId });
      }

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
            <>
              {/* Ans count Div */}
              {/* In AdminStart.js, replace the existing answer count div */}
              <AdminAnswerCounts
                sessionId={sessionId}
                currentItem={currentItem}
                socket={socket}
              />
              <ContentDisplay
                item={currentItem}
                isAdmin={true}
                onNext={handleNext}
                timeLeft={timeLeft}
                isLastItem={isLastItem}
                onEndQuiz={handleEndQuiz}
                isQuizEnded={isQuizEnded}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStart;
