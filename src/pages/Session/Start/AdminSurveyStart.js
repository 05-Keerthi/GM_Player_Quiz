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

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);
    newSocket.emit("create-survey-session", { sessionId });

    const initializeSurvey = async () => {
      try {
        if (joinCode && sessionId) {
          const response = await nextSurveyQuestion(joinCode, sessionId);
          if (response.question) {
            const transformedItem = {
              _id: response.question._id,
              title: response.question.title,
              imageUrl: response.question.imageUrl,
              description: response.question.description,
              dimension: response.question.dimension,
              timer: response.question.timer,
              type: "question",
              options: response.question.answerOptions.map((option) => ({
                _id: option._id,
                text: option.optionText,
                isCorrect: false,
              })),
            };

            setCurrentItem(transformedItem);
            setIsLastItem(response.isLastItem || false);

            const initialTime = transformedItem.timer || 30;
            setTimeLeft(initialTime);

            newSocket.emit("next-survey-question", {
              sessionId,
              type: "question",
              item: transformedItem,
              isLastItem: response.isLastItem || false,
              initialTime,
            });

            startTimer(newSocket, sessionId, initialTime);
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
      
      // Check if we got the "no more questions" message
      if (response.message === "No more questions left in the survey session") {
        setShowResults(true);
        if (socket) {
          socket.emit("survey-completed", { sessionId });
        }
        return;
      }
  
      if (response.question) {
        const transformedItem = {
          _id: response.question._id,
          title: response.question.title,
          imageUrl: response.question.imageUrl,
          description: response.question.description,
          dimension: response.question.dimension,
          timer: response.question.timer,
          type: "question",
          options: response.question.answerOptions.map((option) => ({
            _id: option._id,
            text: option.optionText,
            isCorrect: false,
          })),
        };
  
        setCurrentItem(transformedItem);
        const newTime = transformedItem.timer || 30;
        setTimeLeft(newTime);
        setTimerActive(true);
        setIsLastItem(response.isLastItem || false);
  
        if (socket) {
          socket.emit("next-survey-question", {
            sessionId,
            type: "question",
            item: transformedItem,
            isLastItem: response.isLastItem || false,
            initialTime: newTime,
          });
  
          startTimer(socket, sessionId, newTime);
        }
      }
    } catch (error) {
      console.error("Error getting next question:", error);
      // Check if the error indicates no more questions
      if (error.response?.data?.message === "No more questions left in the survey session") {
        setShowResults(true);
        if (socket) {
          socket.emit("survey-completed", { sessionId });
        }
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

  if (showResults) {
    return (
      <SurveyResults
        sessionId={sessionId}
        joinCode={joinCode}
        onBackToSurvey={() => setShowResults(false)}
      />
    );
  }

  // Rest of the render logic remains the same
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
