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
  const [isLastItem, setIsLastItem] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSurveyEnded, setIsSurveyEnded] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

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

      const userData = {
        sessionId,
        userId: user.id,
        username: user.username,
      };
      newSocket.emit("join-survey-session", userData);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user, sessionId]);

  // useEffect(() => {
  //   if (socket) {
  //     socket.on("next-survey-question", (data) => {
  //       console.log("Received question data:", data);
  //       const { question, isLastQuestion, initialTime } = data;
  //       setCurrentItem(question);
  //       setIsLastItem(isLastQuestion);
  //       setHasSubmitted(false);
  //       setStartTime(Date.now());
  //       setTimeLeft(initialTime || question.timer || 30);
  //     });

  //     socket.on("timer-sync", (data) => {
  //       setTimeLeft(data.timeLeft);
  //     });

  //     socket.on("survey-session-ended", () => {
  //       setIsSurveyEnded(true);
  //       navigate("/joinsurvey");
  //     });

  //     return () => {
  //       socket.off("next-survey-question");
  //       socket.off("timer-sync");
  //       socket.off("survey-session-ended");
  //     };
  //   }
  // }, [socket, navigate]);
  useEffect(() => {
    if (socket) {
      socket.on("next-survey-question", (data) => {
        console.log("Received question data:", data);
        const { type, item } = data;
        
        // Safely access timer property with fallback values
        const timer = item?.timer || 30; // Default to 30 seconds if no timer specified
        
        setCurrentItem(item);
        setIsLastItem(false); // You'll need to implement logic for this
        setHasSubmitted(false);
        setStartTime(Date.now());
        setTimeLeft(timer);
      });
  
      socket.on("timer-sync", (data) => {
        setTimeLeft(data.timeLeft);
      });
  
      socket.on("survey-session-ended", () => {
        setIsSurveyEnded(true);
        navigate("/joinsurvey");
      });
  
      return () => {
        socket.off("next-survey-question");
        socket.off("timer-sync");
        socket.off("survey-session-ended");
      };
    }
  }, [socket, navigate]);
  const handleSubmitAnswer = async (answer) => {
    if (hasSubmitted || !answer || !user || !startTime) {
      return;
    }

    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);

      // Format the answer data to match the backend API expectations
      const answerData = {
        answer: answer.text, // Changed from surveyAnswer to answer to match backend
        timeTaken,
      };

      // Submit to backend
      await submitSurveyAnswer(sessionId, currentItem._id, answerData);
      setHasSubmitted(true);

      // Emit socket event with the same structure as backend emits
      if (socket) {
        socket.emit("survey-submit-answer", {
          sessionId,
          questionId: currentItem._id,
          userId: user.id,
          answer: answer.text,
          timeTaken,
        });
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      // Optionally show error to user
      // toast.error("Failed to submit answer. Please try again.");
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
            hasSubmitted={hasSubmitted}
            isSurveyEnded={isSurveyEnded}
          />
        </div>
      </div>
    </div>
  );
};

export default UserSurveyPlay;