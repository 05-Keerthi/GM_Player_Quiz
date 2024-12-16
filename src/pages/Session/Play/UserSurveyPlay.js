import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAnswerContext } from "../../../context/answerContext";
import ContentDisplay from "../../../components/Session/ContentDisplay";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useAuthContext } from "../../../context/AuthContext";

const UserSurveyPlay = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuthContext();
  const { submitAnswer } = useAnswerContext();
  const [currentItem, setCurrentItem] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isLastItem, setIsLastItem] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSurveyEnded, setIsSurveyEnded] = useState(false);
  const [startTime, setStartTime] = useState(null);

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

  useEffect(() => {
    if (socket) {
      socket.on("next-survey-question", (data) => {
        const { question, isLastQuestion } = data;
        setCurrentItem(question);
        setIsLastItem(isLastQuestion);
        setHasSubmitted(false);
        setStartTime(Date.now());
      });

      socket.on("survey-session-ended", () => {
        setIsSurveyEnded(true);
        navigate("/join");
      });

      return () => {
        socket.off("next-survey-question");
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
      const answerData = {
        answer: answer.text,
        userId: user._id,
        timeTaken,
      };

      await submitAnswer(sessionId, currentItem._id, answerData);
      setHasSubmitted(true);

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
          <ContentDisplay
            item={currentItem}
            isAdmin={false}
            onSubmitAnswer={handleSubmitAnswer}
            isLastItem={isLastItem}
            hasSubmitted={hasSubmitted}
            sessionType="survey"
          />
        </div>
      </div>
    </div>
  );
};

export default UserSurveyPlay;
