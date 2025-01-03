import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSurveyAnswerContext } from "../../../context/surveyAnswerContext";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useAuthContext } from "../../../context/AuthContext";
import SurveyContentDisplay from "../../../components/Session/SurveyContentDisplay";

const UserSurveyPlay = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuthContext();
  const { submitSurveyAnswer } = useSurveyAnswerContext();
  const [currentItem, setCurrentItem] = useState(null);
  const [socket, setSocket] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLastItem, setIsLastItem] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSurveyEnded, setIsSurveyEnded] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);

  const sessionId = searchParams.get("sessionId");

  // Auth check
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Socket initialization
  useEffect(() => {
    if (isAuthenticated && user && sessionId) {
      const newSocket = io(`${process.env.REACT_APP_API_URL}`);
      setSocket(newSocket);

      // Join survey session
      newSocket.emit("join-survey-session", {
        sessionId,
        userId: user.id,
        username: user.username,
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user, sessionId]);

  // Socket event handlers
  useEffect(() => {
    if (socket) {
      // Handle next question
      socket.on("next-survey-question", (data) => {
        console.log("Received next question data:", data);

        const questionData = data?.question || data?.item || {};
        const questionType =
          data?.type || questionData?.type || "single_select";
        const isLastQuestion = data?.isLastQuestion || false;
        const timerValue = data?.initialTime || questionData?.timer || 30;

        // Transform the item based on type
        const transformedItem =
          questionType === "slide"
            ? {
                _id: questionData._id,
                type: "slide",
                title: questionData.surveyTitle || questionData.title,
                content: questionData.surveyContent || questionData.content,
                imageUrl: questionData.imageUrl,
                surveyQuiz: questionData.surveyQuiz,
              }
            : {
                _id: questionData._id,
                title: questionData.title,
                type: questionType,
                imageUrl: questionData.imageUrl,
                description: questionData.description,
                dimension: questionData.dimension,
                timer: timerValue,
                answerOptions: (questionData.answerOptions || []).map(
                  (option) => ({
                    _id: option._id,
                    optionText: option.optionText || option.text,
                    color: option.color, // Include the color property
                  })
                ),
              };

        console.log("Transformed item:", transformedItem);
        setCurrentItem(transformedItem);
        setTimeLeft(timerValue);
        setIsLastItem(isLastQuestion);
        setHasSubmitted(false);

        // Set question start time for non-slide items
        if (questionType !== "slide") {
          setQuestionStartTime(Date.now());
        } else {
          setQuestionStartTime(null);
        }
      });

      // Handle timer sync
      socket.on("timer-sync", (data) => {
        if (data && typeof data.timeLeft === "number") {
          setTimeLeft(data.timeLeft);
        }
      });

      // Handle survey completion
      socket.on("survey-completed", () => {
        setIsSurveyEnded(true);
      });

      // Handle survey end
      socket.on("survey-session-ended", () => {
        setIsSurveyEnded(true);
        setTimeout(() => {
          navigate("/joinsurvey");
        }, 2000); // Give time to show completion message
      });

      // Handle answer confirmation
      socket.on("answer-submission-confirmed", (data) => {
        if (data.status === "success") {
          setHasSubmitted(true);
        }
      });

      return () => {
        socket.off("next-survey-question");
        socket.off("timer-sync");
        socket.off("survey-completed");
        socket.off("survey-session-ended");
        socket.off("answer-submission-confirmed");
      };
    }
  }, [socket, navigate]);

  // Handle answer submission
  const handleSubmitAnswer = async (answer) => {
    if (
      !currentItem ||
      currentItem.type === "slide" ||
      timeLeft <= 0 ||
      hasSubmitted ||
      !answer ||
      !questionStartTime ||
      !user
    ) {
      return;
    }

    try {
      const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);

      // Get the answer text based on the answer type
      const answerText =
        answer.answer ||
        answer.text ||
        (Array.isArray(answer) ? answer.join(",") : answer);

      const answerData = {
        answer: answerText,
        timeTaken,
      };

      // Submit to backend
      await submitSurveyAnswer(sessionId, currentItem._id, answerData);

      // Emit to socket
      if (socket) {
        socket.emit("survey-submit-answer", {
          sessionId,
          questionId: currentItem._id,
          userId: user.id,
          answer: answerText,
          timeTaken,
        });
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  // Loading state
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

  // Auth check
  if (!isAuthenticated) {
    return null;
  }

  // Survey ended state
  if (isSurveyEnded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Survey Completed!</h2>
          <p className="text-gray-600">Thank you for your participation.</p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl px-6">
          <SurveyContentDisplay
            item={currentItem}
            isAdmin={false}
            onSubmitAnswer={handleSubmitAnswer}
            timeLeft={timeLeft}
            isLastItem={isLastItem}
            isSurveyEnded={isSurveyEnded}
            socket={socket}
          />
        </div>
      </div>
    </div>
  );
};

export default UserSurveyPlay;
