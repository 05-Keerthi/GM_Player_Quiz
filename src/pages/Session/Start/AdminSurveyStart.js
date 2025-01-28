import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useSurveySessionContext } from "../../../context/surveySessionContext";
import SurveyContentDisplay from "../../../components/Session/SurveyContentDisplay";
import SurveyResults from "./SurveyResults";
import SurveyProgress from "../../../components/Session/Progress";

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
  const [optionCounts, setOptionCounts] = useState({});
  const [userAnswers, setUserAnswers] = useState(new Map());
  const [progress, setProgress] = useState("0/0");

  const surveyId = searchParams.get("surveyId");
  const sessionId = searchParams.get("sessionId");
  const joinCode = searchParams.get("joinCode");

  // Reset option counts when question changes
  useEffect(() => {
    if (currentItem?.answerOptions) {
      const initialCounts = {};
      currentItem.answerOptions.forEach((_, index) => {
        initialCounts[index] = 0;
      });
      setOptionCounts(initialCounts);
      setSubmittedAnswers([]);
      setUserAnswers(new Map());
    }
  }, [currentItem]);

  // Socket event listeners for answer updates
  useEffect(() => {
    if (socket && currentItem?._id) {
      const handleAnswerSubmitted = (data) => {
        if (data.questionId === currentItem._id) {
          setUserAnswers((prevAnswers) => {
            const newAnswers = new Map(prevAnswers);
            const previousAnswer = newAnswers.get(data.userId);
            
            // If user had a previous answer, decrement that count
            if (previousAnswer) {
              const prevOptionIndex = currentItem.answerOptions.findIndex(
                (opt) => opt.optionText === previousAnswer
              );
              if (prevOptionIndex !== -1) {
                setOptionCounts((prev) => ({
                  ...prev,
                  [prevOptionIndex]: Math.max(0, (prev[prevOptionIndex] || 0) - 1)
                }));
              }
            }

            // Set new answer
            newAnswers.set(data.userId, data.answer);

            // Increment count for new answer
            const newOptionIndex = currentItem.answerOptions.findIndex(
              (opt) => opt.optionText === data.answer
            );
            if (newOptionIndex !== -1) {
              setOptionCounts((prev) => ({
                ...prev,
                [newOptionIndex]: (prev[newOptionIndex] || 0) + 1
              }));
            }

            return newAnswers;
          });
          setSubmittedAnswers((prev) => [...prev, data]);
        }
      };

      socket.on("survey-answer-submitted", handleAnswerSubmitted);
      return () => socket.off("survey-answer-submitted", handleAnswerSubmitted);
    }
  }, [socket, currentItem]);

  // Initialize socket and first question
  useEffect(() => {
    const newSocket = io(`${process.env.REACT_APP_API_URL}`);
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
                    year: item.year,
                    timer: item.timer,
                    type: "question",
                    answerOptions: item.answerOptions?.map((option) => ({
                      _id: option._id,
                      optionText: option.optionText,
                      color: option.color,
                      isCorrect: false,
                    })),
                  };

            setCurrentItem(transformedItem);
            setIsLastItem(response.isLastItem || false);
            setProgress(response.progress || "0/0");
           
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

      if (
        isLastItem ||
        response.message === "No more items left in the survey session" ||
        response.message === "No more questions left in the survey session"
      ) {
        if (socket) {
          socket.emit("survey-completed", { sessionId });
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
                year: item.year,
                timer: item.timer,
                type: "question",
                answerOptions: item.answerOptions?.map((option) => ({
                  _id: option._id,
                  optionText: option.optionText,
                  color: option.color,
                  isCorrect: false,
                })),
              };

        setCurrentItem(transformedItem);
        setIsLastItem(response.isLastItem || false);
        setProgress(response.progress || "0/0");

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
            progress: response.progress // Add this line
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
        navigate(`/surveys/session/${sessionId}`);
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

  const getTextColor = (backgroundColor) => {
    if (!backgroundColor) return "text-gray-700";

    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "text-gray-700" : "text-white";
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl px-6">
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 role="status" className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <>

            <SurveyProgress 
  progress={progress} 
  className="mb-4" 
/>
              {/* Live Response Counter */}
              {currentItem?.answerOptions && (
                <div className="mb-2 flex justify-end rounded-full">
                  <div className="flex flex-wrap gap-2">
                    {currentItem.answerOptions.map((option, index) => {
                      const count = optionCounts[index] || 0;
                      const backgroundColor = option.color || "#FFFFFF";
                      const textColor = getTextColor(backgroundColor);

                      return (
                        <div
                          key={option._id}
                          className="flex flex-col items-center"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-semibold shadow-md border border-gray-200"
                            style={{
                              backgroundColor,
                              color: textColor,
                            }}
                          >
                            {count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Survey Content */}
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
 
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSurveyStart;