import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useSessionContext } from "../../../context/sessionContext";
import FinalLeaderboard from "../FinalLeaderboard";
import AdminAnswerCounts from "../../../components/Session/AnswerCountDisplay";
import ContentDisplay from "../../../components/Session/ContentDisplay";
import SurveyProgress from "../../../components/Session/Progress"; 
const AdminStart = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { nextQuestion, endSession, loading } = useSessionContext();

  // State management
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
  const [progress, setProgress] = useState("0/0");
  
  // URL parameters
  const quizId = searchParams.get("quizId");
  const sessionId = searchParams.get("sessionId");
  const joinCode = searchParams.get("joinCode");

  // Socket initialization and first question fetch
  useEffect(() => {
    const newSocket = io(`${process.env.REACT_APP_API_URL}`);
    setSocket(newSocket);
    newSocket.emit("create-session", { sessionId });

    const initializeQuiz = async () => {
      try {
        if (joinCode && sessionId) {
          const response = await nextQuestion(joinCode, sessionId);
          if (response.item) {
            handleNewItem(response.item, response.isLastItem, newSocket);
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

  // Answer submission handler
  useEffect(() => {
    if (socket && currentItem) {
      const handleAnswerSubmitted = (data) => {
        if (data.answerDetails.questionId === currentItem._id) {
          handleAnswerUpdate(data.answerDetails);
        }
      };

      socket.on("answer-submitted", handleAnswerSubmitted);
      return () => socket.off("answer-submitted", handleAnswerSubmitted);
    }
  }, [socket, currentItem]);

  // Helper functions
  const handleNewItem = (item, isLastItem, socketInstance, response) => {
    setCurrentItem(item);
    const initialTime = item.type === "bullet_points" ? 0 : item.timer || 30;
    setTimeLeft(initialTime);
    setTimerActive(item.type !== "bullet_points");
    setIsLastItem(isLastItem || false);
    setProgress(response.progress || "0/0");
  
    if (item.type === "poll") {
      initializeOptionCounts(item.options);
    }
  
    socketInstance.emit("next-item", {
      sessionId,
      type: item.type,
      item: item,
      isLastItem: isLastItem || false,
      initialTime: initialTime,
      progress: response.progress
    });
  
    if (item.type !== "bullet_points") {
      startTimer(socketInstance, sessionId, initialTime);
    }
  };
  
  const handleNext = async () => {
    try {
      if (!joinCode) {
        console.error("Join code is missing");
        return;
      }
  
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
  
      setSubmittedAnswers([]);
      const response = await nextQuestion(joinCode, sessionId);
  
      if (response.item) {
        handleNewItem(response.item, response.isLastItem, socket, response);
      } else {
        handleQuizEnd();
      }
    } catch (error) {
      if (error.response?.data?.message === "No more items left in the session") {
        handleQuizEnd();
      } else {
        console.error("Error getting next item:", error);
      }
    }
  };

  const initializeOptionCounts = (options) => {
    if (!options) return;
    const initialCounts = {};
    options.forEach((option) => {
      initialCounts[option._id] = 0;
    });
    setOptionCounts(initialCounts);
    setTotalVotes(0);
  };

  const handleAnswerUpdate = (answerDetails) => {
    if (!currentItem || !answerDetails) return;

    if (currentItem.type === "open_ended") {
      setSubmittedAnswers((prev) => [...prev, answerDetails.answer]);
    } else if (currentItem.type === "multiple_select") {
      updateMultiSelectCounts(answerDetails.answer);
    } else if (["poll", "multiple_choice"].includes(currentItem.type)) {
      updateSingleAnswerCounts(answerDetails.answer);
    }
  };

  const updateMultiSelectCounts = (answer) => {
    if (!currentItem?.options) return;

    setOptionCounts((prev) => {
      const newCounts = { ...prev };
      let selectedAnswers = parseAnswers(answer);

      selectedAnswers.forEach((answerText) => {
        const selectedOption = currentItem.options.find(
          (opt) => opt.text === answerText
        );
        if (selectedOption) {
          const optionId = selectedOption._id;
          newCounts[optionId] = (newCounts[optionId] || 0) + 1;
        }
      });

      return newCounts;
    });

    setTotalVotes((prev) => prev + 1);
  };

  const updateSingleAnswerCounts = (answer) => {
    if (!currentItem?.options) return;

    setOptionCounts((prev) => {
      const newCounts = { ...prev };
      // Find the option that matches the answer text
      const selectedOption = currentItem.options.find(
        (opt) => opt.text === answer
      );

      if (selectedOption) {
        const optionId = selectedOption._id;
        newCounts[optionId] = (newCounts[optionId] || 0) + 1;
      }

      return newCounts;
    });

    setTotalVotes((prev) => prev + 1);
  };

  const parseAnswers = (answer) => {
    if (typeof answer === "string") {
      try {
        const parsed = JSON.parse(answer);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [answer];
      }
    }
    return Array.isArray(answer) ? answer : [answer];
  };

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

  // const handleNext = async () => {
  //   try {
  //     if (!joinCode) {
  //       console.error("Join code is missing");
  //       return;
  //     }

  //     if (timerInterval) {
  //       clearInterval(timerInterval);
  //       setTimerInterval(null);
  //     }

  //     setSubmittedAnswers([]);
  //     const response = await nextQuestion(joinCode, sessionId);

  //     if (response.item) {
  //       handleNewItem(response.item, response.isLastItem, socket);
  //     } else {
  //       handleQuizEnd();
  //     }
  //   } catch (error) {
  //     if (
  //       error.response?.data?.message === "No more items left in the session"
  //     ) {
  //       handleQuizEnd();
  //     } else {
  //       console.error("Error getting next item:", error);
  //     }
  //   }
  // };

  const handleQuizEnd = () => {
    setIsQuizEnded(true);
    setShowFinalLeaderboard(true);
    if (socket) {
      socket.emit("quiz-completed", { sessionId });
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
      <div
        className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4"
        data-testid="quiz-end-container"
      >
        <div data-testid="final-leaderboard">
          <FinalLeaderboard sessionId={sessionId} isAdmin={true} />
        </div>
        <button
          data-testid="end-quiz-button"
          onClick={handleEndQuiz}
          className="mt-8 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          End Session
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-100"
      data-testid="admin-start-container"
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl px-6">
          {loading ? (
            <div
              className="flex items-center justify-center"
              data-testid="loading-container"
            >
              <Loader2
                data-testid="loading-spinner"
                className="w-8 h-8 animate-spin"
              />
            </div>
          ) : (
            <div data-testid="content-container">
              <div className="mb-2" data-testid="answer-counts-container">
                <AdminAnswerCounts
                  sessionId={sessionId}
                  currentItem={currentItem}
                  socket={socket}
                />
              </div>
              <div data-testid="content-display-container">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStart;
