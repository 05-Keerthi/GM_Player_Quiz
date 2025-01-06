import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useSessionContext } from "../../../context/sessionContext";
import FinalLeaderboard from "../FinalLeaderboard";
import AdminAnswerCounts from "../../../components/Session/AnswerCountDisplay";
import ContentDisplay from "../../../components/Session/ContentDisplay";

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
  const [submittedAnswers, setSubmittedAnswers] = useState([]);
  const [optionCounts, setOptionCounts] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);

  const quizId = searchParams.get("quizId");
  const sessionId = searchParams.get("sessionId");
  const joinCode = searchParams.get("joinCode");

  // Initialize socket and fetch first question
  useEffect(() => {
    const newSocket = io(`${process.env.REACT_APP_API_URL}`);
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

            if (response.item.type === "poll") {
              const initialCounts = {};
              response.item.options?.forEach((_, index) => {
                initialCounts[index] = 0;
              });
              setOptionCounts(initialCounts);
              setTotalVotes(0);
            }

            newSocket.emit("next-item", {
              sessionId,
              type: response.type,
              item: response.item,
              isLastItem: response.isLastItem || false,
              initialTime: initialTime,
            });

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

  useEffect(() => {
    if (socket && currentItem) {
      const handleAnswerSubmitted = (data) => {
        if (data.answerDetails.questionId === currentItem._id) {
          if (currentItem.type === "open_ended") {
            setSubmittedAnswers((prev) => [...prev, data.answerDetails.answer]);
          } else if (currentItem.type === "multiple_select") {
            setOptionCounts((prev) => {
              const newCounts = { ...prev };
              let selectedAnswers = [];

              if (typeof data.answerDetails.answer === "string") {
                try {
                  selectedAnswers = JSON.parse(data.answerDetails.answer);
                  if (!Array.isArray(selectedAnswers)) {
                    selectedAnswers = [selectedAnswers];
                  }
                } catch {
                  selectedAnswers = [data.answerDetails.answer];
                }
              } else if (Array.isArray(data.answerDetails.answer)) {
                selectedAnswers = data.answerDetails.answer;
              } else {
                selectedAnswers = [data.answerDetails.answer];
              }

              selectedAnswers.forEach((answer) => {
                const optionIndex = currentItem.options.findIndex(
                  (opt) => opt.text === answer
                );
                if (optionIndex !== -1) {
                  newCounts[optionIndex] = (newCounts[optionIndex] || 0) + 1;
                }
              });
              return newCounts;
            });
            setTotalVotes((prev) => prev + 1);
          } else if (
            currentItem.type === "poll" ||
            currentItem.type === "multiple_choice"
          ) {
            setOptionCounts((prev) => {
              const newCounts = { ...prev };
              const optionIndex = currentItem.options.findIndex(
                (opt) => opt.text === data.answerDetails.answer
              );
              if (optionIndex !== -1) {
                newCounts[optionIndex] = (newCounts[optionIndex] || 0) + 1;
              }
              return newCounts;
            });
            setTotalVotes((prev) => prev + 1);
          }
        }
      };

      socket.on("answer-submitted", handleAnswerSubmitted);
      return () => socket.off("answer-submitted", handleAnswerSubmitted);
    }
  }, [socket, currentItem]);

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
      setSubmittedAnswers([]);
      if (!joinCode) {
        console.error("Join code is missing");
        return;
      }

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

        if (response.item.type === "poll") {
          const initialCounts = {};
          response.item.options?.forEach((_, index) => {
            initialCounts[index] = 0;
          });
          setOptionCounts(initialCounts);
          setTotalVotes(0);
        }

        if (socket) {
          socket.emit("next-item", {
            sessionId,
            type: response.type,
            item: response.item,
            isLastItem: response.isLastItem || false,
            initialTime: newTime,
          });

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

      navigate("/quiz-list");
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
              <div className="mb-2">
                <AdminAnswerCounts
                  sessionId={sessionId}
                  currentItem={currentItem}
                  socket={socket}
                />
              </div>
              <div>
                <ContentDisplay
                  item={currentItem}
                  isAdmin={true}
                  onNext={handleNext}
                  timeLeft={timeLeft}
                  isLastItem={isLastItem}
                  onEndQuiz={handleEndQuiz}
                  isQuizEnded={isQuizEnded}
                  submittedAnswers={submittedAnswers}
                  socket={socket}
                  optionCounts={optionCounts}
                  totalVotes={totalVotes}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStart;
