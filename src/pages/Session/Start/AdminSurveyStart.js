import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useSurveySessionContext } from "../../../context/surveySessionContext";
import SurveyContentDisplay from "../../../components/Session/SurveyContentDisplay";
import SurveyResults from "./SurveyResults";

const AdminSurveyStart = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { nextSurveyQuestion, endSurveySession, loading } =
    useSurveySessionContext();
  const [currentItem, setCurrentItem] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [socket, setSocket] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [isLastItem, setIsLastItem] = useState(false);
  const [isSurveyEnded, setIsSurveyEnded] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);
  const [submittedAnswers, setSubmittedAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const surveyId = searchParams.get("surveyId");
  const sessionId = searchParams.get("sessionId");
  const joinCode = searchParams.get("joinCode");

  // Initialize socket and first question
  useEffect(() => {
    const newSocket = io(`${process.env.REACT_APP_API_URL}/api`);
    setSocket(newSocket);
    newSocket.emit("create-survey-session", { sessionId });

    const initializeSurvey = async () => {
      try {
        if (joinCode && sessionId) {
          const response = await nextSurveyQuestion(joinCode, sessionId);
          if (response.item || response.question) {
            const item = response.item || response.question;
            const type = response.type || "question";

            const transformedItem =
              type === "slide"
                ? {
                    _id: item._id,
                    type: "slide",
                    title: item.surveyTitle,
                    content: item.surveyContent,
                    imageUrl: item.imageUrl,
                    surveyQuiz: item.surveyQuiz,
                  }
                : {
                    _id: item._id,
                    title: item.title,
                    imageUrl: item.imageUrl,
                    description: item.description,
                    dimension: item.dimension,
                    timer: item.timer,
                    type: "question",
                    answerOptions: item.answerOptions?.map((option) => ({
                      _id: option._id,
                      optionText: option.optionText,
                      isCorrect: false,
                    })),
                  };

            setCurrentItem(transformedItem);
            setIsLastItem(response.isLastItem || false);

            if (type !== "slide") {
              const initialTime = transformedItem.timer || 30;
              setTimeLeft(initialTime);
              setTimerActive(true);
              startTimer(newSocket, sessionId, initialTime);
            }

            newSocket.emit("next-survey-question", {
              sessionId,
              type,
              item: transformedItem,
              isLastItem: response.isLastItem || false,
              initialTime:
                type !== "slide" ? transformedItem.timer || 30 : null,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching first question:", error);
      }
    };

    initializeSurvey();

    return () => {
      if (timerInterval) clearInterval(timerInterval);
      newSocket.disconnect();
    };
  }, [sessionId, joinCode]);

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      socket.on("survey-answer-submitted", (data) => {
        if (currentItem && data.questionId === currentItem._id) {
          setSubmittedAnswers((prev) => [
            ...prev,
            {
              questionId: data.questionId,
              answer: data.answer,
              userId: data.userId,
              timeTaken: data.timeTaken,
            },
          ]);
        }
      });

      return () => {
        socket.off("survey-answer-submitted");
      };
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

      const response = await nextSurveyQuestion(joinCode, sessionId);
      console.log("Next question response:", response);

      // Check if we're at the end or it's the last item
      if (
        isLastItem ||
        response.message === "No more items left in the survey session" ||
        response.message === "No more questions left in the survey session"
      ) {
        if (socket) {
          socket.emit("survey-completed", { sessionId });
        }

        // Clear any existing timer
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }

        setIsSurveyEnded(true);
        navigate(`/results/${sessionId}?joinCode=${joinCode}`);
        return;
      }

      if (response.item || response.question) {
        const item = response.item || response.question;
        const type = response.type || "question";

        const transformedItem =
          type === "slide"
            ? {
                _id: item._id,
                type: "slide",
                title: item.surveyTitle,
                content: item.surveyContent,
                imageUrl: item.imageUrl,
                surveyQuiz: item.surveyQuiz,
              }
            : {
                _id: item._id,
                title: item.title,
                imageUrl: item.imageUrl,
                description: item.description,
                dimension: item.dimension,
                timer: item.timer,
                type: "question",
                answerOptions: item.answerOptions?.map((option) => ({
                  _id: option._id,
                  optionText: option.optionText,
                  isCorrect: false,
                })),
              };

        setCurrentItem(transformedItem);
        setIsLastItem(response.isLastItem || false);

        if (type !== "slide") {
          const newTime = transformedItem.timer || 30;
          setTimeLeft(newTime);
          setTimerActive(true);
          startTimer(socket, sessionId, newTime);
        }

        if (socket) {
          socket.emit("next-survey-question", {
            sessionId,
            type,
            item: transformedItem,
            isLastItem: response.isLastItem || false,
            initialTime: type !== "slide" ? transformedItem.timer || 30 : null,
          });
        }
      }
    } catch (error) {
      console.error("Error getting next question:", error);
      if (
        error.response?.data?.message ===
          "No more items left in the survey session" ||
        error.response?.data?.message ===
          "No more questions left in the survey session"
      ) {
        if (socket) {
          socket.emit("survey-completed", { sessionId });
        }
        setIsSurveyEnded(true);
        navigate(`/results/${sessionId}?joinCode=${joinCode}`);
      }
    }
  };

  const handleEndSurvey = async () => {
    try {
      if (!joinCode) {
        console.error("Join code is missing");
        return;
      }

      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }

      await endSurveySession(joinCode, sessionId);

      if (socket) {
        socket.emit("end-survey-session", { sessionId });
      }

      navigate("/survey-list");
    } catch (error) {
      console.error("Error ending survey:", error);
    }
  };

  // Show results component if showResults is true
  if (showResults) {
    return (
      <SurveyResults
        sessionId={sessionId}
        joinCode={joinCode}
        onBackToSurvey={() => setShowResults(false)}
      />
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl px-6">
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <SurveyContentDisplay
              item={currentItem}
              isAdmin={true}
              onNext={handleNext}
              timeLeft={timeLeft}
              isLastItem={isLastItem}
              onEndSurvey={handleEndSurvey}
              isSurveyEnded={isSurveyEnded}
              submittedAnswers={submittedAnswers}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSurveyStart;
