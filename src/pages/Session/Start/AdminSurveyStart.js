import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useSurveySessionContext } from "../../../context/surveySessionContext";
import ContentDisplay from "../../../components/Session/ContentDisplay";
import AdminAnswerCounts from "../../../components/Session/AnswerCountDisplay";

const AdminSurveyStart = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { nextSurveyQuestion, endSurveySession, loading } =
    useSurveySessionContext();
  const [currentItem, setCurrentItem] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isLastItem, setIsLastItem] = useState(false);
  const [isSurveyEnded, setIsSurveyEnded] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const surveyId = searchParams.get("surveyId");
  const sessionId = searchParams.get("sessionId");
  const joinCode = searchParams.get("joinCode");

  // Helper function to transform survey question to the expected format
  const transformSurveyQuestion = (question) => {
    console.log("Transforming question:", question);
    if (!question) return null;

    const transformed = {
      _id: question._id,
      title: question.title,
      type: "multiple_choice",
      description: question.description,
      imageUrl: question.imageUrl,
      options:
        question.answerOptions?.map((option) => ({
          _id: option._id,
          text: option.optionText,
          isCorrect: false,
        })) || [],
      dimension: question.dimension,
      timer: question.timer || null,
    };
    console.log("Transformed question:", transformed);
    return transformed;
  };

  useEffect(() => {
    console.log("Setting up socket connection...");
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);
    newSocket.emit("create-survey-session", { sessionId });

    const initializeSurvey = async () => {
      try {
        console.log(
          "Initializing survey with joinCode:",
          joinCode,
          "sessionId:",
          sessionId
        );
        if (joinCode && sessionId) {
          const response = await nextSurveyQuestion(joinCode, sessionId);
          console.log("Initial survey response:", response);

          if (response.questions && response.questions.length > 0) {
            // Handle initial questions array
            const firstQuestion = response.questions[0];
            const transformedQuestion = transformSurveyQuestion(firstQuestion);
            console.log("Setting initial question:", transformedQuestion);

            setCurrentItem(transformedQuestion);
            setIsLastItem(response.questions.length === 1);

            newSocket.emit("next-survey-question", {
              sessionId,
              question: transformedQuestion,
              isLastQuestion: response.questions.length === 1,
            });
          } else if (response.question) {
            // Handle single question response
            const transformedQuestion = transformSurveyQuestion(
              response.question
            );
            console.log(
              "Setting initial question (single):",
              transformedQuestion
            );

            setCurrentItem(transformedQuestion);
            setIsLastItem(response.isLastQuestion || false);

            newSocket.emit("next-survey-question", {
              sessionId,
              question: transformedQuestion,
              isLastQuestion: response.isLastQuestion || false,
            });
          }
        }
      } catch (error) {
        console.error("Error in initializeSurvey:", error);
      }
    };

    initializeSurvey();

    return () => {
      console.log("Cleaning up socket connection");
      newSocket.disconnect();
    };
  }, [sessionId, joinCode]);

  const handleNext = async () => {
    try {
      console.log("Handling next question...");
      if (!joinCode) {
        console.error("Join code is missing");
        return;
      }

      const response = await nextSurveyQuestion(joinCode, sessionId);
      console.log("Next question response:", response);

      if (response.questions && response.questions.length > 0) {
        // Handle questions array
        const nextQuestion = response.questions[0];
        const transformedQuestion = transformSurveyQuestion(nextQuestion);

        setCurrentItem(transformedQuestion);
        setIsLastItem(response.questions.length === 1);

        socket?.emit("next-survey-question", {
          sessionId,
          question: transformedQuestion,
          isLastQuestion: response.questions.length === 1,
        });
      } else if (response.question) {
        // Handle single question
        const transformedQuestion = transformSurveyQuestion(response.question);

        setCurrentItem(transformedQuestion);
        setIsLastItem(response.isLastQuestion || false);

        socket?.emit("next-survey-question", {
          sessionId,
          question: transformedQuestion,
          isLastQuestion: response.isLastQuestion || false,
        });
      } else {
        console.log("No more questions, ending survey");
        setIsSurveyEnded(true);
        socket?.emit("end-survey-session", { sessionId });
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
      if (error.response?.data?.message === "No more questions") {
        setIsSurveyEnded(true);
        socket?.emit("end-survey-session", { sessionId });
      }
    }
  };

  const handleEndSurvey = async () => {
    try {
      console.log("Ending survey...");
      if (!joinCode) {
        console.error("Join code is missing");
        return;
      }

      await endSurveySession(joinCode, sessionId);
      socket?.emit("end-survey-session", { sessionId });
      navigate("/survey-list");
    } catch (error) {
      console.error("Error in handleEndSurvey:", error);
    }
  };

  if (isSurveyEnded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-6">Survey Completed!</h2>
          <p className="text-gray-600 mb-8">
            All questions have been presented.
          </p>
          <button
            onClick={handleEndSurvey}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-full"
          >
            End Session
          </button>
        </div>
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
              <AdminAnswerCounts
                sessionId={sessionId}
                currentItem={currentItem}
                socket={socket}
                sessionType="survey"
              />
              <ContentDisplay
                item={currentItem}
                isAdmin={true}
                onNext={handleNext}
                isLastItem={isLastItem}
                onEndSession={handleEndSurvey}
                isSessionEnded={isSurveyEnded}
                sessionType="survey"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSurveyStart;
