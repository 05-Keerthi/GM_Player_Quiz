// AdminStart.js
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import io from "socket.io-client";
import { useSessionContext } from "../../context/sessionContext";
import ContentDisplay from "../../components/ContentDisplay";
import LeaderboardDisplay from "../../components/LeaderboardDisplay";

const AdminStart = () => {
  const [searchParams] = useSearchParams();
  const { nextQuestion, loading } = useSessionContext();
  const [currentItem, setCurrentItem] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [socket, setSocket] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [isLastItem, setIsLastItem] = useState(false);

  const quizId = searchParams.get("quizId");
  const sessionId = searchParams.get("sessionId");
  const joinCode = searchParams.get("joinCode");

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);
    newSocket.emit("create-session", { sessionId });
    return () => newSocket.disconnect();
  }, [sessionId]);

  useEffect(() => {
    if (socket) {
      socket.on("timer-sync", ({ timeLeft: newTime }) => {
        setTimeLeft(newTime);
      });
      return () => {
        socket.off("timer-sync");
      };
    }
  }, [socket]);

  useEffect(() => {
    const fetchInitialItem = async () => {
      try {
        if (!joinCode) {
          console.error("Join code is missing");
          return;
        }
        const response = await nextQuestion(joinCode, sessionId);

        if (response.item) {
          setCurrentItem(response.item);
          setTimeLeft(
            response.item.type === "bullet_points"
              ? 0
              : response.item.timer || 30
          );
          setTimerActive(response.item.type !== "bullet_points");
          setIsLastItem(response.isLastItem || false);

          if (socket) {
            socket.emit("next-item", {
              sessionId,
              type: response.type,
              item: response.item,
              isLastItem: response.isLastItem || false,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching initial item:", error);
      }
    };

    if (sessionId && socket) {
      fetchInitialItem();
    }
  }, [sessionId, socket, joinCode]);

  useEffect(() => {
    let intervalId;

    if (timerActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          if (socket && newTime >= 0) {
            socket.emit("timer-sync", {
              sessionId,
              timeLeft: newTime,
            });
          }
          if (newTime <= 0) {
            setTimerActive(false);
            clearInterval(intervalId);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timerActive, socket, sessionId]);

  const handleNext = async () => {
    try {
      if (!joinCode) {
        console.error("Join code is missing");
        return;
      }

      if (isLastItem) {
        if (socket) {
          socket.emit("end-session", { sessionId });
        }
        // Add navigation or other end-quiz logic here
        return;
      }

      const response = await nextQuestion(joinCode, sessionId);

      if (response.item) {
        setCurrentItem(response.item);
        setTimeLeft(
          response.item.type === "bullet_points" ? 0 : response.item.timer || 30
        );
        setTimerActive(response.item.type !== "bullet_points");
        setIsLastItem(response.isLastItem || false);

        if (socket) {
          socket.emit("next-item", {
            sessionId,
            type: response.type,
            item: response.item,
            isLastItem: response.isLastItem || false,
          });
        }
      }
    } catch (error) {
      console.error("Error getting next item:", error);
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
            <ContentDisplay
              item={currentItem}
              isAdmin={true}
              onNext={handleNext}
              timeLeft={timeLeft}
              isLastItem={isLastItem}
            />
          )}
        </div>
        <div className="w-full lg:w-1/3">
          <LeaderboardDisplay sessionId={sessionId} isAdmin={true} />
        </div>
      </div>
    </div>
  );
};

export default AdminStart;
