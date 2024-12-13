import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useSessionContext } from "../../../context/sessionContext";
import ContentDisplay from "../../../components/Session/ContentDisplay";
import AdminAnswerCounts from "../../../components/Session/AnswerCountDisplay";

const AdminSurveyStart = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { nextQuestion, endSession, loading } = useSessionContext();
  const [currentItem, setCurrentItem] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isLastItem, setIsLastItem] = useState(false);
  const [isSurveyEnded, setIsSurveyEnded] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
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
          const response = await nextQuestion(joinCode, sessionId);
          if (response.item) {
            setCurrentItem(response.item);
            setIsLastItem(response.isLastItem || false);

            newSocket.emit("next-survey-question", {
              sessionId,
              question: response.item,
              isLastQuestion: response.isLastItem || false
            });
          }
        }
      } catch (error) {
        console.error("Error fetching first question:", error);
      }
    };

    initializeSurvey();

    return () => {
      newSocket.disconnect();
    };
  }, [sessionId, joinCode]);

  useEffect(() => {
    if (socket) {
      // Listen for new users joining
      socket.on("user-joined-survey", (data) => {
        setConnectedUsers(prev => [...prev, data.user]);
      });

      // Listen for survey answer submissions
      socket.on("survey-answer-submitted", (data) => {
        console.log("Survey answer received:", data);
      });

      return () => {
        socket.off("user-joined-survey");
        socket.off("survey-answer-submitted");
      };
    }
  }, [socket]);

  const handleNext = async () => {
    try {
      if (!joinCode) {
        console.error("Join code is missing");
        return;
      }

      const response = await nextQuestion(joinCode, sessionId);

      if (response.item) {
        setCurrentItem(response.item);
        setIsLastItem(response.isLastItem || false);

        if (socket) {
          socket.emit("next-survey-question", {
            sessionId,
            question: response.item,
            isLastQuestion: response.isLastItem || false
          });
        }
      } else {
        setIsSurveyEnded(true);
        if (socket) {
          socket.emit("end-survey-session", { sessionId });
        }
      }
    } catch (error) {
      console.error("Error getting next item:", error);
    }
  };

  const handleEndSurvey = async () => {
    try {
      if (!joinCode) {
        console.error("Join code is missing");
        return;
      }

      await endSession(joinCode, sessionId);

      if (socket) {
        socket.emit("end-survey-session", { sessionId });
      }

      navigate("/survey-list");
    } catch (error) {
      console.error("Error ending survey:", error);
    }
  };

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
              <div className="mb-4 p-4 bg-white rounded-lg shadow">
                <h3 className="font-medium mb-2">Connected Users ({connectedUsers.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {connectedUsers.map(user => (
                    <span key={user._id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {user.username}
                    </span>
                  ))}
                </div>
              </div>
              <AdminAnswerCounts
                sessionId={sessionId}
                currentItem={currentItem}
                socket={socket}
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